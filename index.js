const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config(); 

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, // Allows bot to see servers
        GatewayIntentBits.GuildMessages, // Allows bot to see messages
        GatewayIntentBits.MessageContent // Allows bot to read message content
    ]
});

client.once('ready', () => {
    console.log(`I am here${client.user.tag}`);
});


client.on('messageCreate', (message) => {
    
    if (message.author.bot) return;

    if (message.content.toLowerCase() === 'hello') {
        message.reply('Hey there! 👋');
    }
});

client.login(process.env.BOT_TOKEN);