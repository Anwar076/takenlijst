import { type DefaultSession } from "next-auth";
import { type UserRole } from "./src/generated/prisma";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
      companyId: string;
    };
  }

  interface User {
    id: string;
    role: UserRole;
    companyId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    companyId?: string;
  }
}
