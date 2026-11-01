"use strict";
/* Obedové menu v okolí fakulty – WEBTE1, Samuel Piteľ */

const DAY_NAMES = ["Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok", "Sobota", "Nedeľa"];
const WORK_DAYS = DAY_NAMES.slice(0, 5);
const ALL_WEEK = "all";

const DELAYS = { drag: 0, hospoda: 0 };

/* ---------- Pomocné funkcie pre parsovanie ---------- */

function cleanText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function parsePrice(text) {
  const match = (text || "").replace(/\s/g, "").match(/(\d+)[,.](\d{2})/);
  return match ? parseFloat(`${match[1]}.${match[2]}`) : null;
}

function dayIndexByName(text) {
  const t = text.trim().toLowerCase();
  return DAY_NAMES.findIndex((n) => n.toLowerCase() === t);
}

/* Všeobecný parser: prejde textové uzly stránky, nadpis dňa začne nový deň,
   ostatné riadky sa pridajú ako jedlá. Vhodné pre Wix stránky (Don Co's). */
function parseByDayHeadings(doc) {
  const days = [];
  let current = null;
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const skip = new Set(["SCRIPT", "STYLE", "NOSCRIPT"]);

  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (skip.has(node.parentElement?.tagName)) continue;
    const text = cleanText(node.textContent);
    if (!text) continue;

    const idx = dayIndexByName(text);
    if (idx !== -1) {
      current = { day: DAY_NAMES[idx], date: "", screenings: [] };
      days.push(current);
      continue;
    }
    if (!current || text.length < 4) continue;

    const price = parsePrice(text);
    const title = cleanText(text.replace(/\d+[,.]\d{2}\s*(€|EUR)?/i, ""));
    if (title.length >= 4) {
      current.screenings.push({ title, price });
    } else if (price !== null && current.screenings.length) {
      const last = current.screenings[current.screenings.length - 1];
      if (last.price === null) last.price = price;
    }
  }
  return days;
}

/* ---------- Zdroje ---------- */

const SOURCES = [
  {
    id: "drag",
    name: "Reštaurácia Drag",
    website: "https://www.restauracia-drag.sk/denne-menu",
    localUrl: "Reštaurácia_DRAG_menu.html",
    parse(doc) {
      const ids = { pondelok: "Pondelok", utorok: "Utorok", streda: "Streda", stvrtok: "Štvrtok", piatok: "Piatok" };
      const days = [];
      for (const [id, day] of Object.entries(ids)) {
        const pane = doc.getElementById(id);
        if (!pane) continue;
        const screenings = [];
        pane.querySelectorAll("table tr").forEach((row) => {
          const textEl = row.querySelector("td p, td h4, td");
          const priceEl = row.querySelector(".text-right");
          const title = textEl ? cleanText(textEl.textContent) : "";
          if (title) {
            screenings.push({ title, price: priceEl ? parsePrice(priceEl.textContent) : null });
          }
        });
        days.push({ day, date: "", screenings });
      }
      return days;
    }
  },
  /* Don Co's sa nepoužil: ich denné menu je na webe iba obrázok (PNG), nie HTML text.
     Tu pribudne tretia reštaurácia, ktorá zverejňuje menu priamo v HTML. */
  {
    id: "hospoda",
    name: "Naše Hospoda Karloveská",
    website: "https://nasehospoda-karloveska.sk/#menu",
    localUrl: "Naše_Hospoda_Karloveská___menu.html",
    parse(doc) {
      const days = [];
      doc.querySelectorAll("section#menu article").forEach((article) => {
        const dayTitleEl = article.querySelector("div.text-xs.font-bold.uppercase");
        const dateEl = article.querySelector("div.mt-1.font-bold.text-white");
        if (!dayTitleEl) return;

        const raw = cleanText(dayTitleEl.textContent);
        const day = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
        const screenings = [];

        article.querySelectorAll(".divide-y > div").forEach((item) => {
          const titleEl = item.querySelector(".font-bold.text-hospoda-cream");
          const priceEl = item.querySelector(".shrink-0.font-bold.text-hospoda-cream");
          if (titleEl) {
            screenings.push({
              title: cleanText(titleEl.textContent),
              price: priceEl ? parsePrice(priceEl.textContent) : null
            });
          }
        });
        days.push({ day, date: dateEl ? cleanText(dateEl.textContent) : "", screenings });
      });
      return days;
    }
  }
];

