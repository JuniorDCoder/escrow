"use client";

import { motion } from "framer-motion";
import { ShieldCheck, User, Store } from "lucide-react";

const dotTransition = {
  duration: 2.6,
  repeat: Infinity,
  ease: "easeInOut" as const,
};

export function EscrowFlowGraphic() {
  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-w-md select-none">
      <svg viewBox="0 0 480 360" className="h-full w-full overflow-visible" aria-hidden="true">
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--secured)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--secured)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="pathGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.15" />
            <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* connecting paths */}
        <path d="M108 190 C 160 150, 190 150, 216 158" fill="none" stroke="url(#pathGrad)" strokeWidth="2.5" strokeDasharray="1 8" strokeLinecap="round" />
        <path d="M264 158 C 290 150, 320 150, 372 190" fill="none" stroke="url(#pathGrad)" strokeWidth="2.5" strokeDasharray="1 8" strokeLinecap="round" />

        {/* glow behind shield */}
        <circle cx="240" cy="150" r="95" fill="url(#glow)" />
      </svg>

      {/* Buyer node */}
      <motion.div
        className="absolute left-[6%] top-[46%] flex -translate-y-1/2 flex-col items-center gap-2"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
          <User className="h-7 w-7 text-primary" />
        </div>
        <span className="text-xs font-medium text-muted-foreground">Buyer</span>
      </motion.div>

      {/* Seller node */}
      <motion.div
        className="absolute right-[6%] top-[46%] flex -translate-y-1/2 flex-col items-center gap-2"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
          <Store className="h-7 w-7 text-primary" />
        </div>
        <span className="text-xs font-medium text-muted-foreground">Seller</span>
      </motion.div>

      {/* Escrow shield node (center) */}
      <motion.div
        className="absolute left-1/2 top-[38%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.15 }}
      >
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-primary shadow-lg shadow-primary/20">
          <ShieldCheck className="h-11 w-11 text-primary-foreground" strokeWidth={1.75} />
        </div>
        <span className="text-xs font-semibold text-foreground">Held in escrow</span>
      </motion.div>

      {/* animated flow dots: buyer -> escrow */}
      <motion.div
        className="absolute h-2.5 w-2.5 rounded-full bg-secured shadow-[0_0_8px_var(--secured)]"
        style={{ left: "20%", top: "48%" }}
        animate={{ left: ["20%", "44%"], top: ["48%", "42%"], opacity: [0, 1, 1, 0] }}
        transition={dotTransition}
      />
      {/* animated flow dots: escrow -> seller */}
      <motion.div
        className="absolute h-2.5 w-2.5 rounded-full bg-secured shadow-[0_0_8px_var(--secured)]"
        style={{ left: "56%", top: "42%" }}
        animate={{ left: ["56%", "80%"], top: ["42%", "48%"], opacity: [0, 1, 1, 0] }}
        transition={{ ...dotTransition, delay: 1.3 }}
      />
    </div>
  );
}
