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

// HARD SAFETY CHECK (prevents Railway silent crash loops)
if (!TOKEN) {
  console.error("Missing DISCORD TOKEN");
  process.exit(1);
}

if (!HYPIXEL_KEY) {
  console.error("Missing HYPIXEL KEY");
  process.exit(1);
}

function ratio(a, b) {
  a = Number(a) || 0;
  b = Number(b) || 0;
  if (b > 0) return (a / b).toFixed(2);
  if (a > 0) return "∞";
  return "0.00";
}

client.on("messageCreate", async (message) => {
  try {
    if (!message || message.author.bot) return;

    // safer than channel.name (avoids crashes in DMs/threads)
    if (message.channel?.name !== "guild-bridge") return;

    const text = message.content || "";
    const match = text.match(/!bw\s+([A-Za-z0-9_]{1,16})/i);

    if (!match) return;

    const player = match[1];

    console.log("Fetching:", player);

    const res = await axios.get(
      "https://api.hypixel.net/player",
      {
        params: {
          key: HYPIXEL_KEY,
          name: player
        }
      }
    );

    const p = res.data?.player;

    if (!p) {
      return message.channel.send("Player not found.");
    }

    const bw = p?.stats?.Bedwars || {};

    const stars = p?.achievements?.bedwars_level || 0;

    const fk = bw.final_kills_bedwars || 0;
    const fd = bw.final_deaths_bedwars || 1;

    const w = bw.wins_bedwars || 0;
    const l = bw.losses_bedwars || 1;

    const k = bw.kills_bedwars || 0;
    const d = bw.deaths_bedwars || 1;

    const output =
      `${player} | Stars: ${stars} | FKDR: ${ratio(fk, fd)} | WLR: ${ratio(w, l)} | KDR: ${ratio(k, d)}`;

    await message.channel.send(output);

  } catch (err) {
    console.error("BOT ERROR:", err?.response?.data || err);
  }
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(TOKEN);
