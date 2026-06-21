```js
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

// Get all readable text (content + embeds)
function getAllText(message) {
  let parts = [];

  if (message.content) parts.push(message.content);

  for (const embed of message.embeds || []) {
    if (embed?.title) parts.push(embed.title);
    if (embed?.description) parts.push(embed.description);

    if (Array.isArray(embed?.fields)) {
      for (const field of embed.fields) {
        if (field?.name) parts.push(field.name);
        if (field?.value) parts.push(field.value);
      }
    }
  }

  return parts.join(" ");
}

// Clean text for reliable parsing
function normalize(text) {
  return (text || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Extract !bw <player>
function extractPlayer(text) {
  const normalized = normalize(text);

  console.log("BRIDGE INPUT:", JSON.stringify(normalized));

  const match = normalized.match(/!bw\s+([A-Za-z0-9_]{1,16})/i);
  return match ? match[1] : null;
}

// Safe ratio helper
function ratio(a, b) {
  a = Number(a) || 0;
  b = Number(b) || 0;

  if (b > 0) return (a / b).toFixed(2);
  if (a > 0) return "∞";
  return "0.00";
}

client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return;

    // MUST match your bridge channel EXACTLY
    if (message.channel.name !== "guild-bridge") return;

    const allText = getAllText(message);
    const player = extractPlayer(allText);

    if (!player) return;

    console.log("Fetching player:", player);

    const response = await axios.get(
      `https://api.hypixel.net/player?key=${HYPIXEL_KEY}&name=${encodeURIComponent(player)}`
    );

    const p = response.data?.player;

    if (!p) {
      return message.channel.send("Player not found.");
    }

    const bw = p.stats?.Bedwars || {};

    const stars = p?.achievements?.bedwars_level || 0;

    const wins = bw.wins_bedwars || 0;
    const losses = bw.losses_bedwars || 0;

    const kills = bw.kills_bedwars || 0;
    const deaths = bw.deaths_bedwars || 0;

    const finalKills = bw.final_kills_bedwars || 0;
    const finalDeaths = bw.final_deaths_bedwars || 0;

    const fkdr = ratio(finalKills, finalDeaths);
    const wlr = ratio(wins, losses);
    const kdr = ratio(kills, deaths);

    // IMPORTANT: plain text ONLY (bridge-safe)
    const output =
      `${player} | Stars: ${stars} | FKDR: ${fkdr} | WLR: ${wlr} | KDR: ${kdr}`;

    await message.channel.send(output);

  } catch (error) {
    console.error("ERROR:", error);
    try {
      await message.channel.send("Error fetching stats.");
    } catch {}
  }
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(TOKEN);
```