/* ---------- Stav a prvky ---------- */

const statusText = document.getElementById("status");
const refreshButton = document.getElementById("refresh");
const cards = document.getElementById("cards");
const filters = document.getElementById("filters");
const dayNav = document.getElementById("day-nav");
const dayLabel = document.getElementById("selected-day-label");

const results = {};
const hiddenSources = new Set();

const todayIndex = (new Date().getDay() + 6) % 7;
const todayName = DAY_NAMES[todayIndex];
let selectedDay = todayIndex < 5 ? todayName : WORK_DAYS[0];

const todayTime = document.getElementById("today-time");
todayTime.dateTime = new Date().toISOString().slice(0, 10);
todayTime.textContent = `${todayName} ${new Date().toLocaleDateString("sk-SK")}`;

/* ---------- Načítanie ---------- */

refreshButton.addEventListener("click", loadAll);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function loadSource(source) {
  await wait(DELAYS[source.id] ?? 0);
  const response = await fetch(source.localUrl);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const doc = new DOMParser().parseFromString(await response.text(), "text/html");
  const days = source.parse(doc);
  if (!days.some((d) => d.screenings.length)) {
    throw new Error("v stránke sa nenašlo žiadne menu");
  }
  return days;
}

/* ---------- Vykresľovanie ---------- */

function formatPrice(price) {
  return price === null ? "" : `${price.toFixed(2).replace(".", ",")} €`;
}

