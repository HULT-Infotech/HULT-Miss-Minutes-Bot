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

    // Fetch or create the webhook
    const webhook = await getOrCreateWebhook(targetChannel, client);

    // User joins a voice channel
    if (isRoleMatched && newState.channelId && !oldState.channelId) {
        const channel = newState.channel;
        const category = channel.parent;

        if (config.VC_CATEGORIES.includes(category.id)) {
            const joinTime = new Date();

            const message = await webhook.send({
                content: "```" +
                    "User: " +
                    member.user.username +
                    "\n\n" +
                    "Joined At: " +
                    joinTime.toLocaleString() +
                    "\n\n" +
                    "Voice Channel: " +
                    channel.name +
                    "\nCategory: " +
                    category.name +
                    "\n\n" +
                    "Disconnected At: Not yet" +
                    "\nTotal Time: Not yet" +
                    "```",
                username: client.user.username,
                avatarURL: client.user.displayAvatarURL(),
            });

            activeMessages.set(member.id, { message, joinTime, webhook });
        }
    }

    // User leaves a voice channel
    if (isRoleMatched && oldState.channelId && !newState.channelId) {
        const channel = oldState.channel;
        const category = channel.parent;

        if (config.VC_CATEGORIES.includes(category.id)) {
            const leaveTime = new Date();

            const userMessage = activeMessages.get(member.id);
            if (userMessage) {
                const { message, joinTime, webhook } = userMessage;

                const totalTimeMs = leaveTime - joinTime;
                const totalTimeMinutes = Math.floor(totalTimeMs / 60000); // Total minutes
                const totalTimeSeconds = Math.floor((totalTimeMs % 60000) / 1000); // Remaining seconds
                const totalTimeFormatted = `${totalTimeMinutes}m ${totalTimeSeconds}s`;

                await webhook.editMessage(message.id, {
                    content: "```" +
                        "User: " +
                        member.user.username +
                        "\n\n" +
                        "Joined At: " +
                        joinTime.toLocaleString() +
                        "\n\n" +
                        "Voice Channel: " +
                        channel.name +
                        "\nCategory: " +
                        category.name +
                        "\n\n" +
                        "Disconnected At: " +
                        leaveTime.toLocaleString() +
                        "\nTotal Time: " +
                        totalTimeFormatted +
                        "```",
                });

                activeMessages.delete(member.id);
            }
        }
    }
};

// Helper function to get or create a webhook
async function getOrCreateWebhook(channel, client) {
    const webhooks = await channel.fetchWebhooks();
    let webhook = webhooks.find((wh) => wh.owner.id === client.user.id);

    if (!webhook) {
        webhook = await channel.createWebhook({
            name: client.user.username,
            avatar: client.user.displayAvatarURL(),
        });
    }

    return webhook;
}
