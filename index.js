const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config.json');
require('dotenv').config();

// Set environment variables
config.TOKEN = process.env.DISCORD_TOKEN;
config.GUILD_ID = process.env.GUILD_ID;
config.ROLE_ID = process.env.ROLE_ID;
config.VC_CATEGORIES = process.env.VC_CATEGORIES.split(',');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

client.once('ready', () => {  
    console.log(`Logged in as ${client.user.tag}!`);  

    // Set the bot status to show it's watching the employees
    client.user.setPresence({
        activities: [{ name: 'the employees', type: 3 }], // 3 corresponds to "Watching"
        status: 'online', // You can change to 'dnd' (Do Not Disturb) or 'idle' as needed
    });
}); 

// Import and handle voice state updates
const handleVoiceStateUpdate = require('./events/voiceStateUpdate');
client.on('voiceStateUpdate', (oldState, newState) => {
    handleVoiceStateUpdate(oldState, newState, client, config);
});

// Log in with the token
client.login(config.TOKEN);
