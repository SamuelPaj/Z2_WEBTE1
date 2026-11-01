# Obedové menu v okolí FEI STU (WEBTE1, zadanie č. 2)

Autor: Samuel Piteľ.
Web na školskom serveri: https://webte1.fei.stuba.sk/~xpitels/Z2_Pite%c4%be/index.html

## Reštaurácie (zdroje)

| Reštaurácia | Pôvodná stránka | Lokálna kópia |
|---|---|---|
| Reštaurácia Drag | https://www.restauracia-drag.sk/restauracia-drag | `source/Reštaurácia_DRAG_menu.html` |
| Naše Hospoda Karloveská | https://nasehospoda-karloveska.sk/ | `source/Naše Hospoda Karloveská _ Bratislava - Karlova Ves.html` |
| Jedna Báseň | https://www.jednabasen.sk/ | `source/Jedna_basen_menu.html` |

Podľa spresnenia k bodu (3) sa načítavajú lokálne kópie stránok, proxy sa nepoužíva.


## Použité knižnice

| Knižnica | Verzia | Použitie | Licencia |
|---|---|---|---|
| Bootstrap (CSS) | 5.3.3 | mriežka, karty, tlačidlá, záložky, prepínače, hlásenia | MIT |
| jQuery | 3.7.1 | AJAX, práca s DOM a udalosťami | MIT |

Knižnice sú uložené lokálne v `css/vendor/` a `js/vendor/`. Nie sú použité žiadne
JavaScriptové frameworky.

## Font a licencia

Použitý je font **Poppins** (Poppins Project Authors, https://github.com/itfoundry/Poppins),
uložený lokálne ako `.woff2` v priečinku `fonts/` (reznice 400, 600 a 700,
podmnožiny latin a latin-ext kvôli slovenskej diakritike) a pripojený cez `@font-face`
v `css/fonts.css`. Súbory pochádzajú z balíka `@fontsource/poppins`.

Licencia: **SIL Open Font License 1.1**, plné znenie je v `fonts/LICENSE-Poppins-OFL.txt`.

## Použitie AI nástrojov

AI som využíval pri javascripte. Taktiež som ho využil na vygenerovanie favicon obrázku. A na skontrolovanie zadania či spĺňa to čo má. Požíval som Claude.
