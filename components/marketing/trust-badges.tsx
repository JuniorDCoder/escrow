import { ShieldCheck, FileLock2, ScrollText, UserCheck } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

const BADGES = [
  {
    icon: UserCheck,
    title: "Human-verified payments",
    body: "No auto-release on a webhook. A real person checks every proof of payment before funds are marked secured.",
  },
  {
    icon: ShieldCheck,
    title: "Row-level security",
    body: "Every record is access-controlled at the database layer — a Buyer can never query another user's transaction.",
  },
  {
    icon: FileLock2,
    title: "Private file storage",
    body: "Payment proofs and ID documents are never public. They're served only via short-lived signed links you control.",
  },
  {
    icon: ScrollText,
    title: "Full audit trail",
    body: "Every admin action — a verification, a resolution, a forced status change — is permanently logged.",
  },
];

export function TrustBadges() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {BADGES.map((b, i) => (
        <Reveal key={b.title} delay={i * 0.08}>
          <div className="h-full rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <b.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="font-medium">{b.title}</p>
            <p className="mt-1.5 text-sm text-muted-foreground">{b.body}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
