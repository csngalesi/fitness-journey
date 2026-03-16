/**
 * Fitness Journey MED — Vercel Serverless Function
 * POST /api/extract-macros
 * Body: { description: string }
 * Returns: { cals: number, pro: number, carb: number, fat: number }
 * Env: GEMINI_API_KEY
 */

// Models tried in order — 2.5-flash preferred, fallback to 2.0-flash on 503/429
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];

async function callGemini(model, prompt, apiKey) {
    const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 }
    };
    // thinkingConfig only supported on 2.5-flash
    if (model === 'gemini-2.5-flash') {
        body.generationConfig.thinkingConfig = { thinkingBudget: 0 };
    }

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );

    if (!res.ok) {
        const errText = await res.text();
        const err = new Error(`Gemini API error: ${res.status} — ${errText}`);
        err.status = res.status;
        throw err;
    }

    return res.json();
}

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

    let lastErr;
    for (const model of MODELS) {
        try {
            const geminiData = await callGemini(model, prompt, apiKey);
            const parts = geminiData?.candidates?.[0]?.content?.parts || [];
            // Filter out thinking parts (thought: true) — only keep actual answer text
            const raw = parts.filter(p => !p.thought).map(p => p.text || '').join('\n');

            // Extract JSON from response — greedy to capture the full object
            const match = raw.match(/\{[\s\S]*\}/);
            if (!match) throw new Error(`No JSON found. Parts: ${parts.length}. Raw: ${raw.substring(0, 300)}`);

            const macros = JSON.parse(match[0]);

            const items = Array.isArray(macros.items) ? macros.items.map(it => ({
                name: String(it.name || ''),
                cals: Math.round(Number(it.cals) || 0),
                pro:  Math.round(Number(it.pro)  || 0),
                carb: Math.round(Number(it.carb) || 0),
                fat:  Math.round(Number(it.fat)  || 0),
            })) : [];

            return res.status(200).json({
                items,
                model,
                cals: Math.round(Number(macros.cals) || 0),
                pro:  Math.round(Number(macros.pro)  || 0),
                carb: Math.round(Number(macros.carb) || 0),
                fat:  Math.round(Number(macros.fat)  || 0),
            });
        } catch (err) {
            lastErr = err;
            // Only retry on 503 (unavailable) or 429 (rate limit)
            if (err.status === 503 || err.status === 429) {
                console.warn(`[extract-macros] ${model} returned ${err.status}, trying next model...`);
                continue;
            }
            // Other errors (400, 401, parse errors) — fail immediately
            break;
        }
    }

    console.error('[extract-macros] All models failed:', lastErr);
    return res.status(500).json({ error: lastErr.message });
};
