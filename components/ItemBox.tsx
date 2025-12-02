// src/components/ItemBox.tsx

import React from 'react';
import { SystemWindow, Button } from './SystemComponents';
import { InventoryItem, removeItem } from '../services/inventoryService';
import { EquipmentSlot, User } from '../types';

interface ItemBoxProps {
  user: User;
  inventory: InventoryItem[];
  setInventory: (items: InventoryItem[]) => void;
  onEquip: (item: InventoryItem) => void;
  onClose: () => void;
}

export const ItemBox: React.FC<ItemBoxProps> = ({
  user,
  inventory,
  setInventory,
  onEquip,
  onClose
}) => {
  return (
    <SystemWindow title="Item Box" className="max-w-lg w-full">
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {inventory.length === 0 ? (
          <div className="text-slate-400 text-center py-6 text-sm">
            No items stored. Buy items from the Shop.
          </div>
        ) : (
          inventory.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-slate-800 border border-slate-700 rounded flex justify-between items-center gap-3"
            >
              {/* ITEM INFO */}
              <div className="flex flex-col">
                <span className="font-bold text-cyan-300 text-sm">
                  {item.name}{' '}
                  <span
                    className={`text-[10px] uppercase ml-1 ${
                      item.rarity === 'Common'
                        ? 'text-slate-400'
                        : item.rarity === 'Rare'
                        ? 'text-blue-300'
                        : item.rarity === 'Epic'
                        ? 'text-purple-300'
                        : 'text-yellow-300'
                    }`}
                  >
                    [{item.rarity}]
                  </span>
                </span>

                <span className="text-xs text-slate-400">{item.desc}</span>

                <span className="text-[10px] text-slate-500 mt-1 uppercase">
                  Type: {item.type}
                  {item.slot ? ` · Slot: ${item.slot}` : ''}
                </span>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col gap-1">
                {(item.type === 'gear' || item.type === 'rune') && (
                  <Button
                    onClick={() => onEquip(item)}
                    className="text-[10px] px-2 py-1"
                  >
                    Equip
                  </Button>
                )}

                <Button
                  onClick={() => {
                    const updated = removeItem(user.email, item.id);
                    setInventory(updated);
                  }}
                  className="text-[10px] px-2 py-1"
                >
                  Use
                </Button>

                <Button
                  onClick={() => {
                    const updated = removeItem(user.email, item.id);
                    setInventory(updated);
                  }}
                  className="text-[10px] px-2 py-1"
                  variant="secondary"
                >
                  Discard
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CLOSE BUTTON */}
      <div className="flex justify-end mt-4 pt-4 border-t border-slate-700">
        <Button onClick={onClose}>Close</Button>
      </div>
    </SystemWindow>
  );
};
