require('dotenv').config();
const antiRaid = require('./Auto_mod/anti-raid.js');
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, Collection } = require('discord.js');
const path = require('path');
const kickCommand = require('./Modration/Commands/Kick.js');
const banCommand = require('./Modration/Commands/Ban.js');
const muteCommand = require('./Modration/Commands/Mute.js');
const purgeCommand = require('./Modration/Commands/Purge.js');
const warnCommand = require('./Modration/Commands/Warn.js');
const commands = [
    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member from the server')
        .addUserOption(option => option.setName('user').setDescription('User to kick').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason for kick').setRequired(false)),
    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a member from the server')
        .addUserOption(option => option.setName('user').setDescription('User to ban').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason for ban').setRequired(false)),
    new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a member for 10 minutes')
        .addUserOption(option => option.setName('user').setDescription('User to mute').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason for mute').setRequired(false)),
    new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Delete a number of messages from a channel')
        .addIntegerOption(option => option.setName('amount').setDescription('Number of messages to delete').setRequired(true)),
    new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a member in the server')
        .addUserOption(option => option.setName('user').setDescription('User to warn').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason for warning').setRequired(false)),
].map(cmd => cmd.toJSON());


const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
const autoMod = require('./Auto_mod/auto_mod.js');
require('dotenv').config(); 



const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, // Allows bot to see servers
        GatewayIntentBits.GuildMessages, // Allows bot to see messages
        GatewayIntentBits.MessageContent // Allows bot to read message content
    ]
});

client.commands = new Collection();
client.commands.set('kick', kickCommand);
client.commands.set('ban', banCommand);
client.commands.set('mute', muteCommand);
client.commands.set('purge', purgeCommand);
client.commands.set('warn', warnCommand);

client.once('clientReady', async () => {
    console.log(`I am here${client.user.tag}`);
    // Register slash commands for all guilds the bot is in
    try {
        const guilds = client.guilds.cache.map(guild => guild.id);
        for (const guildId of guilds) {
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, guildId),
                { body: commands }
            );
        }
        console.log('Slash commands registered.');
    } catch (error) {
        console.error('Error registering slash commands:', error);
    }
});

// Register after client is defined
client.on('guildMemberAdd', (member) => {
    antiRaid.handleGuildMemberAdd(member);
});


client.on('messageCreate', (message) => {
    // Auto moderation
    autoMod.handleMessage(message);

    if (message.author.bot) return;

    if (message.content.toLowerCase() === 'hello') {
        message.reply('Hey there! 👋');
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    const { commandName } = interaction;
    if (!client.commands.has(commandName)) return;
    // Helper to reply only if not already replied or deferred
    const safeReply = async (msg, ephemeral = false) => {
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: msg, flags: ephemeral ? 64 : undefined });
        }
    };
    try {
        if (commandName === 'kick' || commandName === 'ban' || commandName === 'mute' || commandName === 'warn') {
            const user = interaction.options.getUser('user');
            const member = await interaction.guild.members.fetch(user.id);
            const reason = interaction.options.getString('reason');
            await client.commands.get(commandName).execute({
                member: interaction.member,
                mentions: { members: { first: () => member } },
                guild: interaction.guild,
                channel: interaction.channel,
                author: interaction.user,
                reply: (msg, ephemeral = false) => safeReply(msg, ephemeral),
                content: '',
            }, ['', user, reason]);
            // No extra reply here to avoid double reply error
        } else if (commandName === 'purge') {
            const amount = interaction.options.getInteger('amount');
            await client.commands.get('purge').execute({
                member: interaction.member,
                channel: interaction.channel,
                reply: (msg, ephemeral = false) => safeReply(msg, ephemeral),
                content: '',
            }, ['', amount]);
            await safeReply(`Purged ${amount} messages.`, true);
        }
    } catch (error) {
        await safeReply('There was an error executing this command.', true);
    }
});

client.login(process.env.DISCORD_TOKEN);