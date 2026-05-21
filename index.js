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

// Extract text from normal messages, webhooks, and embeds.
function getRawText(message) {
  return (
    message.content ||
    message.embeds?.[0]?.description ||
    message.embeds?.[0]?.title ||
    ""
  );
}

// Remove invisible characters and normalize whitespace.
function normalize(text) {
  if (!text) return "";

  return text
    // Zero-width characters and BOM
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    // Non-breaking spaces
    .replace(/\u00A0/g, " ")
    // Collapse whitespace
    .replace(/\s+/g, " ")
    .trim();
}

// Extract "!bw <player>" from ANY bridge format.
// Examples handled:
// [MVP+] Refrqsted [VET]: !bw refrqsted
// [MVP++] kyranny: fun
// [GUILD] Player » !bw name
// Player - !bw name
function extractCommand(raw) {
  const text = normalize(raw);
  if (!text) return null;

  // Match !bw followed by a username anywhere in the message.
  // Minecraft usernames are 1-16 characters: letters, numbers, underscores.
  const match = text.match(/!bw\s+([A-Za-z0-9_]{1,16})/i);

  if (!match) return null;

  return {
    player: match[1]
  };
}

// Safe ratio formatting.
function ratio(numerator, denominator) {
  if (denominator > 0) return (numerator / denominator).toFixed(2);
  if (numerator > 0) return "∞";
  return "0.00";
}

client.on("messageCreate", async (message) => {
  try {
    // Ignore bot messages.
    if (message.author.bot) return;

    // Only respond in #guild-bridge.
    if (message.channel.name !== "guild-bridge") return;

    // Get raw text from the message.
    const raw = getRawText(message);

    // Extract the command and player.
    const command = extractCommand(raw);
    if (!command) return;

    const player = command.player;

    // Query Hypixel API.
    const response = await axios.get(
      `https://api.hypixel.net/player?key=${HYPIXEL_KEY}&name=${encodeURIComponent(player)}`
    );

    const p = response.data.player;
    if (!p) {
      await message.channel.send("Player not found.");
      return;
    }

    const bw = p.stats?.Bedwars || {};

    // Stats.
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

    // One-line output, no emojis.
    await message.channel.send(
      `${player} | Stars: ${stars} | FKDR: ${fkdr} | WLR: ${wlr} | KDR: ${kdr}`
    );

  } catch (error) {
    console.error("Error fetching stats:", error);

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
