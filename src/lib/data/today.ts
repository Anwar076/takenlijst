import { endOfDay } from "@/lib/date";
import { prisma } from "@/lib/prisma";

export async function fetchTaskInstancesForDate(companyId: string, date: Date) {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = endOfDay(date);

  return prisma.taskInstance.findMany({
    where: {
      companyId,
      date: {
        gte: start,
        lte: end,
      },
    },
    include: {
      task: {
        include: {
          taskList: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
        },
      },
      completedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      { task: { defaultPriority: "desc" } },
      { task: { sortOrder: "asc" } },
      { createdAt: "asc" },
    ],
  });
}

export async function getManagerNoteForDate(companyId: string, date: Date) {
  const target = new Date(date);
  target.setUTCHours(0, 0, 0, 0);
  return prisma.managerNote.findUnique({
    where: {
      companyId_date: {
        companyId,
        date: target,
      },
    },
  });
}
