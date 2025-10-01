module.exports = {
	name: 'purge',
	description: 'Delete a number of messages from a channel',
	async execute(message, args) {
		if (!message.member.permissions.has('ManageMessages')) {
			return message.reply('You do not have permission to use this command.');
		}
		const amount = parseInt(args[1]);
		if (isNaN(amount) || amount < 1 || amount > 100) {
			return message.reply('Please specify a number between 1 and 100.');
		}
		try {
			await message.channel.bulkDelete(amount, true);
			message.channel.send(`Deleted ${amount} messages.`)
				.then(msg => setTimeout(() => msg.delete(), 5000));
		} catch (error) {
			message.reply('There was an error trying to purge messages.');
		}
	}
};
