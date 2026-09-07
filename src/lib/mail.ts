// Отправка писем через Resend.
import { Resend } from "resend";
import { signToken } from "@/lib/access";

export const SITE = process.env.SITE_URL || "http://localhost:3000";

function resendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  const resend = resendClient();
  if (!resend) {
    console.warn("RESEND_API_KEY не задан — письмо не отправлено:", opts.subject);
    return false;
  }
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
    return true;
  } catch (e) {
    console.error("mail error:", e);
    return false;
  }
}

const btn =
  "display:inline-block;background:#1e293b;color:#fff;text-decoration:none;padding:13px 24px;border-radius:10px;font-weight:bold;";

/** Письмо покупателю: план готов, ссылка на скачивание. */
export async function sendPlanReadyEmail(orderId: string, email: string): Promise<boolean> {
  const token = signToken({ orderId, email });
  const link = `${SITE}/order/${orderId}?token=${encodeURIComponent(token)}`;

  const subject = "Ваш бизнес-план готов — ссылка на скачивание внутри";

  const text = [
    "Здравствуйте!",
    "",
    "Бизнес-план для социального контракта готов. Скачать документы можно по ссылке:",
    link,
    "",
    "Перед подачей проверьте, пожалуйста: если в анкете были ориентировочные цены",
    "на оборудование (без коммерческого предложения), уточните их у поставщиков.",
    "Если реальная сумма отличается — пришлите новые цифры в ответ на это письмо,",
    "пересоберём смету и финмодель бесплатно.",
    "",
    "Хорошей подачи!",
  ].join("\n");

  const html =
    `<div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6;font-size:16px;">` +
    `<p>Здравствуйте!</p>` +
    `<p>Бизнес-план для социального контракта готов.</p>` +
    `<p><a href="${link}" style="${btn}">Скачать документы →</a></p>` +
    `<p style="font-size:13px;color:#64748b;">Если кнопка не работает, скопируйте ссылку: ${link}</p>` +
    `<p><b>Перед подачей проверьте:</b> если в анкете были ориентировочные цены на оборудование ` +
    `(без коммерческого предложения от поставщика), уточните их. Если реальная сумма отличается — ` +
    `пришлите новые цифры в ответ на это письмо, пересоберём смету и финмодель бесплатно.</p>` +
    `<p style="margin-top:22px;">Хорошей подачи!</p>` +
    `</div>`;

  return sendMail({ to: email, subject, html, text });
}

/** Письмо покупателю при сбое генерации — деньги не теряются, разбираемся вручную. */
export async function sendGenerationFailedEmail(email: string): Promise<boolean> {
  const subject = "Ваш бизнес-план — небольшая задержка";
  const text = [
    "Здравствуйте!",
    "",
    "При автоматической подготовке вашего бизнес-плана произошла ошибка.",
    "Оплата получена, план обязательно подготовим — сейчас разбираемся вручную.",
    "Обычно это занимает не больше пары часов. Спасибо за терпение.",
  ].join("\n");
  const html =
    `<div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6;font-size:16px;">` +
    `<p>Здравствуйте!</p>` +
    `<p>При автоматической подготовке вашего бизнес-плана произошла ошибка. ` +
    `Оплата получена, план обязательно подготовим — сейчас разбираемся вручную. ` +
    `Обычно это занимает не больше пары часов. Спасибо за терпение.</p>` +
    `</div>`;
  return sendMail({ to: email, subject, html, text });
}
