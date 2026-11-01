"use strict";

const WORK_DAYS = DAY_NAMES.slice(0, 5);
const ALL_WEEK = "all";
const STORAGE_PREFIX = "obedove-menu:";


const statusText = document.getElementById("status");
const refreshButton = document.getElementById("refresh");
const clearButton = document.getElementById("clear");
const cards = document.getElementById("cards");
const filters = document.getElementById("filters");
const dayNav = document.getElementById("day-nav");
const dayLabel = document.getElementById("selected-day-label");
const weekendNote = document.getElementById("weekend-note");

const now = new Date();
const todayIndex = (now.getDay() + 6) % 7;
const todayName = DAY_NAMES[todayIndex];
const isWeekend = todayIndex > 4;

let selectedDay = isWeekend ? WORK_DAYS[0] : todayName;
const results = {};
const hiddenSources = new Set();

function todayKey() {
  return new Date().toLocaleDateString("sv-SE");
}

function readStored(source) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + source.id);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.days) || !data.updatedAt) return null;
    const updatedAt = new Date(data.updatedAt);
    if (Number.isNaN(updatedAt.getTime())) return null;
    return { days: data.days, updatedAt, dayKey: data.dayKey };
  } catch {
    return null; 
  }
}

function writeStored(source, days, updatedAt) {
  try {
    localStorage.setItem(
      STORAGE_PREFIX + source.id,
      JSON.stringify({ days, updatedAt: updatedAt.toISOString(), dayKey: todayKey() })
    );
  } catch {
    
  }
}

function clearStored() {
  for (const source of SOURCES) {
    try {
      localStorage.removeItem(STORAGE_PREFIX + source.id);
    } catch {
      /* ignorujeme */
    }
  }
}

async function loadSource(source) {
  let response;
  try {
    response = await fetch(source.localUrl);
  } catch {
    throw new Error("Stránka reštaurácie je momentálne nedostupná.");
  }
  if (!response.ok) {
    throw new Error(`Stránka reštaurácie je nedostupná (chyba ${response.status}).`);
  }

  const doc = parseHtml(await response.text());

  let days;
  try {
    days = source.parse(doc);
  } catch {
    throw new Error("Štruktúra stránky sa zmenila, menu sa nepodarilo spracovať.");
  }
  if (!Array.isArray(days) || !days.some((day) => day.items && day.items.length)) {
    throw new Error("Na stránke sa nenašlo žiadne menu. Možno sa zmenila jej štruktúra.");
  }
  return days;
}

async function loadOne(source, force = false) {
  if (!force) {
    const stored = readStored(source);
    if (stored && stored.dayKey === todayKey()) {
      results[source.id] = { state: "ok", days: stored.days, updatedAt: stored.updatedAt };
      renderCards();
      return;
    }
  }

  const fallback = results[source.id]?.days ? results[source.id] : readStored(source);
  results[source.id] = { state: "loading" };
  renderCards();

  try {
    const days = await loadSource(source);
    const updatedAt = new Date();
    results[source.id] = { state: "ok", days, updatedAt };
    writeStored(source, days, updatedAt);
  } catch (error) {
    results[source.id] = fallback
      ? { state: "ok", days: fallback.days, updatedAt: fallback.updatedAt, warning: error.message }
      : { state: "error", error };
    throw error;
  } finally {
    renderCards();
  }
}

