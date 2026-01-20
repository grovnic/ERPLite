
import { GoogleGenAI } from "@google/genai";

// Always use the process.env.API_KEY directly for initialization as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  async analyzeDocument(docSummary: string) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analiziraj ovaj rezime ERP dokumenta i daj savjete za optimizaciju ili provjeri potencijalne greške u skladu sa BH zakonima (FBiH): ${docSummary}`,
      });
      return response.text;
    } catch (error) {
      console.error("Gemini analysis failed", error);
      return "Unable to analyze document at this time.";
    }
  },

  async generateDescription(productName: string, lang: 'BS' | 'EN') {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generiši profesionalan opis za artikal "${productName}" na jeziku ${lang === 'BS' ? 'Bosanskom' : 'Engleskom'}.`,
      });
      return response.text;
    } catch (error) {
      return productName;
    }
  }
};
