import { GoogleGenAI, Type, Chat, Modality } from "@google/genai";
import { AIResponseSchema, WordDefinition } from "../types";
import { decode, decodeAudioData } from "./audioUtils";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// -- Text Chat Service --

export const createChatSession = (systemInstruction: string): Chat => {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `
        ${systemInstruction}
        IMPORTANT: You are a role-play partner. 
        You MUST return a JSON object for every response. 
        The JSON must strictly follow this schema:
        {
          "characterResponse": "Your in-character reply in English.",
          "translation": "The Portuguese translation of your reply.",
          "feedback": "Helpful feedback in Portuguese about the user's grammar/vocab in their last message. If their English was perfect, say 'Excelente!' or give a relevant tip."
        }
        Do not output markdown code blocks. Output raw JSON.
      `,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          characterResponse: { type: Type.STRING },
          translation: { type: Type.STRING },
          feedback: { type: Type.STRING },
        },
        required: ["characterResponse", "translation", "feedback"],
      },
    },
  });
};

export const sendMessageToChat = async (chat: Chat, message: string): Promise<AIResponseSchema> => {
  try {
    const response = await chat.sendMessage({ message });
    const text = response.text;
    if (!text) throw new Error("No response text");
    
    // Parse JSON
    return JSON.parse(text) as AIResponseSchema;
  } catch (error) {
    console.error("Chat Error:", error);
    // Fallback response if JSON parsing fails or API errors
    return {
      characterResponse: "I'm sorry, I didn't catch that. Could you say it again?",
      translation: "Desculpe, não entendi. Pode repetir?",
      feedback: "Ocorreu um erro técnico. Tente novamente.",
    };
  }
};

export const getWordDefinition = async (word: string, contextSentence: string): Promise<WordDefinition | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Define the word "${word}" based on its usage in this sentence: "${contextSentence}". Return a JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            portugueseDefinition: { type: Type.STRING, description: "Short definition in Portuguese" },
            examples: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "2 simple example sentences in English using this word"
            }
          },
          required: ["word", "portugueseDefinition", "examples"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as WordDefinition;
  } catch (error) {
    console.error("Dictionary Error:", error);
    return null;
  }
}

// -- TTS Service --

export const generateSpeech = async (text: string): Promise<AudioBuffer | null> => {
  try {
    // Generate speech using the specific TTS model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Kore', 'Fenrir', 'Puck', 'Charon'
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) return null;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      audioContext,
      24000,
      1
    );
    
    return audioBuffer;

  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};