import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageCircle, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTransactionDetail } from "@/lib/data/transactions";
import { getActivePaymentMethods } from "@/lib/data/payment-methods";
import { getSettings } from "@/lib/data/settings";
import { getViewerRole, isBuyerSide, isSellerSide } from "@/lib/domain/permissions";
import { PAYOUT_ELIGIBLE_STATUSES, STATUS_DESCRIPTIONS } from "@/lib/domain/state-machine";
import { formatCurrency, formatDate } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/transactions/status-badge";
import { TransactionStepper } from "@/components/transactions/transaction-stepper";
import { AcceptInviteActions } from "@/components/transactions/accept-invite-actions";
import { PaymentInstructions } from "@/components/transactions/payment-instructions";
import { PaymentProofDialog } from "@/components/transactions/payment-proof-dialog";
import { DeliveryProofForm } from "@/components/transactions/delivery-proof-form";
import { PayoutDetailsForm } from "@/components/transactions/payout-details-form";
import { InspectionActions } from "@/components/transactions/inspection-actions";
import { CancelTransactionButton } from "@/components/transactions/cancel-transaction-button";
import { DisputeSummary } from "@/components/transactions/dispute-summary";
import { MessageThread } from "@/components/transactions/message-thread";
import { RatingForm } from "@/components/transactions/rating-form";
import { ForceTransitionDialog } from "@/components/admin/force-transition-dialog";
import { PayoutActions } from "@/components/admin/payout-actions";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Transaction" };

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const detail = await getTransactionDetail(id);
  if (!detail) notFound();

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) notFound();

  const { transaction: tx } = detail;
  const role = getViewerRole(tx, user.id, profile);
  const buyerSide = isBuyerSide(role);
  const sellerSide = isSellerSide(role);

  const settings = await getSettings();
  const whatsappHref = settings.whatsapp_number
    ? `https://wa.me/${settings.whatsapp_number.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
        `Hi, I need help with transaction ${tx.reference_code}.`
      )}`
    : null;

  const myPaymentProofs = detail.paymentProofs.filter((p) => p.uploaded_by === user.id);
  const latestProof = myPaymentProofs[0];
  const activePaymentMethods = tx.status === "awaiting_payment" && buyerSide ? await getActivePaymentMethods() : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{tx.title}</h1>
            <StatusBadge status={tx.status} />
          </div>
          <p className="font-mono text-sm text-muted-foreground">{tx.reference_code}</p>
        </div>
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <MessageCircle className="h-4 w-4" /> Need help? Chat with us on WhatsApp
          </a>
        )}
      </div>

      <Card>
        <CardContent className="py-6">
          <TransactionStepper status={tx.status} />
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 rounded-md border border-border bg-card px-4 py-3 text-sm">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>{STATUS_DESCRIPTIONS[tx.status]}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {role === "admin" && (
            <Card className="border-primary/40">
              <CardHeader>
                <CardTitle className="text-sm">Admin controls</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-2">
                <PayoutActions transactionId={tx.id} status={tx.status} />
                <ForceTransitionDialog transactionId={tx.id} currentStatus={tx.status} />
                {detail.payout ? (
                  <div className="w-full rounded-md border border-border bg-secondary/40 p-3 text-xs">
                    <p className="font-medium uppercase tracking-wide text-muted-foreground">Seller payout details</p>
                    <p className="mt-1">
                      {detail.payout.method_type.replace("_", " ")} — {detail.payout.account_details}
                    </p>
                    {detail.payout.note && <p className="mt-1 text-muted-foreground">{detail.payout.note}</p>}
                  </div>
                ) : (
                  <p className="w-full text-xs text-muted-foreground">Seller has not submitted payout details yet.</p>
                )}
                {detail.paymentProofs.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {detail.paymentProofs.map((p) => (
                      <a
                        key={p.id}
                        href={p.signedUrl ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex"
                      >
                        <Badge variant={p.status === "verified" ? "success" : p.status === "rejected" ? "destructive" : "warning"}>
                          Proof {p.status} — {formatCurrency(p.amount_claimed, p.currency)}
                        </Badge>
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {role === "buyer_invitee" || role === "seller_invitee" ? (
            <AcceptInviteActions transactionId={tx.id} />
          ) : null}

          {tx.status === "awaiting_acceptance" && (role === "buyer" || role === "seller") && (
            <Card>
              <CardContent className="flex items-center justify-between py-5 text-sm">
                <span>
                  Waiting for {buyerSide ? tx.seller_email : tx.buyer_email} to accept the terms.
                </span>
                <CancelTransactionButton transactionId={tx.id} />
              </CardContent>
            </Card>
          )}

          {tx.status === "awaiting_payment" && buyerSide && (
            <Card>
              <CardHeader>
                <CardTitle>Pay into escrow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <PaymentInstructions amountDue={tx.total_payable} currency={tx.currency} methods={activePaymentMethods} />
                <PaymentProofDialog
                  transactionId={tx.id}
                  amountDue={tx.total_payable}
                  currency={tx.currency}
                  methods={activePaymentMethods}
                />
                <CancelTransactionButton transactionId={tx.id} />
              </CardContent>
            </Card>
          )}

          {tx.status === "awaiting_payment" && sellerSide && (
            <Card>
              <CardContent className="flex items-center justify-between py-5 text-sm">
                <span>Waiting for the Buyer to pay into escrow and submit proof of payment.</span>
                <CancelTransactionButton transactionId={tx.id} />
              </CardContent>
            </Card>
          )}

          {tx.status === "payment_under_review" && (
            <Card>
              <CardHeader>
                <CardTitle>Payment under review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>{APP_NAME} is verifying the payment proof. This is usually quick.</p>
                {buyerSide && latestProof && (
                  <p>
                    Submitted {formatCurrency(latestProof.amount_claimed, latestProof.currency)} via{" "}
                    {latestProof.paymentMethodLabel ?? "your chosen method"} on {formatDate(latestProof.created_at)}.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {buyerSide && latestProof?.status === "rejected" && tx.status === "awaiting_payment" && (
            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle className="text-destructive">Your last payment proof was rejected</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="text-muted-foreground">{latestProof.admin_note || "Please resubmit with corrected details."}</p>
              </CardContent>
            </Card>
          )}

          {tx.status === "funded" && sellerSide && <DeliveryProofForm transactionId={tx.id} inspectionDays={tx.inspection_period_days} />}
          {sellerSide && (PAYOUT_ELIGIBLE_STATUSES.includes(tx.status) || detail.payout) && (
            <PayoutDetailsForm transactionId={tx.id} payout={detail.payout} />
          )}
          {tx.status === "funded" && buyerSide && (
            <Card>
              <CardContent className="py-5 text-sm text-muted-foreground">
                Payment is secured. Waiting for the Seller to deliver.
              </CardContent>
            </Card>
          )}

          {tx.status === "inspection_period" && buyerSide && (
            <InspectionActions transactionId={tx.id} inspectionEndsAt={tx.inspection_ends_at} />
          )}
          {tx.status === "inspection_period" && sellerSide && (
            <Card>
              <CardContent className="py-5 text-sm text-muted-foreground">
                The Buyer is inspecting the delivery
                {tx.inspection_ends_at ? ` until ${formatDate(tx.inspection_ends_at)}` : ""}.
              </CardContent>
            </Card>
          )}

          {(tx.status === "accepted" || tx.status === "release_pending") && (
            <Card>
              <CardContent className="py-5 text-sm text-muted-foreground">
                {tx.status === "accepted"
                  ? `Delivery accepted. ${APP_NAME} will queue the payout to the Seller shortly.`
                  : `${APP_NAME} is completing the payout to the Seller.`}
              </CardContent>
            </Card>
          )}

          {tx.status === "released" && (
            <Card className="border-success/40 bg-success-soft">
              <CardContent className="py-5 text-sm font-medium text-success">
                Funds have been released to the Seller. This transaction is complete.
              </CardContent>
            </Card>
          )}

          {(tx.status === "released" || tx.status === "refunded") &&
            (role === "buyer" || role === "seller") &&
            !detail.ratings.some((r) => r.rated_by === user.id) &&
            (() => {
              const ratedUser = role === "buyer" ? tx.seller_id : tx.buyer_id;
              if (!ratedUser) return null;
              return (
                <RatingForm
                  transactionId={tx.id}
                  ratedUser={ratedUser}
                  ratedUserLabel={role === "buyer" ? "Seller" : "Buyer"}
                />
              );
            })()}

          <DisputeSummary disputes={detail.disputes} />

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <MessageThread
                transactionId={tx.id}
                messages={detail.messages}
                currentUserId={user.id}
                disabled={role === "observer"}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Category" value={tx.category.replace(/_/g, " ")} capitalize />
              <Row label="Amount" value={formatCurrency(tx.amount, tx.currency)} mono />
              <Row label="Escrow fee" value={formatCurrency(tx.fee_amount, tx.currency)} mono />
              <Separator />
              <Row label="Buyer pays" value={formatCurrency(tx.total_payable, tx.currency)} strong mono />
              <Row
                label="Seller receives"
                value={formatCurrency(
                  tx.amount - (tx.fee_payer !== "buyer" ? tx.fee_amount * (tx.fee_payer === "split" ? 0.5 : 1) : 0),
                  tx.currency
                )}
                strong
                mono
              />
              <Separator />
              <Row label="Buyer" value={detail.buyerName || tx.buyer_email || "—"} />
              <Row label="Seller" value={detail.sellerName || tx.seller_email || "—"} />
              <Row label="Inspection period" value={`${tx.inspection_period_days} day(s)`} />
              <Row label="Created" value={formatDate(tx.created_at)} />
            </CardContent>
          </Card>
          {tx.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground whitespace-pre-wrap">{tx.description}</CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  capitalize,
  mono,
}: {
  label: string;
  value: string;
  strong?: boolean;
  capitalize?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`text-right ${strong ? "font-semibold" : ""} ${capitalize ? "capitalize" : ""} ${mono ? "font-mono tabular-nums" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

