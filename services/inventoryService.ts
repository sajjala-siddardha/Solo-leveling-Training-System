// src/services/inventoryService.ts

import { Stats } from '../types';

/**
 * Slots where gear and runes can be equipped.
 */
export type EquipmentSlot =
  | 'weapon'
  | 'armor'
  | 'cloak'
  | 'gloves'
  | 'boots'
  | 'necklace'
  | 'ring1'
  | 'ring2'
  | 'rune';

/**
 * Inventory item definition.
 * Maps perfectly with App.tsx <ItemBox /> usage.
 */
export interface InventoryItem {
  id: number; // unique per item
  name: string;
  desc: string;

  // potion | box | key | gear | material | rune
  type: 'potion' | 'box' | 'key' | 'gear' | 'material' | 'rune';

  // item rarity color-coded in Item Box
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';

  // gear & rune only
  slot?: EquipmentSlot;

  // stat bonuses (optional)
  bonuses?: Partial<Stats>;
}

/**
 * Helper to build unique key per user
 */
const storageKey = (email: string) => `inventory_${email}`;

/**
 * Load inventory from localStorage
 */
export const loadInventory = (email: string): InventoryItem[] => {
  const data = localStorage.getItem(storageKey(email));
  return data ? JSON.parse(data) : [];
};

/**
 * Save inventory list into localStorage
 */
export const saveInventory = (email: string, items: InventoryItem[]): void => {
  localStorage.setItem(storageKey(email), JSON.stringify(items));
};
/**
 * Add a new item to inventory
 */
export const addItemToInventory = (
  email: string,
  item: Omit<InventoryItem, 'id'>
): InventoryItem[] => {
  const inv = loadInventory(email);

  const newItem: InventoryItem = {
    id: Date.now(), // unique ID
    ...item,
  };

  const updated = [...inv, newItem];
  saveInventory(email, updated);

  return updated;
};

/**
 * Remove an item by its inventory ID
 */
export const removeItem = (email: string, id: number): InventoryItem[] => {
  const inv = loadInventory(email);
  const updated = inv.filter((i) => i.id !== id);
  saveInventory(email, updated);
  return updated;
};
