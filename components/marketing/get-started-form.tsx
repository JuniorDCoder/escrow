"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { CURRENCY_OPTIONS, GET_STARTED_ROLES, TRANSACTION_CATEGORIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Role = (typeof GET_STARTED_ROLES)[number]["value"];

interface GetStartedFormProps {
  isAuthenticated: boolean;
  whatsappNumber: string | null;
}

export function GetStartedForm({ isAuthenticated, whatsappNumber }: GetStartedFormProps) {
  const router = useRouter();
  const [role, setRole] = useState<Role>("buyer");
  const [category, setCategory] = useState<string>(TRANSACTION_CATEGORIES[0].value);
  const [currency, setCurrency] = useState<string>(CURRENCY_OPTIONS[0].code);

  const handleSubmit = () => {
    if (role === "broker") {
      const categoryLabel = TRANSACTION_CATEGORIES.find((c) => c.value === category)?.label ?? category;
      const message = `Hi, I'd like to broker a ${categoryLabel} transaction in ${currency}.`;
      if (whatsappNumber) {
        window.open(`https://wa.me/${whatsappNumber.replace(/[^\d]/g, "")}?text=${encodeURIComponent(message)}`, "_blank");
      } else {
        router.push("/contact");
      }
      return;
    }

    const target = `/transactions/new?role=${role}&category=${category}&currency=${currency}`;
    router.push(isAuthenticated ? target : `/auth/signup?next=${encodeURIComponent(target)}`);
  };

  return (
    <div className="mx-auto max-w-xl rounded-xl border border-border bg-card p-5 text-left shadow-sm sm:p-6">
      <div className="grid grid-cols-3 gap-2">
        {GET_STARTED_ROLES.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setRole(r.value)}
            className={cn(
              "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
              role === r.value ? "border-primary bg-secondary text-foreground" : "border-input text-muted-foreground hover:bg-secondary/60"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">What are you {role === "seller" ? "selling" : "trading"}?</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRANSACTION_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  <span className="mr-1.5">{c.flag}</span>
                  {c.code} — {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button size="lg" className="mt-4 w-full" onClick={handleSubmit}>
        Get Started <ArrowRight className="h-4 w-4" />
      </Button>

      {role === "broker" && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Broker accounts are set up by our team — this opens WhatsApp to get you started.
        </p>
      )}
    </div>
  );
}
