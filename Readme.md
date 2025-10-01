# φύλακας Discord Bot

![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)
![Discord.js](https://img.shields.io/badge/Discord.js-v14-blue?logo=discord)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Status](https://img.shields.io/badge/Status-Active-success)
![Open Source](https://img.shields.io/badge/Open%20Source-Yes-purple)

**φύλακας** (Greek for "Guardian") is an open-source Discord moderation bot.  
It’s built to help communities stay safe with **powerful moderation tools**, **auto-protection systems**, and some unique features that go beyond traditional bots.

## ✨ Features
- ✅ Moderation Commands (ban, kick, mute, warn, purge, etc.)
- ✅ Auto-Moderation (anti-raid, word filter, spam detection)
- ✅ Utility Commands (announcements, welcome messages)
- ✅ Customizable settings for each server
- ✅ (Planned) AI-powered dark personality mode to roast users in a special channel

---

## 📂 Project Structure
```

φύλακας/
│── Moderation/
│   ├── Auto_mod/
│   │   ├── anti-raid.js
│   │   ├── auto_mod.js
│   │   ├── filter.js
│   ├── Commands/
│   │   ├── Ban.js
│   │   ├── Kick.js
│   │   ├── Mute.js
│   │   ├── Purge.js
│   │   ├── Warn.js
│   ├── Util/
│   │   ├── annous.js
│   │   ├── set_welcome.js
│── index.js
│── package.json
│── .env
│── README.md

````

## 🚀 Setup

### 1. Clone the repository
```bash
git clone https://github.com/your-username/fylakas-bot.git
cd fylakas-bot
````

### 2. Install dependencies

```bash
npm install
```

### 3. Create a `.env` file

```env
TOKEN=your_discord_bot_token_here
CLIENT_ID=your_client_id
GUILD_ID=your_test_guild_id
```

### 4. Run the bot

```bash
node index.js
```

---

## 🛠 Commands (Basic Moderation)

* `/ban` – Ban a user
* `/kick` – Kick a user
* `/mute` – Mute a user
* `/warn` – Warn a user
* `/purge` – Delete messages in bulk
* `/setwelcome` – Configure welcome message
* `/announce` – Post announcements

---

## 🤝 Contributing

Pull requests are welcome!
For major changes, please open an issue first to discuss what you’d like to add.

---

## 📜 License

This project is licensed under the **MIT License** – feel free to use and modify it.

---

## 👤 Developer

* Created by **Albet** *(Discord: your_id_here)*
* GitHub: [burneybuilds](https://github.com/burneybuilds)

---

> "Well done, good and faithful servant…" – *Matthew 25:21*

