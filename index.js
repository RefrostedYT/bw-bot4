module.exports = {
    name: 'bw',
    // Must match the 5-argument signature: (targetPlayer, bot, client, hypixelClient, args)
    async execute(targetPlayer, bot, client, hypixelClient, args) {
        try {
            // 1. Helper functions
            const formatNumber = (num) => (num || 0).toLocaleString();

            // 2. Fetch Player
            const player = await hypixelClient.getPlayer(targetPlayer);
            if (!player || !player.stats?.bedwars) {
                return bot.chat(`/gc ${targetPlayer} has no BedWars stats.`);
            }

            // 3. Extract stats
            const stats = player.stats.bedwars;
            const level = stats.level || 0;
            const finalKills = stats.finalKills || 0;
            const finalKDRatio = stats.finalKDRatio || 0;
            const wins = stats.wins || 0;
            const WLRatio = stats.WLRatio || 0;
            const winstreak = stats.winstreak || 0;
            
            // Accessing nested beds stats safely
            const broken = stats.beds?.broken || 0;
            const BLRatio = stats.beds?.BLRatio || 0;

            // 4. Formatting
            const response = `[${level}✫] ${player.nickname} FK: ${formatNumber(finalKills)} FKDR: ${finalKDRatio} W: ${formatNumber(wins)} WLR: ${WLRatio} BB: ${formatNumber(broken)} BLR: ${BLRatio} WS: ${winstreak}`;

            bot.chat(`/gc ${response}`);
        } catch (error) {
            console.error('Error in bw command:', error);
            bot.chat(`/gc Error: Could not fetch stats for ${targetPlayer}.`);
        }
    }
};
