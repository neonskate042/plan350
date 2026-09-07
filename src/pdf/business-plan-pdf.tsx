// Формальный PDF бизнес-плана для подачи в комиссию соцзащиты.
// Оформление намеренно сдержанное — деловой документ для госкомиссии,
// не маркетинговый материал: чёрный текст, тонкие линии, никакого брендинга.

import path from "path";
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Font,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { SmetaRow, FinRow, RiskRow } from "./sample-data";

const FONT_DIR = path.join(process.cwd(), "src/pdf/fonts");
Font.register({
  family: "Manrope",
  fonts: [
    { src: path.join(FONT_DIR, "Manrope-Regular.ttf"), fontWeight: 400 },
    { src: path.join(FONT_DIR, "Manrope-Bold.ttf"), fontWeight: 700 },
    { src: path.join(FONT_DIR, "Manrope-ExtraBold.ttf"), fontWeight: 800 },
  ],
});
Font.registerHyphenationCallback((w) => [w]);

const ink = "#1a1a1a";
const gray = "#555555";
const line = "#999999";
const border = "#444444";

const s = StyleSheet.create({
  page: {
    fontFamily: "Manrope",
    fontSize: 10.5,
    color: ink,
    paddingTop: 64,
    paddingBottom: 46,
    paddingHorizontal: 60,
    // lineHeight здесь НЕ ставим — задокументированный баг react-pdf/Yoga:
    // lineHeight на самой <Page> ломает position:absolute+bottom у fixed
    // потомков (подвал переставал реплицироваться вообще ни на одну
    // страницу; top-позиционированная шапка при этом не страдала). Интервал
    // между строками задаём точечно, в стиле абзацев (см. `p` ниже).
  },
  header: {
    position: "absolute",
    top: 24,
    left: 60,
    right: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 0.75,
    borderBottomColor: line,
    paddingBottom: 6,
    fontSize: 8.5,
    color: gray,
  },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 60,
    right: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8.5,
    color: gray,
  },
  h: {
    fontSize: 12.5,
    fontWeight: 700,
    color: ink,
    marginTop: 4,
    marginBottom: 8,
    borderBottomWidth: 0.75,
    borderBottomColor: line,
    paddingBottom: 5,
  },
  p: { marginBottom: 8, color: ink, lineHeight: 1.45 },
  tableWrap: { marginTop: 4, marginBottom: 10 },
  tRowHead: { flexDirection: "row", backgroundColor: "#eeeeee" },
  tRow: { flexDirection: "row" },
  tCellHead: {
    padding: 5,
    fontSize: 9,
    fontWeight: 700,
    borderWidth: 0.5,
    borderColor: border,
  },
  tCell: {
    padding: 5,
    fontSize: 9.5,
    borderWidth: 0.5,
    borderColor: border,
  },
  tCellBold: {
    padding: 5,
    fontSize: 9.5,
    fontWeight: 700,
    borderWidth: 0.5,
    borderColor: border,
    backgroundColor: "#f2f2f2",
  },
});

function Section({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  // minPresenceAhead проверяет только "есть ли место начать", а сразу за
  // заголовком часто идёт неразрывная таблица (wrap={false}) — если она
  // целиком не влезает, "начало" (сам заголовок) остаётся на старой странице,
  // а таблица уезжает на новую. Поэтому склеиваем заголовок с ПЕРВЫМ дочерним
  // блоком в один неразрывный узел — так они гарантированно уходят вместе.
  // Остальные блоки раздела (если есть) текут после уже свободно.
  const kids = React.Children.toArray(children);
  const [first, ...rest] = kids;
  return (
    <View>
      <View wrap={false}>
        <Text style={s.h}>
          {n}. {title}
        </Text>
        {first}
      </View>
      {rest}
    </View>
  );
}

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split("\n\n").map((para, i) => (
        <Text key={i} style={s.p}>
          {para}
        </Text>
      ))}
    </>
  );
}

