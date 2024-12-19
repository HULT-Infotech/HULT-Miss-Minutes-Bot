const activeMessages = new Map(); // To track messages for editing later

module.exports = async (oldState, newState, client, config) => {
    const guild = client.guilds.cache.get(config.GUILD_ID);
    if (!guild) return;

    const member = newState.member || oldState.member;
    const role = guild.roles.cache.get(config.ROLE_ID);
    if (!member || !role) return;

    const isRoleMatched = member.roles.cache.has(config.ROLE_ID);
    const targetChannel = client.channels.cache.get('1319201207880908830'); // Replace with your target text channel ID

    if (!targetChannel) {
        console.error('Target channel not found!');
        return;
    }

    // User joins a voice channel
    if (isRoleMatched && newState.channelId && !oldState.channelId) {
        const channel = newState.channel;
        const category = channel.parent;

        if (config.VC_CATEGORIES.includes(category.id)) {
            const joinTime = new Date();

            const message = await targetChannel.send(
                `**Attendance Recorded**\n` +
                `**User:** ${member.user.username}\n` +
                `**Channel:** ${channel.name}\n` +
                `**Category:** ${category.name}\n` +
                `**Joined At:** ${joinTime.toLocaleString()}\n` +
                `**Disconnected At:** Not yet\n` +
                `**Total Time:** Not yet`
            );

            // Save the message ID for later editing
            activeMessages.set(member.id, { message, joinTime });
        }
    }

    // User leaves a voice channel
    if (isRoleMatched && oldState.channelId && !newState.channelId) {
        const channel = oldState.channel;
        const category = channel.parent;

        if (config.VC_CATEGORIES.includes(category.id)) {
            const leaveTime = new Date();

            // Retrieve the message for this user
            const userMessage = activeMessages.get(member.id);
            if (userMessage) {
                const { message, joinTime } = userMessage;

                // Calculate total time
                const totalTimeMs = leaveTime - joinTime;
                const totalTimeMinutes = Math.floor(totalTimeMs / 60000); // Total minutes
                const totalTimeSeconds = Math.floor((totalTimeMs % 60000) / 1000); // Remaining seconds
                const totalTimeFormatted = `${totalTimeMinutes}m ${totalTimeSeconds}s`;

                // Edit the message to include disconnect time and total time
                await message.edit(
                    `**Attendance Recorded**\n` +
                    `**User:** ${member.user.username}\n` +
                    `**Channel:** ${channel.name}\n` +
                    `**Category:** ${category.name}\n` +
                    `**Joined At:** ${joinTime.toLocaleString()}\n` +
                    `**Disconnected At:** ${leaveTime.toLocaleString()}\n` +
                    `**Total Time:** ${totalTimeFormatted}`
                );

                // Remove the user from the active messages map
                activeMessages.delete(member.id);
            }
        }
    }
};
