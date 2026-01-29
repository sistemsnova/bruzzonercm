import { GoogleGenerativeAI } from "@google/generative-ai";
import { ExtractedQuoteItem } from "../types";

const API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string) || "";
const genAI = new GoogleGenerativeAI(API_KEY);
const MODEL_NAME = "gemini-1.5-flash";

export async function analyzeInvoice(fileBase64: string, mimeType: string) {
  if (!API_KEY) throw new Error("API Key missing");
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  try {
    const prompt = "Analiza esta factura y extrae items, totales y proveedor. Devuelve SOLO JSON puro.";
    const result = await model.generateContent([
      { inlineData: { mimeType, data: fileBase64 } },
      { text: prompt }
    ]);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function extractProductsFromText(message: string): Promise<ExtractedQuoteItem[]> {
  if (!API_KEY) return [];
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  try {
    const prompt = "Extrae productos y cantidades de este texto. Devuelve un array JSON [{productName, quantity}]. Texto: " + message;
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    return [];
  }
}

export async function interpretCommand(command: string) {
  if (!API_KEY) return { action: 'ERROR', message: 'IA no configurada.' };
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  try {
    const prompt = "Mapea este comando a una accion de ERP: " + command + ". Devuelve JSON {action, target, message}";
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    return { action: 'ERROR', message: 'Error' };
  }
}