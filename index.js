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

// Get all text from the message, including content and embeds.
function getAllText(message) {
  let parts = [];

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

// Normalize text by removing invisible characters and collapsing spaces.
function normalize(text) {
  return (text || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width chars
    .replace(/\u00A0/g, " ")               // non-breaking spaces
    .replace(/\s+/g, " ")                  // collapse whitespace
    .trim();
}

// Find !bw <player> anywhere in any text.
function extractPlayer(text) {
  const normalized = normalize(text);

  // Debug log so you can see exactly what the bot is reading.
  console.log("FULL MESSAGE TEXT:", JSON.stringify(normalized));

  const match = normalized.match(/!bw\s+([A-Za-z0-9_]{1,16})/i);
  if (!match) return null;

  return match[1];
}

// Safe ratio function.
function ratio(a, b) {
  if (b > 0) return (a / b).toFixed(2);
  if (a > 0) return "∞";
  return "0.00";
}

client.on("messageCreate", async (message) => {
  try {
    // Ignore messages from bots.
    if (message.author.bot) return;

    // Only respond in #guild-bridge.
    if (message.channel.name !== "guild-bridge") return;

    // Extract all visible text.
    const allText = getAllText(message);

    // Find the requested player.
    const player = extractPlayer(allText);
    if (!player) return;

    // Fetch data from Hypixel API.
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

    // One-line response with no emojis.
    await message.channel.send(
      `${player} | Stars: ${stars} | FKDR: ${fkdr} | WLR: ${wlr} | KDR: ${kdr}`
    );

  } catch (error) {
    console.error("ERROR:", error);

    try {
      await message.channel.send("Error fetching stats.");
    } catch {
      // Ignore send failures.
    }
  }
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(TOKEN);
