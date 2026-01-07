
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { imageUrl } = await req.json();

        if (!imageUrl) {
            throw new Error('No imageUrl provided');
        }

        const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
        if (!OPENAI_API_KEY) {
            throw new Error('Missing OPENAI_API_KEY');
        }

        console.log("Analyzing invoice:", imageUrl);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert accountant assistant for a Colombian family. 
            Extract data from the invoice image and return ONLY a valid JSON object.
            
            Fields required:
            - title: A short descriptive title (e.g., "Factura Enel", "Mercado Éxito").
            - amount: The total to pay (number, no currency symbols).
            - category: One of ['vivienda', 'servicios', 'comida', 'transporte', 'entretenimiento', 'salud', 'educacion', 'deudas', 'otros'].
            - serviceType: If category is 'servicios', detect type: ['agua', 'energia', 'gas', 'telecom'] or null.
            - provider: The name of the company (e.g., "Enel Colombia", "EPM", "Claro").
            - paymentUrl: Detect any payment URL if present (or null).
            - dueDate: The "Pagar hasta" or "Pago Oportuno" date in YYYY-MM-DD format.
            - isRecurring: true/false (usually true for utilities/subscriptions).
            
            If a field is not found, use null. ensure numeric amount has no periods/commas if possible, or standard float format.`
                    },
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: "Extract data from this invoice." },
                            { type: 'image_url', image_url: { url: imageUrl } }
                        ]
                    }
                ],
                max_tokens: 500
            }),
        });

        const data = await response.json();
        console.log("OpenAI Response:", data);

        if (data.error) {
            throw new Error(data.error.message);
        }

        const content = data.choices[0].message.content;

        // Extract JSON from markdown code block if present
        const jsonStr = content.replace(/```json\n|\n```/g, '');
        const extractedData = JSON.parse(jsonStr);

        return new Response(JSON.stringify(extractedData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error("Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
