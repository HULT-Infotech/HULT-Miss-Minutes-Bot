const Attendance = require('../models/Attendance');

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
            const attendance = new Attendance({
                userId: member.id,
                username: member.user.username,
                channelId: channel.id,
                channelName: channel.name,
                joinTime: new Date(),
                categoryId: category.id,
            });

            try {
                await attendance.save();
                console.log(`Attendance recorded for ${member.user.username}`);
            } catch (err) {
                console.error('Error saving attendance:', err);
            }
        }
    }
};
