import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: "FAQ" };

const FAQS = [
  {
    q: "How is this different from paying directly?",
    a: `When you pay a stranger directly, you're trusting them to deliver before you have any leverage. With ${APP_NAME}, your payment sits with a neutral third party until the Seller delivers and you accept it — so neither side can walk away with both the money and the goods.`,
  },
  {
    q: `Does ${APP_NAME} actually hold my money in an account it controls?`,
    a: "No. Payments happen off-platform, directly between you and our published account or wallet. We verify that the payment happened and control when the Seller is told to proceed and when payout happens — we are a mediation and verification service, not a bank. See our Terms of Service for the exact legal relationship.",
  },
  {
    q: "How long does payment verification take?",
    a: "An Admin manually checks every submitted proof of payment. It's usually quick, but can take longer outside business hours or for larger/unusual amounts.",
  },
  {
    q: "What if the Seller never delivers?",
    a: "If the inspection period passes with no delivery, or something doesn't match what was agreed, open a dispute. An Admin will review the case and decide on a refund, release, or split outcome.",
  },
  {
    q: "What if I disagree with what I received?",
    a: "Open a dispute before the inspection window closes. Include as much detail and evidence as you can — an Admin reviews both sides before anything moves.",
  },
  {
    q: "What payment methods are supported?",
    a: "Bank transfer, Zelle, Cash App, Chime, Apple Pay, and select cryptocurrencies — see the current list on the Fees page. Admins can add or remove methods at any time.",
  },
  {
    q: "Is there a fee?",
    a: "Yes, a small percentage of the deal amount, shown up front on the Fees page before you create a transaction. Either party can pay it, or it can be split.",
  },
  {
    q: "How do I get help?",
    a: "Use the chat bubble in the corner of any page, or the Contact page — a real person will respond.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Frequently asked questions</h1>
      </div>
      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {FAQS.map((item) => (
          <details key={item.q} className="group p-5">
            <summary className="cursor-pointer list-none font-medium marker:content-none">
              <span className="flex items-center justify-between gap-4">
                {item.q}
                <span className="shrink-0 text-muted-foreground transition-transform group-open:rotate-45">+</span>
              </span>
            </summary>
            <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
