import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logNotConfigured } from "@/lib/server/env";

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    logNotConfigured("OPENAI_API_KEY");
    return NextResponse.json({ text: "", not_configured: "OPENAI_API_KEY" });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  if (!file) {
    return NextResponse.json({ text: "" });
  }

  // Forward to OpenAI Whisper
  const whisperForm = new FormData();
  whisperForm.append("model", "whisper-1");
  whisperForm.append("file", file);

  try {
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: whisperForm,
    });
    const data = await res.json();
    return NextResponse.json({ text: data.text || "" });
  } catch (e) {
    console.error("[Coach] Whisper error:", e);
    return NextResponse.json({ text: "" });
  }
}
