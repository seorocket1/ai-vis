import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

    const body = await req.json();
    console.log('Received request body:', body);

    // Handle two types of requests:
    // 1. From TriggerPrompt page: { Model, Prompt, Brand, executionId }
    // 2. From Onboarding: { promptId }

    let Model = body.Model;
    let Prompt = body.Prompt;
    let Brand = body.Brand;
    let executionId = body.executionId;

    // If promptId is provided, fetch the prompt and create executions for all platforms
    if (body.promptId && !Model) {
      const promptId = body.promptId;

      // Fetch the prompt details
      const { data: promptData, error: promptError } = await supabase
        .from('prompts')
        .select('*, profiles!inner(brand_name)')
        .eq('id', promptId)
        .single();

      if (promptError || !promptData) {
        throw new Error(`Failed to fetch prompt: ${promptError?.message || 'Prompt not found'}`);
      }

      Prompt = promptData.text;
      Brand = promptData.profiles.brand_name;

      // Get all platforms
      const platforms = [
        { id: 'chatgpt', name: 'ChatGPT', displayName: 'ChatGPT' },
        { id: 'gemini', name: 'Gemini', displayName: 'Gemini' },
        { id: 'perplexity', name: 'Perplexity', displayName: 'Perplexity' },
        { id: 'aio', name: 'AI Overview', displayName: 'AI Overview' }
      ];

      // Create executions for all platforms and trigger them
      const promises = platforms.map(async (platform) => {
        // Create execution record
        const { data: execution, error: execError } = await supabase
          .from('prompt_executions')
          .insert({
            prompt_id: promptId,
            user_id: promptData.user_id,
            model: platform.name,
            platform: platform.id,
            status: 'processing',
          })
          .select()
          .single();

        if (execError || !execution) {
          console.error(`Failed to create execution for ${platform.name}:`, execError);
          return null;
        }

        // Trigger n8n webhook for this platform
        try {
          const n8nWebhookUrl = 'https://n8n.seoengine.agency/webhook/84366642-2502-4684-baac-18e950410124';

          const webhookResponse = await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              Model: platform.name,
              Platform: platform.id,
              Prompt: Prompt,
              Brand: Brand,
              executionId: execution.id,
            }),
          });

          if (!webhookResponse.ok) {
            const responseText = await webhookResponse.text();
            console.error(`n8n webhook failed for ${platform.name}:`, responseText);

            // Update execution status to failed
            await supabase
              .from('prompt_executions')
              .update({
                status: 'failed',
                completed_at: new Date().toISOString(),
                error_message: `Webhook failed: ${webhookResponse.status}`,
              })
              .eq('id', execution.id);

            return null;
          }

          console.log(`Successfully triggered analysis for ${platform.name}`);
          return execution.id;
        } catch (error: any) {
          console.error(`Error triggering ${platform.name}:`, error);

          // Update execution status to failed
          await supabase
            .from('prompt_executions')
            .update({
              status: 'failed',
              completed_at: new Date().toISOString(),
              error_message: error.message,
            })
            .eq('id', execution.id);

          return null;
        }
      });

      const results = await Promise.all(promises);
      const successCount = results.filter(r => r !== null).length;

      return new Response(
        JSON.stringify({
          success: true,
          message: `Analysis triggered for ${successCount} platforms`,
          executionIds: results.filter(r => r !== null),
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Original flow for direct trigger
    console.log('Processing direct trigger:', { Model, Prompt, Brand, executionId });

    const n8nWebhookUrl = 'https://n8n.seoengine.agency/webhook/84366642-2502-4684-baac-18e950410124';

    console.log('Calling n8n webhook:', n8nWebhookUrl);

    const webhookResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Model,
        Prompt,
        Brand,
      }),
    });

    console.log('n8n response status:', webhookResponse.status);
    
    if (!webhookResponse.ok) {
      const responseText = await webhookResponse.text();
      console.error('n8n webhook failed:', responseText);
      throw new Error(`n8n webhook failed: ${webhookResponse.status} - ${responseText}`);
    }

    const n8nData = await webhookResponse.json();
    console.log('n8n response data:', JSON.stringify(n8nData));

    // Update execution status to completed
    const { error: execError } = await supabase
      .from('prompt_executions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        ai_response: JSON.stringify(n8nData),
      })
      .eq('id', executionId);

    if (execError) {
      console.error('Error updating execution:', execError);
      throw execError;
    }

    // Insert brand mentions
    if (n8nData.brandAndCompetitorMentions) {
      const mentions = Object.entries(n8nData.brandAndCompetitorMentions).map(([brand, count]) => ({
        execution_id: executionId,
        brand_name: brand,
        mention_count: count as number,
        is_user_brand: Brand.toLowerCase() === brand.toLowerCase(),
      }));

      const { error: mentionsError } = await supabase
        .from('brand_mentions')
        .insert(mentions);

      if (mentionsError) {
        console.error('Error inserting brand mentions:', mentionsError);
      } else {
        console.log('Successfully inserted brand mentions:', mentions.length);
      }
    }

    // Parse and insert sentiment analysis
    if (n8nData.overallSentiment) {
      const sentiment = n8nData.overallSentiment;
      const parsePercent = (val: string) => {
        if (typeof val === 'string') {
          return parseFloat(val.replace('%', '')) || 0;
        }
        return val || 0;
      };

      const positiveScore = parsePercent(sentiment.Positive);
      const neutralScore = parsePercent(sentiment.Neutral);
      const negativeScore = parsePercent(sentiment.Negative);

      let overall = 'neutral';
      if (positiveScore > neutralScore && positiveScore > negativeScore) {
        overall = 'positive';
      } else if (negativeScore > positiveScore && negativeScore > neutralScore) {
        overall = 'negative';
      }

      const { error: sentimentError } = await supabase
        .from('sentiment_analysis')
        .insert({
          execution_id: executionId,
          positive_percentage: positiveScore,
          neutral_percentage: neutralScore,
          negative_percentage: negativeScore,
        });

      if (sentimentError) {
        console.error('Error inserting sentiment:', sentimentError);
      } else {
        console.log('Successfully inserted sentiment analysis');
      }
    }

    // Insert recommendations
    if (n8nData.recommendations && Array.isArray(n8nData.recommendations)) {
      const recs = n8nData.recommendations.map((rec: any, index: number) => ({
        execution_id: executionId,
        recommendation_id: `rec_${index + 1}`,
        text: typeof rec === 'string' ? rec : rec.text,
      }));

      const { error: recsError } = await supabase
        .from('recommendations')
        .insert(recs);

      if (recsError) {
        console.error('Error inserting recommendations:', recsError);
      } else {
        console.log('Successfully inserted recommendations:', recs.length);
      }
    }

    console.log('Successfully processed n8n response for execution:', executionId);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Analysis completed successfully',
        data: n8nData,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error:', error);
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
