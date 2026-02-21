
// deno-lint-ignore-file
// @ts-ignore - Deno runtime import, not resolved by IDE TypeScript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fix: chunked base64 to avoid call-stack overflow on large images (> ~1MB)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { imageUrl } = await req.json();

        if (!imageUrl) {
            throw new Error('No imageUrl provided');
        }

        // @ts-ignore - Deno global, not available in browser/Node TypeScript
        const GEMINI_API_KEY = (globalThis as any).Deno?.env.get('GEMINI_API_KEY');
        if (!GEMINI_API_KEY) {
            throw new Error('Missing GEMINI_API_KEY secret. Deploy with: supabase secrets set GEMINI_API_KEY=your_key');
        }

        console.log("Fetching image:", imageUrl);

        // 1. Fetch image and convert to Base64 (chunked to avoid stack overflow)
        const imageResp = await fetch(imageUrl);
        if (!imageResp.ok) {
            throw new Error(`Failed to fetch image: ${imageResp.status} ${imageResp.statusText}`);
        }
        const imageBlob = await imageResp.blob();
        const arrayBuffer = await imageBlob.arrayBuffer();
        const base64Image = arrayBufferToBase64(arrayBuffer);
        const mimeType = imageBlob.type || 'image/jpeg';

        console.log(`Image fetched: ${(arrayBuffer.byteLength / 1024).toFixed(1)} KB, type: ${mimeType}`);
        console.log("Analyzing with Gemini 2.0 Flash...");

        // 2. Call Gemini 2.0 Flash API (stable, more capable than 1.5-flash)
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        {
                            text: `You are an expert accountant assistant specialized in Colombian household bills and invoices.
Analyze the invoice image and return ONLY a valid JSON object with these exact fields:

{
  "title": "Short descriptive title (e.g., 'Factura Enel', 'Recibo Agua', 'Mercado Éxito')",
  "amount": 125430,
  "category": "servicios",
  "serviceType": "energia",
  "provider": "Enel Colombia",
  "paymentUrl": null,
  "dueDate": "2025-03-15",
  "isRecurring": true
}

Rules:
- title: Short name describing the bill (string).
- amount: The total amount due as a plain integer or decimal (NO currency symbols, NO commas, NO dots as thousands separator). If amount is "$ 1.250.430", return 1250430.
- category: Must be exactly one of: vivienda | servicios | comida | transporte | entretenimiento | salud | educacion | deudas | otros.
- serviceType: ONLY if category is "servicios", use one of: agua | energia | gas | telecom. Otherwise use null.
- provider: Company name as shown on the bill (string).
- paymentUrl: Payment URL if clearly visible on the bill, otherwise null.
- dueDate: Payment due date in YYYY-MM-DD format. Look for "Pagar hasta", "Fecha límite", "Pago Oportuno", "Vence". If not found, use null.
- isRecurring: true for utilities, subscriptions, rent. false for one-time purchases.

Return ONLY the JSON object. No markdown, no explanation.`
                        },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: base64Image
                            }
                        }
                    ]
                }],
                generationConfig: {
                    response_mime_type: "application/json",
                    temperature: 0.1
                }
            }),
        });

        // Fix: check HTTP status before parsing
        if (!response.ok) {
            const errText = await response.text();
            console.error("Gemini HTTP error:", response.status, errText);
            throw new Error(`Gemini API error ${response.status}: ${errText.slice(0, 200)}`);
        }

        const data = await response.json();

        if (data.error) {
            console.error("Gemini API error:", data.error);
            throw new Error(data.error.message);
        }

        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        console.log("Gemini raw response:", content);

        if (!content) throw new Error("No content returned from Gemini");

        // Clean up any accidental markdown wrapping
        const jsonStr = content.replace(/```json\s*|\s*```/g, '').trim();
        const extractedData = JSON.parse(jsonStr);

        // Ensure amount is always a number
        if (extractedData.amount !== null && extractedData.amount !== undefined) {
            const rawAmount = String(extractedData.amount).replace(/[^\d.]/g, '');
            extractedData.amount = parseFloat(rawAmount) || 0;
        }

        console.log("Extracted data:", JSON.stringify(extractedData));

        return new Response(JSON.stringify(extractedData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error("Error in review-invoice:", msg);
        return new Response(JSON.stringify({ error: msg }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
