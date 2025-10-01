const badWords = ['badword1', 'badword2', 'badword3']; // Add more as needed

module.exports = {
	checkMessage: (message) => {
		if (message.author.bot) return;
		const content = message.content.toLowerCase();
		for (const word of badWords) {
			if (content.includes(word)) {
				message.delete();
				message.channel.send(`${message.author}, your message was removed for inappropriate language.`)
					.then(msg => setTimeout(() => msg.delete(), 5000));
				break;
			}
		}
	}
};
