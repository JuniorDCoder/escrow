import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getIsAuthenticated } from "@/lib/data/auth";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getIsAuthenticated()) {
    const { next } = await searchParams;
    redirect(next || "/dashboard");
  }

  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
