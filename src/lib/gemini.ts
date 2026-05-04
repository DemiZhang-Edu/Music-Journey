import { GoogleGenAI, Type } from "@google/genai";
import { localDB } from "./storage";

let aiInstance: GoogleGenAI | null = null;
let currentKey: string | null = null;

function getAI() {
  const localKey = localDB.getAIKey();
  // process.env.GEMINI_API_KEY is injected by Vite in AI Studio
  // import.meta.env.VITE_GEMINI_API_KEY is used for traditional Vite env vars
  const apiKey = localKey || process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing Gemini API Key. Please visit Settings to set your own key.");
  }

  // If key changed, recreate instance
  if (!aiInstance || currentKey !== apiKey) {
    currentKey = apiKey;
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

const MODEL_NAME = "gemini-3-flash-preview";

export async function analyzeMusicPiece(title: string, composer: string) {
  const ai = getAI();
  const prompt = `You are a professional music teacher. Please provide the following information for the piece "${title}" (Composer: ${composer}):
  1. Musical background and context
  2. Brief composer biography
  3. Musical style and characteristics
  4. Practice difficulty breakdown (Overall evaluation, key sections with measure numbers, and practice tips)`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            composer: { type: Type.STRING },
            era: { type: Type.STRING },
            style: { type: Type.STRING },
            background: { type: Type.STRING },
            difficultyAnalysis: {
              type: Type.OBJECT,
              properties: {
                overall: { type: Type.STRING },
                keySections: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      measureRange: { type: Type.STRING },
                      description: { type: Type.STRING },
                      tips: { type: Type.STRING }
                    },
                    required: ["measureRange", "description", "tips"]
                  }
                }
              },
              required: ["overall", "keySections"]
            }
          },
          required: ["composer", "era", "style", "background", "difficultyAnalysis"]
        }
      }
    });

    let text = response.text || "{}";
    // Clean up possible markdown code blocks if responseMimeType fails
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini analyzeMusicPiece failed:", error);
    throw error;
  }
}

export async function analyzeSheetMusicPdf(pdfBase64: string) {
  const ai = getAI();
  const prompt = `You are a professional music teacher. Please analyze this sheet music PDF and extract the following information (keep it very concise and provide both Chinese and English for each item):
  1. Recommended Tempo for the piece
  2. Key Points and difficult sections (extract 3-5 items)
  3. Practice Suggestions specific to this score (extract 3-5 items)`;

  const pdfPart = {
    inlineData: {
      mimeType: "application/pdf",
      data: pdfBase64,
    },
  };

  const bilingualSchema = {
    type: Type.OBJECT,
    properties: {
      zh: { type: Type.STRING },
      en: { type: Type.STRING }
    },
    required: ["zh", "en"]
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: "user", parts: [pdfPart, { text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tempo: bilingualSchema,
            keyPoints: { 
              type: Type.ARRAY,
              items: bilingualSchema
            },
            practiceSuggestions: { 
              type: Type.ARRAY,
              items: bilingualSchema
            },
          },
          required: ["tempo", "keyPoints", "practiceSuggestions"]
        },
      },
    });

    let text = response.text || "{}";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini analyzeSheetMusicPdf failed:", error);
    throw error;
  }
}

export async function getEncouragement(pieceTitle: string, duration: number, notes: string) {
  const ai = getAI();
  const prompt = `A student just practiced "${pieceTitle}" for ${duration} minutes. Practice notes: "${notes}".
  As a gentle and professional music teacher, please provide a short (within 30 words) encouraging message in English.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    return response.text?.trim() || "Keep up the great work, your playing is sounding more beautiful every day!";
  } catch (error) {
    console.error("Gemini getEncouragement failed:", error);
    return "Keep up the great work, your playing is sounding more beautiful every day!";
  }
}

export async function researchCompetition(competitionName: string) {
  const ai = getAI();
  const prompt = `Search for the latest information about the music competition or summer school: "${competitionName}". 
  Provide:
  1. The start date or deadline of the next event (Year, month, day).
  2. Key repertoire or audition requirements.
  3. A brief description of the event.
  
  Format the output as JSON.`;

  try {
    const response = await (ai.models as any).generateContent({
      model: MODEL_NAME,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ googleSearch: {} }],
      toolConfig: { includeServerSideToolInvocations: true },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            eventName: { type: Type.STRING },
            date: { type: Type.STRING, description: "Format: YYYY-MM-DD" },
            requirements: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            description: { type: Type.STRING }
          },
          required: ["eventName", "date", "requirements", "description"]
        }
      }
    });

    let text = response.text || "{}";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini researchCompetition failed:", error);
    throw error;
  }
}

export async function generateWeeklyReport(practices: any[]) {
  const ai = getAI();
  const prompt = `Here is a list of music practice logs for this week:
  ${JSON.stringify(practices)}
  
  Please generate a concise "Weekly Practice Report" based on this data.
  Requirements:
  1. Title: "Music Journey Weekly Report"
  2. Clearly list: Total practice time this week, time allocation for each session.
  3. Description of practice types: Which were independent, which were with a teacher.
  4. Summary of progress: Records of highest or target tempos reached.
  5. Master version study: Whether any master performances were listened to, whose version, and any insights.
  6. Self-evaluation: A concise summary text about progress, difficulties, and mood.
  7. Include a plan for next week at the end.
  
  Style Requirements: Professional and clean layout with bullet points. No long emotional descriptions. English layout.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    return response.text || "Failed to generate report, please try again later.";
  } catch (error) {
    console.error("Gemini generateWeeklyReport failed:", error);
    return "Failed to generate report, please try again later.";
  }
}
