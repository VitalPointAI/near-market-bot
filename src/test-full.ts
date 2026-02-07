/**
 * Comprehensive Test Suite for Near AI Market Bot
 * Tests all non-Telegram components
 */

import { fetchJobs, fetchJobBids, Job, Bid } from './api';
import { initializeState, checkForChanges, getStateSummary, StateChange } from './tracker';
import { 
  formatNewJob, 
  formatNewBid, 
  formatBidAccepted,
  formatChangeSummary, 
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

// Test counters
let passed = 0;
let failed = 0;

function test(name: string, fn: () => boolean | Promise<boolean>) {
  return Promise.resolve(fn()).then(result => {
    if (result) {
      console.log(`  ✅ ${name}`);
      passed++;
    } else {
      console.log(`  ❌ ${name}`);
      failed++;
    }
  }).catch(err => {
    console.log(`  ❌ ${name}: ${err.message}`);
    failed++;
  });
}

async function testAPI() {
  console.log('\n📡 API Module Tests\n');
  
  const jobs = await fetchJobs();
  await test('fetchJobs returns array', () => Array.isArray(jobs));
  await test('fetchJobs returns jobs', () => jobs.length > 0);
  
  if (jobs.length > 0) {
    const job = jobs[0];
    await test('Job has job_id', () => typeof job.job_id === 'string');
    await test('Job has title', () => typeof job.title === 'string');
    await test('Job has status', () => ['open', 'in_progress', 'completed', 'cancelled'].includes(job.status));
    await test('Job has tags array', () => Array.isArray(job.tags));
    
    // Find a job with bids (try multiple since bid_count might be stale)
    const jobsWithBids = jobs.filter(j => j.bid_count > 0);
    let foundBids = false;
    
    for (const jobWithBids of jobsWithBids.slice(0, 5)) {
      const bids = await fetchJobBids(jobWithBids.job_id);
      await test('fetchJobBids returns array', () => Array.isArray(bids));
      
      if (bids.length > 0) {
        foundBids = true;
        await test('Bid has bid_id', () => typeof bids[0].bid_id === 'string');
        await test('Bid has amount', () => typeof bids[0].amount === 'string');
        await test('Bid has bidder_agent_id', () => typeof bids[0].bidder_agent_id === 'string');
        break;
      }
    }
    
    if (!foundBids) {
      console.log('  ⚠️  No jobs with accessible bids found - skipping bid detail tests');
    }
  }
  
  return jobs;
}

async function testTracker() {
  console.log('\n🔄 Tracker Module Tests\n');
  
  await initializeState();
  const stats = getStateSummary();
  
  await test('getStateSummary returns jobs count', () => typeof stats.jobs === 'number');
  await test('getStateSummary returns bids count', () => typeof stats.bids === 'number');
  await test('getStateSummary returns lastUpdate', () => stats.lastUpdate instanceof Date);
  await test('State has jobs', () => stats.jobs > 0);
  
  // Check for changes (should be none right after init)
  const changes = await checkForChanges();
  await test('checkForChanges returns array', () => Array.isArray(changes));
  await test('No changes right after init', () => changes.length === 0);
}

async function testSubscriptions() {
  console.log('\n📬 Subscription Module Tests\n');
  
  // Use unique test chat IDs with timestamp to avoid collisions
  const ts = Date.now();
  const testChatId1 = 90000000 + (ts % 1000000);
  const testChatId2 = 91000000 + (ts % 1000000);
  const testAgent = `test-agent-${ts}.near`;
  const testKeyword = `testKeyword${ts}`;
  const testTag = `testTag${ts}`;
  
  // Test agent subscriptions
  await test('subscribeToAgent returns true for new sub', () => 
    subscribeToAgent(testChatId1, testAgent) === true
  );
  await test('subscribeToAgent returns false for duplicate', () => 
    subscribeToAgent(testChatId1, testAgent) === false
  );
  await test('getAgentFollowers returns subscribers', () => 
    getAgentFollowers(testAgent).includes(testChatId1)
  );
  
  // Test keyword subscriptions
  await test('subscribeToKeyword returns true for new sub', () => 
    subscribeToKeyword(testChatId1, testKeyword) === true
  );
  await test('subscribeToKeyword returns false for duplicate', () => 
    subscribeToKeyword(testChatId1, testKeyword) === false
  );
  
  // Test tag subscriptions
  await test('subscribeToTag returns true for new sub', () => 
    subscribeToTag(testChatId1, testTag) === true
  );
  await test('subscribeToTag handles # prefix', () => 
    subscribeToTag(testChatId2, '#otherTag' + ts) === true
  );
  
  // Test interested chats - use lowercase since subscriptions normalize to lowercase
  const mockJob = {
    title: `Job with ${testKeyword.toLowerCase()} inside`,
    description: 'Some description',
    tags: [testTag.toLowerCase(), 'other'],
    creator_agent_id: 'another-agent.near',
  };
  
  await test('getInterestedChats finds keyword matches', () => 
    getInterestedChats(mockJob).includes(testChatId1)
  );
  
  const mockJob2 = {
    title: 'Regular job',
    description: `Description with ${testKeyword.toLowerCase()}`,
    tags: [],
    creator_agent_id: 'another-agent.near',
  };
  
  await test('getInterestedChats finds keyword in description', () => 
    getInterestedChats(mockJob2).includes(testChatId1)
  );
  
  const mockJob3 = {
    title: 'Tagged job',
    description: 'Normal description',
    tags: [testTag.toLowerCase()],
    creator_agent_id: 'random.near',
  };
  
  await test('getInterestedChats finds tag matches', () => 
    getInterestedChats(mockJob3).includes(testChatId1)
  );
  
  // Test formatSubscription
  const subInfo = formatSubscription(testChatId1);
  await test('formatSubscription returns string', () => typeof subInfo === 'string');
  await test('formatSubscription includes agents', () => subInfo.includes('Agents'));
  
  // Test unsubscribe
  await test('unsubscribeFromAgent returns true', () => 
    unsubscribeFromAgent(testChatId1, testAgent) === true
  );
  await test('unsubscribeFromAgent returns false for non-sub', () => 
    unsubscribeFromAgent(testChatId1, testAgent) === false
  );
  await test('getAgentFollowers no longer includes unsubbed', () => 
    !getAgentFollowers(testAgent).includes(testChatId1)
  );
  
  await test('unsubscribeFromKeyword returns true', () => 
    unsubscribeFromKeyword(testChatId1, testKeyword.toLowerCase()) === true
  );
}

async function testFormatting(jobs: Job[]) {
  console.log('\n📝 Formatting Module Tests\n');
  
  if (jobs.length === 0) {
    console.log('  ⚠️  No jobs available - using mock data');
  }
  
  // Use real job or mock
  const job: Job = jobs[0] || {
    job_id: 'test-123',
    creator_agent_id: 'creator.near',
    title: 'Test Job Title',
    description: 'Test description for a job',
    tags: ['test', 'mock'],
    budget_amount: 10,
    budget_token: 'NEAR',
    status: 'open',
    bid_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  const mockBid: Bid = {
    bid_id: 'bid-456',
    job_id: job.job_id,
    bidder_agent_id: 'bidder-agent-xyz123.near',
    amount: '5.5',
    eta_seconds: 7200,
    proposal: 'This is my proposal for the job. I can do it well.',
    status: 'pending',
    created_at: new Date().toISOString(),
  };
  
  // Test formatNewJob
  const newJobMsg = formatNewJob(job);
  await test('formatNewJob returns string', () => typeof newJobMsg === 'string');
  await test('formatNewJob includes title', () => newJobMsg.includes('NEW JOB'));
  await test('formatNewJob includes marketplace link', () => newJobMsg.includes('market.near.ai'));
  
  // Test formatNewBid
  const newBidMsg = formatNewBid(job, mockBid);
  await test('formatNewBid returns string', () => typeof newBidMsg === 'string');
  await test('formatNewBid includes amount', () => newBidMsg.includes('5.5'));
  await test('formatNewBid includes NEW BID', () => newBidMsg.includes('NEW BID'));
  
  // Test formatBidAccepted
  const acceptedMsg = formatBidAccepted(job, mockBid);
  await test('formatBidAccepted returns string', () => typeof acceptedMsg === 'string');
  await test('formatBidAccepted includes BID ACCEPTED', () => acceptedMsg.includes('BID ACCEPTED'));
  
  // Test formatStatus
  const statusMsg = formatStatus({ jobs: 42, bids: 100, lastUpdate: new Date() });
  await test('formatStatus returns string', () => typeof statusMsg === 'string');
  await test('formatStatus includes job count', () => statusMsg.includes('42'));
  await test('formatStatus includes bid count', () => statusMsg.includes('100'));
  
  // Test formatChangeSummary
  const changes: StateChange[] = [
    { type: 'new_job', timestamp: new Date(), data: job },
    { type: 'new_bid', timestamp: new Date(), data: { job, bid: mockBid } },
    { type: 'bid_accepted', timestamp: new Date(), data: { job, bid: mockBid } },
  ];
  
  const summaryMsg = formatChangeSummary(changes);
  await test('formatChangeSummary returns string', () => typeof summaryMsg === 'string');
  await test('formatChangeSummary includes new jobs', () => summaryMsg.includes('new job'));
  await test('formatChangeSummary includes bids', () => summaryMsg.includes('bid'));
  
  // Test empty changes
  const emptyMsg = formatChangeSummary([]);
  await test('formatChangeSummary handles empty', () => emptyMsg === '');
}

async function main() {
  console.log('🧪 Near AI Market Bot - Comprehensive Test Suite\n');
  console.log('=' .repeat(50));
  
  try {
    // Load existing subscriptions (if any)
    loadSubscriptions();
    
    const jobs = await testAPI();
    await testTracker();
    await testSubscriptions();
    await testFormatting(jobs);
    
    console.log('\n' + '='.repeat(50));
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
    
    if (failed === 0) {
      console.log('✅ All tests passed! Bot is ready for deployment.\n');
      console.log('📝 To deploy, you need:');
      console.log('   1. TELEGRAM_BOT_TOKEN - Get from @BotFather on Telegram');
      console.log('   2. CHANNEL_ID - Your channel username (e.g., @nearaimarket)');
      console.log('   3. Optional: NEAR_MARKET_API_KEY for authenticated requests');
      console.log('\n   Create a .env file with these values, then run:');
      console.log('   npm run build && npm start');
    } else {
      console.log('❌ Some tests failed. Review the issues above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test suite error:', error);
    process.exit(1);
  }
}

main();
