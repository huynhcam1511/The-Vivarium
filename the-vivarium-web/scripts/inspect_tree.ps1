Add-Type -AssemblyName System.Drawing
$dir = "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\the-vivarium-web\public\assets\source"
$files = @(
    "env_tree_ancient_trunk_base.png",
    "env_tree_bough_main_moss.png",
    "env_foliage_canopy_clump_01.png",
    "env_tree_root_deep_cluster.png"
)

foreach ($f in $files) {
    $path = Join-Path $dir $f
    $bmp = New-Object System.Drawing.Bitmap($path)
    $w = $bmp.Width
    $h = $bmp.Height
    $minX = $w
    $maxX = 0
    $minY = $h
    $maxY = 0
    $alphaCount = 0
    $semiAlphaCount = 0
    $opaqueCount = 0
    $borderBleed = 0

    for ($y = 0; $y -lt $h; $y++) {
        for ($x = 0; $x -lt $w; $x++) {
            $p = $bmp.GetPixel($x, $y)
            if ($p.A -gt 10) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
                if ($x -eq 0 -or $x -eq ($w - 1) -or $y -eq 0 -or $y -eq ($h - 1)) {
                    $borderBleed++
                }
            }
            if ($p.A -eq 0) { $alphaCount++ }
            elseif ($p.A -lt 250) { $semiAlphaCount++ }
            else { $opaqueCount++ }
        }
    }
    $bmp.Dispose()
    
    $spanX = $maxX - $minX + 1
    $spanY = $maxY - $minY + 1
    $pctAlpha = [math]::Round(($alphaCount / ($w * $h)) * 100, 1)
    $pctSemi = [math]::Round(($semiAlphaCount / ($w * $h)) * 100, 1)
    $pctOpaque = [math]::Round(($opaqueCount / ($w * $h)) * 100, 1)

    Write-Host "=== $f ==="
    Write-Host "Dimensions: $w x $h"
    Write-Host "Bounding Box X: $minX .. $maxX (Span: $spanX)"
    Write-Host "Bounding Box Y: $minY .. $maxY (Span: $spanY)"
    Write-Host "Border Bleed Pixels: $borderBleed"
    Write-Host "Alpha: $pctAlpha% | Semi: $pctSemi% | Opaque: $pctOpaque%"
    Write-Host ""
}
