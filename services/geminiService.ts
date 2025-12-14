import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedSuggestion } from "../types.ts";

const API_KEY = process.env.API_KEY || '';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Suggests a list of services/materials based on a rough job description.
 */
export const suggestServices = async (jobDescription: string): Promise<GeneratedSuggestion[]> => {
  if (!API_KEY) {
    console.warn("API Key is missing for Gemini suggestions.");
    return [];
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `O usuário é um eletricista criando um orçamento. 
      Descrição do trabalho: "${jobDescription}".
      Liste de 3 a 6 itens de serviço ou materiais necessários para realizar este trabalho. 
      Estime um preço unitário RAZOÁVEL em Reais (BRL) para o mercado brasileiro (apenas mão de obra ou peça pequena). 
      Seja técnico mas claro.`,
      config: {
        systemInstruction: "Você é um assistente sênior de elétrica. Retorne apenas JSON válido.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING, description: "Nome do serviço ou material" },
              estimatedPrice: { type: Type.NUMBER, description: "Preço unitário estimado em reais" },
              unit: { type: Type.STRING, description: "Unidade (un, m, h, kit)" },
            },
            required: ["description", "estimatedPrice", "unit"],
          },
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as GeneratedSuggestion[];
    }
    return [];
  } catch (error) {
    console.error("Error generating suggestions:", error);
    throw error;
  }
};

/**
 * Generates a professional message for WhatsApp based on the quote details.
 */
export const generateProfessionalMessage = async (
  clientName: string,
  totalValue: number,
  itemsCount: number,
  notes: string
): Promise<string> => {
    if (!API_KEY) return `Olá ${clientName}, segue o orçamento no valor de R$ ${totalValue.toFixed(2)}.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Crie uma mensagem curta, educada e profissional para enviar pelo WhatsApp junto com o PDF do orçamento.
            Cliente: ${clientName}
            Valor Total: R$ ${totalValue.toFixed(2)}
            Qtd Itens: ${itemsCount}
            Observações extras: ${notes}
            
            A mensagem deve convidar o cliente a fechar o serviço. Não use hashtags. Use emojis moderados (ferramentas, eletricidade).`,
        });
        return response.text || "";
    } catch (e) {
        console.error(e);
        return `Olá ${clientName}, aqui está seu orçamento detalhado. Valor total: R$ ${totalValue.toFixed(2)}. Aguardo seu retorno!`;
    }
}