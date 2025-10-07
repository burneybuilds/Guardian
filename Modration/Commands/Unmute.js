module.exports = {
    name: 'unmute',
    description: 'Remove timeout from a member',
    async execute(message, args) {
        const reply = message.reply;

        const noPermResponses = [
            'Nah nah, you can’t use that! 😂',
            'Nice try, but you need more power!',
            'Permission denied! 🚫',
            'You thought you could unmute? Not today!',
            'Only mods and admins can use this command!'
        ];

        // Permission check: require ModerateMembers or Administrator
        if (!message.member.permissions.has('ModerateMembers') && !message.member.permissions.has('Administrator')) {
            // Log failed attempt in mod-logs
            let logChannel = message.guild.channels.cache.find(ch => ch.name === 'mod-logs' && ch.isTextBased?.());
            if (!logChannel) {
                logChannel = await message.guild.channels.create({
                    name: 'mod-logs',
                    type: 0,
                    permissionOverwrites: [
                        { id: message.guild.roles.everyone, deny: ['ViewChannel'] },
                        ...message.guild.roles.cache
                            .filter(role => role.permissions.has('Administrator'))
                            .map(role => ({ id: role.id, allow: ['ViewChannel'] })),
                    ],
                });
                logChannel = message.guild.channels.cache.find(ch => ch.name === 'mod-logs' && ch.isTextBased?.());
            }
            if (logChannel) {
                await logChannel.send({
                    embeds: [
                        {
                            title: 'Unauthorized Unmute Attempt',
                            color: 0xff0000,
                            description: `User: ${message.author.tag} (${message.author.id}) tried to use /unmute without permission.`,
                            fields: [
                                { name: 'Channel', value: `${message.channel?.name || 'Unknown'} (${message.channel?.id || 'Unknown'})`, inline: true },
                                { name: 'Time', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
                            ],
                            timestamp: new Date().toISOString(),
                        }
                    ]
                });
            }

            // Send random no-permission message
            const tag = `<@${message.author.id}>`;
            const response = noPermResponses[Math.floor(Math.random() * noPermResponses.length)];
            if (message.reply) {
                await message.reply(`${tag} ${response}`, false);
            } else if (message.channel && message.channel.send) {
                await message.channel.send(`${tag} ${response}`);
            }
            return;
        }

        // Resolve target member: support mention, user object, or id string
        const member = message.mentions?.members?.first?.() || args[1];
        if (!member) {
            return reply('Please mention a valid member to unmute.');
        }

        let reason = args.slice(2).join(' ');

        // Resolve to GuildMember
        let targetMember = member;
        try {
            if (targetMember && targetMember.id && typeof targetMember.timeout !== 'function') {
                targetMember = await message.guild.members.fetch(targetMember.id);
            }
            if (typeof targetMember === 'string') {
                const id = targetMember.replace(/\D/g, '');
                if (id) targetMember = await message.guild.members.fetch(id);
            }
        } catch (err) {
            console.error('Error resolving target member for unmute:', err);
            return reply('Could not find the specified member.');
        }

        try {
            // Remove timeout by passing null
            await targetMember.timeout(null, reason || 'Unmuted');

            // Notify channel
            await message.channel.send(`${targetMember.user.tag} has been unmuted. ${reason ? 'Reason: ' + reason : ''}`);

            // Log to mod-logs
            let logChannel = message.guild.channels.cache.find(ch => ch.name === 'mod-logs' && ch.isTextBased?.());
            if (!logChannel) {
                logChannel = await message.guild.channels.create({
                    name: 'mod-logs',
                    type: 0,
                    permissionOverwrites: [
                        { id: message.guild.roles.everyone, deny: ['ViewChannel'] },
                        ...message.guild.roles.cache
                            .filter(role => role.permissions.has('Administrator'))
                            .map(role => ({ id: role.id, allow: ['ViewChannel'] })),
                    ],
                });
                logChannel = message.guild.channels.cache.find(ch => ch.name === 'mod-logs' && ch.isTextBased?.());
            }
            if (logChannel) {
                await logChannel.send({
                    embeds: [
                        {
                            title: 'Member Unmuted',
                            color: 0x00ff00,
                            description: `A member was unmuted in the server.`,
                            fields: [
                                { name: 'Unmuted User', value: `${targetMember.user.tag} (${targetMember.user.id})`, inline: true },
                                { name: 'Unmuted By', value: `${message.author.tag} (${message.author.id})`, inline: true },
                                { name: 'Reason', value: reason && reason.length > 0 ? reason : 'No reason provided', inline: false },
                                { name: 'Time', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
                            ],
                            timestamp: new Date().toISOString(),
                        }
                    ]
                });
            }

        } catch (error) {
            console.error('Unmute command error:', error);
            return reply('There was an error trying to unmute this user.');
        }
    }
};
