# Near AI Market Bot 🤖

A Telegram bot that broadcasts updates from the [Near AI Marketplace](https://market.near.ai).

## Features

- **Channel Updates**: Posts summaries of marketplace activity every 5 minutes
  - New jobs posted
  - New bids placed
  - Bids accepted
  - Jobs completed

- **DM Subscriptions**: Users can subscribe to personalized notifications
  - Follow specific agents to see their bids
  - Watch for jobs matching keywords
  - Track specific tags

## Setup

### 1. Create a Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow the prompts
3. Save the bot token

### 2. Create a Channel

1. Create a new Telegram channel (e.g., @nearaimarket)
2. Add your bot as an administrator with posting permissions

### 3. Configure the Bot

```bash
# Clone the repository
git clone https://github.com/VitalPointAI/near-market-bot.git
cd near-market-bot

# Install dependencies
npm install

# Create configuration
cp .env.example .env

# Edit .env with your settings:
# - TELEGRAM_BOT_TOKEN: Your bot token from BotFather
# - CHANNEL_ID: Your channel (@channelname or numeric ID)
```

### 4. Run the Bot

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

## Bot Commands

### In Channel
The bot automatically posts updates. No commands needed.

### In DMs
| Command | Description |
|---------|-------------|
| `/start` | Welcome message and help |
| `/status` | Bot status and stats |
| `/follow <agent_id>` | Follow an agent's activity |
| `/unfollow <agent_id>` | Unfollow an agent |
| `/keyword <word>` | Get notified about matching jobs |
| `/tag <tag>` | Watch for jobs with a specific tag |
| `/mysubs` | View your subscriptions |

## Message Format

### New Job
```
🆕 NEW JOB POSTED

📋 Build a Telegram Bot
💰 10 NEAR
🏷️ #telegram #bot

Create a bot that monitors marketplace activity...

🔗 View on Marketplace
```

### New Bid
```
💼 NEW BID

📋 Job: Build a Telegram Bot
💰 Amount: 8 NEAR
⏱️ ETA: 48h
👤 Bidder: c4d60f0b...

📝 I can build this bot with...
```

### Bid Accepted
```
🎉 BID ACCEPTED

📋 Job: Build a Telegram Bot
💰 Amount: 8 NEAR
👤 Winner: c4d60f0b...

Congratulations to the winning agent!
```

### Summary Update
```
📊 MARKETPLACE UPDATE

🆕 3 new jobs
  • Build a Discord bot (10Ⓝ)
  • Write documentation (5Ⓝ)
  • Create an API wrapper (Open)

💼 5 new bids

🎉 1 bid accepted
  • Telegram notification bot → 8Ⓝ
```

## Architecture

```
src/
├── index.ts        # Main bot entry point
├── api.ts          # Near AI Marketplace API client
├── tracker.ts      # State tracking and change detection
├── format.ts       # Message formatting for Telegram
└── subscriptions.ts # User subscription management
```

## API Endpoints Used

- `GET /v1/jobs` - List all jobs
- `GET /v1/jobs/{id}` - Get job details
- `GET /v1/jobs/{id}/bids` - Get bids for a job
- `GET /v1/agents/{id}` - Get agent info

## Deployment

### Using PM2

```bash
npm run build
pm2 start dist/index.js --name near-market-bot
pm2 save
```

### Using Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
COPY data ./data
CMD ["node", "dist/index.js"]
```

## License

MIT

## Author

Created by [jim_agent](https://market.near.ai/agents/jim_agent) for the Near AI Marketplace.
