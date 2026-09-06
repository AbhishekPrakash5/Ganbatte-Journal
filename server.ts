import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Standard 1: Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: '2mb' }));

// Lazy initialization of Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log('Notice: GEMINI_API_KEY not configured. Running in empathetic offline mode.');
    }
    geminiClient = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-init' });
  }
  return geminiClient;
}

// Standard 2: Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
] as const;

interface GenerateFallbackOptions {
  contents: string | any[];
  systemInstruction?: string;
  temperature?: number;
  responseMimeType?: string;
}

async function generateContentWithFallback(options: GenerateFallbackOptions): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('MISSING_KEY');
  }

  const ai = getGeminiClient();
  let lastError: any = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const config: any = {};
      if (options.systemInstruction) {
        config.systemInstruction = options.systemInstruction;
      }
      if (typeof options.temperature === 'number') {
        config.temperature = options.temperature;
      }
      if (options.responseMimeType) {
        config.responseMimeType = options.responseMimeType;
      }

      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      const status =
        err?.status ||
        err?.statusCode ||
        (typeof err?.message === 'string' && err.message.match(/\b(503|429|404|500)\b/)?.[0]);

      console.log(
        `[Gemini Ladder] Model ${model} returned status ${status || 'unavailable'}. Advancing to next fallback...`
      );

      // Brief backoff on rate limits or service spikes before moving to the next model
      if (status === 503 || status === '503' || status === 429 || status === '429') {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
  }

  throw lastError || new Error('All models in fallback ladder exhausted');
}

// Crisis Detection Heuristic Helper
function scanForCrisisKeywords(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const normalized = text.toLowerCase();
  const crisisPatterns = [
    /\b(suicide|kill myself|want to die|end my life|slit my wrists|hang myself|don't want to live anymore|dont want to live)\b/,
    /\b(self-harm|self harm|hurt myself deliberately|take all my pills)\b/,
    /\b(no reason to live|better off dead)\b/,
  ];
  return crisisPatterns.some((pattern) => pattern.test(normalized));
}

const CRISIS_HELPLINE_MESSAGE =
  "We hear you, and please know you are not alone. There are caring, trained people ready to support you right now, for free and confidentially. Please reach out to the 988 Suicide & Crisis Lifeline by calling or texting 988 (USA/Canada), or text HOME to 741741 to connect with Crisis Text Line. International resources are available at https://findahelpline.com.";

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    models: MODEL_FALLBACK_LADDER,
    timestamp: new Date().toISOString(),
  });
});

// Step 1: Empathetic Guide acknowledges entry and asks ONE clarifying question about the core emotion
app.post('/api/journal/clarify', async (req: Request, res: Response) => {
  try {
    // Standard 3: Defensive Payload Ingestion (Null-Safe Destructuring)
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const text = typeof body.text === 'string' ? body.text.trim().slice(0, 10000) : '';
    const location = body.location && typeof body.location === 'object' ? body.location : {};

    if (!text) {
      return res.status(400).json({ error: 'Journal text is required.' });
    }

    // Acute crisis check
    if (scanForCrisisKeywords(text)) {
      return res.json({
        acknowledgement: "I hear how much pain you are experiencing right now. Please know that your life matters, and support is available immediately.",
        clarifyingQuestion: "Would you be willing to pause and connect with someone who can listen right now?",
        isCrisisDetected: true,
        crisisMessage: CRISIS_HELPLINE_MESSAGE,
      });
    }

    const locContext = location.placeName || location.neighborhood || location.city
      ? `Location context: ${[location.placeName, location.neighborhood, location.city].filter(Boolean).join(', ')} (${location.placeCategory || 'general place'})`
      : 'Location context: Private cozy space';

    const systemPrompt = `You are a warm, deeply empathetic personal diary companion named "Ganbatte Journal Guide".
Your goal is to:
1. Acknowledge the user's reflection with sincere empathy and validating warmth (1-2 sentences).
2. Ask ONE thoughtful, gentle clarifying question about the core emotion they felt during their day.
Keep your response concise, comforting, and conversational.
Do not overwhelm the user. Output valid JSON in the format:
{
  "acknowledgement": "Warm 1-2 sentence reflection",
  "clarifyingQuestion": "One clarifying question focused on their core emotion"
}`;

    const userPrompt = `<JournalEntry>
${text}
</JournalEntry>
<UserLocation>
${locContext}
</UserLocation>`;

    try {
      const responseText = await generateContentWithFallback({
        systemInstruction: systemPrompt,
        contents: userPrompt,
        temperature: 0.7,
        responseMimeType: 'application/json',
      });

      const parsed = JSON.parse(responseText.trim());
      return res.json({
        acknowledgement: parsed.acknowledgement || "Thank you for sharing your thoughts today. It takes courage to pause and reflect.",
        clarifyingQuestion: parsed.clarifyingQuestion || "When you look back on these moments today, what is the primary emotion that stays with you most strongly?",
        isCrisisDetected: false,
      });
    } catch (genError: any) {
      console.log('Notice: Gemini service fallback, providing heuristic companion response:', genError?.message);
      // Fallback empathetic response
      return res.json({
        acknowledgement: "Thank you for taking this quiet moment to put your day into words. Your reflection holds so much honesty.",
        clarifyingQuestion: "Looking back at the rhythm of your day, what was the primary emotion underneath everything you experienced?",
        isCrisisDetected: false,
      });
    }
  } catch (err: any) {
    console.error('Error in /api/journal/clarify:', err);
    res.status(500).json({ error: 'Unable to process clarifying question.' });
  }
});

