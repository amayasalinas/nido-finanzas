
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

        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
        if (!GEMINI_API_KEY) {
            throw new Error('Missing GEMINI_API_KEY');
        }

        console.log("Fetching image:", imageUrl);

        // 1. Fetch image and convert to Base64
        const imageResp = await fetch(imageUrl);
        if (!imageResp.ok) throw new Error(`Failed to fetch image: ${imageResp.statusText}`);
        const imageBlob = await imageResp.blob();
        const arrayBuffer = await imageBlob.arrayBuffer();
        const base64Image = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        const mimeType = imageBlob.type || 'image/jpeg';

        console.log("Analyzing with Gemini 1.5 Flash...");

        // 2. Call Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        {
                            text: `You are an expert accountant assistant for a Colombian family. 
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
            
            If a field is not found, use null. Return purely JSON, no markdown headers.` },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: base64Image
                            }
                        }
                    ]
                }],
                generationConfig: {
                    response_mime_type: "application/json"
                }
            }),
        });

        const data = await response.json();

        if (data.error) {
            console.error("Gemini Error:", data.error);
            throw new Error(data.error.message);
        }

        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log("Gemini Raw Response:", content);

        if (!content) throw new Error("No content returned from Gemini");

        // Clean up potential markdown blocks although response_mime_type usually handles it
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
