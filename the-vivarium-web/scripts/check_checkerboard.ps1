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
    
    $greyMatches = 0
    $checkerPatterns = 0

    for ($y = 0; $y -lt $h; $y += 2) {
        for ($x = 0; $x -lt $w; $x += 2) {
            $p = $bmp.GetPixel($x, $y)
            # Checkerboard typically has A near 255 and R,G,B almost equal around 204 (light) or 255 (white) or 153 (dark)
            if ($p.A -gt 200 -and [math]::Abs($p.R - $p.G) -le 3 -and [math]::Abs($p.G - $p.B) -le 3) {
                if (($p.R -ge 195 -and $p.R -le 210) -or ($p.R -ge 245 -and $p.R -le 255) -or ($p.R -ge 145 -and $p.R -le 160)) {
                    $greyMatches++
                }
            }
        }
    }
    $bmp.Dispose()
    Write-Host "$f - Suspected checkerboard/grey background samples: $greyMatches"
}
