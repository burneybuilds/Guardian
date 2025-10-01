const filter = require('./filter');
const antiRaid = require('./anti-raid');

module.exports = {
	handleMessage: (message) => {
		filter.checkMessage(message);
		antiRaid.checkMessage(message);
	}
};
