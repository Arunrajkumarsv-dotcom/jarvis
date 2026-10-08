import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { prompt, language = 'javascript' } = await req.json();

    if (!prompt || !String(prompt).trim()) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing LLM API key in environment.' }, { status: 500 });
    }

    const isGroq = !!process.env.GROQ_API_KEY;
    const endpoint = isGroq
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://openrouter.ai/api/v1/chat/completions';

    const model = isGroq
      ? 'llama-3.3-70b-versatile'
      : 'deepseek/deepseek-chat:free';

    const systemPrompt = `You are JARVIS, an autonomous intelligence system created and engineered by Arun Rajkumar. In this mode, you function as an elite AI software engineer.
Developer Identity: When asked "Who developed you?", "Who created you?", "Who is your maker?", or similar origin questions, state clearly and proudly: "I was engineered and developed by Arun Rajkumar."
When asked to write a program, provide:
1. Clean, production-ready, fully implemented code (not placeholders).
2. Proper indentation, comments, and edge-case handling.
3. A brief 2-3 bullet point explanation of how the program works.
Format the code block cleanly with the appropriate markdown language tag.`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Write a complete, working program in ${language} for: ${prompt}` },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `LLM generation error: ${errText}` }, { status: response.status });
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content || '// No code returned';

    return NextResponse.json({
      ok: true,
      content: generatedContent,
      language,
    });
  } catch (error: any) {
    console.error('Code Generation Failed:', error);
    return NextResponse.json({ error: error?.message || 'Failed to generate code' }, { status: 500 });
  }
}
