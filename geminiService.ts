
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedQuoteItem } from "./types";

/**
 * Analiza una factura (imagen o PDF) y extrae los datos estructurados.
 */
export async function analyzeInvoice(fileBase64: string, mimeType: string) {
  // @ts-ignore: `process.env.API_KEY` is injected at runtime.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
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

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error en analyzeInvoice:", error);
    throw error;
  }
}

/**
 * Extrae nombres de productos y cantidades de un texto (ej. mensaje de WhatsApp).
 */
export async function extractProductsFromText(message: string): Promise<ExtractedQuoteItem[]> {
  // @ts-ignore: `process.env.API_KEY` is injected at runtime.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Extrae una lista de productos y sus cantidades de este mensaje. Si no se especifica una cantidad, asume 1. Devuelve SOLO JSON en formato de array de objetos con las propiedades "productName" (string) y "quantity" (number). 
  
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
          },
        },
      },
    });

    const rawText = response.text || "[]";
    return JSON.parse(rawText) as ExtractedQuoteItem[];
  } catch (error) {
    console.error("Error al extraer productos con Gemini:", error);
    return []; 
  }
}

/**
 * Interpreta un comando de voz o texto del usuario para navegar por el ERP.
 */
export async function interpretCommand(command: string) {
  // @ts-ignore: `process.env.API_KEY` is injected at runtime.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `Eres el asistente inteligente de un ERP de ferretería. Tu tarea es mapear la orden del usuario a una acción del sistema.
  Acciones posibles: 
  - NAVIGATE: cambiar de pestaña (dashboard, inventory, sales, purchases, clients, suppliers, cashier, reports, settings, branches, prices, warehouse, ecommerce, loyalty, remitos, quotes, orders, installments, balances, missing-items, stock-adjustment, users, catalog-config).
  - SEARCH_PRODUCT: buscar algo en el stock.
  - SEARCH_CLIENT: buscar un cliente.
  - CREATE_SALE: iniciar una nueva venta.
  - CHECK_DEBT: ver quién debe dinero.

  Devuelve SOLO JSON con este esquema: { "action": "NAVIGATE|SEARCH_PRODUCT|...", "target": "id_modulo|busqueda", "message": "Respuesta amigable para el usuario" }
  
  Usuario: "${command}"`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ text: prompt }],
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING },
            target: { type: Type.STRING },
            message: { type: Type.STRING }
          },
          required: ["action", "message"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return { action: 'ERROR', message: 'No entendí el comando.' };
  }
}
