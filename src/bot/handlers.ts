import { Context } from "telegraf";
import { aiService } from "../services/ai";
import { memoryService } from "../services/memory";
import { blockchainService } from "../services/blockchain";

export class BotHandlers {
  async handleMessage(ctx: Context) {
    const userId = ctx.from?.id.toString();
    const message = ctx.text;

    if (!userId || !message) return;

    try {
      // Get chat history for context
      const history = await memoryService.getChatHistory(userId, 5);
      const chatHistory = history.map((h) => `User: ${h.message}\nBot: ${h.response}`);

      // Process message with AI
      const aiResult = await aiService.processMessage(message, userId, chatHistory);

      let response = aiResult.response;

      // Handle different actions
      switch (aiResult.action) {
        case "store":
          if (aiResult.data) {
            await memoryService.storeMemory(
              userId,
              aiResult.data.category || "general",
              aiResult.data.content || message,
              aiResult.data
            );
            response = `✅ Stored in your memory! ${response}`;
          }
          break;

        case "recall":
          const memories = await memoryService.recallMemories(
            userId,
            aiResult.data?.query,
            aiResult.data?.category
          );
          response = await aiService.generateRecallResponse(memories);
          break;

        case "blockchain":
          if (aiResult.data?.token) {
            const tokenResults = await blockchainService.searchToken(
              aiResult.data.token,
              aiResult.data.chain
            );
            response = blockchainService.formatTokenResponse(tokenResults);
          }
          break;

        case "chat":
        default:
          // Just use AI response
          break;
      }

      // Store chat history
      await memoryService.storeChatHistory(userId, message, response);

      // Send response
      await ctx.reply(response, { parse_mode: "Markdown" });

    } catch (error) {
      console.error("Handler error:", error);
      await ctx.reply(
        "Sorry, I encountered an error processing your message. Please try again!"
      );
    }
  }

  async handleStart(ctx: Context) {
    const welcomeMessage = `
🤖 **Welcome to Web3 Memory Bot!**

I can help you:
💾 **Store memories** - Tell me about restaurants, preferences, experiences
🔍 **Recall information** - Ask me "What restaurants did I like in Tokyo?"
💰 **Get token data** - Search for token prices and charts
💬 **Chat naturally** - Just talk to me normally!

**Examples:**
• "I loved the ramen at Ichiran in Tokyo"
• "What restaurants did I save?"
• "Show me USDT price"
• "Get Ethereum market chart"

Try it out! 🚀
    `;

    await ctx.reply(welcomeMessage, { parse_mode: "Markdown" });
  }

  async handleChart(ctx: Context) {
    try {
      const args = ctx.text?.split(" ").slice(1);
      const chain = args?.[0] || "ethereum";
      
      const chartData = await blockchainService.getMarketChart(chain);
      const response = blockchainService.formatChartResponse(chartData);
      
      await ctx.reply(response, { parse_mode: "Markdown" });
    } catch (error) {
      await ctx.reply("Failed to fetch chart data. Please try again.");
    }
  }

  async handleMemories(ctx: Context) {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    try {
      const memories = await memoryService.recallMemories(userId);
      
      if (memories.length === 0) {
        await ctx.reply("You haven't stored any memories yet! Tell me something interesting.");
        return;
      }

      let response = "🧠 **Your Recent Memories:**\n\n";
      memories.forEach((memory, index) => {
        response += `${index + 1}. **${memory.category}:** ${memory.content}\n`;
        response += `   📅 ${new Date(memory.timestamp).toLocaleDateString()}\n\n`;
      });

      await ctx.reply(response, { parse_mode: "Markdown" });
    } catch (error) {
      await ctx.reply("Failed to fetch your memories. Please try again.");
    }
  }
}

export const botHandlers = new BotHandlers();