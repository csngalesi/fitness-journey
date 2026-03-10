/**
 * Fitness Journey MED — Vercel Serverless Function
 * POST /api/calc-volumes
 * Body: { aesthetic_target, height_cm, weight_kg, metabolic_goal, age, gender }
 * Returns: [{ muscle, sets, label, color }]
 * Env: GEMINI_API_KEY
 */

const GOAL_LABELS = {
    lose:     'cutting (secar / reduzir BF)',
    maintain: 'manutenção estratégica',
    gain:     'bulking limpo (ganho de massa)',
    recomp:   'recomposição corporal',
};

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { aesthetic_target, height_cm, weight_kg, metabolic_goal, age, gender } = req.body || {};

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const goalLabel = GOAL_LABELS[metabolic_goal] || metabolic_goal || 'não informado';
    const profileStr = [
        height_cm ? `${height_cm}cm` : null,
        weight_kg ? `${weight_kg}kg` : null,
        age       ? `${age} anos`    : null,
        gender === 'M' ? 'masculino' : gender === 'F' ? 'feminino' : null,
        `objetivo: ${goalLabel}`,
    ].filter(Boolean).join(', ');

    const prompt = `Você é um coach especializado em fisiculturismo natural e hipertrofia científica.
Baseado no perfil e na estética alvo abaixo, prescreva os volumes semanais por grupo muscular para as próximas 4 semanas.

Perfil: ${profileStr}
Estética alvo: ${aesthetic_target || 'Físico atlético equilibrado'}

Regras:
- Priorize grupos musculares que mais contribuem para a estética alvo descrita
- Volume total semanal entre 8 e 30 séries por grupo
- Labels: use "Ultra Vol" (>22), "Alto Vol" (16-22), "Vol Médio" (10-15), "Manutenção" (<10)
- Cores hex: vermelho (#ef4444) para Ultra Vol, roxo (#7c3aed) para Alto Vol, azul (#3b82f6) para Vol Médio, cinza (#6b7280) para Manutenção
- Liste entre 5 e 8 grupos musculares

Retorne APENAS um array JSON válido, sem markdown, sem explicações.
Formato exato de cada item: {"muscle": "string", "sets": number, "label": "string", "color": "string"}`;

    try {
        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.4, maxOutputTokens: 1024 }
                })
            }
        );

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            throw new Error(`Gemini API error: ${geminiRes.status} — ${errText}`);
        }

        const geminiData = await geminiRes.json();
        const raw = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Extract JSON array from response
        const match = raw.match(/\[[\s\S]*\]/);
        if (!match) throw new Error('No JSON array found in Gemini response');

        const volumes = JSON.parse(match[0]);

        // Validate each item has required fields
        const result = volumes
            .filter(v => v.muscle && v.sets)
            .map(v => ({
                muscle: String(v.muscle),
                sets:   Math.round(Number(v.sets)),
                label:  String(v.label || 'Vol Médio'),
                color:  String(v.color || '#6b7280'),
            }));

        return res.status(200).json(result);
    } catch (err) {
        console.error('[calc-volumes] Error:', err);
        return res.status(500).json({ error: err.message });
    }
}
