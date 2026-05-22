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
 * Get all visible text from a Discord message.
 * Supports:
 * - normal messages
 * - webhook messages
 * - bridge bot messages
 * - embeds
 */
function getMessageText(message) {
  const parts = [];

  if (message.content) {
    parts.push(message.content);
  }

  for (const embed of message.embeds || []) {
    if (embed.title) parts.push(embed.title);
    if (embed.description) parts.push(embed.description);

    if (Array.isArray(embed.fields)) {
      for (const field of embed.fields) {
        if (field.name) parts.push(field.name);
        if (field.value) parts.push(field.value);
      }
    }
  }

  return parts.join(" ");
}

/**
 * Normalize text:
 * - remove invisible characters
 * - remove weird spaces
 * - collapse whitespace
 */
function normalize(text) {
  return (text || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract player name from:
 * !bw player
 * anywhere in bridge-formatted text
 */
function extractPlayer(text) {
  const normalized = normalize(text);

  console.log("RAW MESSAGE:", JSON.stringify(text));
  console.log("NORMALIZED:", JSON.stringify(normalized));

  const match = normalized.match(/!bw\s+([A-Za-z0-9_]{1,16})/i);

  if (!match) return null;

  return match[1];
}

/**
 * Safe ratio formatter
 */
function ratio(a, b) {
  if (b > 0) return (a / b).toFixed(2);
  if (a > 0) return "∞";
  return "0.00";
}

client.on("messageCreate", async (message) => {
  try {
    // Ignore ONLY this bot's own messages
    // Allow bridge bots and webhooks
    if (message.author.id === client.user.id) return;

    // Only work in #guild-bridge
    if (message.channel.name !== "guild-bridge") return;

    // Extract all message text
    const fullText = getMessageText(message);

    // Extract player from !bw command
    const player = extractPlayer(fullText);

    if (!player) return;

    console.log(`Fetching stats for ${player}`);

    // Query Hypixel API
    const response = await axios.get(
      `https://api.hypixel.net/player?key=${HYPIXEL_KEY}&name=${encodeURIComponent(player)}`
    );

    const p = response.data.player;

    if (!p) {
      await message.channel.send("Player not found.");
      return;
    }

    const bw = p.stats?.Bedwars || {};

    const stars = p.achievements?.bedwars_level || 0;

    const wins = bw.wins_bedwars || 0;
    const losses = bw.losses_bedwars || 0;

    const kills = bw.kills_bedwars || 0;
    const deaths = bw.deaths_bedwars || 0;

    const finalKills = bw.final_kills_bedwars || 0;
    const finalDeaths = bw.final_deaths_bedwars || 0;

    const fkdr = ratio(finalKills, finalDeaths);
    const wlr = ratio(wins, losses);
    const kdr = ratio(kills, deaths);

    // Final formatted message
    const reply =
      `${player} | Stars: ${stars} | FKDR: ${fkdr} | WLR: ${wlr} | KDR: ${kdr}`;

    console.log("WAITING 2 SECONDS BEFORE SENDING...");

    // Delay to help bridge bots relay properly
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Send response
    await message.channel.send(reply);

    console.log("MESSAGE SENT:", reply);

  } catch (error) {
    console.error("ERROR:", error);

    try {
      await message.channel.send("Error fetching stats.");
    } catch {
      // Ignore send failures
    }
  }
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(TOKEN);
