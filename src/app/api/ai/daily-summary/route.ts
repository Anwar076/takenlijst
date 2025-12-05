import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { openai } from "@/lib/ai/openai";
import { parseDateParam, endOfDay } from "@/lib/date";

const SUMMARY_PROMPT = `You are an assistant that summarizes daily task performance.

Input:
- A JSON list of task instances for one day, including:
  - title
  - status: "OPEN" or "DONE" or "SKIPPED"
  - priority: "low", "normal", "high"
  - assignee_name

Goal:
- Write a short summary for the manager in simple English.
- Mention:
  - total tasks, done vs open
  - which high-priority tasks are still open
  - optionally, one or two suggestions for tomorrow

Output:
- 3–6 short sentences.`;

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const dateValue = typeof body.date === "string" ? body.date : undefined;
    const targetDate = parseDateParam(dateValue);
    const endDate = endOfDay(targetDate);

    const instances = await prisma.taskInstance.findMany({
      where: {
        companyId: user.companyId,
        date: {
          gte: targetDate,
          lte: endDate,
        },
      },
      select: {
        status: true,
        note: true,
        task: {
          select: {
            title: true,
            defaultPriority: true,
          },
        },
        assignedTo: {
          select: { name: true },
        },
      },
    });

    const payload = instances.map((instance) => ({
      title: instance.task.title,
      status: instance.status,
      priority: instance.task.defaultPriority.toLowerCase(),
      assignee_name: instance.assignedTo?.name ?? "Unassigned",
    }));

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: SUMMARY_PROMPT },
        { role: "user", content: [{ type: "input_text", text: JSON.stringify(payload) }] },
      ],
    });

    const summary = response.output_text;
    if (!summary) {
      return NextResponse.json({ error: "AI did not respond." }, { status: 500 });
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to generate summary." }, { status: 500 });
  }
}
