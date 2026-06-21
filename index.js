module.exports = {
    name: 'bw',

    async execute(targetPlayer, bot, client, hypixelClient, args) {
        try {
            if (!targetPlayer) {
                return bot.chat(`/gc Usage: !bw <player>`);
            }

            const player = await hypixelClient.getPlayer(targetPlayer);

            if (!player) {
                return bot.chat(`/gc Player not found: ${targetPlayer}`);
            }

            const stats = player.stats?.bedwars;

            if (!stats) {
                return bot.chat(`/gc ${targetPlayer} has no BedWars stats.`);
            }

            const format = (n) => (n || 0).toLocaleString();

            // Safely extract stats (Hypixel correct keys)
            const level = player?.achievements?.bedwars_level || 0;

            const finalKills = stats.final_kills_bedwars || 0;
            const finalDeaths = stats.final_deaths_bedwars || 1;
            const fkdr = (finalKills / finalDeaths).toFixed(2);

            const wins = stats.wins_bedwars || 0;
            const losses = stats.losses_bedwars || 1;
            const wlr = (wins / losses).toFixed(2);

            const bedsBroken = stats.beds_broken_bedwars || 0;
            const bedsLost = stats.beds_lost_bedwars || 1;
            const bblr = (bedsBroken / bedsLost).toFixed(2);

            const winstreak = stats.winstreak || 0;

            const response =
                `[${level}✫] ${player.nickname} ` +
                `FK: ${format(finalKills)} ` +
                `FKDR: ${fkdr} ` +
                `W: ${format(wins)} ` +
                `WLR: ${wlr} ` +
                `BB: ${format(bedsBroken)} ` +
                `BBLR: ${bblr} ` +
                `WS: ${winstreak}`;

            bot.chat(`/gc ${response}`);

        } catch (error) {
            console.error("BW command error:", error);
            bot.chat(`/gc Error fetching stats for ${targetPlayer}`);
        }
    }
};
