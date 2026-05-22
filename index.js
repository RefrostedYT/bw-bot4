const {
  Client,
  GatewayIntentBits,
  WebhookClient
} = require("discord.js");

const axios = require("axios");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Environment variables
const TOKEN = process.env.TOKEN;
const HYPIXEL_KEY = process.env.HYPIXEL_KEY;

// NEW: Webhook credentials
const WEBHOOK_ID = process.env.WEBHOOK_ID;
const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN;

// Create webhook client
const webhook = new WebhookClient({
  id: WEBHOOK_ID,
  token: WEBHOOK_TOKEN
});

/**
 * Extract all visible text from a message.
 * Supports:
 * - normal messages
 * - bridge bots
 * - embeds
 * - webhooks
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
 * Normalize weird bridge formatting.
 */
function normalize(text) {
  return (text || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract player from:
 * !bw player
 */
function extractPlayer(text) {
  const normalized = normalize(text);

  console.log("RAW MESSAGE:", JSON.stringify(normalized));

  const match = normalized.match(/!bw\s+([A-Za-z0-9_]{1,16})/i);

  if (!match) return null;

  return match[1];
}

/**
 * Safe ratio formatting.
 */
function ratio(a, b) {
  if (b > 0) return (a / b).toFixed(2);
  if (a > 0) return "∞";
  return "0.00";
}

client.on("messageCreate", async (message) => {
  try {
    // Ignore ONLY our own bot account
    if (message.author.id === client.user.id) return;

    // Only work in #guild-bridge
    if (message.channel.name !== "guild-bridge") return;

    // Extract all text
    const fullText = getMessageText(message);

    // Extract player
    const player = extractPlayer(fullText);

    if (!player) return;

    console.log(`Fetching stats for ${player}`);

    // Query Hypixel API
    const response = await axios.get(
      `https://api.hypixel.net/player?key=${HYPIXEL_KEY}&name=${encodeURIComponent(player)}`
    );

    const p = response.data.player;

    if (!p) {
      await webhook.send({
        content: "Player not found.",
        username: "Guild Stats"
      });

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

    const reply =
      `${player} | Stars: ${stars} | FKDR: ${fkdr} | WLR: ${wlr} | KDR: ${kdr}`;

    console.log("WAITING 2 SECONDS...");

    // Delay for bridge compatibility
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Send through webhook instead of bot message
    await webhook.send({
      content: reply,
      username: "Guild Stats"
    });

    console.log("SENT:", reply);

  } catch (error) {
    console.error("ERROR:", error);

    try {
      await webhook.send({
        content: "Error fetching stats.",
        username: "Guild Stats"
      });
    } catch {}
  }
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(TOKEN);
