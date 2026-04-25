// AI assistant: recommends rental items based on user's need + proximity.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Candidate = {
  id: string;
  title: string;
  description: string;
  category: string;
  price_per_day: number;
  location: string;
  condition: string;
  distance_km: number | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const { query, candidates, hasLocation } = (await req.json()) as {
      query: string;
      candidates: Candidate[];
      hasLocation: boolean;
    };

    if (!query || !Array.isArray(candidates)) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const trimmed = candidates.slice(0, 50);

    const systemPrompt = `أنت مساعد ذكي في منصة Rent Right لتأجير الأغراض في السعودية.
مهمتك: قراءة احتياج العميل واختيار أفضل المنتجات المناسبة من القائمة المعطاة.
- ركّز على الفئة، الكلمات المفتاحية، الحالة، والسعر المعقول.
- ${hasLocation ? "أعطِ الأولوية للمنتجات الأقرب جغرافياً (distance_km الأصغر)." : "لا يوجد موقع للعميل، فلا تستخدم المسافة كمعيار."}
- اختر من 1 إلى 6 منتجات فقط، الأكثر ملاءمة.
- لا تخترع منتجات غير موجودة في القائمة.
- اكتب رسالة قصيرة ودودة بالعربية تشرح اختيارك.`;

    const userMsg = `احتياج العميل: "${query}"

المنتجات المتاحة (JSON):
${JSON.stringify(trimmed, null, 0)}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "recommend_items",
              description: "Return ranked recommended items with a friendly Arabic message.",
              parameters: {
                type: "object",
                properties: {
                  message: {
                    type: "string",
                    description: "رسالة قصيرة ودودة بالعربية تشرح الاختيار (لا تذكر معرفات).",
                  },
                  recommendations: {
                    type: "array",
                    description: "قائمة المنتجات الموصى بها مرتبة من الأفضل.",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        reason: { type: "string", description: "سطر واحد بالعربية يبرر الاختيار." },
                      },
                      required: ["id", "reason"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["message", "recommendations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "recommend_items" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "تجاوزت الحد المسموح، حاول بعد قليل." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "نفد رصيد المساعد الذكي." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const txt = await aiResp.text();
      console.error("AI error", aiResp.status, txt);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ message: "لم أجد نتائج مناسبة.", recommendations: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-recommend error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
