/**
 * Test script for Near AI Market Bot
 * Tests API connectivity, change detection, and message formatting
 */

import { fetchJobs, fetchJobBids, Job } from './api';
import { initializeState, checkForChanges, getStateSummary } from './tracker';
import { formatNewJob, formatChangeSummary, formatStatus } from './format';

async function testAPI() {
  console.log('=== Testing Near AI Marketplace API ===\n');
  
  // Fetch jobs
  console.log('Fetching jobs...');
  const jobs = await fetchJobs();
  console.log(`Found ${jobs.length} jobs\n`);
  
  if (jobs.length > 0) {
    const job = jobs[0];
    console.log('Sample job:');
    console.log(`  Title: ${job.title}`);
    console.log(`  Status: ${job.status}`);
    console.log(`  Bids: ${job.bid_count}`);
    console.log(`  Budget: ${job.budget_amount || 'Open'} ${job.budget_token}`);
    console.log();
    
    // Test bid fetching
    if (job.bid_count > 0) {
      console.log('Fetching bids for this job...');
      const bids = await fetchJobBids(job.job_id);
      console.log(`Found ${bids.length} bids`);
      if (bids.length > 0) {
        console.log(`  First bid: ${bids[0].amount} NEAR by ${bids[0].bidder_agent_id.substring(0, 8)}...`);
      }
      console.log();
    }
  }
  
  return jobs;
}

async function testTracker() {
  console.log('=== Testing State Tracker ===\n');
  
  // Initialize state
  console.log('Initializing state...');
  await initializeState();
  
  const stats = getStateSummary();
  console.log(`Tracking ${stats.jobs} jobs and ${stats.bids} bids`);
  console.log();
  
  // Check for changes (should be empty on first run)
  console.log('Checking for changes...');
  const changes = await checkForChanges();
  console.log(`Found ${changes.length} changes`);
  console.log();
}

function testFormatting(jobs: Job[]) {
  console.log('=== Testing Message Formatting ===\n');
  
  if (jobs.length > 0) {
    console.log('New Job Format:');
    console.log('---');
    console.log(formatNewJob(jobs[0]));
    console.log('---\n');
  }
  
  // Test status format
  console.log('Status Format:');
  console.log('---');
  console.log(formatStatus({ jobs: 50, bids: 120, lastUpdate: new Date() }));
  console.log('---\n');
  
  // Test change summary
  console.log('Change Summary Format:');
  console.log('---');
  const mockChanges = [
    { type: 'new_job' as const, timestamp: new Date(), data: jobs[0] },
    { type: 'new_job' as const, timestamp: new Date(), data: jobs[1] || jobs[0] },
  ];
  console.log(formatChangeSummary(mockChanges));
  console.log('---\n');
}

async function main() {
  console.log('🧪 Near AI Market Bot - Test Suite\n');
  
  try {
    const jobs = await testAPI();
    await testTracker();
    testFormatting(jobs);
    
    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();
