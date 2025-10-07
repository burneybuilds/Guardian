module.exports = {
	name: 'kick',
	description: 'Kick a member from the server',
	async execute(message, args) {
		// Check for KickMembers or Administrator permission
	const reply = message.reply;
		const noPermResponses = [
			'Nah nah, you can’t use that! 😂',
			'Nice try, but you need more power!',
			'Permission denied! 🚫',
			'You thought you could kick? Not today!',
			'Only mods and admins can use this command!'
		];
	if (!message.member.permissions.has('KickMembers') && !message.member.permissions.has('Administrator')) {
			// Log failed attempt in mod-logs
			let logChannel = message.guild.channels.cache.find(ch => ch.name === 'mod-logs' && ch.isTextBased?.());
			if (!logChannel) {
				logChannel = await message.guild.channels.create({
					name: 'mod-logs',
					type: 0, // GUILD_TEXT
					permissionOverwrites: [
						{
							id: message.guild.roles.everyone,
							deny: ['ViewChannel'],
						},
						...message.guild.roles.cache
							.filter(role => role.permissions.has('Administrator'))
							.map(role => ({
								id: role.id,
								allow: ['ViewChannel'],
							})),
					],
				});
				// Fetch the channel again to ensure it's available
				logChannel = message.guild.channels.cache.find(ch => ch.name === 'mod-logs' && ch.isTextBased?.());
			}
			if (logChannel) {
				await logChannel.send({
					embeds: [
						{
							title: 'Unauthorized Kick Attempt',
							color: 0xff0000,
							description: `User: ${message.author.tag} (${message.author.id}) tried to use /kick without permission.`,
							fields: [
								{ name: 'Channel', value: `${message.channel?.name || 'Unknown'} (${message.channel?.id || 'Unknown'})`, inline: true },
								{ name: 'Time', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
							],
							timestamp: new Date().toISOString(),
						}
					]
				});
			}
			// Send a random public message in the channel (tagged), only this message for unauthorized attempts
			const tag = `<@${message.author.id}>`;
			const response = noPermResponses[Math.floor(Math.random() * noPermResponses.length)];
			if (message.reply) {
				// If this is a slash command, reply to the interaction (public, not ephemeral)
				await message.reply(`${tag} ${response}`, false);
			} else if (message.channel && message.channel.send) {
				// Fallback for message-based
				await message.channel.send(`${tag} ${response}`);
			}
			// No extra reply, only the tagged message and mod-logs embed
			return;
		}
		const member = message.mentions?.members?.first?.() || args[1];
		// Support both interaction and message-based invocation
		let targetMember = member;
		if (!targetMember || typeof targetMember === 'string') {
			// If called from interaction, args[1] is a User object
			if (args[1] && args[1].id) {
				try {
					targetMember = await message.guild.members.fetch(args[1].id);
				} catch {
					return await reply('Could not find the specified member.');
				}
			} else {
				return await reply('Please mention a valid member to kick.');
			}
		}
		if (!targetMember.kickable) {
			return await reply('I cannot kick this user.', true);
		}
		let reason = args[2] || args.slice(1).join(' ');
		try {
			await targetMember.kick(reason || 'No reason provided');
			// Log to #mod-logs channel
			let logChannel = message.guild.channels.cache.find(ch => ch.name === 'mod-logs' && ch.isTextBased?.());
			if (!logChannel) {
				logChannel = await message.guild.channels.create({
					name: 'mod-logs',
					type: 0, // GUILD_TEXT
					permissionOverwrites: [
						{
							id: message.guild.roles.everyone,
							deny: ['ViewChannel'],
						},
						...message.guild.roles.cache
							.filter(role => role.permissions.has('Administrator'))
							.map(role => ({
								id: role.id,
								allow: ['ViewChannel'],
							})),
					],
				});
				logChannel = message.guild.channels.cache.find(ch => ch.name === 'mod-logs' && ch.isTextBased?.());
			}
			if (logChannel && targetMember && targetMember.user) {
				await logChannel.send({
					embeds: [
						{
							title: 'Member Kicked',
							color: 0x00ff00,
							description: `A member was kicked from the server.`,
							fields: [
								{ name: 'Kicked User', value: `${targetMember.user.tag} (${targetMember.user.id})`, inline: true },
								{ name: 'Kicked By', value: `${message.author.tag} (${message.author.id})`, inline: true },
								{ name: 'Reason', value: reason && reason.length > 0 ? reason : 'No reason provided', inline: false },
								{ name: 'Time', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
							],
							timestamp: new Date().toISOString(),
						}
					]
				});
			}
			return await reply(`${targetMember.user.tag} was kicked. ${reason ? 'Reason: ' + reason : ''}`, true);
		} catch (error) {
			// Log error to mod-logs and console
			let logChannel = message.guild.channels.cache.find(ch => ch.name === 'mod-logs' && ch.isTextBased?.());
			if (logChannel) {
				await logChannel.send({
					embeds: [
						{
							title: 'Kick Command Error',
							color: 0xff0000,
							description: `Error: ${(error && error.message) ? error.message : String(error)}\nUser: ${message.author.tag} (${message.author.id})\nTarget: ${(targetMember && targetMember.user) ? `${targetMember.user.tag} (${targetMember.user.id})` : 'Unknown'}`,
							timestamp: new Date().toISOString(),
						}
					]
				});
			}
			console.error('Kick command error:', error);
			return await reply('There was an error trying to kick this user.', true);
		}
	}
};
