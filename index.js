require('dotenv').config();
const antiRaid = require('./Auto_mod/anti-raid.js');
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, Collection } = require('discord.js');
const path = require('path');
const kickCommand = require('./Modration/Commands/Kick.js');
const banCommand = require('./Modration/Commands/Ban.js');
const muteCommand = require('./Modration/Commands/Mute.js');
const unmuteCommand = require('./Modration/Commands/Unmute.js');
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
        .setName('unban')
        .setDescription('Unban a user by ID')
        .addStringOption(option => option.setName('userid').setDescription('User ID to unban').setRequired(true)),
    new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Unmute a member')
        .addUserOption(option => option.setName('user').setDescription('User to unmute').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason for unmute').setRequired(false)),
    new SlashCommandBuilder()
        .setName('viewban')
        .setDescription('View the list of banned users'),
    new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a member for 10 minutes')
        .addUserOption(option => option.setName('user').setDescription('User to mute').setRequired(true))
        .addIntegerOption(option => option.setName('duration').setDescription('Duration in minutes').setRequired(false))
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
        GatewayIntentBits.MessageContent, // Allows bot to read message content
        GatewayIntentBits.GuildMembers, // Needed to fetch members and manage bans/unbans
    ]
});

client.commands = new Collection();
client.commands.set('kick', kickCommand);
client.commands.set('ban', banCommand);
client.commands.set('mute', muteCommand);
client.commands.set('unmute', unmuteCommand);
client.commands.set('purge', purgeCommand);
client.commands.set('warn', warnCommand);

// Support both v14 ('ready') and v15+ ('clientReady') events. Guard so initialization runs only once.
let _readyHandled = false;
const onReady = async () => {
    if (_readyHandled) return;
    _readyHandled = true;
    console.log(`I am here ${client.user.tag}`);
    // Register slash commands for all guilds the bot is in.....
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
};

client.once('ready', onReady);
client.once('clientReady', onReady);

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

    // Defer immediately so Discord won't show "The application did not respond" while we run the command.
    // Use ephemeral to avoid chat clutter; safeReply will edit the deferred reply later.
    if (!interaction.deferred && !interaction.replied) {
        try { await interaction.deferReply(); } catch (err) { /* ignore if deferral fails */ }
    }

    // Helper to reply — uses reply / editReply / followUp depending on interaction state.
    // Accept either a string message or a full options object (so commands can send embeds).
    const safeReply = async (msgOrOptions, ephemeral = false) => {
        // Normalize options
        let opts;
        if (typeof msgOrOptions === 'string') opts = { content: msgOrOptions };
        else opts = Object.assign({}, msgOrOptions);
        if (ephemeral && opts.ephemeral === undefined) opts.ephemeral = true;

        try {
            if (!interaction.replied && interaction.deferred) {
                // deferred but not yet edited. If the caller requested an ephemeral reply, send a separate ephemeral followUp,
                // since editReply cannot change the ephemeral state of the original deferred reply.
                if (opts.ephemeral) {
                    await interaction.followUp(opts);
                    return;
                }
                // otherwise edit the original (public) deferred reply
                await interaction.editReply(opts);
                return;
            }
            if (!interaction.replied && !interaction.deferred) {
                // not deferred and not replied
                await interaction.reply(opts);
                return;
            }
            // If we've already replied (or cannot edit), send as followUp
            await interaction.followUp(opts);
        } catch (err) {
            // As a fallback, try to send a reply or followUp and log error
            console.error('safeReply error:', err);
            try { if (!interaction.replied) await interaction.reply(opts); else await interaction.followUp(opts); } catch (e) {}
        }
    };
    try {
        if (commandName === 'kick') {
            const user = interaction.options.getUser('user');
            const member = await interaction.guild.members.fetch(user.id);
            const reason = interaction.options.getString('reason');
            await client.commands.get('kick').execute({
                member: interaction.member,
                mentions: { members: { first: () => member } },
                guild: interaction.guild,
                channel: interaction.channel,
                author: interaction.user,
                reply: (msg, ephemeral = false) => safeReply(msg, ephemeral),
                content: '',
            }, ['', user, reason]);
        } else if (commandName === 'ban') {
            const user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason');
            await client.commands.get('ban').execute({
                member: interaction.member,
                guild: interaction.guild,
                channel: interaction.channel,
                author: interaction.user,
                reply: (msg, ephemeral = false) => safeReply(msg, ephemeral),
                content: '',
            }, ['ban', user, reason]);
        } else if (commandName === 'unban') {
            const userId = interaction.options.getString('userid');
            await client.commands.get('ban').execute({
                member: interaction.member,
                guild: interaction.guild,
                channel: interaction.channel,
                author: interaction.user,
                reply: (msg, ephemeral = false) => safeReply(msg, ephemeral),
                content: '',
            }, ['unban', userId]);
        } else if (commandName === 'viewban') {
            await client.commands.get('ban').execute({
                member: interaction.member,
                guild: interaction.guild,
                channel: interaction.channel,
                author: interaction.user,
                reply: (msg, ephemeral = false) => safeReply(msg, ephemeral),
                content: '',
            }, ['viewban']);
        } else if (commandName === 'mute') {
            const user = interaction.options.getUser('user');
            const member = await interaction.guild.members.fetch(user.id);
            const reason = interaction.options.getString('reason');
            const duration = interaction.options.getInteger('duration');
            await client.commands.get('mute').execute({
                member: interaction.member,
                mentions: { members: { first: () => member } },
                guild: interaction.guild,
                channel: interaction.channel,
                author: interaction.user,
                reply: (msg, ephemeral = false) => safeReply(msg, ephemeral),
                content: '',
            }, ['', user, duration, reason]);
        } else if (commandName === 'purge') {
            const amount = interaction.options.getInteger('amount');
            await client.commands.get('purge').execute({
                member: interaction.member,
                channel: interaction.channel,
                reply: (msg, ephemeral = false) => safeReply(msg, ephemeral),
                content: '',
            }, ['', amount]);
            await safeReply(`Purged ${amount} messages.`, true);
        } else if (commandName === 'warn') {
            const user = interaction.options.getUser('user');
            const member = await interaction.guild.members.fetch(user.id);
            const reason = interaction.options.getString('reason');
            await client.commands.get('warn').execute({
                member: interaction.member,
                mentions: { members: { first: () => member } },
                guild: interaction.guild,
                channel: interaction.channel,
                author: interaction.user,
                reply: (msg, ephemeral = false) => safeReply(msg, ephemeral),
                content: '',
            }, ['', user, reason]);
        }
        else if (commandName === 'unmute') {
            const user = interaction.options.getUser('user');
            const member = await interaction.guild.members.fetch(user.id);
            const reason = interaction.options.getString('reason');
            await client.commands.get('unmute').execute({
                member: interaction.member,
                mentions: { members: { first: () => member } },
                guild: interaction.guild,
                channel: interaction.channel,
                author: interaction.user,
                reply: (msg, ephemeral = false) => safeReply(msg, ephemeral),
                content: '',
            }, ['', user, reason]);
        }
    } catch (error) {
        await safeReply('There was an error executing this command.', true);
    }
});

client.login(process.env.DISCORD_TOKEN);