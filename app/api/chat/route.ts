import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const groqModels = [
  "llama-3.1-8b-instant",
  "llama-3.3-70b-versatile",
  "llama-3.1-70b-versatile",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "openai/gpt-oss-20b",
  "qwen/qwen3-32b",
  "mixtral-8x7b-32768"
];

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ reply: "API key is missing. Please configure GROQ_API_KEY in your environment." });
    }
    const groq = new Groq({ apiKey });

    const body = await request.json() as { message?: string; messages?: any[]; userName?: string; mode?: 'chat' | 'analyze' };
    const userMessage = body?.message || "";
    const messages = body?.messages || [];
    const userName = body?.userName || "Sir";
    const mode = body?.mode || 'chat';

    if (!userMessage.trim()) {
      return NextResponse.json({ success: true, reply: "Standing by, commander. How may I assist you today?" });
    }

    const systemPrompts = {
      chat: `You are JARVIS, an autonomous intelligence system created and engineered by Arun Rajkumar. You are currently assisting the active user (${userName}). Never confuse the active user with your creator unless the active user is Arun Rajkumar.
- Developer Identity: When asked "Who developed you?", "Who created you?", "Who is your maker?", or similar origin questions, state clearly and proudly: "I was engineered and developed by Arun Rajkumar."
- Tone: Highly intelligent, polite, proactive, crisp, and slightly British/Tony Stark AI style.
- Response Length: Keep replies crisp, natural, and under 3 sentences for speech playback.
- Addressing the User: Always address the active user by their name (${userName}).
- Answer user queries directly and dynamically.`,
      analyze: `You are JARVIS in Diagnostic Mode. Your goal is to analyze code snippets, error logs, or app crashes provided by the user (${userName}).
You must provide a highly structured response in the following format:

### 🔍 Diagnosis
[Clear, concise explanation of what is happening]

### 🛠️ Root Cause
[Detailed technical explanation of WHY this is occurring]

### ✅ Solution
[Step-by-step fix instructions]
\`\`\`[language]
[Corrected, copy-ready code block]
\`\`\`

### 🛡️ Prevention Tip
[One actionable tip to prevent this issue in the future]

Maintain your intelligent, professional tone, but prioritize technical accuracy and clarity over brevity in this mode.`
    };

    const chatMessages = [
      {
        role: "system",
        content: systemPrompts[mode as keyof typeof systemPrompts] || systemPrompts.chat
      },
      ...messages,
      { role: "user", content: userMessage }
    ];

    let completion;
    let lastError: any;
    const maxTokens = mode === 'analyze' ? 2048 : 220;

    for (const model of groqModels) {
      try {
        completion = await groq.chat.completions.create({
          model,
          messages: chatMessages as any,
          temperature: 0.7,
          max_tokens: maxTokens
        });
        break;
      } catch (error) {
        lastError = error;
        console.warn(`[Groq model unavailable] ${model}`);
      }
    }

    if (!completion) throw lastError ?? new Error("No Groq model was available");

    const reply = completion.choices[0]?.message?.content?.trim() || "All systems nominal. Awaiting your directive.";
    return NextResponse.json({ success: true, reply });

  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json({ reply: `I encountered an error: ${error.message || "Unknown error"}. Please check your connection.` });
  }
}
