module.exports = {
	name: 'mute',
	description: 'Mute a member in the server',
	async execute(message, args) {
		const reply = message.reply;

		// Randomized no-permission messages (copied style from Kick.js)
		const noPermResponses = [
			'Nah nah, you can’t use that! 😂',
			'Nice try, but you need more power!',
			'Permission denied! 🚫',
			'You thought you could mute? Not today!',
			'Only mods and admins can use this command!'
		];

		// If the caller doesn't have ModerateMembers or Administrator, log and send a random message
		if (!message.member.permissions.has('ModerateMembers') && !message.member.permissions.has('Administrator')) {
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
							title: 'Unauthorized Mute Attempt',
							color: 0xff0000,
							description: `User: ${message.author.tag} (${message.author.id}) tried to use /mute without permission.`,
							fields: [
								{ name: 'Channel', value: `${message.channel?.name || 'Unknown'} (${message.channel?.id || 'Unknown'})`, inline: true },
								{ name: 'Time', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
							],
							timestamp: new Date().toISOString(),
						}
					]
				});
			}

			// Send a random public message (tagged) to the channel
			const tag = `<@${message.author.id}>`;
			const response = noPermResponses[Math.floor(Math.random() * noPermResponses.length)];
			if (message.reply) {
				await message.reply(`${tag} ${response}`, false);
			} else if (message.channel && message.channel.send) {
				await message.channel.send(`${tag} ${response}`);
			}
			return;
		}

		// Determine target member and duration
		const member = message.mentions?.members?.first?.() || args[1];
		// Support interaction-style call where args[2] is duration
		let durationMinutes = null;
		if (args[2] && typeof args[2] === 'number') durationMinutes = args[2];
		// If called via text and a numeric arg is provided as second arg, support it
		if (!durationMinutes && args[1] && typeof args[1] === 'string' && /^\d+$/.test(args[1])) {
			durationMinutes = parseInt(args[1], 10);
		}
		// Default to 10 minutes if not provided or invalid
		if (!durationMinutes || isNaN(durationMinutes) || durationMinutes <= 0) durationMinutes = 10;

		if (!member) {
			return reply('Please mention a valid member to mute.');
		}
		let reason = args.slice(3).join(' ');

		// Resolve member to GuildMember if needed
		let targetMember = member;
		try {
			// If member is a user-like object with an id, fetch the guild member
			if (targetMember && targetMember.id && typeof targetMember.timeout !== 'function') {
				targetMember = await message.guild.members.fetch(targetMember.id);
			}
			// If member is a mention string like <@123...>, extract id and fetch
			if (typeof targetMember === 'string') {
				const id = targetMember.replace(/\D/g, '');
				if (id) targetMember = await message.guild.members.fetch(id);
			}
		} catch (err) {
			console.error('Error resolving target member for mute:', err);
			return reply('Could not find the specified member.');
		}
		try {
			await targetMember.timeout(durationMinutes * 60 * 1000, reason || 'No reason provided'); // duration in minutes

			// Notify in channel
			await message.channel.send(`${targetMember.user.tag} was muted for ${durationMinutes} minute(s). ${reason ? 'Reason: ' + reason : ''}`);

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
			if (logChannel) {
				await logChannel.send({
					embeds: [
						{
							title: 'Member Muted',
							color: 0x00ff00,
							description: `A member was muted in the server.`,
							fields: [
								{ name: 'Muted User', value: `${targetMember.user.tag} (${targetMember.user.id})`, inline: true },
								{ name: 'Muted By', value: `${message.author.tag} (${message.author.id})`, inline: true },
								{ name: 'Duration', value: `${durationMinutes} minute(s)`, inline: true },
								{ name: 'Reason', value: reason && reason.length > 0 ? reason : 'No reason provided', inline: false },
								{ name: 'Time', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
							],
							timestamp: new Date().toISOString(),
						}
					]
				});
			}
		} catch (error) {
			console.error('Mute command error:', error);
			return reply('There was an error trying to mute this user.');
		}
	}
};
