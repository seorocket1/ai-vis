import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function processSingleResult(supabase: any, payload: any) {
  const { executionId, brandAndCompetitorMentions, sentiment, recommendations, AI_original_response, overallSentiment } = payload;

  console.log('[processSingleResult] Processing execution:', executionId);

  const { data: execution, error: execLookupError } = await supabase
    .from('prompt_executions')
    .select('user_id, status')
    .eq('id', executionId)
    .maybeSingle();

  if (execLookupError) {
    console.error('[processSingleResult] Error looking up execution:', execLookupError);
    throw execLookupError;
  }

  if (!execution) {
    console.error('[processSingleResult] ERROR: Execution not found:', executionId);
    throw new Error(`Execution not found: ${executionId}`);
  }

  console.log('[processSingleResult] Found execution, user_id:', execution.user_id, 'status:', execution.status);

  const userId = execution.user_id;

  console.log('[processSingleResult] Updating execution status to completed');
  const { error: execError } = await supabase
    .from('prompt_executions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      ai_response: JSON.stringify(payload),
    })
    .eq('id', executionId);

  if (execError) {
    console.error('[processSingleResult] Error updating execution:', execError);
    throw execError;
  }
  console.log('[processSingleResult] Execution status updated successfully');

  if (brandAndCompetitorMentions) {
    console.log('[processSingleResult] Processing brand mentions...');
    const { data: profileData } = await supabase
      .from('profiles')
      .select('brand_name')
      .eq('id', userId)
      .maybeSingle();

    const userBrand = profileData?.brand_name || '';
    console.log('[processSingleResult] User brand:', userBrand);

    const mentions = Object.entries(brandAndCompetitorMentions).map(([brand, count]) => {
      const isUserBrand =
        brand.toLowerCase().includes(userBrand.toLowerCase()) ||
        userBrand.toLowerCase().includes(brand.toLowerCase());

      const mentionCount = typeof count === 'string' ? parseInt(count, 10) : (count as number);

      return {
        execution_id: executionId,
        brand_name: brand,
        mention_count: mentionCount || 0,
        is_user_brand: isUserBrand,
      };
    });

    console.log('[processSingleResult] Inserting', mentions.length, 'brand mentions');
    const { error: mentionsError } = await supabase
      .from('brand_mentions')
      .insert(mentions);

    if (mentionsError) {
      console.error('[processSingleResult] Error inserting brand mentions:', mentionsError);
    } else {
      console.log('[processSingleResult] Brand mentions inserted successfully');
    }
  } else {
    console.log('[processSingleResult] WARNING: No brandAndCompetitorMentions in payload');
  }

  const sentimentToUse = sentiment || overallSentiment;
  if (sentimentToUse) {
    console.log('[processSingleResult] Processing sentiment analysis...');
    console.log('[processSingleResult] Sentiment data:', JSON.stringify(sentimentToUse));

    const parsePercentage = (value: any): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const cleaned = value.replace('%', '').trim();
        return parseFloat(cleaned) || 0;
      }
      return 0;
    };

    const { error: sentimentError } = await supabase
      .from('sentiment_analysis')
      .insert({
        execution_id: executionId,
        positive_percentage: parsePercentage(sentimentToUse.Positive || sentimentToUse.positive),
        neutral_percentage: parsePercentage(sentimentToUse.Neutral || sentimentToUse.neutral),
        negative_percentage: parsePercentage(sentimentToUse.Negative || sentimentToUse.negative),
      });

    if (sentimentError) {
      console.error('[processSingleResult] Error inserting sentiment:', sentimentError);
    } else {
      console.log('[processSingleResult] Sentiment analysis inserted successfully');
    }
  } else {
    console.log('[processSingleResult] WARNING: No sentiment data in payload');
  }

  if (recommendations && Array.isArray(recommendations)) {
    console.log('[processSingleResult] Processing', recommendations.length, 'recommendations');
    const recs = recommendations.map((rec: any, index: number) => ({
      execution_id: executionId,
      recommendation_id: `rec_${index + 1}`,
      text: typeof rec === 'string' ? rec : rec.text,
    }));

    const { error: recsError } = await supabase
      .from('recommendations')
      .insert(recs);

    if (recsError) {
      console.error('[processSingleResult] Error inserting recommendations:', recsError);
    } else {
      console.log('[processSingleResult] Recommendations inserted successfully');
    }
  } else {
    console.log('[processSingleResult] WARNING: No recommendations in payload');
  }

  console.log('[processSingleResult] Calculating and storing metrics...');
  await calculateAndStoreMetrics(supabase, userId);

  console.log('[processSingleResult] Processing complete for execution:', executionId);
}

