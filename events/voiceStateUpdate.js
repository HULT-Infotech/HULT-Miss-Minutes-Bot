module.exports = async (oldState, newState, client, config) => {
    const guild = client.guilds.cache.get(config.GUILD_ID);
    if (!guild) return;

    const member = newState.member || oldState.member;
    const role = guild.roles.cache.get(config.ROLE_ID);
    if (!member || !role) return;

    const isRoleMatched = member.roles.cache.has(config.ROLE_ID);

    // Check if the user joined a VC under the monitored categories
    if (isRoleMatched && newState.channelId && !oldState.channelId) {
        const channel = newState.channel;
        const category = channel.parent;

        if (config.VC_CATEGORIES.includes(category.id)) {
            const targetChannel = client.channels.cache.get('1319201207880908830'); // Replace with your target text channel ID

            if (targetChannel) {
                targetChannel.send(
                    `**Attendance Recorded**\n` +
                    `**User:** ${member.user.username}\n` +
                    `**Channel:** ${channel.name}\n` +
                    `**Category:** ${category.name}\n` +
                    `**Joined At:** ${new Date().toLocaleString()}`
                );
            } else {
                console.error('Target channel not found!');
            }
        }
    }
};
