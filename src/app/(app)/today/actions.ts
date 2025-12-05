"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { formatDateParam, parseDateParam } from "@/lib/date";
import { Prisma, type TaskStatus } from "@/generated/prisma";
import { triggerRealtimeEvent } from "@/lib/realtime/server";

const todayChannel = (companyId: string, date: string) => `taskflow-company-${companyId}-day-${date}`;

const updateTaskInstanceSchema = z.object({
  id: z.string().cuid(),
  status: z.enum(["OPEN", "DONE", "SKIPPED"]).optional(),
  note: z.string().max(400).optional(),
  date: z.string().optional(),
});

export async function updateTaskInstanceAction(input: z.infer<typeof updateTaskInstanceSchema>) {
  const user = await requireUser();
  const parsed = updateTaskInstanceSchema.parse(input);

  const instance = await prisma.taskInstance.findUnique({
    where: { id: parsed.id },
    select: { companyId: true },
  });

  if (!instance || instance.companyId !== user.companyId) {
    throw new Error("Task not found");
  }

  const data: Prisma.TaskInstanceUpdateInput = {};

  if (parsed.status) {
    data.status = parsed.status as TaskStatus;
    data.completedAt = parsed.status === "DONE" ? new Date() : null;
    data.completedByUserId = parsed.status === "DONE" ? user.id : null;
  }

  if (parsed.note !== undefined) {
    data.note = parsed.note.length ? parsed.note : null;
  }

  if (Object.keys(data).length === 0) {
    return { ok: true };
  }

  await prisma.taskInstance.update({
    where: { id: parsed.id },
    data,
  });

  const dateParam = parsed.date ?? formatDateParam(new Date());
  revalidatePath(`/today?date=${dateParam}`);
  await triggerRealtimeEvent(todayChannel(user.companyId, dateParam), "task-instance:refresh", {
    id: parsed.id,
  });
  return { ok: true };
}

const managerNoteSchema = z.object({
  content: z.string().max(2000),
  date: z.string(),
});

export async function upsertManagerNoteAction(input: z.infer<typeof managerNoteSchema>) {
  const user = await requireUser();
  if (user.role !== "MANAGER") {
    throw new Error("Only managers can update the note");
  }

  const parsed = managerNoteSchema.parse(input);
  const noteDate = parseDateParam(parsed.date);

  await prisma.managerNote.upsert({
    where: {
      companyId_date: {
        companyId: user.companyId,
        date: noteDate,
      },
    },
    update: {
      content: parsed.content,
      createdByUserId: user.id,
    },
    create: {
      companyId: user.companyId,
      content: parsed.content,
      createdByUserId: user.id,
      date: noteDate,
    },
  });

  revalidatePath(`/today?date=${parsed.date}`);
  await triggerRealtimeEvent(todayChannel(user.companyId, parsed.date), "manager-note:update", {});
  return { ok: true };
}

const generateSchema = z.object({
  date: z.string(),
});

export async function generateTaskInstancesAction(input: z.infer<typeof generateSchema>) {
  const user = await requireUser();
  if (user.role !== "MANAGER") {
    throw new Error("Only managers can generate tasks");
  }

  const parsed = generateSchema.parse(input);
  const date = parseDateParam(parsed.date);

  const tasks = await prisma.task.findMany({
    where: {
      isActive: true,
      taskList: {
        companyId: user.companyId,
      },
      taskInstances: {
        none: { date },
      },
    },
    select: { id: true },
  });

  if (!tasks.length) {
    return { created: 0 };
  }

  await prisma.taskInstance.createMany({
    data: tasks.map((task) => ({
      taskId: task.id,
      companyId: user.companyId,
      date,
    })),
    skipDuplicates: true,
  });

  revalidatePath(`/today?date=${parsed.date}`);
  await triggerRealtimeEvent(todayChannel(user.companyId, parsed.date), "task-instance:refresh", {
    created: tasks.length,
  });
  return { created: tasks.length };
}
