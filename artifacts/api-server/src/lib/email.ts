import { logger } from "./logger";

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email via Resend if RESEND_API_KEY is set, otherwise log the
 * message so the reminder pipeline still runs end-to-end in development.
 */
export async function sendEmail(params: SendEmailParams): Promise<{ ok: boolean; provider: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REMINDER_FROM_EMAIL ?? "RunSafe <reminders@runsafe.app>";

  if (!apiKey) {
    logger.info(
      { to: params.to, subject: params.subject, provider: "log-only" },
      "Email reminder (no RESEND_API_KEY configured — logging only)",
    );
    return { ok: true, provider: "log-only" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      logger.error({ status: res.status, body, to: params.to }, "Resend email failed");
      return { ok: false, provider: "resend" };
    }
    return { ok: true, provider: "resend" };
  } catch (err) {
    logger.error({ err, to: params.to }, "Resend email threw");
    return { ok: false, provider: "resend" };
  }
}
