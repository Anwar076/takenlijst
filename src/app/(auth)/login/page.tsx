import type { Metadata } from "next";
import { LoginForm } from "./login-form";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "Sign in • TaskFlow",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo = typeof params?.redirectTo === "string" ? params.redirectTo : undefined;
  return <LoginForm redirectTo={redirectTo} />;
}