async function calculateAndStoreMetrics(supabase: any, userId: string) {
  try {
    console.log('[calculateAndStoreMetrics] Starting for user:', userId);

    const { data: executions } = await supabase
      .from('prompt_executions')
      .select('id, platform, prompt_id')
      .eq('user_id', userId)
      .eq('status', 'completed');

    console.log('[calculateAndStoreMetrics] Found executions:', executions?.length || 0);

    if (!executions || executions.length === 0) {
      console.log('[calculateAndStoreMetrics] No completed executions found');
      return;
    }

    const executionIds = executions.map((e: any) => e.id);
    const uniquePromptIds = [...new Set(executions.map((e: any) => e.prompt_id))];

    const [mentionsResult, sentimentResult, profileResult] = await Promise.all([
      supabase.from('brand_mentions').select('*').in('execution_id', executionIds),
      supabase.from('sentiment_analysis').select('*').in('execution_id', executionIds),
      supabase.from('profiles').select('brand_name').eq('id', userId).maybeSingle(),
    ]);

    console.log('[calculateAndStoreMetrics] Mentions:', mentionsResult.data?.length || 0);
    console.log('[calculateAndStoreMetrics] Sentiments:', sentimentResult.data?.length || 0);

    const mentions = mentionsResult.data || [];
    const sentiments = sentimentResult.data || [];
    const userBrand = profileResult.data?.brand_name || '';

    const totalBrandMentions = mentions
      .filter((m: any) => m.is_user_brand)
      .reduce((sum: number, m: any) => sum + m.mention_count, 0);

    const totalCompetitorMentions = mentions
      .filter((m: any) => !m.is_user_brand)
      .reduce((sum: number, m: any) => sum + m.mention_count, 0);

    const totalMentions = totalBrandMentions + totalCompetitorMentions;
    const shareOfVoice = totalMentions > 0 ? (totalBrandMentions / totalMentions) * 100 : 0;

    const competitorCounts: Record<string, number> = {};
    mentions.filter((m: any) => !m.is_user_brand).forEach((m: any) => {
      competitorCounts[m.brand_name] = (competitorCounts[m.brand_name] || 0) + m.mention_count;
    });

    const topCompetitor = Object.entries(competitorCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || '';

    const avgPositive = sentiments.length > 0
      ? sentiments.reduce((sum: number, s: any) => sum + (parseFloat(s.positive_percentage) || 0), 0) / sentiments.length
      : 0;

    const avgNeutral = sentiments.length > 0
      ? sentiments.reduce((sum: number, s: any) => sum + (parseFloat(s.neutral_percentage) || 0), 0) / sentiments.length
      : 0;

    const avgNegative = sentiments.length > 0
      ? sentiments.reduce((sum: number, s: any) => sum + (parseFloat(s.negative_percentage) || 0), 0) / sentiments.length
      : 0;

    const avgSentimentScore = avgPositive - avgNegative;

    const promptsWithBrandMentions = new Set(
      mentions
        .filter((m: any) => m.is_user_brand && m.mention_count > 0)
        .map((m: any) => {
          const exec = executions.find((e: any) => e.id === m.execution_id);
          return exec?.prompt_id;
        })
        .filter(Boolean)
    ).size;

    const brandCoverageAcrossPrompts = uniquePromptIds.length > 0
      ? (promptsWithBrandMentions / uniquePromptIds.length) * 100
      : 0;

    const avgBrandVisibility = executions.length > 0
      ? totalBrandMentions / executions.length
      : 0;

    const uniquePlatforms = new Set(executions.map((e: any) => e.platform)).size;

    const allBrands = [...new Set(mentions.map((m: any) => m.brand_name))];
    const brandScores = allBrands.map(brand => {
      const brandMentionCount = mentions
        .filter((m: any) => m.brand_name === brand)
        .reduce((sum: number, m: any) => sum + m.mention_count, 0);
      return { brand, count: brandMentionCount };
    }).sort((a, b) => b.count - a.count);

    const competitiveRank = brandScores.findIndex(b =>
      b.brand.toLowerCase().includes(userBrand.toLowerCase()) ||
      userBrand.toLowerCase().includes(b.brand.toLowerCase())
    ) + 1;

    const responseQuality = (shareOfVoice * 0.4) + (avgPositive * 0.6);

    const metrics = {
      user_id: userId,
      time_period: 'all',
      avg_sentiment_score: avgSentimentScore,
      avg_brand_visibility: brandCoverageAcrossPrompts,
      share_of_voice: shareOfVoice,
      competitive_rank: competitiveRank || 0,
      response_quality: responseQuality,
      platform_coverage: uniquePlatforms,
      total_executions: executions.length,
      total_brand_mentions: totalBrandMentions,
      total_competitor_mentions: totalCompetitorMentions,
      top_competitor: topCompetitor,
      avg_positive_sentiment: avgPositive,
      avg_neutral_sentiment: avgNeutral,
      avg_negative_sentiment: avgNegative,
      updated_at: new Date().toISOString(),
    };

    console.log('[calculateAndStoreMetrics] Metrics to save:', JSON.stringify(metrics));

    const { error: metricsError } = await supabase
      .from('aggregated_metrics')
      .upsert(metrics, { onConflict: 'user_id,time_period' });

    if (metricsError) {
      console.error('[calculateAndStoreMetrics] Error saving metrics:', metricsError);
    } else {
      console.log('[calculateAndStoreMetrics] Metrics saved successfully');
    }
  } catch (error) {
    console.error('[calculateAndStoreMetrics] Error:', error);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('[n8n-callback] ========== NEW REQUEST ==========');
    console.log('[n8n-callback] Request method:', req.method);
    console.log('[n8n-callback] Request headers:', JSON.stringify(Object.fromEntries(req.headers.entries())));

    const rawBody = await req.text();
    console.log('[n8n-callback] Raw body:', rawBody);
    console.log('[n8n-callback] Raw body length:', rawBody.length);

    if (!rawBody || rawBody.trim() === '') {
      console.error('[n8n-callback] ERROR: Empty request body');
      return new Response(
        JSON.stringify({ success: false, error: 'Empty request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (parseError: any) {
      console.error('[n8n-callback] ERROR: Failed to parse JSON:', parseError.message);
      console.error('[n8n-callback] Raw body that failed to parse:', rawBody);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON: ' + parseError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[n8n-callback] Full payload received:', JSON.stringify(payload, null, 2));

    // Check if this is a batch response (array of results) or single result
    if (Array.isArray(payload)) {
      console.log('[n8n-callback] Batch response detected with', payload.length, 'items');

      // Process each item in the batch
      let successCount = 0;
      let errorCount = 0;

      for (const item of payload) {
        try {
          const { executionId } = item;
          if (!executionId) {
            console.error('[n8n-callback] Missing executionId in batch item:', item);
            errorCount++;
            continue;
          }

          await processSingleResult(supabase, item);
          successCount++;
        } catch (error) {
          console.error('[n8n-callback] Error processing batch item:', error);
          errorCount++;
        }
      }

      console.log('[n8n-callback] Batch processing complete:', successCount, 'success,', errorCount, 'errors');

      return new Response(
        JSON.stringify({
          success: true,
          message: `Processed ${successCount}/${payload.length} items successfully`
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Single result processing
    const { executionId, brandAndCompetitorMentions, sentiment, recommendations, AI_original_response, overallSentiment } = payload;

    if (!executionId) {
      console.error('[n8n-callback] ERROR: Missing executionId in payload');
      return new Response(
        JSON.stringify({ success: false, error: 'executionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await processSingleResult(supabase, payload);

    console.log('[n8n-callback] ========== REQUEST COMPLETED SUCCESSFULLY ==========');

    return new Response(
      JSON.stringify({ success: true, message: 'Data saved successfully' }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('[n8n-callback] ========== ERROR ==========');
    console.error('[n8n-callback] Error:', error);
    console.error('[n8n-callback] Stack:', error.stack);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
