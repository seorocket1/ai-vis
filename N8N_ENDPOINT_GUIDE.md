# N8N HTTP Request Configuration

## ⚠️ CRITICAL: You MUST add an HTTP Request node to call the callback!

**"Respond to Webhook" is NOT the same as calling the callback URL!**

## Correct Callback URL
```
https://ypztlmwevcqqcfbzzzsa.supabase.co/functions/v1/n8n-callback
```

## HTTP Request Node Configuration

### Method
`POST`

### URL
```
https://ypztlmwevcqqcfbzzzsa.supabase.co/functions/v1/n8n-callback
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

### JSON Body (Use the NEW format matching your output!)
```json
{
  "executionId": "{{ $('Webhook').item.json.executionId }}",
  "AI_Analysis": "{{ $json.AI_Analysis }}",
  "AI_Response": "{{ $json.AI_Response }}",
  "Sources": "{{ $json.Sources }}"
}
```

**Note**: Adjust the node reference (`$('Webhook')`) to match where your executionId comes from in your workflow.

## Important Notes

1. **ADD an HTTP Request node** - "Respond to Webhook" does NOT call the callback URL!
2. **The HTTP Request must call the n8n-callback edge function**
3. The `executionId` comes from the webhook input and must be passed through your workflow
4. You can keep "Respond to Webhook" for debugging, but it doesn't update the database

## Your Current Workflow Structure (WRONG)

```
❌ Webhook → AI Processing → Respond to Webhook → (Database never gets updated!)
```

## Correct Workflow Structure

```
✅ Webhook → AI Processing → HTTP Request (to n8n-callback) → Database Updated!
   (Optional: Also add "Respond to Webhook" after HTTP Request for debugging)
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
