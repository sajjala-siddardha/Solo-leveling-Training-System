import { User, INITIAL_USER, DailyProgress } from '../types';

const SESSION_KEY = 'SOLO_SYSTEM_CURRENT_SESSION';
const USER_PREFIX = 'SOLO_SYSTEM_USER_';
const CHAT_PREFIX = 'SOLO_SYSTEM_CHAT_';

export interface ChatMessage {
  sender: 'SYSTEM' | 'PLAYER';
  text: string;
}

// Get active session email
export const getCurrentSessionEmail = (): string | null => {
  return localStorage.getItem(SESSION_KEY);
};

// Save user
export const saveUser = (user: User): void => {
  try {
    if (!user.email) return;
    localStorage.setItem(`${USER_PREFIX}${user.email}`, JSON.stringify(user));
    localStorage.setItem(SESSION_KEY, user.email);
  } catch (error) {
    console.error("Failed to save user data", error);
  }
};

// Load user
export const loadUser = (email: string): User | null => {
  try {
    const data = localStorage.getItem(`${USER_PREFIX}${email}`);
    if (!data) return null;

    const user: User = JSON.parse(data);

    // 🔥 Ensure equipment always exists (important)
    if (!user.equipment) {
      user.equipment = {
        weapon: null,
        armor: null,
        cloak: null,
        gloves: null,
        boots: null,
        necklace: null,
        ring1: null,
        ring2: null,
        rune: null,
      };
    }

    return user;
  } catch (error) {
    console.error("Failed to load user data", error);
    return null;
  }
};

// Check if user exists
export const checkUserExists = (email: string): boolean => {
  return !!localStorage.getItem(`${USER_PREFIX}${email}`);
};

// Login / Register user
export const loginUser = (
  email: string,
  username: string
): { user: User; isNew: boolean } => {
  const existingUser = loadUser(email);

  if (existingUser) {
    // Update username but keep data
    const updated = {
      ...existingUser,
      username,
      equipment: existingUser.equipment || {
        weapon: null,
        armor: null,
        cloak: null,
        gloves: null,
        boots: null,
        necklace: null,
        ring1: null,
        ring2: null,
        rune: null,
      },
    };

    saveUser(updated);
    return { user: updated, isNew: false };
  }

  // New user
  const newUser: User = {
    ...INITIAL_USER,
    email,
    username,

    // important for new accounts
    equipment: {
      weapon: null,
      armor: null,
      cloak: null,
      gloves: null,
      boots: null,
      necklace: null,
      ring1: null,
      ring2: null,
      rune: null,
    },

    history: [],
  };

  saveUser(newUser);
  return { user: newUser, isNew: true };
};

// Logout
export const logoutUser = (): void => {
  localStorage.removeItem(SESSION_KEY);
};

// Load active session
export const loadCurrentSession = (): User | null => {
  const email = getCurrentSessionEmail();
  if (!email) return null;
  return loadUser(email);
};

// -------------------------
// CHAT HISTORY
// -------------------------

export const saveChatHistory = (
  email: string,
  messages: ChatMessage[]
): void => {
  try {
    localStorage.setItem(`${CHAT_PREFIX}${email}`, JSON.stringify(messages));
  } catch {
    console.error("Failed to save chat");
  }
};

export const loadChatHistory = (email: string): ChatMessage[] => {
  try {
    const data = localStorage.getItem(`${CHAT_PREFIX}${email}`);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
};

// -------------------------
// DAILY PROGRESS
// -------------------------

export const saveProgressToHistory = (
  user: User,
  progress: DailyProgress
): User => {
  const updatedHistory = user.history.filter((h) => h.date !== progress.date);
  updatedHistory.push(progress);

  const updated = { ...user, history: updatedHistory };
  saveUser(updated);
  return updated;
};
