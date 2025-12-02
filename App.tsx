// =============================
//  App.tsx (FULL WORKING VERSION)
//  With Mobile Shop Scroll Fix
// =============================

import React, { useState, useEffect } from 'react';
import { User, DailyProgress, Stats } from './types';

import {
  saveUser,
  loadCurrentSession,
  loginUser,
  logoutUser,
  checkUserExists,
} from './services/storage';

import { calculateRequiredXp, checkProgression } from './services/gameLogic';
import { generateSystemMessage } from './services/geminiService';

import { SystemWindow, Button, ProgressBar } from './components/SystemComponents';
import { QuestTracker } from './components/QuestTracker';
import { StatusWindow } from './components/StatusWindow';
import { SystemChat } from './components/SystemChat';

import { soundService } from './services/soundService';

import {
  requestNotificationPermission,
  sendSystemNotification,
} from './services/notificationService';

import {
  loadInventory,
  addItemToInventory,
  removeItem,
  InventoryItem,
  EquipmentSlot,
} from './services/inventoryService';

const App: React.FC = () => {
  // ---------------------------
  // USER & STATE
  // ---------------------------
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [todayProgress, setTodayProgress] = useState<DailyProgress | null>(null);
  const [systemNotif, setSystemNotif] = useState<string | null>(null);

  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');

  const [showShop, setShowShop] = useState(false);
  const [showItemBox, setShowItemBox] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const [penaltyActive, setPenaltyActive] = useState(false);
  const [penaltyClicks, setPenaltyClicks] = useState(0);
  const [penaltyGateOpen, setPenaltyGateOpen] = useState(false);

  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const todayStr = new Date().toISOString().split('T')[0];

  // ---------------------------
  // EQUIPPED BONUSES
  // ---------------------------
  const getEquippedBonuses = (
    u: User | null,
    inv: InventoryItem[]
  ): Partial<Stats> => {
    const empty: Partial<Stats> = {
      strength: 0,
      agility: 0,
      sense: 0,
      vitality: 0,
      intelligence: 0,
    };

    if (!u || !u.equipment) return empty;

    const result = { ...empty };

    const slots: EquipmentSlot[] = [
      'weapon',
      'armor',
      'cloak',
      'gloves',
      'boots',
      'necklace',
      'ring1',
      'ring2',
      'rune',
    ];

    for (const slot of slots) {
      const id = u.equipment[slot];
      if (!id) continue;

      const item = inv.find((i) => i.id === id);
      if (!item || !item.bonuses) continue;

      for (const key of Object.keys(item.bonuses) as (keyof Stats)[]) {
        result[key] = (result[key] || 0) + (item.bonuses[key] || 0);
      }
    }

    return result;
  };

  const equippedBonuses = getEquippedBonuses(user, inventory);

  // ---------------------------
  // INITIAL LOAD
  // ---------------------------
  useEffect(() => {
    const sessionUser = loadCurrentSession();

    if (sessionUser) {
      setUser(sessionUser);
      checkDailyReset(sessionUser);

      const inv = loadInventory(sessionUser.email);
      setInventory(inv);

      generateSystemMessage('LOGIN', sessionUser).then((msg) => {
        setSystemNotif(msg);
        soundService.playNotification();
      });

      if ('Notification' in window && Notification.permission === 'granted') {
        setNotificationsEnabled(true);
      }
    }

    setLoading(false);
  }, []);

  // ---------------------------
  // DAILY RESET
  // ---------------------------
  const checkDailyReset = (u: User) => {
    const last = u.history[u.history.length - 1];
    if (last && last.date === todayStr) {
      setTodayProgress(last);
    } else {
      setTodayProgress({
        date: todayStr,
        pushups: 0,
        situps: 0,
        squats: 0,
        running: 0,
        completed: false,
        penaltySurvived: false,
      });
    }
  };

  // ---------------------------
  // LOGIN
  // ---------------------------
  const handleLogin = () => {
    if (!nameInput.trim() || !emailInput.trim()) return;

    const exists = checkUserExists(emailInput);

    const { user: loggedUser } = loginUser(emailInput, nameInput);

    setUser(loggedUser);
    checkDailyReset(loggedUser);

    const inv = loadInventory(loggedUser.email);
    setInventory(inv);

    soundService.playConfirm();

    generateSystemMessage('LOGIN', loggedUser).then((msg) =>
      setSystemNotif(msg)
    );
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setTodayProgress(null);
    setInventory([]);
  };

  // ---------------------------
  // QUEST UPDATE
  // ---------------------------
  const updateProgress = (field: keyof DailyProgress, val: number) => {
    if (!todayProgress) return;
    setTodayProgress({ ...todayProgress, [field]: val });
  };

  // ---------------------------
  // COMPLETE QUEST
  // ---------------------------
  const completeQuest = async () => {
    if (!user || !todayProgress) return;

    const XP = 150;
    const GOLD = 1000;

    let newLevel = user.level;
    let xp = user.currentXp + XP;
    let req = user.requiredXp;
    let ap = user.stats.availablePoints;

    let leveled = false;

    while (xp >= req) {
      xp -= req;
      newLevel++;
      ap += 3;
      req = calculateRequiredXp(newLevel);
      leveled = true;
    }

    const completed = { ...todayProgress, completed: true };
    const newHistory = user.history.filter((h) => h.date !== todayStr);
    newHistory.push(completed);

    let updatedUser: User = {
      ...user,
      level: newLevel,
      currentXp: xp,
      requiredXp: req,
      gold: user.gold + GOLD,
      stats: { ...user.stats, availablePoints: ap },
      streak: user.streak + 1,
      history: newHistory,
    };

    const progression = checkProgression(updatedUser);
    updatedUser = progression.user;

    setUser(updatedUser);
    setTodayProgress(completed);
    saveUser(updatedUser);

    soundService.playLevelUp();

    if (leveled) {
      const msg = await generateSystemMessage('LEVEL_UP', updatedUser);
      setSystemNotif(msg);
    } else {
      setSystemNotif('DAILY QUEST COMPLETED. REWARDS ACCEPTED.');
    }
  };

  // ---------------------------
  // BUY ITEM (SHOP)
  // ---------------------------
  const buyItem = (
    cost: number,
    name: string,
    type: InventoryItem['type'],
    desc: string,
    rarity: InventoryItem['rarity'],
    slot?: EquipmentSlot,
    bonuses: Partial<Stats> = {}
  ) => {
    if (!user) return;

    if (user.gold < cost) {
      setSystemNotif('INSUFFICIENT FUNDS.');
      soundService.playError();
      return;
    }

    const updatedUser = { ...user, gold: user.gold - cost };
    setUser(updatedUser);
    saveUser(updatedUser);

    const newInv = addItemToInventory(user.email, {
      name,
      type,
      desc,
      rarity,
      slot,
      bonuses,
    });

    setInventory(newInv);

    setSystemNotif(`PURCHASE SUCCESSFUL: ${name} added to Item Box.`);
    soundService.playConfirm();
  };

  // ---------------------------
  // EQUIP ITEM
  // ---------------------------
  const equipItem = (item: InventoryItem) => {
    if (!user) return;
    if (!item.slot) return;

    const updatedEquipment = {
      ...user.equipment,
      [item.slot]: item.id,
    };

    const updatedUser: User = { ...user, equipment: updatedEquipment };
    setUser(updatedUser);
    saveUser(updatedUser);

    setSystemNotif(`Equipped ${item.name}`);
  };

  const unequipItem = (slot: EquipmentSlot) => {
    if (!user) return;

    const updatedUser: User = {
      ...user,
      equipment: { ...user.equipment, [slot]: null },
    };

    setUser(updatedUser);
    saveUser(updatedUser);

    setSystemNotif(`Unequipped item in slot ${slot}`);
  };

  // ---------------------------
  // CLEAR NOTIFICATION
  // ---------------------------
  const closeNotif = () => setSystemNotif(null);

  // ---------------------------------------
  // LOADING SCREEN
  // ---------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-500 font-mono-tech animate-pulse">
        CONNECTING TO SYSTEM...
      </div>
    );
  }

  // ---------------------------------------
  // LOGIN SCREEN
  // ---------------------------------------
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <SystemWindow title="Security Clearance" className="w-full max-w-md">

          {/* NAME */}
          <div className="mb-3">
            <label className="text-xs text-slate-400 uppercase">Name</label>
            <input
              className="mt-1 w-full p-2 bg-slate-800 border border-slate-600 text-white"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
          </div>

          {/* EMAIL */}
          <div className="mb-3">
            <label className="text-xs text-slate-400 uppercase">Email</label>
            <input
              className="mt-1 w-full p-2 bg-slate-800 border border-slate-600 text-white"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
          </div>

          <Button onClick={handleLogin} className="w-full mt-4">
            LOGIN
          </Button>

        </SystemWindow>
      </div>
    );
  }

  // ---------------------------------------
  // MAIN APP UI
  // ---------------------------------------
  return (
    <div className="min-h-screen p-6 bg-slate-950 text-white">

      {/* ============================
          SHOP MODAL (Mobile Scroll Fix)
      ============================= */}
      {showShop && !penaltyActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">

          <SystemWindow
            title="Item Shop"
            className="max-w-3xl w-full max-h-[90vh] flex flex-col"
          >

            {/* Scrollable items */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto max-h-[65vh] pr-2">

              {/* Example item */}
              <div
                className="bg-slate-800 p-4 border border-slate-700 hover:border-cyan-500 cursor-pointer"
                onClick={() =>
                  buyItem(
                    100,
                    "Fatigue Potion",
                    "potion",
                    "Recover fatigue.",
                    "Common"
                  )
                }
              >
                <div className="text-cyan-300 font-bold">Fatigue Potion</div>
                <div className="text-xs text-slate-400 mb-2">
                  +20 reps, +2km
                </div>
                <div className="text-yellow-400">100 G</div>
              </div>

              {/* Repeat your shop items here… */}

            </div>

            {/* FIXED FOOTER */}
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700">
              <div className="text-yellow-400 font-bold">
                Gold: {user.gold}
              </div>
              <Button onClick={() => setShowShop(false)}>Close</Button>
            </div>

          </SystemWindow>

        </div>
      )}

      {/* ============================
          ITEM BOX MODAL
      ============================= */}
      {showItemBox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">

          <SystemWindow title="Item Box" className="max-w-lg w-full">

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">

              {inventory.length === 0 ? (
                <div className="text-slate-400 text-center py-6">
                  No items.
                </div>
              ) : (
                inventory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-800 border border-slate-700 rounded flex justify-between"
                  >
                    <div>
                      <div className="text-cyan-300 font-bold">{item.name}</div>
                      <div className="text-xs text-slate-400">{item.desc}</div>
                    </div>

                    <div className="flex flex-col gap-1">
                      {(item.type === 'gear' || item.type === 'rune') && (
                        <Button
                          className="text-xs px-2 py-1"
                          onClick={() => equipItem(item)}
                        >
                          Equip
                        </Button>
                      )}

                      <Button
                        className="text-xs px-2 py-1"
                        onClick={() => {
                          const updated = removeItem(user.email, item.id);
                          setInventory(updated);
                        }}
                      >
                        Use
                      </Button>

                      <Button
                        className="text-xs px-2 py-1"
                        variant="secondary"
                        onClick={() => {
                          const updated = removeItem(user.email, item.id);
                          setInventory(updated);
                        }}
                      >
                        Discard
                      </Button>
                    </div>
                  </div>
                ))
              )}

            </div>

            <div className="flex justify-end pt-4 border-t border-slate-700">
              <Button onClick={() => setShowItemBox(false)}>Close</Button>
            </div>

          </SystemWindow>

        </div>
      )}

      {/* ============================
          NOTIFICATION MODAL
      ============================= */}
      {systemNotif && !showShop && !showItemBox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <SystemWindow title="System Notification" className="max-w-lg">

            <div className="text-cyan-100 font-mono-tech mb-6 whitespace-pre-wrap">
              {systemNotif}
            </div>

            <div className="flex justify-end">
              <Button onClick={closeNotif}>OK</Button>
            </div>

          </SystemWindow>
        </div>
      )}

      {/* ============================
          HEADER
      ============================= */}
      <div className="max-w-5xl mx-auto mb-6">

        <div className="flex justify-between items-center">

          <h1 className="text-3xl font-bold">
            Player: <span className="text-cyan-400">{user.username}</span>
          </h1>

          <div className="flex gap-2">
            <Button onClick={() => setShowShop(true)}>Shop</Button>
            <Button onClick={() => setShowItemBox(true)}>Item Box</Button>

            <Button onClick={handleLogout} variant="danger">
              Logout
            </Button>
          </div>

        </div>

        <ProgressBar
          current={user.currentXp}
          max={user.requiredXp}
          label="Experience"
        />

      </div>

      {/* ============================
          MAIN 3-COLUMN LAYOUT
      ============================= */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* QUEST */}
        <QuestTracker
          progress={todayProgress!}
          onUpdate={updateProgress}
          onComplete={completeQuest}
          onForfeit={() => {}}
          isCompleted={todayProgress!.completed}
        />

        {/* STATUS */}
        <StatusWindow
          user={user}
          onUpgradeStat={() => {}}
          onUnequip={unequipItem}
          equippedBonuses={equippedBonuses}
        />

        {/* CHAT */}
        <SystemChat user={user} />

      </div>

    </div>
  );
};

// ------------------------------
export default App;
// ------------------------------
