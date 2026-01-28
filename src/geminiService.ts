import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

// Función 1: Para el módulo de Compras (Analizar Facturas)
export const analyzeInvoice = async (base64Data: string, mimeType: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Analiza esta factura de ferretería y devuelve un JSON: { "invoiceNumber": string, "supplierName": string, "date": string, "items": [{ "description": string, "quantity": number, "unitPrice": number, "total": number, "sku": string }] }`;
    const result = await model.generateContent([prompt, { inlineData: { data: base64Data, mimeType } }]);
    const response = await result.response;
    return JSON.parse(response.text().match(/\{[\s\S]*\}/)?.[0] || "{}");
  } catch (error) {
    console.error("Error en IA Compras:", error);
    throw error;
  }
};

// Función 2: Para el módulo de Cotizaciones (Extraer de texto/WhatsApp)
export const extractProductsFromText = async (text: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Convierte este pedido de ferretería en un listado JSON: { "items": [{ "description": string, "quantity": number }] }. Texto: "${text}"`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text().match(/\{[\s\S]*\}/)?.[0] || '{"items":[]}');
  } catch (error) {
    console.error("Error en IA Cotizaciones:", error);
    return { items: [] };
  }
};