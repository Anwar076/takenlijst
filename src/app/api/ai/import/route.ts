import { NextResponse } from "next/server";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import pdf from "pdf-parse";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { openai } from "@/lib/ai/openai";

const IMPORT_PROMPT = `You are a task list extraction assistant.

Input:
- A plain text version of a document, image (OCR result), or spreadsheet that contains a checklist or list of tasks.

Goal:
- Extract all actionable tasks and return a clean, structured JSON list of tasks.

For each task, return:
- title: short task title
- description: optional longer description (if present)
- suggested_category: e.g. "cleaning", "opening", "closing", "safety", "admin"
- suggested_frequency: one of ["once", "daily", "weekly", "monthly", "unknown"]
- suggested_priority: one of ["low", "normal", "high"]

Rules:
- Ignore headers like "Checklist", "To do", dates, signatures.
- One bullet/row is usually one task.
- Be strict: only return real actionable tasks.
- Do NOT include any explanation, only JSON.

Output JSON format:
{
  "tasks": [
    {
      "title": "",
      "description": "",
      "suggested_category": "",
      "suggested_frequency": "",
      "suggested_priority": ""
    }
  ]
}`;

async function fileToText(file: File): Promise<{ text: string; isImage: boolean; isCsv: boolean }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = file.type || "application/octet-stream";
  const name = file.name?.toLowerCase() ?? "";

  if (mime.startsWith("image/")) {
    return { text: buffer.toString("base64"), isImage: true, isCsv: false };
  }

  if (mime.includes("csv") || name.endsWith(".csv")) {
    return { text: buffer.toString("utf8"), isImage: false, isCsv: true };
  }

  if (mime.includes("excel") || name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheets = workbook.SheetNames.map((sheetName) =>
      XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName], { blankrows: false }),
    );
    return { text: sheets.join("\n"), isImage: false, isCsv: true };
  }

  if (mime === "application/pdf" || name.endsWith(".pdf")) {
    const parsed = await pdf(buffer);
    return { text: parsed.text, isImage: false, isCsv: false };
  }

  return { text: buffer.toString("utf8"), isImage: false, isCsv: false };
}

function normalizeCsvText(raw: string) {
  const parsed = Papa.parse<string[]>(raw.trim());
  if (parsed.errors.length) {
    return raw;
  }
  return parsed.data.map((row) => row.filter(Boolean).join(" - ")).join("\n");
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (user.role !== "MANAGER") {
      return NextResponse.json({ error: "Only managers can import." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    const { text, isImage, isCsv } = await fileToText(file);
    if (!text) {
      return NextResponse.json({ error: "Unable to extract text." }, { status: 400 });
    }

    const preparedText = isImage ? text : isCsv ? normalizeCsvText(text) : text;

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      input: [
        {
          role: "system",
          content: IMPORT_PROMPT,
        },
        {
          role: "user",
          content: isImage
            ? [
                { type: "input_text", text: "Extract tasks from this checklist image." },
                { type: "input_image", image_url: `data:${file.type};base64,${preparedText}` },
              ]
            : [{ type: "input_text", text: preparedText }],
        },
      ],
    });

    const output = response.output?.[0]?.content?.[0];
    const textResult = output && "text" in output ? output.text : response.output_text;
    if (!textResult) {
      return NextResponse.json({ error: "AI did not return data." }, { status: 500 });
    }

    const parsed = JSON.parse(textResult);

    const importRecord = await prisma.aiImport.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        originalFileName: file.name,
        originalMimeType: file.type,
        extractedRawText: isImage ? null : preparedText,
        extractedJson: parsed,
        status: "COMPLETED",
      },
    });

    return NextResponse.json({ importId: importRecord.id, tasks: parsed.tasks ?? [] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to process file." }, { status: 500 });
  }
}
