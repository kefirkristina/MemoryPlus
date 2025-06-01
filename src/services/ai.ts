import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class AIService {
  async processMessage(
    message: string,
    userId: string,
    chatHistory: string[]
  ): Promise<{
    response: string;
    action: "store" | "recall" | "chat" | "blockchain";
    data?: any;
  }> {
    const systemPrompt = `You are a Web3 memory assistant. Analyze user messages and determine:
1. If they want to STORE information (restaurants, preferences, experiences)
2. If they want to RECALL stored information 
3. If they want BLOCKCHAIN data (token prices, charts)
4. If it's just casual CHAT

For STORE: Extract category, content, and metadata
For RECALL: Identify what they're looking for and suggest visualization
For BLOCKCHAIN: Extract token symbols and chains
For CHAT: Respond naturally

Recent chat: ${chatHistory.slice(-5).join("\n")}

Current message: "${message}"

Respond with JSON:
{
  "action": "store|recall|blockchain|chat",
  "response": "your response text",
  "data": {
    "category": "restaurants|preferences|experiences|tokens",
    "content": "extracted content",
    "query": "search query for recall",
    "token": "token symbol",
    "chain": "ethereum|flow|rootstock"
  }
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.7,
      });

      const result = JSON.parse(
        completion.choices[0].message.content || "{}"
      );
      return result;
    } catch (error) {
      console.error("AI processing error:", error);
      return {
        response: "I had trouble processing that. Can you try again?",
        action: "chat",
      };
    }
  }

  async generateRecallResponse(memories: any[]): Promise<string> {
    if (memories.length === 0) {
      return "I don't have any memories matching that query yet.";
    }

    const prompt = `Generate a natural response based on these user memories:
${memories.map((m) => `${m.category}: ${m.content}`).join("\n")}

Make it conversational and helpful.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      return completion.choices[0].message.content || "Here's what I found.";
    } catch (error) {
      return "Here's what I found in your memories:\n" +
        memories.map((m) => `• ${m.content}`).join("\n");
    }
  }
}

export const aiService = new AIService();