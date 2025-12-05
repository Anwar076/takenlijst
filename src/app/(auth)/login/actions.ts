"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const initialState: LoginState = { status: "idle" };

export { initialState as loginInitialState };

export async function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please provide a valid email and password.",
    };
  }

  try {
    const redirectTo = formData.get("redirectTo")?.toString() || "/today";
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirectTo,
    });
    return { status: "success" };
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { status: "error", message: "Invalid email or password." };
      }
      return { status: "error", message: "Unable to sign you in." };
    }
    throw error;
  }
}
