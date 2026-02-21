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
        const systemInstruction = `Eres un asistente contable experto especializado en recibos y facturas familiares (especialmente de Colombia).
Tareas:
1. Evalúa si la imagen es legible y parece ser una factura, recibo o ticket de compra. Si está muy borrosa, cortada de forma que no se lee, o definitivamente NO es un recibo/factura, marca "isUnreadable" como true e inventa valores por defecto para los demás campos requeridos.
2. Si es legible, extrae la información solicitada con estas reglas estrictas:
- amount: El total a pagar, convertido a número. Sin símbolos ni puntuación de separador de miles. Ej: "$ 1.250.430" -> 1250430.
- dueDate: YYYY-MM-DD. Busca "Pagar hasta", "Fecha límite", "Vence".
- isRecurring: true para servicios públicos, arriendo, planes, suscripciones. false para compras de una vez o mercado.
- serviceType: solo si category es "servicios". Puede ser: "agua", "energia", "gas", "telecom". Si no aplica, déjalo vacío o usa null.`;

        console.log("Calling Gemini 2.0 Flash with Structured Outputs...");
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: systemInstruction }]
                },
                contents: [{
                    parts: [
                        {
                            inline_data: {
                                mime_type: mimeType || 'image/jpeg',
                                data: base64Data
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.1,
                    response_mime_type: "application/json",
                    response_schema: {
                        type: "OBJECT",
                        properties: {
                            isUnreadable: { type: "BOOLEAN", description: "true if the image is too blurry, dark, or no invoice/bill is visible." },
                            title: { type: "STRING", description: "Short descriptive title (e.g., 'Factura Enel', 'Recibo Agua', 'Mercado Éxito')" },
                            amount: { type: "NUMBER", description: "The total amount due. NO currency symbols. Just the number." },
                            category: { type: "STRING", enum: ["vivienda", "servicios", "comida", "transporte", "entretenimiento", "salud", "educacion", "deudas", "otros"] },
                            serviceType: { type: "STRING", description: "Must be one of: agua, energia, gas, telecom. Null or empty if not applicable.", nullable: true },
                            provider: { type: "STRING", description: "Company name as shown on the bill" },
                            dueDate: { type: "STRING", description: "YYYY-MM-DD", nullable: true },
                            isRecurring: { type: "BOOLEAN" }
                        },
                        required: ["isUnreadable", "title", "amount", "category", "provider", "isRecurring"]
                    }
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

        if (extractedData.isUnreadable) {
            console.warn("Gemini flagged the image as unreadable.");
            return res.status(422).json({ error: "No pudimos leer la factura. Asegúrate de que la foto no esté borrosa o muy oscura e intenta de nuevo." });
        }

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
