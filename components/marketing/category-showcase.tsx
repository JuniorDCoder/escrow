import Link from "next/link";
import { Globe2, Car, Laptop2, Briefcase, Bitcoin, Package, Boxes } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

const CATEGORIES = [
  { icon: Globe2, label: "Domain Names" },
  { icon: Car, label: "Vehicles" },
  { icon: Laptop2, label: "Digital Goods" },
  { icon: Briefcase, label: "Services" },
  { icon: Bitcoin, label: "Crypto Assets" },
  { icon: Package, label: "Merchandise" },
  { icon: Boxes, label: "And more" },
];

export function CategoryShowcase() {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {CATEGORIES.map((c, i) => (
        <Reveal key={c.label} delay={i * 0.05}>
          <Link
            href="/auth/signup"
            className="group flex items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
              <c.icon className="h-3.5 w-3.5 text-primary" />
            </span>
            {c.label}
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
