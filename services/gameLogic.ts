import { User, Rank, HunterClass } from '../types';

// XP Curve: Linear scaling for simplicity in this demo, but could be exponential
export const calculateRequiredXp = (level: number): number => {
  return Math.floor(100 * Math.pow(1.15, level - 1));
};

export const getRankForLevel = (level: number): Rank => {
  if (level >= 100) return Rank.NATIONAL;
  if (level >= 80) return Rank.S;
  if (level >= 60) return Rank.A;
  if (level >= 40) return Rank.B;
  if (level >= 20) return Rank.C;
  if (level >= 10) return Rank.D;
  return Rank.E;
};

export const getJobForLevel = (level: number): { job: HunterClass; title: string } => {
  if (level >= 75) return { job: HunterClass.SHADOW_MONARCH, title: 'King of the Dead' };
  if (level >= 45) return { job: HunterClass.NECROMANCER, title: 'Mage of Death' };
  if (level >= 25) return { job: HunterClass.ASSASSIN, title: 'Silent Killer' };
  if (level >= 10) return { job: HunterClass.FIGHTER, title: 'Wolf Slayer' };
  return { job: HunterClass.NONE, title: 'The Weakest' };
};

export const checkProgression = (user: User): { 
  newRank?: Rank; 
  newJob?: HunterClass; 
  newTitle?: string; 
  didLevelUp: boolean;
  user: User;
} => {
  const currentRank = user.rank;
  const currentJob = user.job;
  const newRank = getRankForLevel(user.level);
  const { job: newJob, title: newTitle } = getJobForLevel(user.level);

  let updatedUser = { ...user };
  let rankChanged = false;
  let jobChanged = false;

  if (newRank !== currentRank) {
    updatedUser.rank = newRank;
    rankChanged = true;
  }

  // Only upgrade job, never downgrade (unless we want to support class reset, but not for now)
  // Simple check: we just take the new one if it's different and "higher" index roughly mapping to levels
  if (newJob !== currentJob) {
    updatedUser.job = newJob;
    updatedUser.title = newTitle;
    jobChanged = true;
  }

  return {
    newRank: rankChanged ? newRank : undefined,
    newJob: jobChanged ? newJob : undefined,
    newTitle: jobChanged ? newTitle : undefined,
    didLevelUp: false, // This function is called AFTER level up logic usually
    user: updatedUser
  };
};