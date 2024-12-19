const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');
require('dotenv').config();
const config = require('./config.json');
const handleVoiceStateUpdate = require('./events/voiceStateUpdate'); // Import the component

// Load sensitive data from .env
config.TOKEN = process.env.DISCORD_TOKEN;
config.MONGO_URI = process.env.MONGO_URI;
config.GUILD_ID = process.env.GUILD_ID;
config.ROLE_ID = process.env.ROLE_ID;
config.VC_CATEGORIES = process.env.VC_CATEGORIES.split(',');

// Initialize client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

// Connect to MongoDB
mongoose.connect(config.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Failed to connect to MongoDB:', err);
});

// Bot ready event
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Use the modularized voiceStateUpdate event
client.on('voiceStateUpdate', (oldState, newState) => {
    handleVoiceStateUpdate(oldState, newState, client, config);
});

client.login(config.TOKEN);
