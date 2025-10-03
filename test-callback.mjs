#!/usr/bin/env node

// Test script to verify n8n-callback Edge Function
import fs from 'fs';

const SUPABASE_URL = 'https://ypztlmwevcqqcfbzzzsa.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwenRsbXdldmNxcWNmYnp6enNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc4ODExMjMsImV4cCI6MjA0MzQ1NzEyM30.TYO61IQn1rfn6S-RElLxOLtUFBn_FhptJcdYF8AQZnU';

async function testCallback() {
  console.log('=== Testing n8n-callback Edge Function ===\n');

  // Read test payload
  const payload = JSON.parse(fs.readFileSync('test-n8n-payload.json', 'utf8'));
  console.log('Test payload:', JSON.stringify(payload, null, 2));

  const callbackUrl = `${SUPABASE_URL}/functions/v1/n8n-callback`;
  console.log('\nCalling:', callbackUrl);

  try {
    const response = await fetch(callbackUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('\nResponse status:', response.status);
    const responseData = await response.json();
    console.log('Response data:', JSON.stringify(responseData, null, 2));

    if (response.ok) {
      console.log('\n✅ Callback function executed successfully!');

      // Check if data was inserted
      console.log('\n=== Checking database tables ===');

      const tables = ['sentiment_analysis', 'recommendations', 'brand_mentions', 'aggregated_metrics'];

      for (const table of tables) {
        const checkUrl = `${SUPABASE_URL}/rest/v1/${table}?select=*&execution_id=eq.${payload.executionId}&limit=5`;
        const checkResponse = await fetch(checkUrl, {
          headers: {
            'apikey': ANON_KEY,
            'Authorization': `Bearer ${ANON_KEY}`,
          },
        });

        if (checkResponse.ok) {
          const data = await checkResponse.json();
          console.log(`\n${table}: ${data.length} rows found`);
          if (data.length > 0) {
            console.log('Sample:', JSON.stringify(data[0], null, 2));
          }
        } else {
          console.log(`\n${table}: Error checking (${checkResponse.status})`);
        }
      }
    } else {
      console.log('\n❌ Callback function failed');
    }
  } catch (error) {
    console.error('\n❌ Error calling callback function:', error.message);
  }
}

testCallback();
