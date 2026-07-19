import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";
import { getIsAuthenticated } from "@/lib/data/auth";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getIsAuthenticated()) {
    const { next } = await searchParams;
    redirect(next || "/dashboard");
  }

  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
