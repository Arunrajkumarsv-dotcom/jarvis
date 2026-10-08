import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({ status: "ONLINE", latency: "42ms", core: "GROQ_LPU_ACTIVE", version: "v3.0.4" });
}