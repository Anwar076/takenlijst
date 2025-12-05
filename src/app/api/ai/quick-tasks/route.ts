import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { openai } from "@/lib/ai/openai";

const QUICK_PROMPT = `You are an assistant that converts natural language into task items.

Input: a short paragraph where a manager describes tasks in free text.

Output: JSON array of tasks with:
- title
- due_date (if a specific date is mentioned; ISO 8601; otherwise null)
- suggested_frequency: ["once", "daily", "weekly", "monthly", "unknown"]
- suggested_priority: ["low", "normal", "high"]

Keep titles short and clear.

Return only JSON.`;

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) {
      return NextResponse.json({ error: "Text is required." }, { status: 400 });
    }

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      input: [
        { role: "system", content: QUICK_PROMPT },
        { role: "user", content: [{ type: "input_text", text }] },
      ],
    });

    const textResult = response.output_text;
    if (!textResult) {
      return NextResponse.json({ error: "AI did not respond." }, { status: 500 });
    }

    const parsed = JSON.parse(textResult);
    return NextResponse.json({ tasks: Array.isArray(parsed.tasks) ? parsed.tasks : parsed });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to process text." }, { status: 500 });
  }
}
