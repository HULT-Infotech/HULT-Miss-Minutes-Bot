const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config.json');
require('dotenv').config();

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
});

const handleVoiceStateUpdate = require('./events/voiceStateUpdate');
client.on('voiceStateUpdate', (oldState, newState) => {
    handleVoiceStateUpdate(oldState, newState, client, config);
});

client.login(config.TOKEN);
