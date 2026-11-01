# Obedové menu v okolí FEI STU (WEBTE1, zadanie č. 2)

Autor: Samuel Piteľ
https://webte1.fei.stuba.sk/~xpitels/Z2_Pite%c4%be/index.html

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

Pri vypracovaní bol použitý AI asistent **Claude (Anthropic)**. Pomohol s parserom pre
reštauráciu Jedna Báseň, s úpravou kódu na Bootstrap a jQuery, s lokálnym fontom
a s textami README a stránky „O projekte“. Za obsah a funkčnosť riešenia
zodpovedá autor, ktorý ho vie vysvetliť.

## Validácia

Výpisy z validátorov (https://validator.w3.org/ a https://jigsaw.w3.org/css-validator/)
patria do priečinka `docs/`.