async function loadAll(force = false) {
  refreshButton.disabled = true;
  cards.setAttribute("aria-busy", "true");
  statusText.textContent = "Načítavam menu…";

  const outcomes = await Promise.allSettled(SOURCES.map((source) => loadOne(source, force)));
  const failed = outcomes.filter((outcome) => outcome.status === "rejected").length;

  statusText.textContent = failed
    ? `Načítané ${SOURCES.length - failed} z ${SOURCES.length} reštaurácií. Pri ${failed} sa vyskytla chyba.`
    : `Menu je pripravené (${SOURCES.length} z ${SOURCES.length} reštaurácií).`;
  cards.setAttribute("aria-busy", "false");
  refreshButton.disabled = false;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatPrice(price) {
  return `${price.toFixed(2).replace(".", ",")} €`;
}

function createItem(item) {
  const li = el("li", "item");

  const info = el("div");
  info.append(el("span", "item-title", item.title));
  const meta = [item.amount, item.allergens ? `alergény: ${item.allergens}` : ""].filter(Boolean).join(" · ");
  if (meta) info.append(el("span", "item-meta", meta));
  li.append(info);

  if (typeof item.price === "number") li.append(el("span", "price", formatPrice(item.price)));
  return li;
}

function createGroup(type, label, items) {
  if (items.length === 0) return null;
  const group = el("div", `group group-${type}`);
  group.append(el("p", "group-label", label));
  const list = el("ul", "items");
  list.append(...items.map(createItem));
  group.append(list);
  return group;
}

function createDayBlock(entry, dayName, showHeading, shownImages = new Set()) {
  const block = el("section", "day-block");

  if (showHeading) {
    const heading = el("h4", "day-heading", dayName);
    if (entry?.date) heading.append(createTime(entry.date));
    if (dayName === todayName) heading.append(el("span", "badge", "dnes"));
    block.append(heading);
  } else if (entry?.date) {
    const line = el("p", "day-date");
    line.append(createTime(entry.date));
    block.append(line);
  }

  const items = entry?.items ?? [];
  if (items.length === 0) {
    block.append(el("p", "empty", "Menu na tento deň nie je k dispozícii."));
    return block;
  }

  const images = items.filter((item) => item.type === "image");
  if (images.length > 0) {
    for (const image of images) {
      if (shownImages.has(image.src)) {
        block.append(el("p", "empty", "Týždenné menu je zobrazené pri prvom dni."));
      } else {
        shownImages.add(image.src);
        block.append(createImage(image));
      }
    }
    return block;
  }

  const soups = createGroup("soup", "Polievka", items.filter((item) => item.type === "soup"));
  const mains = createGroup("main", "Hlavné jedlá", items.filter((item) => item.type !== "soup"));
  block.append(...[soups, mains].filter(Boolean));
  return block;
}

function createImage(item) {
  const figure = el("figure", "menu-image");
  const link = el("a");
  link.href = item.src;
  link.target = "_blank";
  link.rel = "noopener";
  const img = el("img");
  img.src = item.src;
  img.alt = item.title;
  img.loading = "lazy";
  link.append(img);
  figure.append(link, el("figcaption", "", "Menu je na webe reštaurácie zverejnené ako obrázok. Kliknutím ho zväčšíte."));
  return figure;
}

function createTime(dateText) {
  const time = el("time", "", dateText);
  const match = dateText.match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})?/);
  if (match) {
    const year = match[3] || new Date().getFullYear();
    time.dateTime = `${year}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  }
  return time;
}

function createMenuContent(days) {
  const week = selectedDay === ALL_WEEK;
  const names = week ? WORK_DAYS : [selectedDay];
  const fragment = document.createDocumentFragment();
  const shownImages = new Set(); // týždenný obrázok sa v zobrazení celého týždňa ukáže len raz
  for (const name of names) {
    const entry = days.find((day) => day.day.toLowerCase() === name.toLowerCase());
    fragment.append(createDayBlock(entry, name, week, shownImages));
  }
  return fragment;
}

function createCard(source) {
  const result = results[source.id] ?? { state: "loading" };

  const card = el("article", "card");

  const header = el("header", "card-header");
  const title = el("h3", "card-title");
  const link = el("a", "", source.name);
  link.href = source.website;
  link.target = "_blank";
  link.rel = "noopener";
  title.append(link);
  if (result.state === "loading") {
    const spinner = el("span", "spinner");
    spinner.setAttribute("role", "status");
    spinner.setAttribute("aria-label", "Načítava sa");
    title.append(spinner);
  }
  header.append(title);
  if (source.address) header.append(el("address", "card-address", source.address));

  const body = el("div", "card-body");
  if (result.state === "loading") {
    body.append(el("p", "message-info", "Načítavam denné menu…"));
  } else if (result.state === "error") {
    const box = el("div", "message-error");
    box.append(el("p", "", `Menu sa nepodarilo načítať. ${result.error.message}`));
    const retry = el("button", "btn btn-ghost", "Skúsiť znova");
    retry.type = "button";
    retry.addEventListener("click", () => loadOne(source, true).catch(() => {}));
    box.append(retry);
    body.append(box);
  } else if (result.state === "ok") {
    if (result.warning) {
      body.append(el("p", "message-warn", `Aktualizácia zlyhala (${result.warning}) Zobrazujú sa predtým uložené dáta.`));
    }
    body.append(createMenuContent(result.days));
  } else {
    body.append(el("p", "message-info", "Dáta nie sú načítané. Kliknite na „Aktualizovať menu“."));
  }

  const footer = el("footer", "card-footer");
  if (result.updatedAt) {
    footer.append("Naposledy aktualizované: ");
    const time = el("time", "", result.updatedAt.toLocaleString("sk-SK"));
    time.dateTime = result.updatedAt.toISOString();
    footer.append(time);
  } else {
    footer.textContent = "Zatiaľ neaktualizované";
  }

  card.append(header, body, footer);
  return card;
}

function renderCards() {
  dayLabel.textContent = selectedDay === ALL_WEEK ? "celý týždeň" : selectedDay;
  const visible = SOURCES.filter((source) => !hiddenSources.has(source.id));
  if (visible.length === 0) {
    cards.replaceChildren(el("p", "empty", "Nie je vybraná žiadna reštaurácia. Zapnite aspoň jednu vo filtri."));
    return;
  }
  cards.replaceChildren(...visible.map(createCard));
}

function renderDayNav() {
  const tabs = [...WORK_DAYS, ALL_WEEK];
  dayNav.replaceChildren(
    ...tabs.map((value) => {
      const li = el("li");
      const button = el("button", "", value === ALL_WEEK ? "Celý týždeň" : value);
      button.type = "button";
      if (value === selectedDay) button.setAttribute("aria-current", "true");
      if (value === todayName) button.append(el("span", "today-mark", "dnes"));
      button.addEventListener("click", () => {
        selectedDay = value;
        renderDayNav();
        renderCards();
      });
      li.append(button);
      return li;
    })
  );
}

function renderFilters() {
  for (const source of SOURCES) {
    const label = el("label");
    const checkbox = el("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) hiddenSources.delete(source.id);
      else hiddenSources.add(source.id);
      renderCards();
    });
    label.append(checkbox, source.name);
    filters.append(label);
  }
}

refreshButton.addEventListener("click", () => loadAll(true));

clearButton.addEventListener("click", () => {
  clearStored();
  for (const source of SOURCES) results[source.id] = { state: "empty" };
  renderCards();
  statusText.textContent = "Uložené dáta boli vymazané.";
});

const todayTime = document.getElementById("today-time");
todayTime.dateTime = todayKey();
todayTime.textContent = `${todayName} ${now.toLocaleDateString("sk-SK")}`;
weekendNote.hidden = !isWeekend;

renderFilters();
renderDayNav();
renderCards();
loadAll(false);