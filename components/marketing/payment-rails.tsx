import { Landmark, Bitcoin, Banknote, Zap, DollarSign, PiggyBank, CreditCard } from "lucide-react";

const RAILS = [
  { icon: Landmark, label: "Bank Transfer" },
  { icon: Bitcoin, label: "Bitcoin" },
  { icon: Banknote, label: "USDT" },
  { icon: Zap, label: "Zelle" },
  { icon: DollarSign, label: "Cash App" },
  { icon: PiggyBank, label: "Chime" },
  { icon: CreditCard, label: "Apple Pay" },
];

export function PaymentRails() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
      {RAILS.map((r) => (
        <div
          key={r.label}
          className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground"
        >
          <r.icon className="h-4 w-4 text-primary" />
          {r.label}
        </div>
      ))}
    </div>
  );
}
