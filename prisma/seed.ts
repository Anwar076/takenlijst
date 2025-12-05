import bcrypt from "bcryptjs";
import {
  TaskFrequency,
  TaskPriority,
  UserRole,
  PrismaClient,
} from "../src/generated/prisma";

const prisma = new PrismaClient();

const today = new Date();
today.setUTCHours(0, 0, 0, 0);

async function main() {
  console.log("🌱 Seeding TaskFlow demo data...");

  await prisma.taskInstance.deleteMany();
  await prisma.task.deleteMany();
  await prisma.taskList.deleteMany();
  await prisma.managerNote.deleteMany();
  await prisma.aiImport.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  const company = await prisma.company.create({
    data: {
      name: "Acme Kitchens",
    },
  });

  const [manager, member] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Maya Manager",
        email: "maya.manager@example.com",
        role: UserRole.MANAGER,
        hashedPassword: await bcrypt.hash("password123", 10),
        companyId: company.id,
      },
    }),
    prisma.user.create({
      data: {
        name: "Miles Member",
        email: "miles.member@example.com",
        role: UserRole.MEMBER,
        hashedPassword: await bcrypt.hash("password123", 10),
        companyId: company.id,
      },
    }),
  ]);

  const kitchenList = await prisma.taskList.create({
    data: {
      name: "Daily Kitchen Checklist",
      description: "Opening duties for the morning crew",
      location: "Kitchen",
      defaultFrequency: TaskFrequency.DAILY,
      companyId: company.id,
      createdByUserId: manager.id,
    },
  });

  const fridgeList = await prisma.taskList.create({
    data: {
      name: "Weekly Food Safety",
      description: "Deep cleaning and temperature checks",
      defaultFrequency: TaskFrequency.WEEKLY,
      companyId: company.id,
      createdByUserId: manager.id,
    },
  });

  const sanitizeCounters = await prisma.task.create({
    data: {
      title: "Sanitize all prep counters",
      description: "Use food-safe sanitizer and log completion",
      category: "cleaning",
      defaultFrequency: TaskFrequency.DAILY,
      defaultPriority: TaskPriority.HIGH,
      taskListId: kitchenList.id,
    },
  });

  const prepProduce = await prisma.task.create({
    data: {
      title: "Prep produce bins",
      description: "Wash and restock salad bar bins",
      category: "prep",
      defaultFrequency: TaskFrequency.DAILY,
      defaultPriority: TaskPriority.NORMAL,
      taskListId: kitchenList.id,
    },
  });

  const checkFridge = await prisma.task.create({
    data: {
      title: "Record walk-in temperatures",
      description: "Log high/low and flag issues",
      category: "safety",
      defaultFrequency: TaskFrequency.WEEKLY,
      defaultPriority: TaskPriority.HIGH,
      taskListId: fridgeList.id,
    },
  });

  await prisma.taskInstance.createMany({
    data: [
      {
        companyId: company.id,
        taskId: sanitizeCounters.id,
        date: today,
        assignedToUserId: member.id,
      },
      {
        companyId: company.id,
        taskId: prepProduce.id,
        date: today,
        assignedToUserId: member.id,
      },
      {
        companyId: company.id,
        taskId: checkFridge.id,
        date: today,
        assignedToUserId: manager.id,
      },
    ],
  });

  await prisma.managerNote.create({
    data: {
      companyId: company.id,
      date: today,
      content: "Focus on cooler temps and prep speed today.",
      createdByUserId: manager.id,
    },
  });

  console.log("✅ Seed completed. Accounts:");
  console.log(" Manager: maya.manager@example.com / password123");
  console.log(" Member: miles.member@example.com / password123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
