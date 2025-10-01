const recentJoins = new Map();

module.exports = {
	checkMessage: (message) => {
		// Placeholder: No message-based anti-raid logic
	},
	handleGuildMemberAdd: (member) => {
		const now = Date.now();
		const guildId = member.guild.id;
		if (!recentJoins.has(guildId)) recentJoins.set(guildId, []);
		const joins = recentJoins.get(guildId);
		joins.push(now);
		// Remove joins older than 10 seconds
		while (joins.length && now - joins[0] > 10000) joins.shift();
		if (joins.length > 5) {
			// More than 5 joins in 10 seconds: possible raid
			const channel = member.guild.systemChannel;
			if (channel) channel.send('Possible raid detected!');
		}
	}
};
