const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config.json');
require('dotenv').config();

// Set environment variables
config.TOKEN = process.env.DISCORD_TOKEN;   //! Change this to your bot's token
config.GUILD_ID = process.env.GUILD_ID;   //! Change this to your server's ID
config.ROLE_ID = process.env.ROLE_ID;  //! Change this to your role's ID
config.VC_CATEGORIES = process.env.VC_CATEGORIES.split(','); //! Change this to your voice channel category IDs

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