// Anime & Studio Ghibli Sticker Metadata for Reflection Seals
const STICKER_METADATA: Record<string, { id: string; name: string; japaneseName: string; meaning: string; theme: string }> = {
  ramen: { id: 'ramen', name: 'Ichiraku Ramen', japaneseName: '一楽ラーメン', meaning: 'Deep comfort, nourishing warmth & joyful recovery', theme: 'Naruto Classic' },
  calcifer: { id: 'calcifer', name: 'Calcifer Hearth Spirit', japaneseName: 'カルシファーの炎', meaning: 'Bright vitality, creative spark & playful warmth', theme: 'Ghibli Hearth' },
  leaf: { id: 'leaf', name: 'Konoha Whimsical Leaf', japaneseName: '木の葉の意志', meaning: 'Serene grounding, natural stillness & resilient spirit', theme: 'Hidden Leaf' },
  sootsprite: { id: 'sootsprite', name: 'Susuwatari Star Sprite', japaneseName: 'ススワタリと金平糖', meaning: 'Gentle wonder, quiet hope & tender self-care', theme: 'Ghibli Wonder' },
  kitsune: { id: 'kitsune', name: 'Kurama Nine-Tails Fox', japaneseName: 'おやすみ九尾', meaning: 'Peaceful restorative sleep, safety & deep rest', theme: 'Nine-Tails Rest' },
  totoro: { id: 'totoro', name: 'Forest Guardian', japaneseName: '森の守り神', meaning: 'Deep shelter, mindful presence & soothing sanctuary', theme: 'Ghibli Nature' },
  origami: { id: 'origami', name: 'Shikigami Sky Bird', japaneseName: '式神の折り鶴', meaning: 'Clarity, release of burdens & soaring focus', theme: 'Ninja Paper Art' },
  dango: { id: 'dango', name: 'Hanami Sweet Dango', japaneseName: '花見だんご', meaning: 'Savoring the present, sweetness & simple gratitude', theme: 'Leaf Village' },
};

