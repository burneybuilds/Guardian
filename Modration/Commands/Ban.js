module.exports = {
	name: 'ban',
	description: 'Ban a member from the server',
	async execute(message, args) {
		if (!message.member.permissions.has('BanMembers')) {
			return message.reply('You do not have permission to use this command.');
		}
		const member = message.mentions.members.first();
		if (!member) {
			return message.reply('Please mention a valid member to ban.');
		}
		if (!member.bannable) {
			return message.reply('I cannot ban this user.');
		}
		let reason = args.slice(1).join(' ');
		try {
			await member.ban({ reason: reason || 'No reason provided' });
			message.channel.send(`${member.user.tag} was banned. ${reason ? 'Reason: ' + reason : ''}`);
		} catch (error) {
			message.reply('There was an error trying to ban this user.');
		}
	}
};
