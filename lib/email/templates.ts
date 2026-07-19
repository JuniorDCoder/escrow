import { APP_NAME } from "@/lib/constants";

function layout(bodyHtml: string, preheader: string) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <span style="display:none;font-size:1px;color:#f1f5f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
            <tr>
              <td style="background-color:#0e3a53;border-radius:12px 12px 0 0;padding:24px;text-align:center;">
                <span style="color:#ffffff;font-size:18px;font-weight:700;">${APP_NAME}</span>
              </td>
            </tr>
            <tr>
              <td style="background-color:#ffffff;border-radius:0 0 12px 12px;padding:32px 28px;color:#0b1120;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="text-align:center;padding-top:20px;color:#94a3b8;font-size:12px;">
                ${APP_NAME} — trusted third-party escrow. Payments are only ever verified by a human.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background-color:#0e3a53;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;margin-top:20px;">${label}</a>`;
}

function summaryBox(referenceCode: string, title: string, amountFormatted?: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;border-radius:8px;margin:20px 0;">
    <tr><td style="padding:16px 20px;">
      <p style="margin:0 0 4px;font-size:13px;color:#64748b;">${referenceCode}</p>
      <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#0b1120;">${title}</p>
      ${amountFormatted ? `<p style="margin:0;font-size:15px;color:#0e3a53;font-weight:600;">${amountFormatted}</p>` : ""}
    </td></tr>
  </table>`;
}

export function transactionInviteEmail(opts: {
  role: "buyer" | "seller";
  title: string;
  referenceCode: string;
  amountFormatted: string;
  inviterName: string;
  actionUrl: string;
  hasAccount: boolean;
}) {
  const { role, title, referenceCode, amountFormatted, inviterName, actionUrl, hasAccount } = opts;
  const roleLabel = role === "buyer" ? "Buyer" : "Seller";
  const body = `
    <p style="margin:0 0 16px;font-size:16px;font-weight:600;">You've been invited to an escrow transaction</p>
    <p style="margin:0 0 4px;">${inviterName} started a transaction on ${APP_NAME} and listed you as the <strong>${roleLabel}</strong>.</p>
    ${summaryBox(referenceCode, title, amountFormatted)}
    <p style="margin:0 0 8px;">Nothing happens until you review and accept the terms — no payment is due yet.</p>
    ${button(actionUrl, hasAccount ? "Review & accept" : "Create your account to review")}
  `;
  return layout(body, `${inviterName} invited you to an escrow transaction: ${title}`);
}

export function notificationEmail(opts: { headline: string; body: string; actionUrl: string; actionLabel?: string }) {
  const html = `
    <p style="margin:0 0 16px;font-size:16px;font-weight:600;">${opts.headline}</p>
    <p style="margin:0 0 8px;">${opts.body}</p>
    ${button(opts.actionUrl, opts.actionLabel || "View transaction")}
  `;
  return layout(html, opts.headline);
}
