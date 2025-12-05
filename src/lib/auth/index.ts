import NextAuth, { type AuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { type UserRole } from "@/generated/prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type CredentialsUser = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  companyId: string;
};

const isCredentialsUser = (user: unknown): user is CredentialsUser => {
  return (
    !!user &&
    typeof user === "object" &&
    "role" in user &&
    "companyId" in user &&
    "id" in user
  );
};

const authConfig: AuthConfig = {
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          select: {
            id: true,
            name: true,
            email: true,
            hashedPassword: true,
            role: true,
            companyId: true,
          },
        });

        if (!user) {
          return null;
        }

        const isValid = await compare(parsed.data.password, user.hashedPassword);
        if (!isValid) {
          return null;
        }

        const authUser: CredentialsUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId,
        };
        return authUser;
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user && isCredentialsUser(user)) {
        token.role = user.role;
        token.companyId = user.companyId;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = (token.role as UserRole) ?? "MEMBER";
        session.user.companyId = (token.companyId as string) ?? "";
      }
      return session;
    },
  },
};

export const { handlers: authHandlers, auth, signIn, signOut } = NextAuth(authConfig);
