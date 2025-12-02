
import React, { useState, useEffect } from 'react';
import { SystemWindow, Button, ProgressBar } from './SystemComponents';
import { DailyProgress, DAILY_GOALS } from '../types';

interface QuestTrackerProps {
  progress: DailyProgress;
  onUpdate: (field: keyof DailyProgress, value: number) => void;
  onComplete: () => void;
  onForfeit: () => void;
  isCompleted: boolean;
}

export const QuestTracker: React.FC<QuestTrackerProps> = ({ progress, onUpdate, onComplete, onForfeit, isCompleted }) => {
  // Local state for smooth UI updates before committing to parent
  const [localProgress, setLocalProgress] = useState(progress);

  useEffect(() => {
    setLocalProgress(progress);
  }, [progress]);

  const handleChange = (field: keyof DailyProgress, val: string) => {
    const num = parseInt(val) || 0;
    setLocalProgress(prev => ({ ...prev, [field]: num }));
  };

  const handleBlur = (field: keyof DailyProgress) => {
    onUpdate(field, localProgress[field] as number);
  };

  const allGoalsMet = 
    localProgress.pushups >= DAILY_GOALS.pushups &&
    localProgress.situps >= DAILY_GOALS.situps &&
    localProgress.squats >= DAILY_GOALS.squats &&
    localProgress.running >= DAILY_GOALS.running;
    
  const penaltySurvived = progress.penaltySurvived;

  return (
    <SystemWindow title="Daily Quest: Strength Training" className="flex flex-col gap-6">
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold text-cyan-300 tracking-wider">GOALS</h2>
        <p className={`text-xs uppercase ${penaltySurvived ? 'text-green-400 font-bold' : 'text-slate-400'}`}>
           {penaltySurvived 
             ? "PENALTY SURVIVED. You may still complete the daily quest." 
             : "Warning: Failure to complete will result in a penalty."}
        </p>
      </div>

      <div className="space-y-4">
        {/* Push-ups */}
        <div className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-12 md:col-span-4">
             <label className="text-sm font-bold text-white uppercase block">Push-ups</label>
             <span className="text-xs text-slate-500">Target: {DAILY_GOALS.pushups}</span>
          </div>
          <div className="col-span-8 md:col-span-6">
            <ProgressBar current={localProgress.pushups} max={DAILY_GOALS.pushups} />
          </div>
          <div className="col-span-4 md:col-span-2">
            <input 
              type="number" 
              value={localProgress.pushups}
              onChange={(e) => handleChange('pushups', e.target.value)}
              onBlur={() => handleBlur('pushups')}
              disabled={isCompleted}
              className="w-full bg-slate-800 border border-slate-600 text-cyan-300 p-1 text-center font-mono-tech focus:border-cyan-400 outline-none"
            />
          </div>
        </div>

        {/* Sit-ups */}
        <div className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-12 md:col-span-4">
             <label className="text-sm font-bold text-white uppercase block">Sit-ups</label>
             <span className="text-xs text-slate-500">Target: {DAILY_GOALS.situps}</span>
          </div>
          <div className="col-span-8 md:col-span-6">
            <ProgressBar current={localProgress.situps} max={DAILY_GOALS.situps} />
          </div>
          <div className="col-span-4 md:col-span-2">
             <input 
              type="number" 
              value={localProgress.situps}
              onChange={(e) => handleChange('situps', e.target.value)}
              onBlur={() => handleBlur('situps')}
              disabled={isCompleted}
              className="w-full bg-slate-800 border border-slate-600 text-cyan-300 p-1 text-center font-mono-tech focus:border-cyan-400 outline-none"
            />
          </div>
        </div>

        {/* Squats */}
        <div className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-12 md:col-span-4">
             <label className="text-sm font-bold text-white uppercase block">Squats</label>
             <span className="text-xs text-slate-500">Target: {DAILY_GOALS.squats}</span>
          </div>
          <div className="col-span-8 md:col-span-6">
            <ProgressBar current={localProgress.squats} max={DAILY_GOALS.squats} />
          </div>
          <div className="col-span-4 md:col-span-2">
             <input 
              type="number" 
              value={localProgress.squats}
              onChange={(e) => handleChange('squats', e.target.value)}
              onBlur={() => handleBlur('squats')}
              disabled={isCompleted}
              className="w-full bg-slate-800 border border-slate-600 text-cyan-300 p-1 text-center font-mono-tech focus:border-cyan-400 outline-none"
            />
          </div>
        </div>

        {/* Running */}
        <div className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-12 md:col-span-4">
             <label className="text-sm font-bold text-white uppercase block">Running (km)</label>
             <span className="text-xs text-slate-500">Target: {DAILY_GOALS.running}km</span>
          </div>
          <div className="col-span-8 md:col-span-6">
            <ProgressBar current={localProgress.running} max={DAILY_GOALS.running} />
          </div>
          <div className="col-span-4 md:col-span-2">
             <input 
              type="number" 
              value={localProgress.running}
              onChange={(e) => handleChange('running', e.target.value)}
              onBlur={() => handleBlur('running')}
              disabled={isCompleted}
              className="w-full bg-slate-800 border border-slate-600 text-cyan-300 p-1 text-center font-mono-tech focus:border-cyan-400 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center gap-4">
        {!isCompleted && !penaltySurvived && (
          <Button 
            onClick={onForfeit} 
            variant="danger"
            className="text-xs py-1 px-3 opacity-60 hover:opacity-100"
          >
            Forfeit Quest
          </Button>
        )}
        
        {isCompleted ? (
           <div className="flex-grow text-center text-green-400 font-bold text-xl uppercase tracking-widest animate-pulse border-2 border-green-500 px-6 py-2 bg-green-900/20">
             Quest Completed
           </div>
        ) : (
          <Button 
            onClick={onComplete} 
            disabled={!allGoalsMet}
            className={`flex-grow ${allGoalsMet ? "animate-bounce" : "opacity-50"}`}
          >
            Complete Quest
          </Button>
        )}
      </div>
    </SystemWindow>
  );
};
