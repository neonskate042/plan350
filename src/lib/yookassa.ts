// Тонкая обёртка над API ЮKassa (v3). Все запросы — только с сервера.
// Ключи берём из окружения: YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY.

import crypto from "crypto";

const API = "https://api.yookassa.ru/v3";

export type YooPayment = {
  id: string;
  status: "pending" | "waiting_for_capture" | "succeeded" | "canceled";
  paid: boolean;
  amount: { value: string; currency: string };
  confirmation?: { type: string; confirmation_url?: string };
  metadata?: Record<string, string>;
};

export function isYookassaConfigured(): boolean {
  return Boolean(process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY);
}

function authHeader(): string {
  const shopId = process.env.YOOKASSA_SHOP_ID || "";
  const secret = process.env.YOOKASSA_SECRET_KEY || "";
  return "Basic " + Buffer.from(`${shopId}:${secret}`).toString("base64");
}

async function call<T>(
  method: "GET" | "POST",
  pathname: string,
  body?: unknown,
  idempotenceKey?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: authHeader(),
    "Content-Type": "application/json",
  };
  if (method === "POST") {
    headers["Idempotence-Key"] = idempotenceKey || crypto.randomUUID();
  }

  const res = await fetch(`${API}${pathname}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`ЮKassa ${method} ${pathname} → ${res.status}: ${text.slice(0, 400)}`);
  }
  return JSON.parse(text) as T;
}

export type CreatePaymentArgs = {
  /** Сумма в рублях, целое число */
  amount: number;
  /** Что видит покупатель в форме оплаты */
  description: string;
  /** Наименование позиции в кассовом чеке (54-ФЗ) */
  receiptTitle: string;
  /** Почта покупателя — на неё уходит чек */
  email: string;
  /** Куда вернуть после оплаты */
  returnUrl: string;
  /** Своё в платеже: orderId и т.п., читаем в вебхуке */
  metadata: Record<string, string>;
  /** Ключ идемпотентности: повтор запроса не создаст второй платёж */
  idempotenceKey: string;
};

export async function createPayment(a: CreatePaymentArgs): Promise<YooPayment> {
  const value = a.amount.toFixed(2);
  // Код НДС в чеке: 1 — «без НДС» (УСН, патент). Меняется одной переменной окружения.
  const vatCode = Number(process.env.YOOKASSA_VAT_CODE || 1);

  return call<YooPayment>(
    "POST",
    "/payments",
    {
      amount: { value, currency: "RUB" },
      capture: true,
      confirmation: { type: "redirect", return_url: a.returnUrl },
      description: a.description,
      metadata: a.metadata,
      receipt: {
        customer: { email: a.email },
        items: [
          {
            description: a.receiptTitle.slice(0, 128),
            quantity: "1.00",
            amount: { value, currency: "RUB" },
            vat_code: vatCode,
            payment_mode: "full_payment",
            payment_subject: "service",
          },
        ],
      },
    },
    a.idempotenceKey,
  );
}

/** Перезапрос платежа: вебхуку не доверяем, статус проверяем у самой ЮKassa. */
export async function getPayment(id: string): Promise<YooPayment> {
  return call<YooPayment>("GET", `/payments/${encodeURIComponent(id)}`);
}
