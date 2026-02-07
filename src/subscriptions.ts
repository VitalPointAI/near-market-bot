/**
 * Subscription Manager
 * Handles user subscriptions to agents and job keywords
 */

import * as fs from 'fs';
import * as path from 'path';

interface Subscription {
  chatId: number;
  agents: string[];      // Agent IDs to follow
  keywords: string[];    // Keywords to match in job titles/descriptions
  tags: string[];        // Tags to match
  createdAt: Date;
}

interface SubscriptionStore {
  subscriptions: Map<number, Subscription>;
}

const STORE_PATH = path.join(process.cwd(), 'data', 'subscriptions.json');

let store: SubscriptionStore = {
  subscriptions: new Map(),
};

/**
 * Load subscriptions from disk
 */
export function loadSubscriptions(): void {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const data = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
      store.subscriptions = new Map(
        data.subscriptions.map((s: any) => [s.chatId, { ...s, createdAt: new Date(s.createdAt) }])
      );
      console.log(`Loaded ${store.subscriptions.size} subscriptions`);
    }
  } catch (error) {
    console.error('Error loading subscriptions:', error);
  }
}

/**
 * Save subscriptions to disk
 */
export function saveSubscriptions(): void {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const data = {
      subscriptions: Array.from(store.subscriptions.values()),
    };
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving subscriptions:', error);
  }
}

/**
 * Get or create subscription for a chat
 */
export function getSubscription(chatId: number): Subscription {
  if (!store.subscriptions.has(chatId)) {
    store.subscriptions.set(chatId, {
      chatId,
      agents: [],
      keywords: [],
      tags: [],
      createdAt: new Date(),
    });
  }
  return store.subscriptions.get(chatId)!;
}

/**
 * Subscribe to an agent
 */
export function subscribeToAgent(chatId: number, agentId: string): boolean {
  const sub = getSubscription(chatId);
  if (sub.agents.includes(agentId)) {
    return false; // Already subscribed
  }
  sub.agents.push(agentId);
  saveSubscriptions();
  return true;
}

/**
 * Unsubscribe from an agent
 */
export function unsubscribeFromAgent(chatId: number, agentId: string): boolean {
  const sub = getSubscription(chatId);
  const idx = sub.agents.indexOf(agentId);
  if (idx === -1) {
    return false; // Not subscribed
  }
  sub.agents.splice(idx, 1);
  saveSubscriptions();
  return true;
}

/**
 * Subscribe to a keyword
 */
export function subscribeToKeyword(chatId: number, keyword: string): boolean {
  const sub = getSubscription(chatId);
  const kw = keyword.toLowerCase();
  if (sub.keywords.includes(kw)) {
    return false;
  }
  sub.keywords.push(kw);
  saveSubscriptions();
  return true;
}

/**
 * Unsubscribe from a keyword
 */
export function unsubscribeFromKeyword(chatId: number, keyword: string): boolean {
  const sub = getSubscription(chatId);
  const idx = sub.keywords.indexOf(keyword.toLowerCase());
  if (idx === -1) {
    return false;
  }
  sub.keywords.splice(idx, 1);
  saveSubscriptions();
  return true;
}

/**
 * Subscribe to a tag
 */
export function subscribeToTag(chatId: number, tag: string): boolean {
  const sub = getSubscription(chatId);
  const t = tag.toLowerCase().replace(/^#/, '');
  if (sub.tags.includes(t)) {
    return false;
  }
  sub.tags.push(t);
  saveSubscriptions();
  return true;
}

/**
 * Get all chat IDs that should be notified about a job
 */
export function getInterestedChats(job: { 
  title: string; 
  description: string; 
  tags: string[];
  creator_agent_id: string;
}): number[] {
  const interested: number[] = [];
  const titleLower = job.title.toLowerCase();
  const descLower = job.description.toLowerCase();
  const jobTags = job.tags.map(t => t.toLowerCase());

  for (const [chatId, sub] of store.subscriptions) {
    // Check if subscribed to creator agent
    if (sub.agents.includes(job.creator_agent_id)) {
      interested.push(chatId);
      continue;
    }

    // Check keywords
    for (const keyword of sub.keywords) {
      if (titleLower.includes(keyword) || descLower.includes(keyword)) {
        interested.push(chatId);
        break;
      }
    }

    // Check tags
    for (const tag of sub.tags) {
      if (jobTags.includes(tag)) {
        if (!interested.includes(chatId)) {
          interested.push(chatId);
        }
        break;
      }
    }
  }

  return interested;
}

/**
 * Get all chat IDs that should be notified about an agent's activity
 */
export function getAgentFollowers(agentId: string): number[] {
  const followers: number[] = [];
  
  for (const [chatId, sub] of store.subscriptions) {
    if (sub.agents.includes(agentId)) {
      followers.push(chatId);
    }
  }
  
  return followers;
}

/**
 * Format subscription info for display
 */
export function formatSubscription(chatId: number): string {
  const sub = getSubscription(chatId);
  
  const parts: string[] = ['📬 *Your Subscriptions*\n'];
  
  if (sub.agents.length > 0) {
    parts.push(`👤 Agents: ${sub.agents.length}`);
    for (const a of sub.agents.slice(0, 5)) {
      parts.push(`  • \`${a.substring(0, 12)}...\``);
    }
  } else {
    parts.push('👤 No agents followed');
  }
  
  if (sub.keywords.length > 0) {
    parts.push(`\n🔍 Keywords: ${sub.keywords.join(', ')}`);
  }
  
  if (sub.tags.length > 0) {
    parts.push(`\n🏷️ Tags: ${sub.tags.map(t => `#${t}`).join(' ')}`);
  }
  
  if (sub.agents.length === 0 && sub.keywords.length === 0 && sub.tags.length === 0) {
    parts.push('\n_No active subscriptions. Use /follow, /keyword, or /tag to subscribe._');
  }
  
  return parts.join('\n');
}
