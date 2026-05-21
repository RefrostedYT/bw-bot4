const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.TOKEN;
const HYPIXEL_KEY = process.env.HYPIXEL_KEY;

/**
 * Extracts text from normal messages, webhooks, and embeds.
 */
function getRawText(message) {
  return (
    message.content ||
    message.embeds?.[0]?.description ||
    message.embeds?.[0]?.title ||
    ""
  );
}

/**
 * Removes zero-width/invisible characters and normalizes whitespace.
 */
function normalize(text) {
  if (!text) return "";

  return text
    // Remove zero-width and BOM characters
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    // Convert non-breaking spaces to regular spaces
    .replace(/\u00A0/g, " ")
    // Collapse all whitespace to single spaces
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Cleans bridge prefixes and extracts the actual command.
 * Works with formats such as:
 * [MVP+] Refrqsted: !bw refrqsted
 * [MVP++] Player » !bw refrqsted
 * Player - !bw refrqsted
 * [GUILD] Player > !bw refrqsted
 */
function extractCommand(raw) {
  let text = normalize(raw);
  if (!text) return "";

  // Find !bw anywhere in the text (case-insensitive)
  const lower = text.toLowerCase();
  const index = lower.indexOf("!bw");

  if (index === -1) return "";

  // Return everything from !bw onward
  return normalize(text.slice(index));
}

client.on("messageCreate", async (message) => {
  try {
    // Ignore bot messages
    if (message.author.bot) return;

    // Only respond in #guild-bridge
    if (message.channel.name !== "guild-bridge") return;

    // Get raw text from content/embed/webhook
    const raw = getRawText(message);

    // Extract command robustly
    const command = extractCommand(raw);
    if (!command) return;

    // Parse command
    const parts = command.split(" ");

    // Must be !bw <player>
    if (parts.length < 2) {
      return message.channel.send("Usage: !bw <player>");
    }

    const player = parts[1];

    // Fetch player data from Hypixel API
    const response = await axios.get(
      `https://api.hypixel.net/player?key=${HYPIXEL_KEY}&name=${encodeURIComponent(player)}`
    );

    const p = response.data.player;
    if (!p) {
      return message.channel.send("Player not found.");
    }

    const bw = p.stats?.Bedwars || {};

    // Bedwars stats
    const stars = p.achievements?.bedwars_level || 0;

    const wins = bw.wins_bedwars || 0;
    const losses = bw.losses_bedwars || 0;

    const kills = bw.kills_bedwars || 0;
    const deaths = bw.deaths_bedwars || 0;

    const finalKills = bw.final_kills_bedwars || 0;
    const finalDeaths = bw.final_deaths_bedwars || 0;

    // Avoid division by zero
    const safeDivide = (a, b) => (b > 0 ? (a / b).toFixed(2) : a > 0 ? "∞" : "0.00");

    const fkdr = safeDivide(finalKills, finalDeaths);
    const wlr = safeDivide(wins, losses);
    const kdr = safeDivide(kills, deaths);

    // Single-line output, no emojis
    await message.channel.send(
      `${player} | Stars: ${stars} | FKDR: ${fkdr} | WLR: ${wlr} | KDR: ${kdr}`
    );

  } catch (error) {
    console.error("Error fetching stats:", error);

    try {
      await message.channel.send("Error fetching stats.");
    } catch {
      // Ignore send errors
    }
  }
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(TOKEN);
