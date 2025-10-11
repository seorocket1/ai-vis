// Test script to verify n8n callback is working
// Run with: node test-n8n-callback.mjs <executionId>

const SUPABASE_URL = 'https://0ec90b57d6e95fcbda19832f.supabase.co';
const CALLBACK_URL = `${SUPABASE_URL}/functions/v1/n8n-callback`;

const executionId = process.argv[2];

if (!executionId) {
  console.error('Usage: node test-n8n-callback.mjs <executionId>');
  console.error('\nTo get an executionId:');
  console.error('1. Go to Prompts page');
  console.error('2. Trigger a prompt (single or bulk)');
  console.error('3. Check the database or console logs for the execution ID');
  process.exit(1);
}

const testPayload = {
  executionId: executionId,
  brandAndCompetitorMentions: {
    "Taxbuddy": 5,
    "ClearTax": 3,
    "Zoho Books": 2
  },
  overallSentiment: {
    Positive: "60%",
    Neutral: "30%",
    Negative: "10%"
  },
  recommendations: [
    "Test recommendation 1",
    "Test recommendation 2",
    "Test recommendation 3"
  ]
};

console.log('Testing n8n callback endpoint...');
console.log('URL:', CALLBACK_URL);
console.log('Execution ID:', executionId);
console.log('\nSending payload:');
console.log(JSON.stringify(testPayload, null, 2));
console.log('\n');

fetch(CALLBACK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testPayload)
})
  .then(async (response) => {
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const text = await response.text();
    console.log('\nResponse body:');
    try {
      console.log(JSON.stringify(JSON.parse(text), null, 2));
    } catch {
      console.log(text);
    }

    if (response.ok) {
      console.log('\n✅ SUCCESS! Callback was accepted.');
      console.log('Check your database to verify the execution status was updated.');
    } else {
      console.log('\n❌ FAILED! Callback was rejected.');
    }
  })
  .catch((error) => {
    console.error('\n❌ ERROR calling callback:', error);
  });
