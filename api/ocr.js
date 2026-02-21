export default async function handler(req, res) {
    // CORS configuration for local testing if needed
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )

    if (req.method === 'OPTIONS') {
        return res.status(200).end()
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { imageBase64, mimeType } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ error: 'No image provided' });
        }

        const processEnvKey = process.env.GEMINI_API_KEY;
        if (!processEnvKey) {
            console.error("Missing GEMINI_API_KEY in Vercel environment variables.");
            return res.status(500).json({ error: 'Missing GEMINI_API_KEY in Vercel' });
        }

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${processEnvKey}`;

        // Convert base64 payload to string if it isn't already
        const base64Data = typeof imageBase64 === 'string' ? imageBase64 : Buffer.from(imageBase64).toString('base64');

        console.log("Calling Gemini 2.0 Flash...");
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
                                mime_type: mimeType || 'image/jpeg',
                                data: base64Data
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

        if (!response.ok) {
            const errText = await response.text();
            console.error("Gemini HTTP error:", response.status, errText);
            return res.status(response.status).json({ error: `Gemini API error: ${errText.slice(0, 200)}` });
        }

        const data = await response.json();

        if (data.error) {
            console.error("Gemini API returned an error:", data.error);
            return res.status(500).json({ error: data.error.message });
        }

        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!content) {
            console.error("No content returned from Gemini.", data);
            return res.status(500).json({ error: "No content returned from Gemini" });
        }

        const jsonStr = content.replace(/```json\s*|\s*```/g, '').trim();
        const extractedData = JSON.parse(jsonStr);

        if (extractedData.amount !== null && extractedData.amount !== undefined) {
            const rawAmount = String(extractedData.amount).replace(/[^\d.]/g, '');
            extractedData.amount = parseFloat(rawAmount) || 0;
        }

        return res.status(200).json(extractedData);
    } catch (error) {
        console.error("Error in OCR:", error);
        return res.status(500).json({ error: error.message || String(error) });
    }
}