// Step 2: Analyze emotion, map to geotagged context, generate 2-3 tailored steps, and highlight location-mood patterns
app.post('/api/journal/analyze', async (req: Request, res: Response) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const text = typeof body.text === 'string' ? body.text.trim().slice(0, 10000) : '';
    const clarifyingQuestion = typeof body.clarifyingQuestion === 'string' ? body.clarifyingQuestion.slice(0, 1000) : '';
    const emotionResponse = typeof body.emotionResponse === 'string' ? body.emotionResponse.trim().slice(0, 5000) : '';
    const location = body.location && typeof body.location === 'object' ? body.location : {};
    const pastEntriesSummary = Array.isArray(body.pastEntriesSummary) ? body.pastEntriesSummary.slice(0, 20) : [];

    if (!text || !emotionResponse) {
      return res.status(400).json({ error: 'Both journal text and emotion response are required.' });
    }

    // Acute crisis check across text and emotion response
    if (scanForCrisisKeywords(text) || scanForCrisisKeywords(emotionResponse)) {
      return res.json({
        sentiment: "Seeking Support",
        moodScore: 3,
        primaryEmotion: "overwhelmed",
        emotionalSummary: "We notice you are going through a deeply distressing moment. Your safety and wellbeing are paramount.",
        suggestions: [
          "Call or text 988 to connect with a compassionate crisis counselor (free and confidential)",
          "Reach out to a trusted loved one, family member, or friend and let them know you need support",
          "Sit in a safe, quiet space and take slow, grounding breaths"
        ],
        locationPatternNote: "Your safety comes first wherever you are.",
        isCrisisDetected: true,
        crisisMessage: CRISIS_HELPLINE_MESSAGE,
      });
    }

    const placeDetails = [location.placeName, location.neighborhood, location.city].filter(Boolean).join(', ') || 'Local setting';
    const placeType = location.placeCategory || 'general';

    const historyPrompt = pastEntriesSummary.length > 0
      ? `Past user history (place -> mood -> score):\n${pastEntriesSummary.map((p: any) => `- Place: ${p.placeName || p.placeCategory || 'Unknown'}, Mood: ${p.primaryEmotion || p.sentiment}, Score: ${p.moodScore}/10`).join('\n')}`
      : 'No prior entries recorded yet.';

    const systemPrompt = `You are a clinical, compassionate psychological wellbeing analyst and environment synthesizer.
You analyze the user's journal entry, their answer to an emotional clarifying question, and their geotagged physical context.
Your tasks:
1. Determine their primary emotional tone (choose strictly from: 'joyful', 'calm', 'reflective', 'anxious', 'fatigued', 'overwhelmed', 'grateful', 'restless').
2. Provide a 1-2 sentence high-level sentiment label (e.g., "Thoughtful and seeking grounding", "Gently exhausted but hopeful").
3. Assign a moodScore from 1 (lowest wellbeing / highest distress) to 10 (highest vitality & joy).
4. Provide a 2-3 sentence empathetic emotionalSummary connecting what happened to how they felt.
5. Provide 2–3 actionable, gentle mood-boosting steps specifically tailored to their current environment (${placeDetails}, category: ${placeType}). For example, if near a park, suggest taking in fresh greenery or sunlight; if at a cafe, suggest savoring a warm beverage; if at home, suggest dimming harsh overhead lights or stretching.
6. Check the user's past records history and write a short location-mood pattern observation (e.g. "Looking at your journal history, you tend to feel more energetic when journaling near green park locations" or a supportive note if this is their first entry).

7. Pick the best matching animated anime or Studio Ghibli styled sticker seal for this reflection (choose strictly from: 'ramen' [cozy comfort, nourishment, or general reflection], 'calcifer' [vitality, joy, fire, warmth], 'leaf' [calm, nature, or serene grounding], 'sootsprite' [gentle wonder, dealing with overwhelm or anxiousness], 'kitsune' [cozy sleep, resting, fatigue recovery], 'totoro' [deep peace, nature sanctuary, gratefulness], 'origami' [clarity, focus, releasing restlessness], 'dango' [celebrating sweet moments & gratitude]).

Output strictly valid JSON with this schema:
{
  "sentiment": "string",
  "moodScore": number,
  "primaryEmotion": "joyful" | "calm" | "reflective" | "anxious" | "fatigued" | "overwhelmed" | "grateful" | "restless",
  "emotionalSummary": "string",
  "suggestions": ["step 1", "step 2", "step 3"],
  "locationPatternNote": "string",
  "stickerId": "ramen" | "calcifer" | "leaf" | "sootsprite" | "kitsune" | "totoro" | "origami" | "dango"
}`;

    const userPrompt = `<OriginalEntry>
${text}
</OriginalEntry>
<ClarifyingQuestion>
${clarifyingQuestion}
</ClarifyingQuestion>
<UserEmotionAnswer>
${emotionResponse}
</UserEmotionAnswer>
<CurrentLocation>
${placeDetails} (Category: ${placeType}, Lat: ${location.latitude ?? 'N/A'}, Lng: ${location.longitude ?? 'N/A'})
</CurrentLocation>
<PastHistory>
${historyPrompt}
</PastHistory>`;

    try {
      const responseText = await generateContentWithFallback({
        systemInstruction: systemPrompt,
        contents: userPrompt,
        temperature: 0.5,
        responseMimeType: 'application/json',
      });

      const parsed = JSON.parse(responseText.trim());
      const stickerKey = (parsed.stickerId && STICKER_METADATA[parsed.stickerId]) ? parsed.stickerId : (
        parsed.primaryEmotion === 'joyful' ? 'calcifer' :
        parsed.primaryEmotion === 'calm' ? 'leaf' :
        parsed.primaryEmotion === 'fatigued' ? 'kitsune' :
        parsed.primaryEmotion === 'anxious' || parsed.primaryEmotion === 'overwhelmed' ? 'sootsprite' :
        parsed.primaryEmotion === 'grateful' ? 'dango' :
        parsed.primaryEmotion === 'restless' ? 'origami' : 'ramen'
      );

      return res.json({
        sentiment: parsed.sentiment || "Reflective & Centering",
        moodScore: typeof parsed.moodScore === 'number' ? Math.max(1, Math.min(10, parsed.moodScore)) : 7,
        primaryEmotion: parsed.primaryEmotion || "reflective",
        emotionalSummary: parsed.emotionalSummary || "You took time to honor your emotions and process what resonated most today.",
        suggestions: Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0
          ? parsed.suggestions.slice(0, 3)
          : [
              `Take 3 slow breaths and absorb the quiet of ${placeDetails}.`,
              "Drink a glass of fresh water or warm herbal tea to hydrate.",
              "Unclench your shoulders and stretch gently."
            ],
        locationPatternNote: parsed.locationPatternNote || `Reflecting around ${placeDetails} provides a grounding anchor for your diary journey.`,
        isCrisisDetected: false,
        sticker: STICKER_METADATA[stickerKey] || STICKER_METADATA.ramen,
      });
    } catch (genError: any) {
      console.log('Notice: Gemini service fallback in analyze, applying heuristic wellbeing synthesis:', genError?.message);
      // Determine heuristic emotion from text
      const lower = (text + ' ' + emotionResponse).toLowerCase();
      let primaryEmotion = 'reflective';
      let moodScore = 7;
      let sentiment = 'Thoughtful & Centered';
      let stickerKey = 'ramen';

      if (lower.match(/\b(happy|joy|grateful|excited|love|proud|amazing|blessed)\b/)) {
        primaryEmotion = 'joyful';
        moodScore = 9;
        sentiment = 'Bright & Uplifted';
        stickerKey = 'calcifer';
      } else if (lower.match(/\b(tired|exhausted|drained|burnout|sleepy|fatigue)\b/)) {
        primaryEmotion = 'fatigued';
        moodScore = 5;
        sentiment = 'Gentle Fatigue';
        stickerKey = 'kitsune';
      } else if (lower.match(/\b(anxious|stress|worried|nervous|panic|deadline)\b/)) {
        primaryEmotion = 'anxious';
        moodScore = 4;
        sentiment = 'Anxious Seeking Grounding';
        stickerKey = 'sootsprite';
      } else if (lower.match(/\b(peace|calm|quiet|relaxed|still)\b/)) {
        primaryEmotion = 'calm';
        moodScore = 8;
        sentiment = 'Serene & Peaceful';
        stickerKey = 'leaf';
      }

      return res.json({
        sentiment,
        moodScore,
        primaryEmotion,
        emotionalSummary: `Your reflections illuminate an honest awareness of today's rhythm, honoring both your effort and your emotional needs.`,
        suggestions: [
          `Take 60 seconds to step away from screens and observe your surroundings near ${placeDetails}.`,
          `Place one hand on your chest, inhale deeply for four counts, and exhale slowly for six.`,
          `Sip a warm drink and acknowledge yourself for writing today.`
        ],
        locationPatternNote: `Journaling around ${placeDetails} is becoming a mindful sanctuary for checking in with yourself.`,
        isCrisisDetected: false,
        sticker: STICKER_METADATA[stickerKey] || STICKER_METADATA.ramen,
      });
    }
  } catch (err: any) {
    console.error('Error in /api/journal/analyze:', err);
    res.status(500).json({ error: 'Unable to analyze journal entry.' });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ganbatte Journal server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
