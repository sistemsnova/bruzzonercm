
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedQuoteItem } from "./types"; // Import ExtractedQuoteItem

export async function analyzeInvoice(fileBase64: string, mimeType: string) {
  // Initialize GoogleGenAI instance right before making an API call to ensure use of correct API Key
  // @ts-ignore: `process.env.API_KEY` is injected at runtime.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview", 
    contents: {
      parts: [
        { inlineData: { mimeType: mimeType, data: fileBase64 } },
        { text: "Extract all items, totals, VAT, supplier info, and invoice number from this document. If it's a PDF, analyze all pages. Return ONLY JSON." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          invoiceNumber: { type: Type.STRING },
          supplierName: { type: Type.STRING },
          supplierCuit: { type: Type.STRING },
          date: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sku: { type: Type.STRING },
                description: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                unitPrice: { type: Type.NUMBER },
                total: { type: Type.NUMBER }
              },
              required: ["description", "quantity", "unitPrice"]
            }
          },
          subtotal: { type: Type.NUMBER },
          iva: { type: Type.NUMBER },
          totalAmount: { type: Type.NUMBER }
        },
        required: ["supplierName", "totalAmount", "items"]
      }
    }
  });

  // Access the text property directly on the GenerateContentResponse object
  return JSON.parse(response.text || "{}");
}

/**
 * Extracts product names and quantities from a given text message (e.g., WhatsApp).
 * @param message The text message to analyze.
 * @returns A promise that resolves to an array of ExtractedQuoteItem.
 */
export async function extractProductsFromText(message: string): Promise<ExtractedQuoteItem[]> {
  // Initialize GoogleGenAI instance right before making an API call to ensure use of correct API Key
  // @ts-ignore: `process.env.API_KEY` is injected at runtime.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Extrae una lista de productos y sus cantidades de este mensaje. Si no se especifica una cantidad, asume 1. Devuelve SOLO JSON en formato de array de objetos con las propiedades "productName" (string) y "quantity" (number). Ejemplo: [{ "productName": "martillo", "quantity": 2 }, { "productName": "cemento", "quantity": 1 }].
  
  Mensaje: "${message}"`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: [{ text: prompt }], 
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              productName: { type: Type.STRING, description: 'The name of the product mentioned.' },
              quantity: { type: Type.NUMBER, description: 'The quantity requested for the product.' },
            },
            required: ["productName", "quantity"],
            propertyOrdering: ["productName", "quantity"],
          },
        },
      },
    });

    // Access the text property directly on the GenerateContentResponse object
    const rawText = response.text || "[]";
    const cleanText = rawText.replace(/```json\s*|```/g, '').trim();

    return JSON.parse(cleanText) as ExtractedQuoteItem[];
  } catch (error) {
    console.error("Error al extraer productos con Gemini:", error);
    return []; 
  }
}
