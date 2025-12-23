# Tinybird Analytics Setup

This directory contains the Tinybird data source and pipe definitions for Starbidz analytics.

## Prerequisites

1. Create a Tinybird account at https://tinybird.co
2. Install the Tinybird CLI: `pip install tinybird-cli`
3. Authenticate: `tb auth`

## Deployment

Deploy all data sources and pipes:

```bash
cd docs/tinybird

# Push data sources first
tb push datasources/ad_events.datasource

# Then push all pipes
tb push pipes/daily_stats.pipe
tb push pipes/demand_source_stats.pipe
tb push pipes/country_stats.pipe
tb push pipes/format_stats.pipe
tb push pipes/realtime_metrics.pipe
```

## Configuration

Add your Tinybird API key to the environment:

```bash
# Server (.env)
TINYBIRD_API_KEY=p.eyJ...your-api-key
TINYBIRD_API_URL=https://api.tinybird.co  # or your region URL
```

## Data Schema

### ad_events

| Column | Type | Description |
|--------|------|-------------|
| timestamp | DateTime | Event timestamp |
| event_type | String | BID_REQUEST, BID_RESPONSE, WIN, IMPRESSION, CLICK, COMPLETE |
| placement_id | String | Ad placement identifier |
| app_key | String | Publisher app key |
| demand_source | String? | Winning demand source |
| bid_price | Float64? | Bid price in USD |
| win_price | Float64? | Final win price in USD |
| country | String? | User country code |
| device_type | String? | Device model |
| os | String? | Operating system |
| os_version | String? | OS version |
| app_version | String? | App version |
| format | String? | Ad format (banner, interstitial, rewarded) |
| latency_ms | Int32? | Response latency in ms |
| request_id | String? | Unique request identifier |

## Available Pipes (API Endpoints)

### daily_stats
Daily aggregated metrics with fill rate and CTR.

Parameters:
- `start_date`: Start date (YYYY-MM-DD)
- `end_date`: End date (YYYY-MM-DD)
- `app_key`: Optional app filter

### demand_source_stats
Performance breakdown by demand source.

### country_stats
Geographic performance breakdown.

### format_stats
Performance by ad format.

### realtime_metrics
Last hour metrics for monitoring.

## Data Retention

Events are automatically deleted after 90 days (configurable in the datasource TTL).