function createDayBlock(entry, dayName) {
  const block = document.createElement("section");
  block.className = "day-block";
  if (dayName === todayName) block.classList.add("is-today");

  const heading = document.createElement("h3");
  heading.textContent = dayName;
  if (entry?.date) {
    heading.append(" ");
    const time = document.createElement("time");
    const m = entry.date.match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})?/);
    if (m) {
      const year = m[3] || new Date().getFullYear();
      time.dateTime = `${year}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    }
    time.textContent = entry.date;
    heading.append(time);
  }
  block.append(heading);

  if (!entry || entry.screenings.length === 0) {
    const empty = document.createElement("p");
    empty.className = "mb-0 text-body-secondary";
    empty.textContent = "Menu na tento deň nie je k dispozícii.";
    block.append(empty);
    return block;
  }

  const list = document.createElement("ul");
  list.className = "list-unstyled mb-0 menu-list";
  for (const item of entry.screenings) {
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = item.title;
    li.append(name);
    if (item.price !== null) {
      const price = document.createElement("span");
      price.className = "menu-price";
      price.textContent = formatPrice(item.price);
      li.append(price);
    }
    list.append(li);
  }
  block.append(list);
  return block;
}

function createMenuContent(days) {
  const names = selectedDay === ALL_WEEK ? WORK_DAYS : [selectedDay];
  const fragment = document.createDocumentFragment();
  for (const name of names) {
    const entry = days.find((d) => d.day.toLowerCase() === name.toLowerCase());
    fragment.append(createDayBlock(entry, name));
  }
  return fragment;
}

function createCard(source) {
  const result = results[source.id] ?? { state: "loading" };

  const column = document.createElement("div");
  column.className = selectedDay === ALL_WEEK ? "col-12 col-lg-6 col-xl-4" : "col-12 col-md-6 col-lg-4";

  const card = document.createElement("article");
  card.className = "card h-100";

  const header = document.createElement("header");
  header.className = "card-header d-flex justify-content-between align-items-center";
  const title = document.createElement("h3");
  title.className = "h5 mb-0";
  const link = document.createElement("a");
  link.href = source.website;
  link.textContent = source.name;
  link.target = "_blank";
  link.rel = "noopener";
  title.append(link);
  header.append(title);

  const body = document.createElement("div");
  body.className = "card-body";

  if (result.state === "loading") {
    const spinner = document.createElement("div");
    spinner.className = "spinner-border spinner-border-sm";
    spinner.setAttribute("role", "status");
    const label = document.createElement("span");
    label.className = "visually-hidden";
    label.textContent = "Načítava sa…";
    spinner.append(label);
    header.append(spinner);
    body.textContent = "Načítavam denné menu…";
  } else if (result.state === "error") {
    body.classList.add("text-danger");
    body.textContent = `Menu sa nepodarilo načítať (${result.error.message}). `;
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "btn btn-sm btn-outline-danger mt-2 d-block";
    retry.textContent = "Skúsiť znova";
    retry.addEventListener("click", () => loadOne(source).catch(() => {}));
    body.append(retry);
  } else {
    body.append(createMenuContent(result.days));
  }

  const footer = document.createElement("footer");
  footer.className = "card-footer small text-body-secondary";
  if (result.updatedAt) {
    footer.append("Aktualizované ");
    const time = document.createElement("time");
    time.dateTime = result.updatedAt.toISOString();
    time.textContent = result.updatedAt.toLocaleString("sk-SK");
    footer.append(time);
  } else {
    footer.textContent = "Zatiaľ nenačítané";
  }

  card.append(header, body, footer);
  column.append(card);
  return column;
}

function renderCards() {
  dayLabel.textContent = selectedDay === ALL_WEEK ? "celý týždeň" : selectedDay;
  const visible = SOURCES.filter((s) => !hiddenSources.has(s.id));
  cards.replaceChildren(...visible.map(createCard));
}

function renderDayNav() {
  const tabs = [...WORK_DAYS, ALL_WEEK];
  dayNav.replaceChildren(...tabs.map((value) => {
    const li = document.createElement("li");
    li.className = "nav-item";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "nav-link" + (value === selectedDay ? " active" : "");
    button.textContent = value === ALL_WEEK ? "Celý týždeň" : value;
    if (value === selectedDay) button.setAttribute("aria-current", "true");
    button.addEventListener("click", () => {
      selectedDay = value;
      renderDayNav();
      renderCards();
    });
    li.append(button);
    return li;
  }));
}

/* Filtre reštaurácií */
for (const source of SOURCES) {
  const label = document.createElement("label");
  label.className = "form-check form-check-inline";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "form-check-input";
  checkbox.checked = true;
  checkbox.addEventListener("change", () => {
    checkbox.checked ? hiddenSources.delete(source.id) : hiddenSources.add(source.id);
    renderCards();
  });
  label.append(checkbox, ` ${source.name}`);
  filters.append(label);
}

/* ---------- Načítanie ---------- */

async function loadOne(source) {
  const previous = results[source.id];
  results[source.id] = { state: "loading", updatedAt: previous?.updatedAt };
  renderCards();
  try {
    const days = await loadSource(source);
    results[source.id] = { state: "ok", days, updatedAt: new Date() };
  } catch (error) {
    results[source.id] = { state: "error", error, updatedAt: previous?.updatedAt };
    throw error;
  } finally {
    renderCards();
  }
}

async function loadAll() {
  refreshButton.disabled = true;
  statusText.textContent = "Načítavam denné menu…";
  const outcomes = await Promise.allSettled(SOURCES.map(loadOne));
  const failed = outcomes.filter((o) => o.status === "rejected").length;
  statusText.textContent = `Načítané ${SOURCES.length - failed} z ${SOURCES.length} reštaurácií.`;
  refreshButton.disabled = false;
}

renderDayNav();
loadAll();