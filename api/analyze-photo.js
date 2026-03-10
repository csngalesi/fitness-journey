/**
 * Fitness Journey MED — Vercel Serverless Function
 * POST /api/analyze-photo
 * Body: { imageBase64: string, mimeType: string, height_cm?: number, weight_kg_last?: number }
 * Returns: { bf: number, weight: number|null, notes: string }
 * Env: GEMINI_API_KEY
 */

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { imageBase64, mimeType = 'image/jpeg', height_cm, weight_kg_last } = req.body || {};
    if (!imageBase64) {
        return res.status(400).json({ error: 'imageBase64 is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const contextLines = [];
    if (height_cm)      contextLines.push(`Altura: ${height_cm}cm`);
    if (weight_kg_last) contextLines.push(`Último peso registrado: ${weight_kg_last}kg`);
    const context = contextLines.length ? `\nContexto do atleta: ${contextLines.join(', ')}` : '';

    const prompt = `Você é um avaliador especializado em composição corporal para fins de acompanhamento fitness.
Analise esta foto de avaliação física e estime:
1. Percentual de gordura corporal (BF%) com base na visibilidade muscular, distribuição de gordura e definição
2. Peso corporal aproximado (se possível deduzir pela estatura e composição visual)
${context}

Seja honesto e preciso. Considere gênero, postura e iluminação na análise.
Retorne APENAS JSON válido no formato:
{"bf": number, "weight": number_or_null, "notes": "string curta com observação"}

Exemplo: {"bf": 14.5, "weight": 82.0, "notes": "Definição visível no abdômen, gordura baixa nos flancos"}`;

    try {
        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { inline_data: { mime_type: mimeType, data: imageBase64 } },
                            { text: prompt }
                        ]
                    }],
                    generationConfig: { temperature: 0.3, maxOutputTokens: 256 }
                })
            }
        );

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            throw new Error(`Gemini API error: ${geminiRes.status} — ${errText}`);
        }

        const geminiData = await geminiRes.json();
        const raw = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        const match = raw.match(/\{[\s\S]*?\}/);
        if (!match) throw new Error('No JSON found in Gemini response');

        const result = JSON.parse(match[0]);
        return res.status(200).json({
            bf:     result.bf     != null ? parseFloat(Number(result.bf).toFixed(1))     : null,
            weight: result.weight != null ? parseFloat(Number(result.weight).toFixed(1)) : null,
            notes:  String(result.notes || ''),
        });
    } catch (err) {
        console.error('[analyze-photo] Error:', err);
        return res.status(500).json({ error: err.message });
    }
}
