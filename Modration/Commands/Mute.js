module.exports = {
	name: 'mute',
	description: 'Mute a member in the server',
	async execute(message, args) {
		if (!message.member.permissions.has('ModerateMembers')) {
			return message.reply('You do not have permission to use this command.');
		}
		const member = message.mentions.members.first();
		if (!member) {
			return message.reply('Please mention a valid member to mute.');
		}
		let reason = args.slice(1).join(' ');
		try {
			await member.timeout(10 * 60 * 1000, reason || 'No reason provided'); // 10 minutes
			message.channel.send(`${member.user.tag} was muted for 10 minutes. ${reason ? 'Reason: ' + reason : ''}`);
		} catch (error) {
			message.reply('There was an error trying to mute this user.');
		}
	}
};
