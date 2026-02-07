/**
 * Message Formatting for Telegram
 */

import { Job, Bid } from './api';
import { StateChange } from './tracker';

/**
 * Escape markdown special characters
 */
function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

/**
 * Format a job for display
 */
export function formatJob(job: Job): string {
  const budget = job.budget_amount 
    ? `${job.budget_amount} ${job.budget_token}` 
    : 'No budget set';
  const tags = job.tags.length > 0 
    ? job.tags.map(t => `#${t}`).join(' ') 
    : '';
  
  return `📋 *${escapeMarkdown(job.title)}*

💰 Budget: ${budget}
🏷️ ${tags || 'No tags'}
📊 Bids: ${job.bid_count}

${escapeMarkdown(job.description.substring(0, 200))}${job.description.length > 200 ? '...' : ''}`;
}

/**
 * Format a new job notification
 */
export function formatNewJob(job: Job): string {
  const budget = job.budget_amount 
    ? `${job.budget_amount} ${job.budget_token}` 
    : 'Open budget';
  const tags = job.tags.length > 0 
    ? job.tags.slice(0, 5).map(t => `#${t}`).join(' ') 
    : '';
  
  return `🆕 *NEW JOB POSTED*

📋 *${escapeMarkdown(job.title)}*
💰 ${budget}
${tags ? `🏷️ ${tags}` : ''}

${escapeMarkdown(job.description.substring(0, 300))}${job.description.length > 300 ? '...' : ''}

🔗 [View on Marketplace](https://market.near.ai/jobs/${job.job_id})`;
}

/**
 * Format a new bid notification
 */
export function formatNewBid(job: Job, bid: Bid): string {
  const eta = Math.round(bid.eta_seconds / 3600);
  
  return `💼 *NEW BID*

📋 Job: ${escapeMarkdown(job.title)}
💰 Amount: ${bid.amount} NEAR
⏱️ ETA: ${eta}h
👤 Bidder: \`${bid.bidder_agent_id.substring(0, 8)}...\`

📝 _${escapeMarkdown(bid.proposal.substring(0, 150))}${bid.proposal.length > 150 ? '...' : ''}_`;
}

/**
 * Format an accepted bid notification
 */
export function formatBidAccepted(job: Job, bid: Bid): string {
  return `🎉 *BID ACCEPTED*

📋 Job: ${escapeMarkdown(job.title)}
💰 Amount: ${bid.amount} NEAR
👤 Winner: \`${bid.bidder_agent_id.substring(0, 8)}...\`

Congratulations to the winning agent\\!`;
}

/**
 * Format a job completed notification
 */
export function formatJobCompleted(job: Job): string {
  return `✅ *JOB COMPLETED*

📋 ${escapeMarkdown(job.title)}

This job has been marked as completed\\.`;
}

/**
 * Format a batch of changes into a summary
 */
export function formatChangeSummary(changes: StateChange[]): string {
  if (changes.length === 0) {
    return '';
  }

  const newJobs = changes.filter(c => c.type === 'new_job');
  const newBids = changes.filter(c => c.type === 'new_bid');
  const accepted = changes.filter(c => c.type === 'bid_accepted');
  const completed = changes.filter(c => c.type === 'job_completed');

  const parts: string[] = ['📊 *MARKETPLACE UPDATE*\n'];

  if (newJobs.length > 0) {
    parts.push(`🆕 ${newJobs.length} new job${newJobs.length > 1 ? 's' : ''}`);
    for (const change of newJobs.slice(0, 3)) {
      const job = change.data as Job;
      const budget = job.budget_amount ? `${job.budget_amount}Ⓝ` : 'Open';
      parts.push(`  • ${escapeMarkdown(job.title.substring(0, 40))} \\(${budget}\\)`);
    }
    if (newJobs.length > 3) {
      parts.push(`  _\\+${newJobs.length - 3} more_`);
    }
  }

  if (newBids.length > 0) {
    parts.push(`\n💼 ${newBids.length} new bid${newBids.length > 1 ? 's' : ''}`);
  }

  if (accepted.length > 0) {
    parts.push(`\n🎉 ${accepted.length} bid${accepted.length > 1 ? 's' : ''} accepted`);
    for (const change of accepted) {
      const { job, bid } = change.data;
      parts.push(`  • ${escapeMarkdown(job.title.substring(0, 30))} → ${bid.amount}Ⓝ`);
    }
  }

  if (completed.length > 0) {
    parts.push(`\n✅ ${completed.length} job${completed.length > 1 ? 's' : ''} completed`);
  }

  return parts.join('\n');
}

/**
 * Format status message
 */
export function formatStatus(stats: { jobs: number; bids: number; lastUpdate: Date }): string {
  return `🤖 *Near AI Market Bot Status*

📋 Tracking: ${stats.jobs} jobs
💼 Monitoring: ${stats.bids} bids
🕐 Last update: ${stats.lastUpdate.toISOString()}

Bot is running and checking for updates every 5 minutes\\.`;
}
