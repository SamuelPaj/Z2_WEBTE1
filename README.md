# Obedové menu v okolí FEI STU (WEBTE1, zadanie č. 2)

Webová stránka, ktorá zo stránok reštaurácií v okolí FEI STU spracuje denné menu
a zobrazí ho podľa dní v týždni. Celé riešenie beží na strane klienta
(HTML, CSS, JavaScript).

Autor: Samuel Piteľ

## Reštaurácie (zdroje)

| Reštaurácia | Pôvodná stránka | Lokálna kópia |
|---|---|---|
| Reštaurácia Drag | https://www.restauracia-drag.sk/denne-menu | `source/Reštaurácia_DRAG_menu.html` |
| Naše Hospoda Karloveská | https://nasehospoda-karloveska.sk/#menu | `source/Naše Hospoda Karloveská _ Bratislava - Karlova Ves.html` |
| Jedna Báseň | https://www.jednabasen.sk/restauracja/jedna-basen-karlova-ves | `source/Jedna_basen_menu.html` |

Podľa spresnenia k bodu (3) sa načítavajú lokálne kópie stránok, proxy sa nepoužíva.

## Spustenie

Stránka načítava súbory cez AJAX, preto ju treba otvoriť cez HTTP server
(po otvorení cez `file://` prehliadač načítanie blokuje):

```
python -m http.server 8000
```

a potom otvoriť `http://localhost:8000/`.

## Štruktúra

```
index.html          hlavná stránka s menu
o-projekte.html     podstránka „O projekte“
css/fonts.css       @font-face pre lokálny font
css/styles.css      vlastné štýly
css/vendor/         Bootstrap
js/parsers.js       parsery reštaurácií a zoznam zdrojov (SOURCES)
js/script.js        načítanie, ukladanie, zobrazenie
js/vendor/          jQuery
fonts/              Poppins (.woff2) a licencia
source/             lokálne kópie stránok reštaurácií
docs/               výpisy z validátorov
```

## Ako to funguje

1. `loadSource` načíta lokálnu kópiu cez jQuery AJAX (`$.ajax`) ako text.
2. Text sa spracuje cez `DOMParser` a údaje sa hľadajú cez `querySelector`
   a `querySelectorAll`. Cudzí HTML sa do stránky nevkladá.
3. Parser každej reštaurácie vráti rovnakú štruktúru
   `[{ day, date, items: [{ type, title, amount, allergens, price }] }]`.
4. Výsledok sa ukladá do `localStorage` (kľúč `obedove-menu:<id>`).
   Ak sú uložené dáta z dnešného dňa, stránky sa znova nenačítavajú.
5. Tlačidlá „Aktualizovať menu“ a „Vymazať uložené dáta“ spustia nové načítanie,
   resp. odstránia uložené dáta.
6. Chyba pri jednej reštaurácii (nedostupná stránka, zmenená štruktúra, chýbajúce
   menu) sa zobrazí len na jej karte, ostatné fungujú.

### Pridanie novej reštaurácie

V `js/parsers.js` napíšte funkciu `parseNazov(doc)`, ktorá vráti pole dní
v jednotnej štruktúre, a pridajte záznam do poľa `SOURCES`
(`id`, `name`, `address`, `website`, `localUrl`, `parse`).

## Použité knižnice

| Knižnica | Verzia | Použitie | Licencia |
|---|---|---|---|
| Bootstrap (CSS) | 5.3.3 | mriežka, karty, tlačidlá, záložky, prepínače, hlásenia | MIT |
| jQuery | 3.7.1 | AJAX, práca s DOM a udalosťami | MIT |

Knižnice sú uložené lokálne v `css/vendor/` a `js/vendor/`. Nepoužité sú žiadne
JavaScriptové frameworky.

## Font a licencia

Použitý je font **Poppins** (Poppins Project Authors, https://github.com/itfoundry/Poppins),
uložený lokálne ako `.woff2` v priečinku `fonts/` (reznice 400, 600 a 700,
podmnožiny latin a latin-ext kvôli slovenskej diakritike) a pripojený cez `@font-face`
v `css/fonts.css`. Súbory pochádzajú z balíka `@fontsource/poppins`.

Licencia: **SIL Open Font License 1.1**, plné znenie je v `fonts/LICENSE-Poppins-OFL.txt`.

## Použitie AI nástrojov

Pri vypracovaní bol použitý AI asistent **Claude (Anthropic)**. Pomohol s parserom pre
reštauráciu Jedna Báseň, s úpravou kódu na Bootstrap a jQuery, s lokálnym fontom
a s textami README a stránky „O projekte“. Za obsah a funkčnosť riešenia
zodpovedá autor, ktorý ho vie vysvetliť.

## Validácia

Výpisy z validátorov (https://validator.w3.org/ a https://jigsaw.w3.org/css-validator/)
patria do priečinka `docs/`.
