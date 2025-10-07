
const fs = require('fs');
const path = require('path');
const banListPath = path.join(__dirname, 'ban.txt');

function addBanToFile(userId, userTag, reason) {
	const entry = `${userId}|${userTag}|${reason || 'No reason provided'}\n`;
	fs.appendFileSync(banListPath, entry, 'utf8');
}


function removeBanFromFile(userId) {
	let bans = [];
	if (fs.existsSync(banListPath)) {
		bans = fs.readFileSync(banListPath, 'utf8').split('\n').filter(Boolean);
	}
	bans = bans.filter(line => !line.startsWith(userId + '|'));
	fs.writeFileSync(banListPath, bans.join('\n') + (bans.length ? '\n' : ''), 'utf8');
}

function getBanList() {
	if (!fs.existsSync(banListPath)) return [];
	return fs.readFileSync(banListPath, 'utf8').split('\n').filter(Boolean).map(line => {
		const [id, tag, reason] = line.split('|');
		return { id, tag, reason };
	});
}

module.exports = {
	name: 'ban',
	description: 'Ban, unban, and view banned members',
	async execute(message, args) {
		const reply = message.reply;
		// Debug: log incoming args and caller info to help troubleshoot
		console.log('[Ban] execute called. args:', args);
		try { console.log('[Ban] caller:', (message.author && message.author.tag) || 'unknown', 'member id:', message.member && message.member.id); } catch {};
		try { console.log('[Ban] member permissions:', message.member && message.member.permissions && message.member.permissions.toArray ? message.member.permissions.toArray() : message.member && message.member.permissions); } catch {}
		let responded = false;
		try {
			// Detect which command is being called
			const subcommand = args[0];
			// /ban
			if (!subcommand || subcommand === 'ban') {
				if (!message.member.permissions.has('BanMembers')) {
					await reply('You do not have permission to use this command.', false); responded = true;
				} else {
					let member = args[1];
					let reason = args[2] || '';
					// If called from slash, args[1] is a User object
					if (member && member.id) {
						try {
							const targetMember = await message.guild.members.fetch(member.id);
							if (!targetMember.bannable) {
								await reply('I cannot ban this user.', true); responded = true;
							} else {
								await targetMember.ban({ reason: reason || 'No reason provided' });
								addBanToFile(targetMember.user.id, targetMember.user.tag, reason);
								await reply(`${targetMember.user.tag} was banned. ${reason ? 'Reason: ' + reason : ''}`, true); responded = true;
							}
						} catch (err) {
							await reply('Could not find the specified member.', false); responded = true;
						}
					} else {
						await reply('Please mention a valid member to ban.', false); responded = true;
					}
				}
			}
			// /unban
			else if (subcommand === 'unban') {
				if (!message.member.permissions.has('BanMembers')) {
					await reply('You do not have permission to use this command.', false); responded = true;
				} else {
					const userId = args[1];
					if (!userId) {
						await reply('Please provide a user ID to unban.', false); responded = true;
					} else {
						try {
							// Use GuildBanManager.remove to unban a user by ID (correct discord.js API)
							console.log(`[Ban] attempting to unban ID: ${userId}`);
							await message.guild.bans.remove(userId);
							console.log(`[Ban] unban succeeded for ID: ${userId}`);
							removeBanFromFile(userId);
							await reply(`User with ID ${userId} has been unbanned.`, true); responded = true;
						} catch (err) {
							await reply('There was an error trying to unban this user. Make sure the ID is correct and the user is banned.', true); responded = true;
						}
					}
				}
			}
			// /viewban
			else if (subcommand === 'viewban') {
				if (!message.member.permissions.has('BanMembers')) {
					await reply('You do not have permission to use this command.', false); responded = true;
				} else {
					const bans = getBanList();
					if (!bans.length) {
						await reply('No users are currently banned.', true); responded = true;
					} else {
						const embed = {
							title: 'Banned Users',
							color: 0xff0000,
							description: bans.map(b => `**${b.tag}** (ID: ${b.id})\nReason: ${b.reason}`).join('\n\n'),
							timestamp: new Date().toISOString(),
						};
						await reply({ embeds: [embed] }, true); responded = true;
					}
				}
			}
		} catch (error) {
			if (!responded) {
				await reply('There was an error executing the command.', true);
			}
			// Log error for debugging
			console.error('Ban.js error:', error);
		}
	}
};
