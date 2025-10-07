module.exports = {
	name: 'warn',
	description: 'Warn a member in the server',
	async execute(message, args) {
		if (!message.member.permissions.has('KickMembers')) {
			return message.reply('You do not have permission to use this command.', false);
		}
		const member = message.mentions.members.first();
		if (!member) {
			return message.reply('Please mention a valid member to warn.');
		}
		let reason = args.slice(1).join(' ');
		try {
			await member.send(`You have been warned in ${message.guild.name}. ${reason ? 'Reason: ' + reason : ''}`);
			message.channel.send(`${member.user.tag} has been warned. ${reason ? 'Reason: ' + reason : ''}`);
		} catch (error) {
			message.reply('There was an error trying to warn this user.');
		}
	}
};
