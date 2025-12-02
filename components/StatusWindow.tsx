import React from 'react';
import { SystemWindow, Button } from './SystemComponents';
import { User, Stats, EquipmentSlot } from '../types';

interface StatusWindowProps {
  user: User;
  onUpgradeStat: (stat: keyof Stats) => void;
  equippedBonuses: Partial<Stats>;
  onUnequip: (slot: EquipmentSlot) => void;
}

export const StatusWindow: React.FC<StatusWindowProps> = ({
  user,
  onUpgradeStat,
  equippedBonuses,
  onUnequip
}) => {
  const statRows: { label: string; key: keyof Stats }[] = [
    { label: 'Strength', key: 'strength' },
    { label: 'Agility', key: 'agility' },
    { label: 'Sense', key: 'sense' },
    { label: 'Vitality', key: 'vitality' },
    { label: 'Intelligence', key: 'intelligence' },
  ];

  return (
    <SystemWindow title="Status" className="flex flex-col h-full">
      
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4 mb-6 border-b border-slate-700 pb-4">
        <div>
          <div className="text-xs text-slate-400 uppercase">Name</div>
          <div className="text-lg font-bold text-white">{user.username}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400 uppercase">Level</div>
          <div className="text-lg font-bold text-cyan-300">{user.level}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400 uppercase">Job</div>
          <div className="text-sm font-bold text-white">{user.job}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400 uppercase">Rank</div>
          <div className="text-sm font-bold text-white">{user.rank}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400 uppercase">Title</div>
          <div className="text-sm font-bold text-white">{user.title}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400 uppercase">Gold</div>
          <div className="text-sm font-bold text-yellow-400 font-mono-tech">
            {user.gold.toLocaleString()} G
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-3">
        {statRows.map((stat) => (
          <div
            key={stat.key}
            className="flex justify-between items-center bg-slate-800/50 p-2 rounded border border-slate-700/50"
          >
            <span className="text-sm font-bold uppercase w-28 text-slate-300">
              {stat.label}
            </span>

            {/* Base stat */}
            <span className="font-mono-tech text-lg text-white">
              {user.stats[stat.key]}
            </span>

            {/* Bonus */}
            {equippedBonuses[stat.key] && equippedBonuses[stat.key]! > 0 && (
              <span className="text-green-300 text-sm ml-2">
                +{equippedBonuses[stat.key]}
              </span>
            )}

            {/* Upgrade button */}
            {user.stats.availablePoints > 0 && (
              <button
                onClick={() => onUpgradeStat(stat.key)}
                className="w-8 h-8 flex items-center justify-center bg-cyan-600/20 border border-cyan-500 text-cyan-300 hover:bg-cyan-500 hover:text-white transition-colors text-lg"
              >
                +
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Equipped items list */}
      <div className="mt-6 border-t border-slate-700 pt-4">
        <div className="text-sm text-slate-400 uppercase mb-2">Equipped Gear</div>

        <div className="space-y-2">
          {Object.entries(user.equipment || {}).map(([slot, itemId]) =>
            itemId ? (
              <div
                key={slot}
                className="flex justify-between items-center bg-slate-800/40 border border-slate-700 p-2 rounded"
              >
                <span className="capitalize">{slot}</span>
                <Button
                  className="text-[10px] px-2 py-1"
                  onClick={() => onUnequip(slot as EquipmentSlot)}
                >
                  Unequip
                </Button>
              </div>
            ) : (
              <div
                key={slot}
                className="flex justify-between items-center bg-slate-800/20 border border-slate-700 p-2 rounded text-slate-500"
              >
                <span className="capitalize">{slot}</span>
                <span className="text-xs">Empty</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Available points */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-400 uppercase">Available Points</span>
          <span className="text-2xl font-bold text-cyan-400 font-mono-tech system-text-shadow">
            {user.stats.availablePoints}
          </span>
        </div>
      </div>
    </SystemWindow>
  );
};
