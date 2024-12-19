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

    const currentDate = new Date().toDateString(); // Track attendance by date

    // User joins a voice channel
    if (isRoleMatched && newState.channelId && !oldState.channelId) {
        const channel = newState.channel;
        const category = channel.parent;

        if (config.VC_CATEGORIES.includes(category.id)) {
            const joinTime = new Date();

            // Check if the user already has an active attendance message for today
            let userMessage = activeMessages.get(member.id);

            if (userMessage && userMessage.date === currentDate) {
                // Edit the existing message to include the new join
                const { message, attendances, webhook } = userMessage;
                attendances.push({
                    joinTime: joinTime,
                    channel: channel.name,
                    category: category.name,
                });

                const updatedContent = generateAttendanceMessage(member, attendances);
                await webhook.editMessage(message.id, { content: updatedContent });

                userMessage.attendances = attendances; // Update tracked data
            } else {
                // Create a new message for the user if it's a new day
                const attendances = [{
                    joinTime: joinTime,
                    channel: channel.name,
                    category: category.name,
                }];

                const message = await webhook.send({
                    content: generateAttendanceMessage(member, attendances),
                    username: client.user.username,
                    avatarURL: client.user.displayAvatarURL(),
                });

                activeMessages.set(member.id, { message, attendances, date: currentDate, webhook });
            }
        }
    }

// User leaves a voice channel
if (isRoleMatched && oldState.channelId && !newState.channelId) {
    const channel = oldState.channel;
    const category = channel.parent;

    if (config.VC_CATEGORIES.includes(category.id)) {
        const leaveTime = new Date();

        const userMessage = activeMessages.get(member.id);
        if (userMessage && userMessage.date === currentDate) {
            const { message, attendances, webhook } = userMessage;

            // Add disconnect time to the last attendance
            const lastAttendance = attendances[attendances.length - 1];
            lastAttendance.leaveTime = leaveTime;

            // Calculate total time for this attendance
            const totalTimeMs = leaveTime - lastAttendance.joinTime;
            const totalTimeMinutes = Math.floor(totalTimeMs / 60000); // Total minutes
            const totalTimeSeconds = Math.floor((totalTimeMs % 60000) / 1000); // Remaining seconds
            lastAttendance.totalTime = `${totalTimeMinutes}m ${totalTimeSeconds}s`;

            // Update the message with the day's total time
            const updatedContent = generateAttendanceMessage(member, attendances, true);

            try {
                await webhook.editMessage(message.id, { content: updatedContent });
                userMessage.attendances = attendances; // Update tracked data
            } catch (error) {
                if (error.code === 10008) {
                    console.error(`Message not found (possibly deleted): ${message.id}`);
                    // Optionally, remove the user from activeMessages map
                    activeMessages.delete(member.id);
                } else {
                    console.error(`Failed to edit message: ${error.message}`);
                }
            }
        }
    }
}

};

// Helper function to generate attendance message content
function generateAttendanceMessage(member, attendances, includeTotalTime = false) {
    let content = "```" +
        "User: @" + member.user.username + "\n\n";

    let totalDayTimeMs = 0;

    attendances.forEach((attendance, index) => {
        content += `Session ${index + 1}:\n`;
        content += "Joined At: " + attendance.joinTime.toLocaleString() + "\n";
        content += "Voice Channel: " + attendance.channel + "\n";
        content += "Category: " + attendance.category + "\n";

        if (attendance.leaveTime) {
            const totalTimeMs = attendance.leaveTime - attendance.joinTime;
            totalDayTimeMs += totalTimeMs; // Add to total day time

            content += "Disconnected At: " + attendance.leaveTime.toLocaleString() + "\n";
            content += "Total Time: " + attendance.totalTime + "\n";
        } else {
            content += "Disconnected At: Not yet\n";
            content += "Total Time: Not yet\n";
        }

        content += "\n";
    });

    if (includeTotalTime) {
        const totalDayMinutes = Math.floor(totalDayTimeMs / 60000); // Total minutes
        const totalDaySeconds = Math.floor((totalDayTimeMs % 60000) / 1000); // Remaining seconds
        const totalDayFormatted = `${totalDayMinutes}m ${totalDaySeconds}s`;

        content += "-----------------------------------\n";
        content += "Total Work Time for the Day: " + totalDayFormatted + "\n";
    }

    content += "```";
    content += `<@${member.id}> \t✅`; // Use nickname at the bottom
    return content;
}

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
