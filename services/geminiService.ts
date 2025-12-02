// src/services/geminiService.ts

import { GoogleGenAI } from "@google/genai";
import { User } from "../types";

// ✅ FIX 1: Make Vite env access safe for Vercel Build
const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;

if (!apiKey) {
  console.warn("❌ VITE_GEMINI_API_KEY is missing. Check .env.local or Vercel Env Vars.");
}

// Create AI client safely
const ai = new GoogleGenAI({ apiKey });

// ---------------------------------------------------

export const generateSystemMessage = async (
  context: "LOGIN" | "LEVEL_UP" | "FAILURE" | "ADVICE" | "REMINDER" | "PENALTY",
  user: User,
  userQuery?: string
): Promise<string> => {
  const modelId = "gemini-2.5-flash";

  const baseSystemInstruction = `
    You are 'The System' from Solo Leveling.
    Speak with a robotic, cold, dominating tone.
    Refer to user as 'Player'.
    Use RPG terms like Stats, Level, Title, Rank, Penalty Zone.
    Format like a system notification window.
  `;

  let prompt = "";

  switch (context) {
    case "LOGIN":
      prompt = `Player has logged in. Level: ${user.level}. Streak: ${user.streak}. Welcome them and remind about today's Daily Quest.`;
      break;

    case "LEVEL_UP":
      prompt = `Player reached Level ${user.level}. Congratulate coldly. Tell them to allocate stat points.`;
      break;

    case "FAILURE":
      prompt = `Player failed the daily quest. Warn them about the Penalty Zone.`;
      break;

    case "ADVICE":
      prompt = `Player asks: "${userQuery}". Provide fitness-RPG advice. Keep it under 100 words.`;
      break;

    case "REMINDER":
      prompt = `Player is late. Remind them the Daily Quest remains incomplete. Threaten the Penalty Zone.`;
      break;

    case "PENALTY":
      prompt = `Player triggered Penalty Quest: Survival. Describe the danger in a menacing, Solo Leveling tone.`;
      break;
  }

  try {
    const result = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: baseSystemInstruction,
      },
    });

    return result.text || "SYSTEM: CONNECTION UNSTABLE.";
  } catch (err) {
    console.error("Gemini API ERROR:", err);
    return "SYSTEM: OFFLINE.";
  }
};
