import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { type UserRole } from "@/generated/prisma";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

export async function requireRole(role: UserRole) {
  const user = await requireUser();
  if (user.role !== role) {
    throw new Error("Unauthorized");
  }
  return user;
}
