/**
 * State Tracker for Near AI Marketplace
 * Detects new jobs, new bids, and status changes
 */

import { fetchJobs, fetchJobBids, Job, Bid } from './api';

export interface StateChange {
  type: 'new_job' | 'new_bid' | 'bid_accepted' | 'job_completed';
  timestamp: Date;
  data: any;
}

interface TrackerState {
  jobs: Map<string, Job>;
  bids: Map<string, Bid>;
  lastUpdate: Date;
}

let state: TrackerState = {
  jobs: new Map(),
  bids: new Map(),
  lastUpdate: new Date(),
};

/**
 * Check for changes and return list of updates
 */
export async function checkForChanges(): Promise<StateChange[]> {
  const changes: StateChange[] = [];
  const now = new Date();

  try {
    // Fetch current jobs
    const currentJobs = await fetchJobs();
    
    for (const job of currentJobs) {
      const prevJob = state.jobs.get(job.job_id);
      
      // New job
      if (!prevJob) {
        changes.push({
          type: 'new_job',
          timestamp: now,
          data: job,
        });
      } else {
        // Check for status changes
        if (prevJob.status !== job.status) {
          if (job.status === 'completed') {
            changes.push({
              type: 'job_completed',
              timestamp: now,
              data: job,
            });
          }
        }
        
        // Check for new bids
        if (job.bid_count > prevJob.bid_count) {
          // Fetch actual bids to get details
          const bids = await fetchJobBids(job.job_id);
          for (const bid of bids) {
            if (!state.bids.has(bid.bid_id)) {
              changes.push({
                type: 'new_bid',
                timestamp: now,
                data: { job, bid },
              });
              state.bids.set(bid.bid_id, bid);
            } else {
              // Check for bid status changes
              const prevBid = state.bids.get(bid.bid_id);
              if (prevBid && prevBid.status !== bid.status && bid.status === 'accepted') {
                changes.push({
                  type: 'bid_accepted',
                  timestamp: now,
                  data: { job, bid },
                });
                state.bids.set(bid.bid_id, bid);
              }
            }
          }
        }
      }
      
      // Update state
      state.jobs.set(job.job_id, job);
    }
    
    state.lastUpdate = now;
  } catch (error) {
    console.error('Error checking for changes:', error);
  }

  return changes;
}

/**
 * Initialize state with current data (no notifications for existing items)
 */
export async function initializeState(): Promise<void> {
  console.log('Initializing tracker state...');
  
  const jobs = await fetchJobs();
  
  for (const job of jobs) {
    state.jobs.set(job.job_id, job);
    
    // Also fetch existing bids
    const bids = await fetchJobBids(job.job_id);
    for (const bid of bids) {
      state.bids.set(bid.bid_id, bid);
    }
  }
  
  state.lastUpdate = new Date();
  console.log(`Initialized with ${state.jobs.size} jobs and ${state.bids.size} bids`);
}

/**
 * Get current state summary
 */
export function getStateSummary(): { jobs: number; bids: number; lastUpdate: Date } {
  return {
    jobs: state.jobs.size,
    bids: state.bids.size,
    lastUpdate: state.lastUpdate,
  };
}
