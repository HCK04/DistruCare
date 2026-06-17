<#
  make-mockups.ps1 — Générateur de maquettes "iPhone 17 Pro Max" pour DisrtuCare
  ---------------------------------------------------------------------------
  Place tes captures d'écran (.png) dans  mockups\screens\  puis lance ce script.
  Pour chaque capture, il produit dans  mockups\out\  une maquette marketing :
  capture insérée dans un cadre iPhone (corps titane, Dynamic Island, coins
  arrondis), posée sur un fond dégradé avec une légende au-dessus.

  Le cadre est DESSINÉ par ImageMagick (aucune image de bezel à télécharger) et
  s'adapte automatiquement à la résolution de chaque capture.

  Exemples :
    powershell -ExecutionPolicy Bypass -File .\make-mockups.ps1
    .\make-mockups.ps1 -Bg1 "#102036" -Bg2 "#0F766E"
    .\make-mockups.ps1 -ScreensDir .\screens -OutDir .\out
#>

param(
  [string]$ScreensDir   = "$PSScriptRoot\screens",
  [string]$OutDir       = "$PSScriptRoot\out",
  [string]$Bg1          = "#0F766E",   # haut du dégradé (teal de la marque)
  [string]$Bg2          = "#0B3B36",   # bas du dégradé (teal profond)
  [string]$CaptionColor = "#FFFFFF",
  [string]$BodyColor    = "#26262B",   # corps de l'iPhone (titane sombre)
  [string]$EdgeColor    = "#4A4A4F",   # liseré métallique
  [switch]$NoCaption
)

$ErrorActionPreference = 'Stop'

# ── Localiser ImageMagick ───────────────────────────────────
$magick = "$env:USERPROFILE\scoop\apps\imagemagick\current\magick.exe"
if (-not (Test-Path $magick)) {
  $cmd = Get-Command magick -ErrorAction SilentlyContinue
  if ($cmd) { $magick = $cmd.Source } else { throw "ImageMagick introuvable. Installe-le : scoop install imagemagick" }
}

# Le build portable (scoop) charge ses coders en DLL : on doit indiquer où
# trouver les modules et leurs dépendances, sinon "no decode delegate".
$imRoot = Split-Path $magick -Parent
if (Test-Path "$imRoot\modules\coders") {
  $env:Path = "$imRoot;$imRoot\modules\coders;$imRoot\modules\filters;$env:Path"
  $env:MAGICK_CONFIGURE_PATH     = $imRoot
  $env:MAGICK_CODER_MODULE_PATH  = "$imRoot\modules\coders"
  $env:MAGICK_FILTER_MODULE_PATH = "$imRoot\modules\filters"
}

# ── Police de la légende ────────────────────────────────────
# ImageMagick attend des slashes "/" dans les chemins de police sous Windows.
$fontPath = "$env:WINDIR\Fonts\segoeuib.ttf"          # Segoe UI Bold
if (-not (Test-Path $fontPath)) { $fontPath = "$env:WINDIR\Fonts\arialbd.ttf" }
$fontPath = $fontPath -replace '\\', '/'

# ── Légendes (mockups\captions.txt : "nomdefichier=Légende") ─
$captions = @{}
$capFile = "$PSScriptRoot\captions.txt"
if (Test-Path $capFile) {
  foreach ($line in Get-Content $capFile -Encoding UTF8) {
    if ($line -match '^\s*#') { continue }
    if ($line -match '^(.*?)=(.*)$') { $captions[$matches[1].Trim()] = $matches[2].Trim() }
  }
}

# ── Préparation des dossiers ────────────────────────────────
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$tmp = Join-Path $OutDir ".tmp"
New-Item -ItemType Directory -Force -Path $tmp | Out-Null

$shots = Get-ChildItem $ScreensDir -File -ErrorAction SilentlyContinue |
         Where-Object { $_.Extension -match '^\.(png|jpg|jpeg)$' }
if (-not $shots) {
  Write-Host "Aucune capture (.png / .jpg / .jpeg) trouvee dans : $ScreensDir" -ForegroundColor Yellow
  Write-Host "Depose tes captures d'ecran la, puis relance le script." -ForegroundColor Yellow
  exit 1
}

function RInt([double]$v) { return [int][math]::Round($v) }

