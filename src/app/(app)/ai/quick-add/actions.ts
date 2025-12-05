"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { mapFrequency, mapPriority } from "../task-utils";

const aiTaskArraySchema = z.array(
  z.object({
    title: z.string().min(1),
    description: z.string().optional().nullable(),
    suggested_category: z.string().optional().nullable(),
    suggested_frequency: z.string().optional().nullable(),
    suggested_priority: z.string().optional().nullable(),
  }),
);

export async function addAiTasksToExistingListAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "MANAGER") {
    throw new Error("Only managers can update tasks.");
  }

  const listId = z.string().cuid().parse(formData.get("taskListId"));
  const tasksRaw = formData.get("tasks")?.toString() ?? "[]";
  const parsedTasks = aiTaskArraySchema.parse(JSON.parse(tasksRaw));

  const list = await prisma.taskList.findUnique({
    where: { id: listId },
    select: { companyId: true },
  });

  if (!list || list.companyId !== user.companyId) {
    throw new Error("Task list not found.");
  }

  if (!parsedTasks.length) {
    return { added: 0 };
  }

  await prisma.task.createMany({
    data: parsedTasks.map((task, index) => ({
      title: task.title,
      description: task.description ?? null,
      category: task.suggested_category ?? null,
      defaultFrequency: mapFrequency(task.suggested_frequency),
      defaultPriority: mapPriority(task.suggested_priority),
      taskListId: listId,
      sortOrder: index,
    })),
  });

  revalidatePath("/task-lists");
  revalidatePath("/today");

  return { added: parsedTasks.length };
}
