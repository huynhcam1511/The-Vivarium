Add-Type -AssemblyName System.Drawing

$assets = @(
    @{ name = "env_terrain_surface_grass.png"; path = "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\the-vivarium-web\public\assets\environment\ground\env_terrain_surface_grass.png" },
    @{ name = "env_grass_tuft_green.png"; path = "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\the-vivarium-web\public\assets\environment\vegetation\env_grass_tuft_green.png" },
    @{ name = "env_flower_clover_white.png"; path = "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\the-vivarium-web\public\assets\environment\vegetation\env_flower_clover_white.png" },
    @{ name = "env_flower_daisy_golden.png"; path = "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\the-vivarium-web\public\assets\environment\vegetation\env_flower_daisy_golden.png" }
)

foreach ($item in $assets) {
    $bmp = New-Object System.Drawing.Bitmap($item.path)
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

    $seamDiffSum = 0
    if ($item.name -eq "env_terrain_surface_grass.png") {
        for ($y = 0; $y -lt $h; $y++) {
            $pL = $bmp.GetPixel(0, $y)
            $pR = $bmp.GetPixel($w - 1, $y)
            $diff = [math]::Abs($pL.R - $pR.R) + [math]::Abs($pL.G - $pR.G) + [math]::Abs($pL.B - $pR.B) + [math]::Abs($pL.A - $pR.A)
            $seamDiffSum += $diff
        }
    }

    $bmp.Dispose()
    
    $spanX = $maxX - $minX + 1
    $spanY = $maxY - $minY + 1
    $pctAlpha = [math]::Round(($alphaCount / ($w * $h)) * 100, 1)
    $pctSemi = [math]::Round(($semiAlphaCount / ($w * $h)) * 100, 1)
    $pctOpaque = [math]::Round(($opaqueCount / ($w * $h)) * 100, 1)

    Write-Host "=== $($item.name) ==="
    Write-Host "Dimensions: $w x $h"
    Write-Host "Bounding Box X: $minX .. $maxX (Span: $spanX)"
    Write-Host "Bounding Box Y: $minY .. $maxY (Span: $spanY)"
    Write-Host "Border Bleed Pixels: $borderBleed"
    Write-Host "Alpha: $pctAlpha% | Semi: $pctSemi% | Opaque: $pctOpaque%"
    if ($item.name -eq "env_terrain_surface_grass.png") {
        Write-Host "Seam Diff Sum (Left vs Right edge): $seamDiffSum"
    }
    Write-Host ""
}
