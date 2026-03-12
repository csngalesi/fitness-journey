/**
 * Fitness Journey MED — Vercel Serverless Function
 * POST /api/calc-volumes
 * Body: { aesthetic_target, height_cm, weight_kg, metabolic_goal, age, gender, training_level }
 * Returns: { rationale, volumes, weekly_split }
 * Env: GEMINI_API_KEY
 */

const GOAL_LABELS = {
    lose:     'cutting (secar / reduzir BF)',
    maintain: 'manutenção estratégica',
    gain:     'bulking limpo (ganho de massa)',
    recomp:   'recomposição corporal',
};

const TRAINING_LEVEL_LABELS = {
    beginner:     'iniciante (< 1 ano de treino consistente)',
    intermediate: 'intermediário (1-4 anos de treino consistente)',
    advanced:     'avançado (> 4 anos de treino consistente)',
};

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { aesthetic_target, height_cm, weight_kg, metabolic_goal, age, gender, training_level } = req.body || {};

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const goalLabel     = GOAL_LABELS[metabolic_goal]         || metabolic_goal || 'não informado';
    const levelLabel    = TRAINING_LEVEL_LABELS[training_level] || 'intermediário (1-4 anos)';

    const profileStr = [
        height_cm  ? `${height_cm}cm`                                            : null,
        weight_kg  ? `${weight_kg}kg`                                            : null,
        age        ? `${age} anos`                                               : null,
        gender === 'M' ? 'sexo masculino' : gender === 'F' ? 'sexo feminino'    : null,
        `objetivo metabólico: ${goalLabel}`,
        `nível de treino: ${levelLabel}`,
    ].filter(Boolean).join(' | ');

    const prompt = `Você é um cientista do esporte e coach de força especializado em hipertrofia baseada em evidências.
Use o framework MEV/MAV/MRV do RP Strength para prescrever volumes semanais individualizados.

PERFIL DO ATLETA: ${profileStr}
ESTÉTICA ALVO: ${aesthetic_target || 'Físico atlético equilibrado'}

━━━━━━━━━━━━━━━━━━━━━━━━━━
FRAMEWORK DE VOLUME (séries/semana por nível de treino)
━━━━━━━━━━━━━━━━━━━━━━━━━━
Use estas faixas de referência (MV = manutenção | MEV = mínimo efetivo | MAV = máximo adaptativo | MRV = máximo recuperável):

Grupo Muscular       | MV  | MEV       | MAV       | MRV
Quadríceps           | 6   | 8–10      | 12–20     | 22–26
Isquiotibiais        | 4   | 6–8       | 10–16     | 18–22
Glúteos              | 0   | 4–6       | 8–14      | 16–20
Peitoral             | 6   | 8–10      | 12–20     | 20–24
Dorsal (costas)      | 8   | 10–12     | 14–22     | 24–28
Ombros (lat+post)    | 6   | 8–10      | 16–22     | 24–28
Bíceps               | 6   | 8–10      | 14–20     | 24–28
Tríceps              | 4   | 6–8       | 10–18     | 20–24
Panturrilhas         | 6   | 8–10      | 12–16     | 20–24

REGRAS DE PRESCRIÇÃO DE VOLUME:
- Iniciante: usar MEV (menor capacidade de recuperação, maior sensibilidade ao treino)
- Intermediário: MEV até metade do MAV
- Avançado: MAV pleno a MRV para grupos prioritários
- Músculos que contribuem mais para a estética alvo → volumes no topo da faixa (MAV→MRV)
- Músculos não prioritários ou já desenvolvidos → MV ou MEV
- Frequência ideal: 2–3x/semana por grupo para síntese proteica máxima
- Nunca ultrapassar MRV — risco de overreaching e regressão

━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITÉRIOS DE SELEÇÃO DE EXERCÍCIOS (baseados em evidências)
━━━━━━━━━━━━━━━━━━━━━━━━━━
Priorize exercícios com:
1. TENSÃO MECÂNICA ALTA NO ALONGAMENTO (posição de maior comprimento = maior hipertrofia — Petrella 2006, McMahon 2014)
2. CURVA DE FORÇA FAVORÁVEL (carga distribuída em toda a amplitude, não apenas no pico)
3. ALTA ATIVAÇÃO por EMG em estudos controlados
4. BAIXO RISCO articular para a carga muscular gerada

Referências por grupo:
- Quadríceps: hack squat, leg press 45°, Bulgarian split squat (melhor ROM que agachamento traseiro)
- Isquiotibiais: stiff-leg deadlift/RDL, leg curl deitado (ênfase no alongamento), Nordic curl
- Glúteos: hip thrust, RDL, agachamento profundo (ativação no alongamento > extensão no topo)
- Peitoral: supino inclinado com halteres, crucifixo no cabo baixo para alto (ênfase no estiramento)
- Dorsal: remada apoiada no banco, pulldown com full stretch, remada unilateral com haltere
- Ombros laterais: elevação lateral no cabo (tensão constante > haltere), elevação lateral na máquina
- Bíceps: rosca inclinada com haltere (posição encurtada do cotovelo = estiramento do bíceps), rosca no cabo
- Tríceps: extensão testa, extensão sobre a cabeça (ênfase na cabeça longa = máximo estiramento)
- Panturrilhas: elevação sentado (sóleo), elevação em pé (gastrocnêmio), sempre com amplitude completa

━━━━━━━━━━━━━━━━━━━━━━━━━━
PRESCRIÇÃO DE REP RANGES E DESCANSO
━━━━━━━━━━━━━━━━━━━━━━━━━━
- Compostos (agachar, empurrar, puxar): 6–10 reps | 2–3 min descanso
- Isolamento: 10–20 reps | 60–90s descanso
- RIR (Reps in Reserve): 1–3 em todas as séries de trabalho (não failure sistêmico)
- Último set pode ser RIR 0–1 (próximo da falha)

━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMATO DE RESPOSTA
━━━━━━━━━━━━━━━━━━━━━━━━━━
Retorne APENAS JSON válido, sem markdown, sem explicações externas.

Labels de volume: "Ultra Vol" (>22 séries), "Alto Vol" (16–22), "Vol Médio" (10–15), "Manutenção" (<10)
Cores hex: #ef4444 Ultra Vol | #7c3aed Alto Vol | #3b82f6 Vol Médio | #6b7280 Manutenção

{
  "rationale": "2–3 frases justificando as prioridades de volume, frequência e ajustes ao nível do atleta.",
  "volumes": [
    {"muscle": "string", "sets": number, "label": "string", "color": "string", "frequency_per_week": number}
  ],
  "weekly_split": [
    {
      "day": "D1",
      "label": "Nome do treino (ex: Push — Peitoral & Tríceps)",
      "groups": [
        {
          "muscle": "string",
          "sets": number,
          "exercises": [
            {
              "name": "string",
              "sets": number,
              "reps": "string (ex: '8-10' ou '12-15')",
              "rest": "string (ex: '2 min' ou '90s')",
              "rir": "string (ex: 'RIR 2')",
              "rationale": "string curta: por que este exercício (1 frase)"
            }
          ]
        }
      ]
    }
  ]
}`;

    try {
        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 8192,
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
        const raw = parts.filter(p => !p.thought).map(p => p.text || '').join('\n');

        const match = raw.match(/\{[\s\S]*\}/);
        if (!match) throw new Error(`No JSON found. Parts: ${parts.length}. Raw: ${raw.substring(0, 500)}`);

        const parsed = JSON.parse(match[0]);
        const volumesRaw = Array.isArray(parsed.volumes) ? parsed.volumes : [];

        const volumes = volumesRaw
            .filter(v => v.muscle && v.sets)
            .map(v => ({
                muscle:             String(v.muscle),
                sets:               Math.round(Number(v.sets)),
                label:              String(v.label || 'Vol Médio'),
                color:              String(v.color || '#6b7280'),
                frequency_per_week: Number(v.frequency_per_week) || 2,
            }));

        const weekly_split = Array.isArray(parsed.weekly_split) ? parsed.weekly_split : [];

        return res.status(200).json({
            rationale: String(parsed.rationale || ''),
            volumes,
            weekly_split,
        });
    } catch (err) {
        console.error('[calc-volumes] Error:', err);
        return res.status(500).json({ error: err.message });
    }
}
