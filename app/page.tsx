import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

// Placeholder — replaced by the full marketing landing page in a later pass.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-16 text-center">
      <h1 className="text-3xl font-semibold">{APP_NAME}</h1>
      <p className="max-w-md text-muted-foreground">
        Trusted third-party escrow — funds are held until both sides confirm the deal is done.
      </p>
      <div className="flex gap-3">
        <Link href="/auth/signup" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Get started
        </Link>
        <Link href="/auth/login" className="rounded-md border border-input px-4 py-2 text-sm font-medium">
          Log in
        </Link>
      </div>
    </main>
  );
}
