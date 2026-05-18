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

function clean(content) {
  return content.split(":").slice(1).join(":").trim();
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.channel.name !== "guild-bridge") return;

  const msg = clean(message.content);

  if (!msg.startsWith("!bw")) return;

  const name = msg.split(" ")[1];
  if (!name) return message.channel.send("Usage: !bw <player>");

  try {
    const res = await axios.get(
      `https://api.hypixel.net/player?key=${HYPIXEL_KEY}&name=${name}`
    );

    const p = res.data.player;
    if (!p) return message.channel.send("Player not found.");

    const bw = p.stats?.Bedwars || {};

    const stars = p.achievements?.bedwars_level || 0;
    const wins = bw.wins_bedwars || 0;
    const losses = bw.losses_bedwars || 1;
    const kills = bw.kills_bedwars || 0;
    const deaths = bw.deaths_bedwars || 1;

    const fkdr = (kills / deaths).toFixed(2);
    const wlr = (wins / losses).toFixed(2);
    const kdr = (kills / deaths).toFixed(2);

    message.channel.send(
`🎮 ${name}
⭐ Stars: ${stars}
⚔ FKDR: ${fkdr}
🏆 WLR: ${wlr}
☠ KDR: ${kdr}`
    );

  } catch (err) {
    console.log(err);
    message.channel.send("Error fetching stats.");
  }
});

client.login(TOKEN);
