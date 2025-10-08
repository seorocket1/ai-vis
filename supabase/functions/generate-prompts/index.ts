import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
    const { brandName, website, location } = await req.json();

    // Generate suggested prompts based on brand info
    // In a real implementation, this would use an AI API like OpenAI
    // For now, we'll generate template-based prompts

    const prompts = [
      `What are the best ${extractIndustry(website)} services in ${location}?`,
      `${brandName} vs competitors: which is better?`,
      `How does ${brandName} compare to other ${extractIndustry(website)} providers?`,
      `Best ${extractIndustry(website)} tools for small businesses in ${location}`,
      `${brandName} review: is it worth it in ${new Date().getFullYear()}?`,
    ];

    return new Response(
      JSON.stringify({ prompts }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error generating prompts:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

function extractIndustry(website: string): string {
  // Simple industry extraction logic
  // In production, this would analyze the website content
  const keywords = ['software', 'tax', 'accounting', 'marketing', 'design', 'consulting'];

  for (const keyword of keywords) {
    if (website.toLowerCase().includes(keyword)) {
      return keyword;
    }
  }

  return 'service';
}
