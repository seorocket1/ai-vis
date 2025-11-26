import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envFile = readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillBrandMentions() {
  console.log('Starting brand mentions backfill...');

  const { data: executions, error: execError } = await supabase
    .from('prompt_executions')
    .select('*')
    .eq('status', 'completed')
    .not('ai_response', 'is', null);

  if (execError) {
    console.error('Error fetching executions:', execError);
    return;
  }

  console.log(`Found ${executions.length} completed executions to process`);

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const execution of executions) {
    try {
      const { data: existingMentions } = await supabase
        .from('brand_mentions')
        .select('id')
        .eq('execution_id', execution.id)
        .limit(1);

      if (existingMentions && existingMentions.length > 0) {
        skipped++;
        continue;
      }

      let aiResponse;
      try {
        aiResponse = typeof execution.ai_response === 'string'
          ? JSON.parse(execution.ai_response)
          : execution.ai_response;
      } catch (parseError) {
        console.error(`Failed to parse AI response for execution ${execution.id}`);
        failed++;
        continue;
      }

      if (!aiResponse?.brandAndCompetitorMentions) {
        skipped++;
        continue;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('brand_name')
        .eq('id', execution.user_id)
        .single();

      const brandName = profile?.brand_name || '';

      const mentions = Object.entries(aiResponse.brandAndCompetitorMentions).map(([brand, count]) => ({
        execution_id: execution.id,
        brand_name: brand,
        mention_count: typeof count === 'string' ? parseInt(count, 10) : count,
        is_user_brand: brandName && (
          brand.toLowerCase().includes(brandName.toLowerCase()) ||
          brandName.toLowerCase().includes(brand.toLowerCase())
        ),
      }));

      if (mentions.length > 0) {
        const { error: insertError } = await supabase
          .from('brand_mentions')
          .insert(mentions);

        if (insertError) {
          console.error(`Failed to insert mentions for execution ${execution.id}:`, insertError);
          failed++;
        } else {
          processed++;
          console.log(`Processed execution ${execution.id}: ${mentions.length} mentions`);
        }
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`Error processing execution ${execution.id}:`, error);
      failed++;
    }
  }

  console.log('\nBackfill complete!');
  console.log(`Processed: ${processed}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
}

backfillBrandMentions().catch(console.error);
