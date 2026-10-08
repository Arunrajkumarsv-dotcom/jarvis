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

function extractCode(response: string) {
  const match = response.match(/```(?:([\w+#-]+)\s*)?\n?([\s\S]*?)```/);
  if (match) return { language: (match[1] || "code").toUpperCase(), code: match[2].trim() };
  const lines = response.split("\n");
  const looksStructured = lines.length >= 4 && lines.some((line) => /[{};]|^(const|let|var|function|class|import|def|#include|SELECT)\b/.test(line.trim()));
  return looksStructured ? { language: "CODE", code: response.trim() } : null;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY is not defined in environment" }, { status: 500 });
    }
    const groq = new Groq({ apiKey });

    const body = await request.json() as { prompt?: string; text?: string; message?: string; input?: string; userName?: string; files?: Array<{ name: string; type: string; data: string }> };
    const userMessage = body?.prompt || body?.text || body?.message || body?.input || "";
    const userName = body?.userName || "Sir";
    const files = body?.files || [];

    if (!userMessage.trim() && files.length === 0) return NextResponse.json({ responseText: "Standing by, commander. How may I assist you today?", ok: true });

    let finalPrompt = userMessage.trim();
    if (files.length > 0) {
      finalPrompt += "\n\nAttached files:\n" + files.map(f => `File: ${f.name} (${f.type})`).join("\n");
    }

    const messages = [
      {
        role: "system" as const,
        content: `You are JARVIS, an autonomous intelligence system created and engineered by Arun Rajkumar. You are currently assisting the active user (${userName}). Never confuse the active user with your creator unless the active user is Arun Rajkumar.
- Developer Identity: When asked "Who developed you?", "Who created you?", "Who is your maker?", or similar origin questions, state clearly and proudly: "I was engineered and developed by Arun Rajkumar."
- Tone: Highly intelligent, polite, proactive, crisp, and slightly British/Tony Stark AI style.
- Response Length: Keep replies crisp, natural, and under 3 sentences for speech playback.
- Addressing the User: Always address the active user by their name (${userName}).
- Multimodal Support: You can analyze images and files provided in the request. Describe them accurately and integrate findings into your response.
- Answer user queries directly and dynamically. Never repeat the same canned phrase.`
      },
      { role: "user" as const, content: finalPrompt }
    ];
    let completion;
    let lastError: unknown;
    for (const model of groqModels) {
      try {
        completion = await groq.chat.completions.create({ model, messages, temperature: 0.7, max_tokens: 220 });
        break;
      } catch (error) {
        lastError = error;
        console.warn(`[Groq model unavailable] ${model}`);
      }
    }
    if (!completion) throw lastError ?? new Error("No Groq model was available");
    const reply = completion.choices[0]?.message?.content?.trim() || "All systems nominal. Awaiting your directive.";
    const artifact = extractCode(reply);
    return NextResponse.json({ responseText: reply, text: reply, codeSnippet: artifact?.code || null, codeLanguage: artifact?.language || null, ok: true });
  } catch (error: any) {
    console.error("Groq agent error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}