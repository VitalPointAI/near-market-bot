/**
 * Near AI Market Bot
 * 
 * Telegram bot that broadcasts updates from the Near AI Marketplace.
 * - Posts summaries of new jobs, bids, and accepted bids every 5 minutes
 * - Allows users to subscribe to specific agents or keywords via DM
 * 
 * Created by jim_agent for the Near AI Marketplace
 */

import 'dotenv/config';
import { Bot, Context, session } from 'grammy';
import * as cron from 'node-cron';
import { initializeState, checkForChanges, getStateSummary, StateChange } from './tracker';
import { 
  formatChangeSummary, 
  formatNewJob, 
  formatNewBid, 
  formatBidAccepted,
  formatStatus 
} from './format';
import {
  loadSubscriptions,
  subscribeToAgent,
  unsubscribeFromAgent,
  subscribeToKeyword,
  unsubscribeFromKeyword,
  subscribeToTag,
  formatSubscription,
  getInterestedChats,
  getAgentFollowers,
} from './subscriptions';

// Environment variables
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID || '@nearaimarket';
const UPDATE_INTERVAL = process.env.UPDATE_INTERVAL || '*/5 * * * *'; // Every 5 minutes

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

// Initialize bot
const bot = new Bot(BOT_TOKEN);

// Track if we've done initial load
let initialized = false;

/**
 * Post update to channel
 */
async function postToChannel(message: string): Promise<void> {
  if (!message.trim()) return;
  
  try {
    await bot.api.sendMessage(CHANNEL_ID, message, {
      parse_mode: 'MarkdownV2',
      link_preview_options: { is_disabled: true },
    });
    console.log('Posted to channel');
  } catch (error) {
    console.error('Error posting to channel:', error);
  }
}

/**
 * Send personalized notifications to subscribers
 */
async function notifySubscribers(changes: StateChange[]): Promise<void> {
  for (const change of changes) {
    try {
      if (change.type === 'new_job') {
        const job = change.data;
        const interested = getInterestedChats(job);
        
        for (const chatId of interested) {
          try {
            await bot.api.sendMessage(chatId, formatNewJob(job), {
              parse_mode: 'MarkdownV2',
              link_preview_options: { is_disabled: true },
            });
          } catch (e) {
            console.error(`Failed to notify ${chatId}:`, e);
          }
        }
      } else if (change.type === 'new_bid' || change.type === 'bid_accepted') {
        const { bid } = change.data;
        const followers = getAgentFollowers(bid.bidder_agent_id);
        
        for (const chatId of followers) {
          try {
            const message = change.type === 'new_bid' 
              ? formatNewBid(change.data.job, bid)
              : formatBidAccepted(change.data.job, bid);
            await bot.api.sendMessage(chatId, message, {
              parse_mode: 'MarkdownV2',
              link_preview_options: { is_disabled: true },
            });
          } catch (e) {
            console.error(`Failed to notify ${chatId}:`, e);
          }
        }
      }
    } catch (error) {
      console.error('Error notifying subscribers:', error);
    }
  }
}

/**
 * Check for updates and post
 */
async function checkAndPost(): Promise<void> {
  console.log('Checking for marketplace updates...');
  
  const changes = await checkForChanges();
  
  if (changes.length > 0) {
    console.log(`Found ${changes.length} changes`);
    
    // Post summary to channel
    const summary = formatChangeSummary(changes);
    await postToChannel(summary);
    
    // Notify individual subscribers
    await notifySubscribers(changes);
  } else {
    console.log('No changes detected');
  }
}

// Bot commands
bot.command('start', async (ctx) => {
  const isPrivate = ctx.chat?.type === 'private';
  
  if (isPrivate) {
    await ctx.reply(
      `👋 Welcome to the Near AI Market Bot!

I post updates about jobs, bids, and accepted bids from market.near.ai

*Commands:*
/status - Bot status
/follow <agent_id> - Follow an agent
/unfollow <agent_id> - Unfollow an agent
/keyword <word> - Get notified about jobs matching a keyword
/tag <tag> - Get notified about jobs with a tag
/mysubs - View your subscriptions

Join @nearaimarket for public updates!`,
      { parse_mode: 'Markdown' }
    );
  } else {
    await ctx.reply('Near AI Market Bot is active! I post marketplace updates here.');
  }
});

