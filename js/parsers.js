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

<<<<<<< HEAD
<<<<<<< HEAD
=======
/* Veľké písmená zmení na vetu: "KURACIE PRSIA" → "Kuracie prsia". */
>>>>>>> 2ea2af6 (Pridanie Zadanie 2)
=======
/* Veľké písmená zmení na vetu: "KURACIE PRSIA" → "Kuracie prsia". */
>>>>>>> 490480740136fd087f996bc64287e63e7fbd71c5
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

/* Stránka Drag dátumy neuvádza, preto sa dopočítajú z týždňa načítania:
   pondelok až piatok aktuálneho týždňa, cez víkend nasledujúceho týždňa. */
function weekDate(dayOffset, now = new Date()) {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sinceMonday = (date.getDay() + 6) % 7; // pondelok = 0, nedeľa = 6
  date.setDate(date.getDate() - sinceMonday + (sinceMonday > 4 ? 7 : 0) + dayOffset);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${date.getFullYear()}`;
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

    days.push({ day, date: weekDate(DAY_NAMES.indexOf(day)), items });
  }
  return days;
}

function parseHospoda(doc) {
  const days = [];

  doc.querySelectorAll("section#menu article").forEach((article) => {
    const dayEl = article.querySelector("div.text-xs.font-bold.uppercase");
    const index = dayEl ? dayIndex(textOf(dayEl)) : -1;
<<<<<<< HEAD
<<<<<<< HEAD
    if (index === -1) return;
=======
    if (index === -1) return; // napr. blok „Špeciál“ nie je deň v týždni
>>>>>>> 2ea2af6 (Pridanie Zadanie 2)
=======
    if (index === -1) return; // napr. blok „Špeciál“ nie je deň v týždni
>>>>>>> 490480740136fd087f996bc64287e63e7fbd71c5

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

<<<<<<< HEAD
<<<<<<< HEAD
=======
/* Alergény v tvare "/A:1,3,7/" (aj chybné varianty "/A1,3/", "/A: /") na konci textu. */
>>>>>>> 2ea2af6 (Pridanie Zadanie 2)
=======
/* Alergény v tvare "/A:1,3,7/" (aj chybné varianty "/A1,3/", "/A: /") na konci textu. */
>>>>>>> 490480740136fd087f996bc64287e63e7fbd71c5
function extractAllergens(value) {
  const match = value.match(/\s*\/\s*A\s*:?\s*([\d,\s]*)\/?\s*$/i);
  if (!match) return { text: value, allergens: "" };
  return {
    text: cleanText(value.slice(0, match.index)),
    allergens: match[1].replace(/\s/g, "").replace(/,+$/, "")
  };
}

<<<<<<< HEAD
<<<<<<< HEAD
=======
/* Cena z tlačidla: "od €8,20", "€10,90" alebo "od €8". */
>>>>>>> 2ea2af6 (Pridanie Zadanie 2)
=======
/* Cena z tlačidla: "od €8,20", "€10,90" alebo "od €8". */
>>>>>>> 490480740136fd087f996bc64287e63e7fbd71c5
function parseEuroPrice(value) {
  const match = (value || "").match(/€\s*(\d+(?:[.,]\d+)?)/);
  return match ? parseFloat(match[1].replace(",", ".")) : null;
}

function parseJednaBasen(doc) {
  const days = [];

  doc.querySelectorAll('div[id^="menu-menu-"].menuv2-section').forEach((section) => {
    const heading = textOf(section.querySelector(".m-list__title-text"));
    const dayMatch = heading.match(/pondelok|utorok|streda|štvrtok|piatok/i);
    if (!dayMatch) return;
    const dateMatch = heading.match(/\d{1,2}\.\s*\d{1,2}\.\s*\d{4}/);

    const items = [];

<<<<<<< HEAD
<<<<<<< HEAD
=======
    // polievky sú v popise skupiny, oddelené značkami <br>
>>>>>>> 2ea2af6 (Pridanie Zadanie 2)
=======
    // polievky sú v popise skupiny, oddelené značkami <br>
>>>>>>> 490480740136fd087f996bc64287e63e7fbd71c5
    const description = section.querySelector(".m-list__description");
    if (description) {
      const walker = document.createTreeWalker(description, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const line = cleanText(node.textContent);
        if (!line) continue;
        const { text, allergens } = extractAllergens(line);
        const volume = text.match(/\s+(\d+(?:[.,]\d+)?\s*(?:ml|l))$/i);
        items.push({
          type: "soup",
          title: sentenceCase(volume ? cleanText(text.slice(0, volume.index)) : text),
          amount: volume ? volume[1].replace(/\s/g, "") : "",
          allergens,
          price: null
        });
      }
    }

<<<<<<< HEAD
<<<<<<< HEAD
=======
    // hlavné jedlá sú v zozname položiek
>>>>>>> 2ea2af6 (Pridanie Zadanie 2)
=======
    // hlavné jedlá sú v zozname položiek
>>>>>>> 490480740136fd087f996bc64287e63e7fbd71c5
    section.querySelectorAll("li.m-list__item").forEach((li) => {
      const titleEl = li.querySelector(".m-item__title");
      if (!titleEl) return;

      const fromTitle = extractAllergens(textOf(titleEl));
      const { amount, title } = splitAmount(fromTitle.text);

<<<<<<< HEAD
<<<<<<< HEAD
=======
      // druhý riadok ("140/200g /A:1,3,7/") dopĺňa gramáž mäsa a prílohy
>>>>>>> 2ea2af6 (Pridanie Zadanie 2)
=======
      // druhý riadok ("140/200g /A:1,3,7/") dopĺňa gramáž mäsa a prílohy
>>>>>>> 490480740136fd087f996bc64287e63e7fbd71c5
      const extra = extractAllergens(textOf(li.querySelector(".m-item__description")));
      const fullAmount = extra.text.match(/^\d+(?:\/\d+)*\s*g(?:\s*\/\s*\d+\s*g)?$/i);

      const priceText = textOf(li.querySelector(".add-button"));
      items.push({
        type: "main",
        title: sentenceCase(title),
        amount: fullAmount ? fullAmount[0].replace(/\s/g, "") : amount,
        allergens: fromTitle.allergens || extra.allergens,
        price: parseEuroPrice(priceText),
        priceFrom: /^od\b/i.test(priceText)
      });
    });

    days.push({ day: DAY_NAMES[dayIndex(dayMatch[0])], date: dateMatch ? dateMatch[0].replace(/\s/g, "") : "", items });
  });

  return days;
}

const SOURCES = [
  {
    id: "drag",
    name: "Reštaurácia Drag",
    address: "Staré Grunty 64, Bratislava",
    website: "https://www.restauracia-drag.sk/restauracia-drag",
    localUrl: "source/Reštaurácia_DRAG_menu.html",
    parse: parseDrag
  },
  {
    id: "hospoda",
    name: "Naše Hospoda Karloveská",
    address: "Segnerova 3, Bratislava – Karlova Ves",
    website: "https://nasehospoda-karloveska.sk/",
    localUrl: "source/Naše Hospoda Karloveská _ Bratislava - Karlova Ves.html",
    parse: parseHospoda
  },
  {
    id: "jedna-basen",
    name: "Jedna Báseň",
    address: "Pribišova 3173/6, Bratislava – Karlova Ves",
    website: "https://www.jednabasen.sk/",
    localUrl: "source/Jedna_basen_menu.html",
    parse: parseJednaBasen
  }
];