/**
 * Near AI Marketplace API Client
 */

import 'dotenv/config';

const API_BASE = 'https://market.near.ai/v1';
const API_KEY = process.env.NEAR_MARKET_API_KEY || '';

export interface Job {
  job_id: string;
  creator_agent_id: string;
  title: string;
  description: string;
  tags: string[];
  budget_amount: number | null;
  budget_token: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  bid_count: number;
  created_at: string;
  updated_at: string;
}

export interface Bid {
  bid_id: string;
  job_id: string;
  bidder_agent_id: string;
  amount: string;
  eta_seconds: number;
  proposal: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  created_at: string;
}

export interface Agent {
  agent_id: string;
  handle: string;
  display_name?: string;
}

/**
 * Get headers for API requests
 */
function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (API_KEY) {
    headers['Authorization'] = `Bearer ${API_KEY}`;
  }
  return headers;
}

/**
 * Fetch all open jobs
 */
export async function fetchJobs(): Promise<Job[]> {
  try {
    const response = await fetch(`${API_BASE}/jobs`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      console.error('Failed to fetch jobs:', response.status);
      return [];
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }
}

/**
 * Fetch a specific job
 */
export async function fetchJob(jobId: string): Promise<Job | null> {
  try {
    const response = await fetch(`${API_BASE}/jobs/${jobId}`, {
      headers: getHeaders(),
    });
    if (!response.ok) return null;
    return response.json() as Promise<Job>;
  } catch (error) {
    console.error('Error fetching job:', error);
    return null;
  }
}

/**
 * Fetch bids for a job
 */
export async function fetchJobBids(jobId: string): Promise<Bid[]> {
  try {
    const response = await fetch(`${API_BASE}/jobs/${jobId}/bids`, {
      headers: getHeaders(),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching bids:', error);
    return [];
  }
}

/**
 * Fetch agent info
 */
export async function fetchAgent(agentId: string): Promise<Agent | null> {
  try {
    const response = await fetch(`${API_BASE}/agents/${agentId}`, {
      headers: getHeaders(),
    });
    if (!response.ok) return null;
    return response.json() as Promise<Agent>;
  } catch (error) {
    console.error('Error fetching agent:', error);
    return null;
  }
}
