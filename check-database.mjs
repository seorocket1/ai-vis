#!/usr/bin/env node

const SUPABASE_URL = 'https://ypztlmwevcqqcfbzzzsa.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwenRsbXdldmNxcWNmYnp6enNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyOTUxNDcsImV4cCI6MjA3NDg3MTE0N30.gEoE22qbE4QevfZ8Td4wTeDRxMjfnZwzrTHin3lTMUk';

async function checkDatabase() {
  console.log('=== Checking Supabase Database State ===\n');

  const tables = {
    'prompt_executions': 'id,status,user_id',
    'brand_mentions': 'id,execution_id,brand_name',
    'sentiment_analysis': 'id,execution_id',
    'recommendations': 'id,execution_id',
    'aggregated_metrics': 'id,user_id',
  };

  for (const [tableName, columns] of Object.entries(tables)) {
    console.log(`\n--- ${tableName} ---`);
    try {
      const url = `${SUPABASE_URL}/rest/v1/${tableName}?select=${columns}&limit=3`;
      const response = await fetch(url, {
        headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Rows: ${data.length}`);
        if (data.length > 0) console.log(JSON.stringify(data[0], null, 2));
        else console.log('⚠️  EMPTY');
      } else {
        console.log(`❌ ${response.status}:`, await response.text());
      }
    } catch (error) {
      console.log(`❌ Error:`, error.message);
    }
  }
}

checkDatabase();
