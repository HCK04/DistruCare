# Instructions de session — DisrtuCare

> Fichier de reprise. À lire en début de session pour savoir **exactement** quoi faire.
> Dernière mise à jour : 2026-06-13

---

## 🎯 Les deux grandes tâches en cours

### Tâche A — Rédiger le RAPPORT complet (projet biomédical, en français)

Un seul document académique en français suivant **exactement** ce plan :

- **Introduction** : contexte général, problématique, objectifs, méthodologie, organisation du rapport.
- **Chapitre 1 — Étude du besoin & état de l'art** : analyse du besoin, solutions existantes, limites des systèmes actuels, **cahier des charges fonctionnel**.
- **Chapitre 2 — Conception du système** : architecture globale, spécifications techniques, conception matérielle (composants + schémas), conception logicielle (niveau **conceptuel uniquement**), modélisation (diagrammes). Bien **séparer matériel / logiciel** et rester **théorique** pour ne pas répéter le Ch. 3.
- **⭐ Chapitre 3 — Fonctionnement & développement logiciel (PARTIE DU PROPRIÉTAIRE, la plus détaillée)** : fonctionnement du système matériel, développement logiciel (code/algorithmes décrits simplement), **organigramme (logigramme)**, intégration matériel↔logiciel, difficultés & solutions.
- **Chapitre 4 — Tests et validation** : protocole de test, résultats, analyse des performances, limites. Distinguer **résultats** vs **interprétation**.
- **Conclusion générale & perspectives** : bilan, apports, limites, perspectives (IoT, app mobile, améliorations).

