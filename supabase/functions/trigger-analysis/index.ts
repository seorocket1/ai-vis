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

    let Model = body.Model;
    let Prompt = body.Prompt;
    let Brand = body.Brand;
    let executionId = body.executionId;

    if (body.promptId && !Model) {
      const promptId = body.promptId;

      const { data: promptData, error: promptError } = await supabase
        .from('prompts')
        .select('*')
        .eq('id', promptId)
        .single();

      if (promptError || !promptData) {
        throw new Error(`Failed to fetch prompt: ${promptError?.message || 'Prompt not found'}`);
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('brand_name')
        .eq('id', promptData.user_id)
        .single();

      if (profileError || !profileData) {
        throw new Error(`Failed to fetch profile: ${profileError?.message || 'Profile not found'}`);
      }

      Prompt = promptData.text;
      Brand = profileData.brand_name;

      const platforms = [
        { id: 'gemini', name: 'Gemini', displayName: 'Gemini' }
      ];

      const promises = platforms.map(async (platform) => {
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

    // Handle new N8N format with capitalized fields
    let brandAndCompetitorMentions = n8nData.brandAndCompetitorMentions;
    let sentiment = n8nData.sentiment || n8nData.overallSentiment;
    let recommendations = n8nData.recommendations;
    let AI_original_response = n8nData.AI_original_response || n8nData.AI_Response;
    let sources = n8nData.sources || n8nData.Sources;

    // NEW FORMAT: Parse AI_Analysis if it exists
    if (n8nData.AI_Analysis) {
      console.log('Detected new N8N format with AI_Analysis');
      try {
        const analysisText = n8nData.AI_Analysis;
        const jsonBlocks = analysisText.match(/```json\n([\s\S]*?)\n```/g);

        if (jsonBlocks && jsonBlocks.length >= 3) {
          const brandMentionsJson = jsonBlocks[0].replace(/```json\n|\n```/g, '');
          brandAndCompetitorMentions = JSON.parse(brandMentionsJson);

          const sentimentJson = jsonBlocks[1].replace(/```json\n|\n```/g, '');
          sentiment = JSON.parse(sentimentJson);

          const recsJson = jsonBlocks[2].replace(/```json\n|\n```/g, '');
          const recsObj = JSON.parse(recsJson);
          recommendations = Object.values(recsObj);
        }
      } catch (parseError) {
        console.error('Error parsing AI_Analysis:', parseError);
      }
    }

    // Parse Sources if it's a JSON string
    if (sources && typeof sources === 'string') {
      try {
        sources = JSON.parse(sources);
      } catch (e) {
        console.error('Error parsing Sources:', e);
      }
    }

    const updateData: any = {
      status: 'completed',
      completed_at: new Date().toISOString(),
      ai_response: AI_original_response || JSON.stringify(n8nData),
    };

    if (sources) {
      updateData.sources = sources;
    }

    const { error: execError } = await supabase
      .from('prompt_executions')
      .update(updateData)
      .eq('id', executionId);

    if (execError) {
      console.error('Error updating execution:', execError);
      throw execError;
    }

    if (brandAndCompetitorMentions) {
      const mentions = Object.entries(brandAndCompetitorMentions).map(([brand, count]) => ({
        execution_id: executionId,
        brand_name: brand,
        mention_count: typeof count === 'string' ? parseInt(count, 10) : (count as number),
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

    if (sentiment) {
      const parsePercent = (val: any) => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          return parseFloat(val.replace('%', '')) || 0;
        }
        return 0;
      };

      const positiveScore = parsePercent(sentiment.Positive || sentiment.positive);
      const neutralScore = parsePercent(sentiment.Neutral || sentiment.neutral);
      const negativeScore = parsePercent(sentiment.Negative || sentiment.negative);

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

    if (recommendations && Array.isArray(recommendations)) {
      const recs = recommendations.map((rec: any, index: number) => ({
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
