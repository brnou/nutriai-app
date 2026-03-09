import { GoogleGenAI, Type } from "@google/genai";
import { Meal } from "../types";

const apiKey = process.env.GEMINI_API_KEY;

export async function analyzeFoodImage(base64Image: string): Promise<Partial<Meal>> {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = "Analyze this food image and provide nutritional information. Be as accurate as possible.";
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1] || base64Image,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the food" },
          description: { type: Type.STRING, description: "Brief description of the food" },
          calories: { type: Type.NUMBER, description: "Estimated calories in kcal" },
          protein: { type: Type.NUMBER, description: "Protein in grams" },
          carbs: { type: Type.NUMBER, description: "Carbohydrates in grams" },
          fats: { type: Type.NUMBER, description: "Fats in grams" },
          fiber: { type: Type.NUMBER, description: "Fiber in grams" },
          matchPercentage: { type: Type.NUMBER, description: "Confidence percentage (0-100)" }
        },
        required: ["name", "calories", "protein", "carbs", "fats", "fiber"]
      }
    },
  });

  try {
    const result = JSON.parse(response.text);
    return {
      name: result.name,
      description: result.description,
      calories: result.calories,
      protein: result.protein,
      carbs: result.carbs,
      fats: result.fats,
      fiber: result.fiber,
    };
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Failed to analyze image");
  }
}
