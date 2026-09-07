// Реестр тарифов. Цены и состав — из plans/2026-08-31-generator-biznes-planov.md.

export type TariffId = "basic" | "standard" | "max";

export type Tariff = {
  id: TariffId;
  title: string;
  /** Наименование в кассовом чеке (54-ФЗ): понятное, без маркетинга */
  receiptTitle: string;
  price: number;
  hasExcel: boolean;
  hasDefensePrep: boolean;
  hasSupport: boolean;
};

export const TARIFFS: Record<TariffId, Tariff> = {
  basic: {
    id: "basic",
    title: "Базовый",
    receiptTitle: "Бизнес-план для социального контракта — базовый пакет",
    price: 1490,
    hasExcel: false,
    hasDefensePrep: false,
    hasSupport: false,
  },
  standard: {
    id: "standard",
    title: "Стандарт",
    receiptTitle: "Бизнес-план для социального контракта — пакет «Стандарт»",
    price: 2990,
    hasExcel: true,
    hasDefensePrep: true,
    hasSupport: true,
  },
  max: {
    id: "max",
    title: "Максимум",
    receiptTitle: "Бизнес-план для социального контракта — пакет «Максимум»",
    price: 4990,
    hasExcel: true,
    hasDefensePrep: true,
    hasSupport: true,
  },
};

export const DEFAULT_TARIFF: TariffId = "standard";

export function isTariffId(v: unknown): v is TariffId {
  return typeof v === "string" && v in TARIFFS;
}

export function getTariff(id: string): Tariff | undefined {
  return isTariffId(id) ? TARIFFS[id] : undefined;
}
