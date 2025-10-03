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

    const { Model, Prompt, Brand, executionId } = await req.json();

    console.log('Received request:', { Model, Prompt, Brand, executionId });

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