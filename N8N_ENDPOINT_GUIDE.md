# N8N HTTP Request Configuration

## Correct Callback URL
```
https://0ec90b57d6e95fcbda19832f.supabase.co/functions/v1/n8n-callback
```

## HTTP Request Node Configuration

### Method
`POST`

### URL
```
https://0ec90b57d6e95fcbda19832f.supabase.co/functions/v1/n8n-callback
```

### Authentication
**None** (or select "No Auth")

### Send Headers
**YES - Enable this toggle**

### Headers Configuration
Click "Add Option" > "Specify Headers"

Add header:
- **Name**: `Content-Type`
- **Value**: `application/json`

### Send Body
**YES - Enable this toggle**

### Body Content Type
Select: **JSON**

### Specify Body
Select: **Using JSON**

### JSON Body
```json
{
  "executionId": "{{ $json.executionId }}",
  "brandAndCompetitorMentions": {{ $json.brandAndCompetitorMentions }},
  "overallSentiment": {{ $json.overallSentiment }},
  "recommendations": {{ $json.recommendations }}
}
```

## Important Notes

1. **Place HTTP Request node INSIDE the loop** so it executes for each prompt
2. **DO NOT use "Respond to Webhook"** after the loop - use HTTP Request instead
3. Each prompt must get its own callback with its unique `executionId`
4. The `executionId` comes from the input `Prompts` array

## Workflow Structure

```
Webhook
  ↓
Code (prepare data)
  ↓
Loop Over Items (Prompts array)
  ↓
  ├── AI Agent (Google Gemini)
  ├── Code (format output)
  └── HTTP Request (send callback) ← Do this for EACH item
```

## Testing the Endpoint

Run this command to test the callback URL works:
```bash
node test-n8n-callback.mjs <execution-id>
```

Replace `<execution-id>` with an actual execution ID from your database.

## Common Mistakes to Avoid

❌ **Wrong**: Only responding once after loop completes
❌ **Wrong**: Using "Respond to Webhook" instead of HTTP Request
❌ **Wrong**: HTTP Request outside the loop
❌ **Wrong**: Missing Content-Type header
❌ **Wrong**: Typo in URL

✅ **Correct**: HTTP Request node inside loop, sends callback for each prompt
✅ **Correct**: Each callback includes the specific executionId
✅ **Correct**: Content-Type header set to application/json
