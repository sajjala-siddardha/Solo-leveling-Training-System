import { GoogleGenAI } from "@google/genai";
import { User, DailyProgress } from '../types';

// Updated to use Vite environment variable system
const getAiClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error("API Key missing");
    return null;
  }

  return new GoogleGenAI({ apiKey });
};

export const generateSystemMessage = async (
  context: 'LOGIN' | 'LEVEL_UP' | 'FAILURE' | 'ADVICE' | 'REMINDER' | 'PENALTY',
  user: User,
  userQuery?: string
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "SYSTEM ERROR: API KEY NOT FOUND.";

  const modelId = "gemini-2.5-flash"; 
  
  let prompt = "";
  
  const baseSystemInstruction = `
    You are 'The System' from the Solo Leveling universe. 
    You speak directly to the 'Player' (User: ${user.username}).
    Your tone is robotic, cold, authoritative, yet helpful in a gamified way.
    Use terms like 'Player', 'Daily Quest', 'Stats', 'Penalty Zone'.
    Format your response as a system notification window text.
    Keep it concise (under 50 words unless asked for advice).
  `;

  switch (context) {
    case 'LOGIN':
      prompt = `The player has logged in. Current Level: ${user.level}. Streak: ${user.streak}. Welcome them back and remind them of the Daily Quest: Strength Training.`;
      break;

    case 'LEVEL_UP':
      prompt = `The player reached Level ${user.level}! Congratulate them coldly. Remind them to allocate stat points.`;
      break;

    case 'FAILURE':
      prompt = `The player failed to complete the daily quest. Warn them about the 'Penalty Zone'.`;
      break;

    case 'ADVICE':
      prompt = `The player is asking for advice: "${userQuery}". Provide a fitness-focused answer but wrapped in RPG metaphors (describe muscle growth like Strength stat increase). Keep it under 100 words.`;
      break;

    case 'REMINDER':
      prompt = `The player hasn't completed their daily quest yet. Time is ticking. Generate a short, threatening notification about the consequences (Penalty Zone).`;
      break;

    case 'PENALTY':
      prompt = `The player has FAILED or FORFEITED the Daily Quest. Announce "Penalty Quest: Survival". Describe a terrifying environment (giant centipedes / desert) they must survive. Be menacing.`;
      break;
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: baseSystemInstruction,
      }
    });

    return response.text || "SYSTEM: CONNECTION UNSTABLE.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "SYSTEM: OFFLINE.";
  }
};