function Table({
  widths,
  head,
  rows,
  totalRow,
}: {
  widths: number[];
  head: string[];
  rows: string[][];
  totalRow?: string[];
}) {
  return (
    // wrap={false}: таблица уходит на следующую страницу целиком, если не
    // помещается — не разрывается между строками, оставляя "хвост" без шапки.
    <View style={s.tableWrap} wrap={false}>
      <View style={s.tRowHead}>
        {head.map((h, i) => (
          <Text key={i} style={[s.tCellHead, { width: `${widths[i]}%` }]}>
            {h}
          </Text>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={s.tRow} wrap={false}>
          {row.map((cell, ci) => (
            <Text key={ci} style={[s.tCell, { width: `${widths[ci]}%` }]}>
              {cell}
            </Text>
          ))}
        </View>
      ))}
      {totalRow && (
        <View style={s.tRow} wrap={false}>
          {totalRow.map((cell, ci) => (
            <Text key={ci} style={[s.tCellBold, { width: `${widths[ci]}%` }]}>
              {cell}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const money = (n: number) => n.toLocaleString("ru-RU") + " ₽";

export type BusinessPlanInput = {
  title: string;
  applicant: string;
  region: string;
  city: string;
  requestedSum: number;
  date: string;
  pm: number;
  summary: string;
  applicantInfo: string;
  serviceDescription: string;
  marketAnalysis: string;
  orgPlan: [string, string][];
  smeta: SmetaRow[];
  finance: FinRow[];
  breakeven: string;
  risks: RiskRow[];
  /** Раздел 11 — что физически прилагается к плану (манифест для комиссии) */
  attachments: string[];
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
};

function TitlePage({ d }: { d: BusinessPlanInput }) {
  return (
    <Page size="A4" style={{ ...s.page, justifyContent: "space-between" }}>
      <View>
        <View style={{ marginTop: 90, alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: 800, letterSpacing: 1 }}>
            БИЗНЕС-ПЛАН
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: gray,
              marginTop: 10,
              textAlign: "center",
              maxWidth: 360,
            }}
          >
            к социальному контракту на осуществление индивидуальной
            предпринимательской деятельности
          </Text>
          <Text style={{ fontSize: 15, fontWeight: 700, marginTop: 28 }}>
            «{d.title}»
          </Text>
        </View>

        <View style={{ marginTop: 70, alignSelf: "center", width: 360 }}>
          {[
            ["Заявитель", d.applicant],
            ["Регион", d.region],
            ["Населённый пункт", d.city],
            ["Запрашиваемая сумма", money(d.requestedSum)],
            ["Дата составления", d.date],
          ].map(([k, v]) => (
            <View
              key={k}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                borderBottomWidth: 0.5,
                borderBottomColor: line,
                paddingVertical: 7,
              }}
            >
              <Text style={{ color: gray, fontSize: 10.5 }}>{k}</Text>
              <Text style={{ fontSize: 10.5, fontWeight: 700 }}>{v}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ marginBottom: 40 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 30,
          }}
        >
          <Text style={{ fontSize: 10 }}>
            Подпись заявителя: _____________________
          </Text>
          <Text style={{ fontSize: 10 }}>Дата: _______________</Text>
        </View>
      </View>
    </Page>
  );
}

function ContentPage({ d }: { d: BusinessPlanInput }) {
  const financeTotal = d.finance.reduce(
    (a, r) => ({
      orders: a.orders + r.orders,
      revenue: a.revenue + r.revenue,
      costs: a.costs + r.costs,
      profit: a.profit + r.profit,
    }),
    { orders: 0, revenue: 0, costs: 0, profit: 0 },
  );

  return (
    <Page size="A4" style={s.page}>
      {/* fixed-элементы объявляем в начале дерева, а не после контента —
          иначе react-pdf ненадёжно определяет, на каких страницах их
          повторять (замечено: подвал в конце дерева не размножался по
          страницам, а появлялся один раз). Видимое место всё равно задаёт
          position: absolute в стилях, порядок в JSX на это не влияет. */}
      <View style={s.header} fixed>
        <Text>Бизнес-план — {d.applicant}</Text>
        <Text>{d.region}</Text>
      </View>
      <View style={s.footer} fixed>
        <Text>Приложение к заявлению о заключении социального контракта</Text>
        {/* render-элементу нужен свой отдельный проп fixed, а не только на
            родительском View, — так требует документация react-pdf; без него
            весь этот View не реплицировался ни на одну страницу. */}
        <Text
          fixed
          render={({ pageNumber, totalPages }) =>
            `Страница ${pageNumber} из ${totalPages}`
          }
        />
      </View>

      <Section n={1} title="Резюме проекта">
        <Paragraphs text={d.summary} />
      </Section>

      <Section n={2} title="Сведения о заявителе и обоснование выбора направления">
        <Paragraphs text={d.applicantInfo} />
      </Section>

      <Section n={3} title="Описание услуги и целевой аудитории">
        <Paragraphs text={d.serviceDescription} />
      </Section>

      <Section n={4} title="Анализ рынка и конкурентов">
        <Paragraphs text={d.marketAnalysis} />
      </Section>

      <Section n={5} title="Организационный план">
        <Table
          widths={[65, 35]}
          head={["Этап", "Срок"]}
          rows={d.orgPlan}
        />
      </Section>

      <Section n={6} title="Смета расходов">
        <Table
          widths={[80, 20]}
          head={["Статья", "Сумма, ₽"]}
          rows={d.smeta.map((r) => [r.item, r.sum.toLocaleString("ru-RU")])}
          totalRow={["Итого", d.requestedSum.toLocaleString("ru-RU")]}
        />
      </Section>

      <Section n={7} title="Финансовая модель на 12 месяцев">
        <Text style={s.p}>
          Средний чек за один выезд (шиномонтаж + балансировка комплекта из 4
          колёс): 3 500 ₽. Переменные расходы на заказ: 600 ₽. Постоянные
          расходы в месяц: 8 000 ₽.
        </Text>
        <Table
          widths={[32, 14, 18, 18, 18]}
          head={["Месяц", "Заказов", "Выручка", "Расходы", "Прибыль"]}
          rows={d.finance.map((r) => [
            r.month,
            String(r.orders),
            r.revenue.toLocaleString("ru-RU"),
            r.costs.toLocaleString("ru-RU"),
            r.profit.toLocaleString("ru-RU"),
          ])}
          totalRow={[
            "Итого за год",
            String(financeTotal.orders),
            financeTotal.revenue.toLocaleString("ru-RU"),
            financeTotal.costs.toLocaleString("ru-RU"),
            financeTotal.profit.toLocaleString("ru-RU"),
          ]}
        />
        <Text style={s.p}>
          Средняя прибыль в месяц — около{" "}
          {Math.round(financeTotal.profit / 12).toLocaleString("ru-RU")} ₽, что
          выше прожиточного минимума трудоспособного населения региона (
          {d.pm.toLocaleString("ru-RU")} ₽/мес) более чем в{" "}
          {(financeTotal.profit / 12 / d.pm).toFixed(1)} раза.
        </Text>
      </Section>

      <Section n={8} title="Точка безубыточности">
        <Paragraphs text={d.breakeven} />
      </Section>

      <Section n={9} title="Оценка рисков">
        <Table
          widths={[40, 20, 40]}
          head={["Риск", "Вероятность", "Мера снижения"]}
          rows={d.risks.map((r) => [r.risk, r.probability, r.measure])}
        />
      </Section>

      <Section n={10} title="SWOT-анализ">
        <View style={{ flexDirection: "row", marginBottom: 8 }} wrap={false}>
          <View style={{ width: "50%", paddingRight: 6 }}>
            <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>
              Сильные стороны
            </Text>
            {d.swot.strengths.map((t, i) => (
              <Text key={i} style={{ fontSize: 9.5, marginBottom: 3 }}>
                • {t}
              </Text>
            ))}
          </View>
          <View style={{ width: "50%", paddingLeft: 6 }}>
            <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>
              Слабые стороны
            </Text>
            {d.swot.weaknesses.map((t, i) => (
              <Text key={i} style={{ fontSize: 9.5, marginBottom: 3 }}>
                • {t}
              </Text>
            ))}
          </View>
        </View>
        <View style={{ flexDirection: "row" }} wrap={false}>
          <View style={{ width: "50%", paddingRight: 6 }}>
            <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>
              Возможности
            </Text>
            {d.swot.opportunities.map((t, i) => (
              <Text key={i} style={{ fontSize: 9.5, marginBottom: 3 }}>
                • {t}
              </Text>
            ))}
          </View>
          <View style={{ width: "50%", paddingLeft: 6 }}>
            <Text style={{ fontSize: 10, fontWeight: 700, marginBottom: 4 }}>
              Угрозы
            </Text>
            {d.swot.threats.map((t, i) => (
              <Text key={i} style={{ fontSize: 9.5, marginBottom: 3 }}>
                • {t}
              </Text>
            ))}
          </View>
        </View>
      </Section>

      <Section n={11} title="Приложения">
        <Text style={s.p}>
          К настоящему бизнес-плану прилагаются документы, подтверждающие
          расчёты, приведённые выше:
        </Text>
        {d.attachments.map((a, i) => (
          <View key={i} style={{ flexDirection: "row", marginBottom: 5 }} wrap={false}>
            <Text style={{ width: 16, fontSize: 9.5 }}>{i + 1}.</Text>
            <Text style={{ flex: 1, fontSize: 9.5 }}>{a}</Text>
          </View>
        ))}
      </Section>
      {/* Оговорка про "полный список документов уточняйте в соцзащите" — это
          инструктаж клиенту, а не текст для комиссии. Официальный документ на
          подачу не место для неуверенности в собственном составе. Такая
          формулировка идёт в памятку клиенту (см. п.3 "Продукт: что получает
          клиент" в plans/2026-08-31-generator-biznes-planov.md), не сюда. */}
    </Page>
  );
}

function BusinessPlanDoc({ d }: { d: BusinessPlanInput }) {
  return (
    <Document title={`Бизнес-план — ${d.title}`} author={d.applicant}>
      <TitlePage d={d} />
      <ContentPage d={d} />
    </Document>
  );
}

export function buildBusinessPlanPdf(d: BusinessPlanInput): Promise<Buffer> {
  return renderToBuffer(<BusinessPlanDoc d={d} />);
}
