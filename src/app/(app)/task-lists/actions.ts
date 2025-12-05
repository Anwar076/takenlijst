"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { triggerRealtimeEvent } from "@/lib/realtime/server";
import { parseDateParam } from "@/lib/date";

const listChannel = (companyId: string) => `taskflow-company-${companyId}-lists`;

const optionalText = z
  .string()
  .optional()
  .transform((value) => value?.trim())
  .transform((value) => (value ? value : null));

const listSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: optionalText,
  location: optionalText,
  groupName: optionalText,
  defaultFrequency: z.enum(["ONCE", "DAILY", "WEEKLY", "MONTHLY", "UNKNOWN"]).default("UNKNOWN"),
});

const taskSchema = z.object({
  taskListId: z.string().cuid(),
  title: z.string().min(2, "Title is required"),
  description: optionalText,
  category: optionalText,
  defaultFrequency: z.enum(["ONCE", "DAILY", "WEEKLY", "MONTHLY", "UNKNOWN"]).default("DAILY"),
  defaultPriority: z.enum(["LOW", "NORMAL", "HIGH"]).default("NORMAL"),
});

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const initialActionState: ActionState = { status: "idle" };

export async function createTaskListAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (user.role !== "MANAGER") {
    return { status: "error", message: "Only managers can create task lists." };
  }

  const parsed = listSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    location: formData.get("location"),
    groupName: formData.get("groupName"),
    defaultFrequency: formData.get("defaultFrequency"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await prisma.taskList.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      location: parsed.data.location,
      groupName: parsed.data.groupName,
      defaultFrequency: parsed.data.defaultFrequency,
      companyId: user.companyId,
      createdByUserId: user.id,
    },
  });

  revalidatePath("/task-lists");
  await triggerRealtimeEvent(listChannel(user.companyId), "task-lists:refresh", {});
  return { status: "success", message: "Task list created." };
}

const updateListSchema = listSchema.extend({
  id: z.string().cuid(),
});

export async function updateTaskListAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "MANAGER") {
    throw new Error("Unauthorized");
  }

  const parsed = updateListSchema.parse({
    id: formData.get("listId"),
    name: formData.get("name"),
    description: formData.get("description"),
    location: formData.get("location"),
    groupName: formData.get("groupName"),
    defaultFrequency: formData.get("defaultFrequency"),
  });

  const list = await prisma.taskList.findUnique({
    where: { id: parsed.id },
    select: { companyId: true },
  });

  if (!list || list.companyId !== user.companyId) {
    throw new Error("Task list not found");
  }

  await prisma.taskList.update({
    where: { id: parsed.id },
    data: {
      name: parsed.name,
      description: parsed.description,
      location: parsed.location,
      groupName: parsed.groupName,
      defaultFrequency: parsed.defaultFrequency,
    },
  });

  revalidatePath("/task-lists");
  await triggerRealtimeEvent(listChannel(user.companyId), "task-lists:refresh", {});
}

export async function deleteTaskListAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "MANAGER") {
    throw new Error("Unauthorized");
  }

  const listId = z.string().cuid().parse(formData.get("listId"));

  const list = await prisma.taskList.findUnique({
    where: { id: listId },
    select: { companyId: true },
  });

  if (!list || list.companyId !== user.companyId) {
    throw new Error("Task list not found");
  }

  await prisma.taskList.delete({ where: { id: listId } });

  revalidatePath("/task-lists");
  await triggerRealtimeEvent(listChannel(user.companyId), "task-lists:refresh", {});
}

export async function createTaskAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (user.role !== "MANAGER") {
    return { status: "error", message: "Only managers can add tasks." };
  }

  const parsed = taskSchema.safeParse({
    taskListId: formData.get("taskListId"),
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    defaultFrequency: formData.get("defaultFrequency"),
    defaultPriority: formData.get("defaultPriority"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const list = await prisma.taskList.findUnique({
    where: { id: parsed.data.taskListId },
    select: { companyId: true },
  });

  if (!list || list.companyId !== user.companyId) {
    return { status: "error", message: "Task list not found." };
  }

  await prisma.task.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      defaultFrequency: parsed.data.defaultFrequency,
      defaultPriority: parsed.data.defaultPriority,
      taskListId: parsed.data.taskListId,
    },
  });

  revalidatePath("/task-lists");
  await triggerRealtimeEvent(listChannel(user.companyId), "task-lists:refresh", {});
  return { status: "success", message: "Task added." };
}

const updateTaskSchema = taskSchema.extend({
  id: z.string().cuid(),
});

export async function updateTaskAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "MANAGER") {
    throw new Error("Unauthorized");
  }

  const parsed = updateTaskSchema.parse({
    id: formData.get("taskId"),
    taskListId: formData.get("taskListId"),
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    defaultFrequency: formData.get("defaultFrequency"),
    defaultPriority: formData.get("defaultPriority"),
  });

  const task = await prisma.task.findUnique({
    where: { id: parsed.id },
    select: { taskList: { select: { companyId: true } } },
  });

  if (!task || task.taskList.companyId !== user.companyId) {
    throw new Error("Task not found");
  }

  await prisma.task.update({
    where: { id: parsed.id },
    data: {
      title: parsed.title,
      description: parsed.description,
      category: parsed.category,
      defaultFrequency: parsed.defaultFrequency,
      defaultPriority: parsed.defaultPriority,
    },
  });

  revalidatePath("/task-lists");
  await triggerRealtimeEvent(listChannel(user.companyId), "task-lists:refresh", {});
}

export async function deleteTaskAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "MANAGER") {
    throw new Error("Unauthorized");
  }

  const taskId = z.string().cuid().parse(formData.get("taskId"));

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { taskList: { select: { companyId: true } } },
  });

  if (!task || task.taskList.companyId !== user.companyId) {
    throw new Error("Task not found");
  }

  await prisma.task.delete({ where: { id: taskId } });

  revalidatePath("/task-lists");
  await triggerRealtimeEvent(listChannel(user.companyId), "task-lists:refresh", {});
}

export async function generateTaskListInstancesAction(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "MANAGER") {
    throw new Error("Unauthorized");
  }

  const taskListId = z.string().cuid().parse(formData.get("taskListId"));
  const dateParam = (formData.get("date") ?? null) as string | null;
  const targetDate = parseDateParam(dateParam ?? undefined);

  const tasks = await prisma.task.findMany({
    where: {
      taskListId,
      taskList: { companyId: user.companyId },
      isActive: true,
      taskInstances: { none: { date: targetDate } },
    },
    select: { id: true },
  });

  if (tasks.length) {
    await prisma.taskInstance.createMany({
      data: tasks.map((task) => ({
        taskId: task.id,
        companyId: user.companyId,
        date: targetDate,
      })),
      skipDuplicates: true,
    });
  }

  revalidatePath("/task-lists");
  await triggerRealtimeEvent(listChannel(user.companyId), "task-lists:refresh", {});
}
