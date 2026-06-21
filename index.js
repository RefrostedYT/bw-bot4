```js
module.exports = {
    name: 'bw',

    async execute(targetPlayer, bot, client, hypixelClient, args) {
        try {
            console.log(`Fetching BedWars stats for ${targetPlayer}...`);

            const player = await hypixelClient.getPlayer(targetPlayer);

            if (!player) {
                return bot.chat(`/gc Player ${targetPlayer} not found.`);
            }

            if (!player.stats || !player.stats.bedwars) {
                return bot.chat(`/gc ${targetPlayer} has no BedWars stats.`);
            }

            const stats = player.stats.bedwars;

            const formatNumber = (num) => (num || 0).toLocaleString();

            // Level
            const level = player.level || 0;

            // Final kills / deaths
            const finalKills = stats.finalKills || 0;
            const finalDeaths = stats.finalDeaths || 1;
            const fkdr = (finalKills / finalDeaths).toFixed(2);

            // Wins / losses
            const wins = stats.wins || 0;
            const losses = stats.losses || 1;
            const wlr = (wins / losses).toFixed(2);

            // Beds broken / lost
            const bedsBroken = stats.bedsBroken || 0;
            const bedsLost = stats.bedsLost || 1;
            const bblr = (bedsBroken / bedsLost).toFixed(2);

            const winstreak = stats.winstreak || 0;

            const response =
                `[${level}✫] ${player.nickname} ` +
                `FK: ${formatNumber(finalKills)} ` +
                `FKDR: ${fkdr} ` +
                `W: ${formatNumber(wins)} ` +
                `WLR: ${wlr} ` +
                `BB: ${formatNumber(bedsBroken)} ` +
                `BBLR: ${bblr} ` +
                `WS: ${winstreak}`;

            bot.chat(`/gc ${response}`);

        } catch (error) {
            console.error("BW command error:", error);
            bot.chat(`/gc Error fetching stats for ${targetPlayer}.`);
        }
    }
};
```