foreach ($s in $shots) {
  $name = $s.BaseName
  Write-Host "-> $($s.Name)" -ForegroundColor Cyan

  # Dimensions de la capture
  $dim = (& $magick identify -format "%w %h" $s.FullName) -split ' '
  $W = [int]$dim[0]; $H = [int]$dim[1]

  # Géométrie du cadre (proportionnelle à la largeur)
  $b   = RInt($W * 0.026); if ($b -lt 12) { $b = 12 }   # épaisseur du bord
  $sr  = RInt($W * 0.095)                                # rayon des coins de l'écran
  $BW  = $W + 2*$b                                     # largeur du corps
  $BH  = $H + 2*$b                                     # hauteur du corps
  $br  = $sr + $b                                      # rayon des coins du corps

  # Dynamic Island
  $diW  = RInt($W * 0.32)
  $diH  = RInt($diW * 0.30)
  $diX1 = RInt(($W - $diW) / 2)
  $diY1 = RInt($H * 0.018)
  $diX2 = $diX1 + $diW
  $diY2 = $diY1 + $diH
  $diR  = RInt($diH / 2)

  $round = Join-Path $tmp "round.png"
  $phone = Join-Path $tmp "phone.png"
  $bg    = Join-Path $tmp "bg.png"
  $comp  = Join-Path $tmp "comp.png"
  $final = Join-Path $OutDir "$name.png"

  # 1) Coins de l'écran arrondis + Dynamic Island
  & $magick $s.FullName -alpha set `
    "(" -size "${W}x${H}" xc:none -fill white -draw "roundrectangle 0,0,$($W-1),$($H-1),$sr,$sr" ")" `
    -compose DstIn -composite `
    -compose over -stroke none -fill black -draw "roundrectangle $diX1,$diY1,$diX2,$diY2,$diR,$diR" `
    $round

  # 2) Corps de l'iPhone (titane) + insertion de l'écran
  & $magick -size "${BW}x${BH}" xc:none `
    -fill $BodyColor -stroke $EdgeColor -strokewidth 2 -draw "roundrectangle 1,1,$($BW-2),$($BH-2),$br,$br" `
    $round -geometry "+$b+$b" -compose over -composite `
    $phone

  # 3) Fond dégradé (taille calculée selon le cadre + légende)
  $padX = RInt($BW * 0.17)
  $CW   = $BW + 2*$padX
  $ps   = RInt($CW * 0.040)                                  # taille de la légende
  $capArea = if ($NoCaption) { RInt($BH * 0.05) } else { RInt($ps * 2.8) }
  $topM = RInt($BH * 0.07)
  $botM = RInt($BH * 0.08)
  $CH   = $capArea + $topM + $BH + $botM
  $phoneY = $capArea + $topM

  & $magick -size "${CW}x${CH}" "gradient:$Bg1-$Bg2" $bg

  # 4) Ombre portée + composition du téléphone sur le fond
  & $magick $bg `
    "(" $phone "(" +clone -background black -shadow "55x35+0+25" ")" +swap -background none -layers merge +repage ")" `
    -gravity north -geometry "+0+$phoneY" -compose over -composite `
    $comp

  # 5) Légende
  if ($NoCaption) {
    Copy-Item $comp $final -Force
  } else {
    $cap = if ($captions.ContainsKey($name)) { $captions[$name] }
           else { (Get-Culture).TextInfo.ToTitleCase(($name -replace '[-_]', ' ')) }
    # On écrit la légende dans un fichier UTF-8 et on la fait LIRE par ImageMagick
    # (caption:@fichier) : sous Windows PowerShell 5.1, passer des accents en
    # argument à un .exe les corrompt. Le passage par fichier règle le problème.
    $capTxt = Join-Path $tmp "cap.txt"
    [System.IO.File]::WriteAllText($capTxt, $cap, (New-Object System.Text.UTF8Encoding($false)))
    $capW   = RInt($CW * 0.86)
    $capPng = Join-Path $tmp "cap.png"
    & $magick -background none -fill $CaptionColor -font $fontPath -pointsize $ps `
      -gravity center -size "${capW}x${capArea}" "caption:@$capTxt" $capPng
    & $magick $comp $capPng -gravity north -geometry "+0+0" -compose over -composite $final
  }

  Write-Host "   ok : $final" -ForegroundColor Green
}

Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
Write-Host ""
Write-Host "Termine. Maquettes dans : $OutDir" -ForegroundColor Green
