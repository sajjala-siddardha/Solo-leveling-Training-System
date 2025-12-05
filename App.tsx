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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayProgress, setTodayProgress] = useState<DailyProgress | null>(null);
  const [systemNotif, setSystemNotif] = useState<string | null>(null);

  // Inputs
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');

  // UI
  const [showShop, setShowShop] = useState(false);
  const [showItemBox, setShowItemBox] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Penalty
  const [penaltyActive, setPenaltyActive] = useState(false);
  const [penaltyClicks, setPenaltyClicks] = useState(0);
  const [penaltyGateOpen, setPenaltyGateOpen] = useState(false);

  // Inventory
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const todayStr = new Date().toISOString().split('T')[0];

  // ---- Helpers: Equipped Bonuses ----
  const getEquippedBonuses = (u: User | null, inv: InventoryItem[]): Partial<Stats> => {
    const empty: Partial<Stats> = {
      strength: 0,
      agility: 0,
      sense: 0,
      vitality: 0,
      intelligence: 0,
    };
    if (!u || !u.equipment) return empty;

    const result: Partial<Stats> = { ...empty };

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
      const item = inv.find((it) => it.id === id);
      if (!item || !item.bonuses) continue;

      for (const key of Object.keys(item.bonuses) as (keyof Stats)[]) {
        const val = item.bonuses[key] || 0;
        (result as any)[key] = ((result as any)[key] || 0) + val;
      }
    }

    return result;
  };

  const equippedBonuses = getEquippedBonuses(user, inventory);

  // ---- INIT ----
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

  // ---- PENALTY (20:00) ----
  useEffect(() => {
    if (
      !user ||
      !todayProgress ||
      todayProgress.completed ||
      todayProgress.penaltySurvived ||
      penaltyActive
    )
      return;

    const checkTime = () => {
      const now = new Date();
      if (now.getHours() >= 20) {
        triggerPenalty('TIME LIMIT EXCEEDED (20:00). PENALTY INITIATED.');
      }
    };

    const interval = setInterval(checkTime, 30000);
    checkTime();

    return () => clearInterval(interval);
  }, [user, todayProgress, penaltyActive]);

  // ---- AI REMINDER ----
  useEffect(() => {
    if (
      !user ||
      !todayProgress ||
      todayProgress.completed ||
      todayProgress.penaltySurvived ||
      !notificationsEnabled ||
      penaltyActive
    )
      return;

    const timer = setTimeout(async () => {
      const now = new Date();
      if (now.getHours() < 20) {
        const msg = await generateSystemMessage('REMINDER', user);
        sendSystemNotification('The System', msg);
        soundService.playNotification();
        setSystemNotif(msg);
      }
    }, 60000 * 15);

    return () => clearTimeout(timer);
  }, [user, todayProgress, notificationsEnabled, penaltyActive]);

  // ---- DAILY RESET ----
  const checkDailyReset = (currentUser: User) => {
    const lastLog = currentUser.history[currentUser.history.length - 1];

    if (lastLog && lastLog.date === todayStr) {
      setTodayProgress(lastLog);
    } else {
      const fresh: DailyProgress = {
        date: todayStr,
        pushups: 0,
        situps: 0,
        squats: 0,
        running: 0,
        completed: false,
        penaltySurvived: false,
      };
      setTodayProgress(fresh);
    }
  };

  // ---- LOGIN ----
  const handleLogin = () => {
    if (!nameInput.trim() || !emailInput.trim()) return;

    if (!emailInput.includes('@')) {
      soundService.playError();
      return;
    }

    const exists = checkUserExists(emailInput);
    if (exists) {
      alert('Account already registered. Logging in...');
    }

    const { user: loggedInUser } = loginUser(emailInput, nameInput);
    setUser(loggedInUser);
    checkDailyReset(loggedInUser);

    const inv = loadInventory(loggedInUser.email);
    setInventory(inv);

    soundService.playConfirm();
    generateSystemMessage('LOGIN', loggedInUser).then((msg) => setSystemNotif(msg));
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setTodayProgress(null);
    setNameInput('');
    setEmailInput('');
    setInventory([]);
    soundService.playClick();
  };
  // ---- NOTIFICATION PERMISSION ----
  const enableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);

    if (granted) {
      soundService.playConfirm();
      new Notification('The System', {
        body: 'Notifications Enabled. Do not fail your daily quest.',
        silent: true,
      });
      soundService.playNotification();
    }
  };

  // ---- QUEST PROGRESS ----
  const updateProgress = (field: keyof DailyProgress, value: number) => {
    if (!todayProgress) return;

    setTodayProgress((prev) =>
      prev ? { ...prev, [field]: value } : prev
    );
  };

  const completeQuest = async () => {
    if (!user || !todayProgress) return;

    const xpGain = 150;
    const goldGain = 1000;

    let newLevel = user.level;
    let currentXp = user.currentXp + xpGain;
    let requiredXp = user.requiredXp;
    let availablePoints = user.stats.availablePoints;
    let leveledUp = false;

    while (currentXp >= requiredXp) {
      currentXp -= requiredXp;
      newLevel++;
      requiredXp = calculateRequiredXp(newLevel);
      availablePoints += 3;
      leveledUp = true;
    }

    const completedEntry = { ...todayProgress, completed: true };
    const newHistory = user.history.filter((h) => h.date !== todayStr);
    newHistory.push(completedEntry);

    let updatedUser: User = {
      ...user,
      level: newLevel,
      currentXp,
      requiredXp,
      gold: user.gold + goldGain,
      stats: { ...user.stats, availablePoints },
      streak: user.streak + 1,
      history: newHistory,
    };

    const prog = checkProgression(updatedUser);
    updatedUser = prog.user;

    setUser(updatedUser);
    setTodayProgress(completedEntry);
    saveUser(updatedUser);

    soundService.playLevelUp();

    if (leveledUp) {
      const msg = await generateSystemMessage('LEVEL_UP', updatedUser);
      setSystemNotif(msg);
    } else {
      setSystemNotif('DAILY QUEST COMPLETED. REWARDS ACCEPTED.');
    }
  };

  // ---- SHOP PURCHASE ----
  const buyItem = (
    cost: number,
    itemName: string,
    type: 'potion' | 'box' | 'key' | 'gear' | 'material' | 'rune',
    desc: string,
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary',
    slot?: EquipmentSlot,
    bonuses: Partial<Stats> = {}
  ) => {
    if (!user || !todayProgress) return;

    if (user.gold < cost) {
      setSystemNotif('INSUFFICIENT FUNDS.');
      soundService.playError();
      return;
    }

    let updatedUser = { ...user, gold: user.gold - cost };
    let message = `PURCHASED: [${itemName}] added to Item Box.`;

    const newInv = addItemToInventory(user.email, {
      name: itemName,
      type,
      desc,
      rarity,
      slot,
      bonuses,
    });

    setInventory(newInv);
    saveUser(updatedUser);
    setUser(updatedUser);

    setSystemNotif(message);
    soundService.playConfirm();
  };

  const closeNotif = () => setSystemNotif(null);

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-cyan-500 font-mono-tech animate-pulse">
        CONNECTING TO SYSTEM...
      </div>
    );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <SystemWindow title="Security Clearance" className="w-full max-w-md z-10">
          {/* LOGIN FIELDS */}
        </SystemWindow>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
      
      {/* SHOP MODAL */}
      {showShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <SystemWindow title="Hunter Supply Shop" className="max-w-3xl w-full">

            <div className="max-h-[70vh] overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* SHOP ITEMS HERE */}
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700">
              <div className="text-yellow-400 font-bold font-mono-tech">
                Gold: {user.gold.toLocaleString()} G
              </div>
              <Button onClick={() => setShowShop(false)}>Close Shop</Button>
            </div>

          </SystemWindow>
        </div>
      )}

      {/* ITEM BOX MODAL */}
      {showItemBox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <SystemWindow title="Item Box" className="max-w-lg w-full">

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">

              {inventory.length === 0 ? (
                <div className="text-slate-400 text-center py-6 text-sm">No items stored.</div>
              ) : (
                inventory.map((item) => (
                  <div key={item.id}
                    className="p-3 bg-slate-800 border border-slate-700 rounded flex justify-between items-center"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-cyan-300 text-sm">
                        {item.name}
                      </span>
                      <span className="text-xs text-slate-400">{item.desc}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Button className="text-[10px] px-2 py-1"
                        onClick={() => {
                          const updated = removeItem(user.email, item.id);
                          setInventory(updated);
                        }}>
                        Discard
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end mt-4 pt-4 border-t border-slate-700">
              <Button onClick={() => setShowItemBox(false)}>Close</Button>
            </div>

          </SystemWindow>
        </div>
      )}

      {/* HEADER + MAIN UI BELOW */}
      {/* ... (your full JSX continues here exactly as before) ... */}

    </div>
  );
};

export default App;
