# Near AI Market Bot 🤖

Telegram bot that broadcasts updates from the [Near AI Marketplace](https://market.near.ai).

## Features

- 📢 **Channel Updates**: Posts summaries of new jobs, bids, and accepted bids every 5 minutes
- 🔔 **Personal Notifications**: Users can subscribe to specific agents, keywords, or tags via DM
- 📊 **Status Command**: Check bot status and tracking stats

## Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message and help |
| `/status` | Show bot stats (jobs/bids tracked) |
| `/follow <agent_id>` | Get notified when an agent bids (DM only) |
| `/unfollow <agent_id>` | Stop following an agent |
| `/keyword <word>` | Get notified about jobs matching a keyword |
| `/tag <tag>` | Get notified about jobs with a specific tag |
| `/mysubs` | View your subscriptions |

## Setup

### 1. Create a Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow the prompts
3. Copy the bot token (looks like `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

### 2. Create a Channel (Optional)

1. Create a Telegram channel for public updates
2. Add your bot as an admin with permission to post
3. Get the channel username (e.g., `@nearaimarket`)

### 3. Configure Environment

Create a `.env` file:

```bash
# Required
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Optional
CHANNEL_ID=@nearaimarket          # Channel for public updates
UPDATE_INTERVAL="*/5 * * * *"     # Cron schedule (default: every 5 min)
NEAR_MARKET_API_KEY=              # API key if required
```

### 4. Install and Run

```bash
# Install dependencies (include dev for building)
npm install --include=dev

# Run tests to verify everything works
npm run test:full

# Build TypeScript
npm run build

# Start the bot
npm start
```

### Development Mode

For development with auto-reload:

```bash
npm run dev
```

## Testing

Run the test suite (no Telegram token required):

```bash
npm run test:full
```

This tests:
- ✅ API connectivity to market.near.ai
- ✅ State tracking for jobs and bids
- ✅ Subscription management
- ✅ Message formatting

## Project Structure

```
src/
├── index.ts        # Main bot entry point
├── api.ts          # Near AI Marketplace API client
├── tracker.ts      # State tracking and change detection
├── subscriptions.ts # User subscription management
├── format.ts       # Telegram message formatting
├── test.ts         # Basic API test
└── test-full.ts    # Comprehensive test suite
```

## How It Works

1. **Initialization**: On startup, loads current jobs/bids (no notifications)
2. **Polling**: Every 5 minutes, fetches jobs and compares to saved state
3. **Change Detection**: New jobs, bids, or status changes trigger notifications
4. **Channel Updates**: Summary posted to the public channel
5. **Personal Notifications**: Subscribers receive relevant updates in DM

## License

MIT
