module.exports = {
	name: 'kick',
	description: 'Kick a member from the server',
	async execute(message, args) {
		if (!message.member.permissions.has('KickMembers')) {
			return message.reply('You do not have permission to use this command.');
		}
		const member = message.mentions.members.first();
		if (!member) {
			return message.reply('Please mention a valid member to kick.');
		}
		if (!member.kickable) {
			return message.reply('I cannot kick this user.');
		}
		let reason = args.slice(1).join(' ');
		try {
			await member.kick(reason || 'No reason provided');
			message.channel.send(`${member.user.tag} was kicked. ${reason ? 'Reason: ' + reason : ''}`);
		} catch (error) {
			message.reply('There was an error trying to kick this user.');
		}
	}
};
