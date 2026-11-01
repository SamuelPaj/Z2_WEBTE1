"use strict";

const DAY_NAMES = ["Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok", "Sobota", "Nedeľa"];

function parseHtml(htmlText) {
  return new DOMParser().parseFromString(htmlText, "text/html");
}

function cleanText(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function textOf(element) {
  return element ? cleanText(element.textContent) : "";
}

function parsePrice(value) {
  const match = (value || "").replace(/\s/g, "").match(/(\d+)[,.](\d{2})/);
  return match ? parseFloat(`${match[1]}.${match[2]}`) : null;
}

function dayIndex(name) {
  const wanted = cleanText(name).toLowerCase();
  return DAY_NAMES.findIndex((day) => day.toLowerCase() === wanted);
}

/* Veľké písmená zmení na vetu: "KURACIE PRSIA" → "Kuracie prsia". */
function sentenceCase(value) {
  const letters = value.replace(/[^\p{L}]/gu, "");
  const upper = letters.replace(/[^\p{Lu}]/gu, "");
  if (letters.length < 4 || upper.length / letters.length < 0.7) return value;
  const lower = value.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function splitAmount(value) {
  const match = value.match(/^((?:\d+(?:[.,]\d+)?\s*(?:kg|g|ml|l|ks)\b\s*\/?\s*)+)(.+)$/i);
  if (!match) return { amount: "", title: value };
  return {
    amount: match[1].replace(/\/\s*$/, "").trim(),
    title: cleanText(match[2].replace(/^[\s.:\-–]+/, ""))
  };
}

function splitAllergens(value) {
  const match = value.match(/^(.*?)\s*\/\s*([\d,\s]+)\s*\/?\s*$/);
  if (!match) return { title: value, allergens: "" };
  return { title: cleanText(match[1]), allergens: match[2].replace(/\s/g, "").replace(/,$/, "") };
}

function buildItem(type, rawText, price) {
  const { amount, title: afterAmount } = splitAmount(cleanText(rawText));
  const { title, allergens } = splitAllergens(afterAmount);
  return { type, title: sentenceCase(title), amount, allergens, price };
}

function parseDrag(doc) {
  const panes = { pondelok: "Pondelok", utorok: "Utorok", streda: "Streda", stvrtok: "Štvrtok", piatok: "Piatok" };
  const days = [];

  for (const [id, day] of Object.entries(panes)) {
    const pane = doc.getElementById(id);
    if (!pane) continue;

    const items = [];
    let section = "main";

    pane.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const line = cleanText(node.textContent);
        if (line && section === "soup") items.push(buildItem("soup", line, null));
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;

      if (node.classList.contains("menu_box_title")) {
        section = /polievk/i.test(node.textContent) ? "soup" : "main";
      } else if (section === "soup" && node.tagName !== "SCRIPT" && node.tagName !== "TABLE") {
        // polievka môže byť v <span> alebo <p>
        const line = textOf(node);
        if (line) items.push(buildItem("soup", line, null));
      } else if (node.tagName === "TABLE") {
        node.querySelectorAll("tr").forEach((row) => {
          const line = textOf(row.querySelector("td"));
          if (!line) return;
          items.push(buildItem("main", line, parsePrice(textOf(row.querySelector(".text-right")))));
        });
      }
    });

    days.push({ day, date: "", items });
  }
  return days;
}

function parseHospoda(doc) {
  const days = [];

  doc.querySelectorAll("section#menu article").forEach((article) => {
    const dayEl = article.querySelector("div.text-xs.font-bold.uppercase");
    const index = dayEl ? dayIndex(textOf(dayEl)) : -1;
    if (index === -1) return; // napr. blok „Špeciál“ nie je deň v týždni

    const items = [];
    article.querySelectorAll(".divide-y > div").forEach((row) => {
      const titleEl = row.querySelector(".font-bold.text-hospoda-cream");
      if (!titleEl) return;

      const clone = titleEl.cloneNode(true);
      const amount = [...clone.querySelectorAll("span")]
        .map(textOf)
        .filter((part) => !/^\d+\.$/.test(part))
        .join(" ");
      clone.querySelectorAll("span").forEach((span) => span.remove());

      const tags = [...row.querySelectorAll("span")].map(textOf);
      const allergenTag = tags.find((tag) => /^alergény/i.test(tag));
      const priceEl = row.querySelector(".shrink-0.font-bold.text-hospoda-cream");

      items.push({
        type: tags.some((tag) => /^polievka$/i.test(tag)) ? "soup" : "main",
        title: textOf(clone),
        amount,
        allergens: allergenTag ? allergenTag.replace(/^alergény:\s*/i, "") : "",
        price: parsePrice(textOf(priceEl))
      });
    });

    days.push({ day: DAY_NAMES[index], date: textOf(article.querySelector("div.mt-1.font-bold.text-white")), items });
  });

  return days;
}


const SOURCES = [
  {
    id: "drag",
    name: "Reštaurácia Drag",
    address: "Staré Grunty 64, Bratislava",
    website: "https://www.restauracia-drag.sk/denne-menu",
    localUrl: "source/restauracia-drag.html",
    parse: parseDrag
  },
  {
    id: "hospoda",
    name: "Naše Hospoda Karloveská",
    address: "Segnerova 3, Bratislava – Karlova Ves",
    website: "https://nasehospoda-karloveska.sk/#menu",
    localUrl: "source/nasa-hospoda.html",
    parse: parseHospoda
  }
];
