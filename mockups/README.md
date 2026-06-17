# Maquettes iPhone — DisrtuCare

Génère automatiquement des **maquettes marketing** (style App Store / Behance) :
ta capture d'écran insérée dans un cadre **iPhone 17 Pro Max** (corps titane,
Dynamic Island, coins arrondis, ombre portée) sur un fond dégradé avec légende.

Le cadre est **dessiné par ImageMagick** — aucune image de bezel à télécharger,
et il s'adapte tout seul à la résolution de chaque capture.

---

## Utilisation en 3 étapes

1. **Capture tes écrans dans Expo Go** (sur le téléphone, bouton de capture
   habituel). Une capture par écran : tableau de bord, historique, réglages, etc.

2. **Dépose les PNG** dans le dossier `mockups/screens/`.
   Nomme-les simplement : `dashboard.png`, `history.png`, `settings.png`,
   `hardware.png`, `onboarding.png`… (le nom sert de clé pour la légende).

3. **Lance le générateur** depuis le dossier `mockups/` :
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\make-mockups.ps1
   ```
   Les maquettes finies arrivent dans `mockups/out/`.

> ⚠️ Le fichier `screens/dashboard.png` actuel est un **exemple** (placeholder).
> Remplace-le par ta vraie capture.

---

## Légendes

Édite `mockups/captions.txt` — une ligne par écran :
```
dashboard=Votre tableau de bord, en un coup d'œil
history=Suivez votre observance jour après jour
```
Le `nom` à gauche du `=` doit correspondre au nom du fichier PNG (sans extension).
Sans entrée, le nom du fichier est utilisé comme légende.

---

## Options

| Option | Effet | Exemple |
|--------|-------|---------|
| `-Bg1` / `-Bg2` | Couleurs du dégradé (haut / bas) | `-Bg1 "#102036" -Bg2 "#0F766E"` |
| `-CaptionColor` | Couleur du texte de légende | `-CaptionColor "#FFFFFF"` |
| `-BodyColor` / `-EdgeColor` | Couleur du corps / liseré de l'iPhone | `-BodyColor "#0A0A0C"` |
| `-NoCaption` | Sans légende (cadre + fond seulement) | `-NoCaption` |
| `-ScreensDir` / `-OutDir` | Dossiers d'entrée / sortie | `-OutDir .\export` |

Exemples :
```powershell
# Fond bleu nuit -> teal
.\make-mockups.ps1 -Bg1 "#102036" -Bg2 "#0F766E"

# iPhone noir, sans légende
.\make-mockups.ps1 -BodyColor "#0A0A0C" -NoCaption
```

---

## Prérequis

- **ImageMagick** (déjà installé via `scoop install imagemagick`).
  Le script trouve `magick.exe` tout seul et configure les chemins de modules.
- Police **Segoe UI Bold** (présente sur Windows 11) pour les légendes.

## Dépannage

- *« no decode delegate »* → ImageMagick ne trouve pas ses modules. Le script
  gère ça automatiquement ; si tu lances `magick` à la main, ajoute le dossier
  `…\scoop\apps\imagemagick\current` au `PATH`.
- *Accents cassés dans la légende* → déjà géré (lecture via fichier UTF-8).
- *Cadre trop épais/fin* → ajuste le facteur `0.026` (épaisseur du bord) dans
  `make-mockups.ps1`.
