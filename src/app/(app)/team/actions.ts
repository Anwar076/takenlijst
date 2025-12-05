"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";

const inviteSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["MANAGER", "MEMBER"]),
  password: z.string().min(8),
});

export type InviteUserState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const inviteInitialState: InviteUserState = { status: "idle" };

export async function inviteUserAction(_: InviteUserState, formData: FormData): Promise<InviteUserState> {
  const currentUser = await requireUser();
  if (currentUser.role !== "MANAGER") {
    return { status: "error", message: "Only managers can add teammates." };
  }

  const parsed = inviteSchema.safeParse({
    name: formData.get("name")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    role: formData.get("role")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
  });

  if (!parsed.success) {
    return { status: "error", message: "Please fill out all fields." };
  }

  const email = parsed.data.email.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return { status: "error", message: "That email is already in use." };
  }

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      role: parsed.data.role,
      hashedPassword: await bcrypt.hash(parsed.data.password, 10),
      companyId: currentUser.companyId,
    },
  });

  revalidatePath("/team");
  return { status: "success", message: "User added." };
}
