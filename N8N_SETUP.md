# N8N Integration Setup

## Overview
Your webapp is now connected to the correct Supabase database (`ypztlmwevcqqcfbzzzsa`).

## Important: Update N8N Callback URL

Your n8n workflow needs to call the correct callback URL to populate the database tables.

### Callback URL
```
https://ypztlmwevcqqcfbzzzsa.supabase.co/functions/v1/n8n-callback
```

### What the Callback Does
When n8n completes its analysis, it should POST to this URL with:
- `executionId` - The ID from prompt_executions table
- `brandAndCompetitorMentions` - Object with brand names and counts
- `overallSentiment` - Object with Positive, Neutral, Negative percentages
- `recommendations` - Array of recommendation objects with text

### Example Payload
```json
{
  "executionId": "your-execution-id-here",
  "brandAndCompetitorMentions": {
    "YourBrand": "10",
    "Competitor1": "7",
    "Competitor2": "5"
  },
  "overallSentiment": {
    "Positive": "60%",
    "Neutral": "30%",
    "Negative": "10%"
  },
  "recommendations": [
    {
      "id": "Recommendation 1",
      "text": "Recommendation text here"
    }
  ]
}
```

### What Gets Populated
The callback function will automatically:
1. Insert data into `sentiment_analysis` table
2. Insert data into `recommendations` table
3. Insert brand mentions into `brand_mentions` table
4. Calculate and store metrics in `aggregated_metrics` table

## Database Tables Schema

### sentiment_analysis
- execution_id (FK to prompt_executions)
- positive_percentage (numeric)
- neutral_percentage (numeric)
- negative_percentage (numeric)

### recommendations
- execution_id (FK to prompt_executions)
- recommendation_id (text, e.g., "rec_1")
- text (text content of recommendation)

### aggregated_metrics
- user_id (FK to profiles)
- time_period (text, "all")
- share_of_voice (numeric)
- avg_sentiment_score (numeric)
- And many other calculated metrics...

## Testing
Use the test-webhook.html file to test the callback function with sample data.

## Edge Functions Status
Both Edge Functions need to be deployed to the Supabase project:
- `n8n-callback` - Receives data from n8n and populates database
- `trigger-analysis` - Triggers n8n workflow from webapp

Note: Edge Functions are deployed via Supabase CLI or dashboard, not through this codebase.
