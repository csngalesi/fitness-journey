/**
 * Fitness Journey MED — Vercel Serverless Function
 * POST /api/extract-macros
 * Body: { description: string }
 * Returns: { cals: number, pro: number, carb: number, fat: number }
 * Env: GEMINI_API_KEY
 */

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { description } = req.body || {};
    if (!description || !description.trim()) {
        return res.status(400).json({ error: 'description is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const prompt = `Você é um nutricionista especializado em composição corporal.
Analise a descrição de refeição abaixo e estime os macronutrientes de cada alimento/item individualmente e o total.
Seja preciso com base em porções típicas brasileiras.
Retorne APENAS JSON válido, sem markdown, sem explicações, exatamente neste formato:
{
  "items": [
    { "name": "nome do alimento/porção", "cals": number, "pro": number, "carb": number, "fat": number }
  ],
  "cals": number,
  "pro": number,
  "carb": number,
  "fat": number
}
Os campos "cals", "pro", "carb", "fat" do nível raiz devem ser a soma dos itens.

Refeição: ${description}`;

    try {
        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 1024,
                        thinkingConfig: { thinkingBudget: 0 }
                    }
                })
            }
        );

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            throw new Error(`Gemini API error: ${geminiRes.status} — ${errText}`);
        }

        const geminiData = await geminiRes.json();
        const parts = geminiData?.candidates?.[0]?.content?.parts || [];
        // Filter out thinking parts (thought: true) — only keep actual answer text
        const raw = parts.filter(p => !p.thought).map(p => p.text || '').join('\n');

        // Extract JSON from response — greedy to capture the full object
        const match = raw.match(/\{[\s\S]*\}/);
        if (!match) throw new Error(`No JSON found. Parts: ${parts.length}. Raw: ${raw.substring(0, 300)}`);

        const macros = JSON.parse(match[0]);

        // Validate and sanitize totals
        const items = Array.isArray(macros.items) ? macros.items.map(it => ({
            name: String(it.name || ''),
            cals: Math.round(Number(it.cals) || 0),
            pro:  Math.round(Number(it.pro)  || 0),
            carb: Math.round(Number(it.carb) || 0),
            fat:  Math.round(Number(it.fat)  || 0),
        })) : [];

        const result = {
            items,
            cals: Math.round(Number(macros.cals) || 0),
            pro:  Math.round(Number(macros.pro)  || 0),
            carb: Math.round(Number(macros.carb) || 0),
            fat:  Math.round(Number(macros.fat)  || 0),
        };

        return res.status(200).json(result);
    } catch (err) {
        console.error('[extract-macros] Error:', err);
        return res.status(500).json({ error: err.message });
    }
}
