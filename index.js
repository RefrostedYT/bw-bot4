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
 * Removes bridge prefixes like:
 * [MVP+] Name: !bw player
 */
function clean(content) {
  if (content.includes(":")) {
    return content.split(":").slice(1).join(":").trim();
  }
  return content.trim();
}

client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return;
    if (message.channel.name !== "guild-bridge") return;

    let msg = clean(message.content).trim().toLowerCase();

    console.log("DEBUG MSG:", JSON.stringify(msg));

    const bwIndex = msg.indexOf("!bw");
    if (bwIndex === -1) return;

    msg = msg.slice(bwIndex).trim();

    const parts = msg.split(/\s+/);
    const name = parts[1];

    if (!name) {
      return message.channel.send("Usage: !bw <player>");
    }

    const res = await axios.get(
      `https://api.hypixel.net/player?key=${HYPIXEL_KEY}&name=${name}`
    );

    const p = res.data.player;
    if (!p) {
      return message.channel.send("Player not found.");
    }

    const bw = p.stats?.Bedwars || {};

    // Stats
    const stars = p.achievements?.bedwars_level || 0;

    const wins = bw.wins_bedwars || 0;
    const losses = bw.losses_bedwars || 1;

    const kills = bw.kills_bedwars || 0;
    const deaths = bw.deaths_bedwars || 1;

    // 🔥 FIXED: correct FKDR (final kills/deaths)
    const finalKills = bw.final_kills_bedwars || 0;
    const finalDeaths = bw.final_deaths_bedwars || 1;

    const fkdr = (finalKills / finalDeaths).toFixed(2);
    const wlr = (wins / losses).toFixed(2);
    const kdr = (kills / deaths).toFixed(2);

    await message.channel.send(
`🎮 ${name}
⭐ Stars: ${stars}
⚔ FKDR: ${fkdr}
🏆 WLR: ${wlr}
☠ KDR: ${kdr}`
    );

  } catch (err) {
    console.error("ERROR:", err);
    message.channel.send("Error fetching stats.");
  }
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(TOKEN);