**RÈGLES NON NÉGOCIABLES :**
1. **ANTI-PLAGIAT = PRIORITÉ N°1.** Rédaction 100 % originale, reformulée, tournures variées. Pas de copier-coller de définitions toutes faites. Le `chapitre3_disrtucare.tex` existant doit être **réécrit/reformulé**, jamais recopié tel quel.
2. **PAS TROP TECHNIQUE.** C'est un projet **biomédical**, pas informatique. Angle santé / patient / observance. Explications par analogie. Éviter le jargon code/électronique lourd.
3. **EN FRANÇAIS**, registre académique.
4. **Ch. 3 le plus détaillé** (c'est la partie du propriétaire) tout en restant accessible.
5. Éviter la redondance **Ch. 2 (théorique)** ↔ **Ch. 3 (fonctionnement réel)**.

**Sortie LaTeX** : réutiliser le style déjà présent (`rapport_disrtucare.tex`, `chapitre3_disrtucare.tex`) — couleurs navy/teal, tcolorbox, organigramme TikZ. Décider avec le propriétaire : un seul `.tex` global OU rapport principal + chapitre 3 séparé.

---

### Tâche B — REDESIGN de l'UI : « vraie app médicale », moins de bruit « IA »

Le propriétaire trouve l'UI actuelle trop « AI-generated ». Objectif : **propre, clinique, sobre**, comme une vraie application médicale.

**Ce qui fait « IA » dans l'UI actuelle (à supprimer) :**
- Fond bleu nuit sombre `#0B1120` + ombres turquoise « glow » (`Shadows.accent`).
- Émojis (`👋` dans le greeting, `🎉` dans « All doses logged »).
- Palette arc-en-ciel `MedColors` (8 couleurs vives).
- Labels en MAJUSCULES avec letter-spacing (« NEXT DOSE IN »).
- Carte « Next Dose » entièrement remplie en teal vif.
- Anglais (« Good morning », « Today's Doses »).

**Direction du redesign (plan à appliquer) :**
1. **Thème clair clinique** : fond blanc / gris très clair (`#F8FAFC`), cartes blanches, texte foncé. Plus lisible pour les seniors, plus « medical-grade ».
2. **Une seule couleur primaire calme** (teal médical sobre ou bleu clinique), utilisée avec parcimonie — supprimer le rainbow `MedColors`.
3. **Zéro émoji.** Remplacer par des icônes outline cohérentes (`@expo/vector-icons`) toujours accompagnées de texte.
4. **Cartes plates** : bordure 1px discrète + ombre très douce, pas de « glow ».
5. **Hiérarchie typographique forte** + beaucoup d'espace blanc (grille 8pt). Pas de labels tout en majuscules tracés.
6. **Couleurs de statut désaturées** (vert/ambre/rouge cliniques) réservées à de petits indicateurs, pas à de grands aplats.
7. **Carte « Prochaine dose »** : carte blanche, barre d'accent latérale ou petite icône, au lieu d'un aplat teal vif.
8. **Grandes cibles tactiles conservées** (≥56px) pour l'accessibilité des personnes âgées.
9. (À confirmer) **Passer l'app en français** pour cohérence avec le rapport, ou rester en anglais.

**Fichiers concernés :** `src/theme/index.ts` (refonte tokens), puis les écrans `src/screens/*.tsx`, et composants `src/components/*.tsx` (DoseCard, AdherenceRing, StatusBadge, ConfirmModal), `src/hardware/HardwareStatusBar.tsx`.

> ✅ Statut : le redesign est **IMPLÉMENTÉ** (2026-06-13). Thème clair clinique, zéro émoji (icônes Ionicons), une seule couleur primaire, app **entièrement en français**, et **bouton « confort visuel » (œil)** qui agrandit toute la typographie.

**Système de gros caractères (accessibilité) :**
- Contexte `src/context/UISettings.tsx` → hook `useUI()` expose `{ largeText, fonts, toggleLargeText, setLargeText }`.
- `fonts` = `makeFonts(largeText)` dans `theme/index.ts` (facteur ×1.32).
- Chaque écran/composant construit ses styles via `makeStyles(fonts)` → tout le texte se met à l'échelle.
- Préférence persistée en SQLite (colonne `schedule.large_text`).
- Accès rapide : **icône œil** dans l'en-tête du tableau de bord + interrupteur **« Confort visuel »** dans Réglages › Accessibilité.

---

## 🚀 Comment lancer l'application

- C'est une app **Expo / React Native** (mobile, testée via **Expo Go**, PAS sur web).
- ⚠️ **Le web ne marche pas** : `expo-sqlite` n'a pas de moteur wasm fourni (`wa-sqlite.wasm` introuvable). Ne PAS utiliser `--web`.
- **Bonne commande** (ouvre une fenêtre CMD séparée avec le QR code à scanner avec Expo Go) :
  ```
  npx expo start
  ```
- Le téléphone et le PC doivent être sur le **même réseau WiFi**. Scanner le QR avec l'app **Expo Go**.

---

### Tâche C — Maquettes iPhone (style App Store) — ✅ OUTIL PRÊT

Générateur automatique de **maquettes marketing iPhone 17 Pro Max** dans `mockups/`.
- `mockups/make-mockups.ps1` : dessine le cadre iPhone (titane, Dynamic Island,
  coins arrondis, ombre) autour de chaque capture, sur fond dégradé + légende.
- **ImageMagick** installé via `scoop install imagemagick`. Binaire :
  `~\scoop\apps\imagemagick\current\magick.exe`. Le build portable a besoin que
  son dossier racine + `modules\coders` soient dans le PATH (le script le fait).
- Flux : capturer les écrans dans **Expo Go** → déposer les PNG dans
  `mockups/screens/` → lancer `powershell -ExecutionPolicy Bypass -File .\make-mockups.ps1`
  → sortie dans `mockups/out/`.
- Légendes dans `mockups/captions.txt` (`nomfichier=Légende`).
- `mockups/screens/dashboard.png` est un **placeholder** de démo, à remplacer.
- Pièges déjà résolus : `RI` est un alias Remove-Item (fonction renommée `RInt`) ;
  chemins de police en `/` ; légendes accentuées lues via fichier UTF-8 ;
  modules ImageMagick à mettre dans le PATH.

## 📌 État / prochaines étapes

- [x] Repo analysé (firmware, src, rules.md, HARDWARE.md, LaTeX existants).
- [x] App lancée et vérifiée (Metro bundler OK ; web KO à cause de SQLite — normal).
- [x] Instructions sauvegardées (ce fichier).
- [x] Plan UI « medical clean » défini.
- [ ] **EN ATTENTE feu vert** : implémenter le redesign UI.
- [ ] **EN ATTENTE feu vert** : rédiger le rapport complet selon le plan.

## 🧠 Contexte matériel FINAL (mis à jour 2026-06-13 — état réel assemblé)

- NodeMCU V3 (ESP8266) + ULN2003 + moteur 28BYJ-48 — **fonctionne, assemblé**.
- **Câblage moteur FINAL : D5→IN1, D6→IN2, D7→IN3, D0→IN4** (IN4 déplacé de D8 vers
  D0 car D8/GPIO15 est une broche de *strapping* qui bloquait le démarrage).
- **Bouton sur D3** (câblage diagonal du bouton tactile, sinon il maintient GPIO0 bas → blocage boot).
- **LCD 16×2 I²C sur D1(SCL)/D2(SDA), adresse 0x27** — détecté auto (0x27/0x3F), code non bloquant.
- **PAS de DS3231** (horloge logicielle, re-sync par l'app via `/settime`) ; **PAS de LED**.
- Alim moteur sur **VU/5V** (pas VIN), cavalier ULN2003 installé.
- **WiFi multi-réseaux** (ESP8266WiFiMulti) : liste {MG1, La_Fibre_dOrange_0E96, iPhone}
  dans `setupWifiList()` ; rejoint le réseau dispo, bascule/reconnecte auto. (Flash en attente.)
- **Rotation : STEPS_PER_SLOT = 2048 demi-pas** = ½ tour = 1 compartiment (15 logements + réducteur 7,5:1, d'après l'Instructables).
- Communication : **WiFi / HTTP / JSON**, sondage `/status` toutes les 3 s (`event_id`).
- 7 endpoints : `/status`, `/sync`, `/settime`, `/led`, `/motor`, `/diag`, `/selftest`.
- **Cause racine du calvaire WiFi** : broches de boot (strapping) D8/D3 ; voir mémoire `project-strapping-boot-rootcause`.
- `rules.md` dit « pas de connectivité / Arduino Uno » mais contrainte **levée** (NodeMCU + WiFi).

> Ces changements doivent se refléter dans le rapport (surtout Ch. 3 : broches moteur,
> horloge logicielle, multi-WiFi, et les difficultés boot/strapping comme vécu original).
