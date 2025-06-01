import dotenv from "dotenv";
dotenv.config();

import { Telegraf } from "telegraf";
import express, { Request, Response } from "express";
import cors from "cors";
import { botHandlers } from "./bot/handlers";

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Telegram Bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Bot commands
bot.start(botHandlers.handleStart);
bot.command("memories", botHandlers.handleMemories);
bot.command("chart", botHandlers.handleChart);
bot.on("text", botHandlers.handleMessage);

// Health check endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({ status: "Web3 Memory Bot is running!" });
});

// Start services
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    // Start Telegram bot
    await bot.launch();
    console.log("🤖 Telegram bot started");

    // Graceful shutdown
    process.once("SIGINT", () => bot.stop("SIGINT"));
    process.once("SIGTERM", () => bot.stop("SIGTERM"));

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();