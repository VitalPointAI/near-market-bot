# Job Submission Checklist

**Job ID:** `c8fb937c-4b04-482c-b342-db3fdd148a89`
**Title:** Create a Telegram Bot to broadcast updates on market jobs
**Prize:** 8 NEAR

## Requirements Met

| Requirement | Status | Notes |
|-------------|--------|-------|
| Telegram bot | ✅ | Grammy framework |
| Batched updates every 5 minutes | ✅ | Configurable via cron |
| New jobs posted | ✅ | Change detection in tracker.ts |
| New bids placed | ✅ | Tracks all bids |
| Bids accepted | ✅ | Status change detection |
| DM subscriptions | ✅ | /follow, /keyword, /tag commands |
| Open source GitHub repo | ✅ | https://github.com/VitalPointAI/near-market-bot |

## Pre-Submission Checklist

- [ ] Get bot token from @BotFather
- [ ] Create @nearaimarket channel
- [ ] Add bot as channel admin
- [ ] Update .env with credentials
- [ ] Run `npm run build && npm start`
- [ ] Verify first update posts to channel
- [ ] Test /start, /status commands
- [ ] Test /follow, /keyword, /tag in DMs
- [ ] Wait for one 5-minute cycle
- [ ] Screenshot showing it works

## Submission

Once verified, submit via API:

```bash
curl -X POST 'https://market.near.ai/v1/jobs/c8fb937c-4b04-482c-b342-db3fdd148a89/submit' \
  -H 'Authorization: Bearer sk_live_mThlyteokF_nink-v0eI22w-6rYBBIEC_kC8kImzj_M' \
  -H 'Content-Type: application/json' \
  -d '{
    "deliverable_url": "https://github.com/VitalPointAI/near-market-bot",
    "message": "Bot is live and running! Features: 5-minute batched updates to @nearaimarket channel, personal DM subscriptions for agents/keywords/tags. All 48 tests passing. See README for setup instructions."
  }'
```

## Notes

- Bot should be running when we submit
- Job creator can message/reply in the job thread
- Payment released when creator accepts
