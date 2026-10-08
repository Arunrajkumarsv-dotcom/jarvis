import { NextResponse } from "next/server";
import Groq, { toFile } from "groq-sdk";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY is not defined in environment" }, { status: 500 });
    }
    const groq = new Groq({ apiKey });

    const formData = await request.formData();
    const fileEntry = formData.get("file");
    if (!(fileEntry instanceof Blob)) return NextResponse.json({ error: "No audio file received" }, { status: 400 });
    const buffer = Buffer.from(await fileEntry.arrayBuffer());
    const uploadableFile = await toFile(buffer, "audio.webm", { type: fileEntry.type || "audio/webm" });
    const transcription = await groq.audio.transcriptions.create({
      file: uploadableFile,
      model: "whisper-large-v3-turbo",
      language: "en",
      response_format: "json"
    });
    return NextResponse.json({ text: transcription.text ? transcription.text.trim() : "" });
  } catch (error: any) {
    console.error("[Transcribe API Error]:", error);
    return NextResponse.json({ error: error.message || "Transcription failed" }, { status: 500 });
  }
}
