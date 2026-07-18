import { ShieldCheck, UserCheck, FileLock2, ScrollText } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

const POINTS = [
  { icon: UserCheck, text: "Every payment is checked by a real person before funds are secured." },
  { icon: ShieldCheck, text: "Row-level security keeps every transaction visible only to its two parties." },
  { icon: FileLock2, text: "Payment proofs stay private — never shared with the other side." },
  { icon: ScrollText, text: "Every admin action is permanently logged for a full audit trail." },
];

export function AuthSidePanel() {
  return (
    <div className="relative hidden h-full flex-col justify-center overflow-hidden bg-primary px-12 py-16 text-primary-foreground lg:flex">
      <div className="bg-dot-grid absolute inset-0 opacity-20" aria-hidden="true" />
      <div
        className="animate-blob absolute -left-20 top-10 -z-0 h-72 w-72 rounded-full bg-secured/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="animate-blob absolute -right-16 bottom-10 -z-0 h-72 w-72 rounded-full bg-white/10 blur-3xl"
        style={{ animationDelay: "3s" }}
        aria-hidden="true"
      />

      <div className="relative max-w-sm">
        <div className="animate-float-slow mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
          <ShieldCheck className="h-8 w-8" strokeWidth={1.75} />
        </div>
        <h2 className="text-3xl font-semibold leading-tight tracking-tight">Deals you can actually trust.</h2>
        <p className="mt-3 text-primary-foreground/75">
          {APP_NAME} holds the money in the middle so neither side has to go first on faith alone.
        </p>

        <ul className="mt-10 space-y-5">
          {POINTS.map((p) => (
            <li key={p.text} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10">
                <p.icon className="h-3.5 w-3.5" />
              </span>
              <span className="text-sm text-primary-foreground/85">{p.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