bot.command('status', async (ctx) => {
  const stats = getStateSummary();
  await ctx.reply(formatStatus(stats), { parse_mode: 'MarkdownV2' });
});

bot.command('follow', async (ctx) => {
  if (ctx.chat?.type !== 'private') {
    await ctx.reply('This command only works in DMs.');
    return;
  }
  
  const agentId = ctx.message?.text?.split(' ')[1];
  if (!agentId) {
    await ctx.reply('Usage: /follow <agent_id>');
    return;
  }
  
  const success = subscribeToAgent(ctx.chat.id, agentId);
  if (success) {
    await ctx.reply(`✅ Now following agent \`${agentId.substring(0, 12)}...\`\nYou'll be notified when they bid on jobs.`, { parse_mode: 'Markdown' });
  } else {
    await ctx.reply('You\'re already following this agent.');
  }
});

bot.command('unfollow', async (ctx) => {
  if (ctx.chat?.type !== 'private') {
    await ctx.reply('This command only works in DMs.');
    return;
  }
  
  const agentId = ctx.message?.text?.split(' ')[1];
  if (!agentId) {
    await ctx.reply('Usage: /unfollow <agent_id>');
    return;
  }
  
  const success = unsubscribeFromAgent(ctx.chat.id, agentId);
  if (success) {
    await ctx.reply(`✅ Unfollowed agent.`);
  } else {
    await ctx.reply('You weren\'t following this agent.');
  }
});

bot.command('keyword', async (ctx) => {
  if (ctx.chat?.type !== 'private') {
    await ctx.reply('This command only works in DMs.');
    return;
  }
  
  const keyword = ctx.message?.text?.split(' ').slice(1).join(' ');
  if (!keyword) {
    await ctx.reply('Usage: /keyword <word or phrase>');
    return;
  }
  
  const success = subscribeToKeyword(ctx.chat.id, keyword);
  if (success) {
    await ctx.reply(`✅ Now watching for jobs matching "${keyword}"`);
  } else {
    await ctx.reply('You\'re already watching for this keyword.');
  }
});

bot.command('tag', async (ctx) => {
  if (ctx.chat?.type !== 'private') {
    await ctx.reply('This command only works in DMs.');
    return;
  }
  
  const tag = ctx.message?.text?.split(' ')[1];
  if (!tag) {
    await ctx.reply('Usage: /tag <tag_name>');
    return;
  }
  
  const success = subscribeToTag(ctx.chat.id, tag);
  if (success) {
    await ctx.reply(`✅ Now watching for jobs tagged #${tag.replace(/^#/, '')}`);
  } else {
    await ctx.reply('You\'re already watching for this tag.');
  }
});

bot.command('mysubs', async (ctx) => {
  if (ctx.chat?.type !== 'private') {
    await ctx.reply('This command only works in DMs.');
    return;
  }
  
  const info = formatSubscription(ctx.chat.id);
  await ctx.reply(info, { parse_mode: 'Markdown' });
});

// Error handling
bot.catch((err) => {
  console.error('Bot error:', err);
});

// Main startup
async function main() {
  console.log('🤖 Starting Near AI Market Bot...');
  
  // Load subscriptions
  loadSubscriptions();
  
  // Initialize state (load current jobs/bids without notifying)
  await initializeState();
  initialized = true;
  
  // Schedule updates
  console.log(`Scheduling updates: ${UPDATE_INTERVAL}`);
  cron.schedule(UPDATE_INTERVAL, async () => {
    if (initialized) {
      await checkAndPost();
    }
  });
  
  // Start bot
  console.log('Starting bot...');
  await bot.start({
    onStart: (botInfo) => {
      console.log(`✅ Bot started: @${botInfo.username}`);
    },
  });
}

main().catch(console.error);
