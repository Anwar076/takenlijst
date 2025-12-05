"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { mapFrequency, mapPriority } from "../task-utils";

const aiTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  suggested_category: z.string().optional().nullable(),
  suggested_frequency: z.string().optional().nullable(),
  suggested_priority: z.string().optional().nullable(),
});

export async function createListFromAiAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "MANAGER") {
    throw new Error("Only managers can create lists.");
  }

  const name = (formData.get("name") ?? "").toString().trim();
  const tasksPayload = formData.get("tasks")?.toString() ?? "[]";
  const importId = formData.get("importId")?.toString();

  if (!name) {
    throw new Error("List name is required.");
  }

  const parsedTasks = z.array(aiTaskSchema).parse(JSON.parse(tasksPayload));

  const list = await prisma.taskList.create({
    data: {
      name,
      companyId: user.companyId,
      createdByUserId: user.id,
      tasks: {
        create: parsedTasks.map((task, index) => ({
          title: task.title,
          description: task.description ?? null,
          category: task.suggested_category ?? null,
          defaultFrequency: mapFrequency(task.suggested_frequency),
          defaultPriority: mapPriority(task.suggested_priority),
          sortOrder: index,
        })),
      },
    },
  });

  if (importId) {
    await prisma.aiImport.update({
      where: { id: importId },
      data: { status: "COMPLETED" },
    });
  }

  revalidatePath("/task-lists");
  revalidatePath("/today");

  return { listId: list.id };
}
