Add-Type -AssemblyName System.Drawing

function Inspect-File($filePath) {
    $bmp = New-Object System.Drawing.Bitmap($filePath)
    Write-Host "File: $filePath"
    Write-Host "Resolution: $($bmp.Width) x $($bmp.Height)"
    Write-Host "PixelFormat: $($bmp.PixelFormat)"

    # Count bounding box and alpha
    $minX = $bmp.Width
    $maxX = 0
    $minY = $bmp.Height
    $maxY = 0
    $borderLeaks = 0

    for ($y = 0; $y -lt $bmp.Height; $y++) {
        for ($x = 0; $x -lt $bmp.Width; $x++) {
            $pixel = $bmp.GetPixel($x, $y)
            if ($pixel.A -gt 0) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
                if ($x -eq 0 -or $x -eq ($bmp.Width - 1) -or $y -eq 0 -or $y -eq ($bmp.Height - 1)) {
                    $borderLeaks++
                }
            }
        }
    }

    $contentW = $maxX - $minX + 1
    $contentH = $maxY - $minY + 1
    $pivotY = [math]::Round($maxY / $bmp.Height, 4)
    $pivotX = [math]::Round(($minX + $maxX) / 2 / $bmp.Width, 4)

    Write-Host "Content BBox: X=[$minX, $maxX] (W=$contentW), Y=[$minY, $maxY] (H=$contentH)"
    Write-Host "Aspect Ratio: $([math]::Round($contentW / $contentH, 2)) : 1"
    Write-Host "Lowest Contact Y: $maxY / $($bmp.Height) = $pivotY ($([math]::Round($pivotY * 100, 1))%)"
    Write-Host "Center Contact X: $pivotX"
    Write-Host "Border Leaks: $borderLeaks"
    Write-Host "-------------------------------------------"
    $bmp.Dispose()
}

Inspect-File "C:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\the-vivarium-web\public\assets\source\char_ant_worker_idle_v2.png"
Inspect-File "C:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\the-vivarium-web\public\assets\source\char_ant_worker_idle.png"

# Inspect Terrain seams
$tbmp = New-Object System.Drawing.Bitmap("C:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\the-vivarium-web\public\assets\terrain\terrain_soil_dark_loam_v2.png")
Write-Host "Terrain V2: $($tbmp.Width) x $($tbmp.Height)"
$diffH = 0
$diffV = 0
for ($x = 0; $x -lt $tbmp.Width; $x++) {
    $pTop = $tbmp.GetPixel($x, 0)
    $pBot = $tbmp.GetPixel($x, $tbmp.Height - 1)
    $diffH += [math]::Abs($pTop.R - $pBot.R) + [math]::Abs($pTop.G - $pBot.G) + [math]::Abs($pTop.B - $pBot.B)
}
for ($y = 0; $y -lt $tbmp.Height; $y++) {
    $pLeft = $tbmp.GetPixel(0, $y)
    $pRight = $tbmp.GetPixel($tbmp.Width - 1, $y)
    $diffV += [math]::Abs($pLeft.R - $pRight.R) + [math]::Abs($pLeft.G - $pRight.G) + [math]::Abs($pLeft.B - $pRight.B)
}
Write-Host "Terrain V2 avg horizontal seam diff: $([math]::Round($diffH / $tbmp.Width / 3, 4)) px"
Write-Host "Terrain V2 avg vertical seam diff: $([math]::Round($diffV / $tbmp.Height / 3, 4)) px"
$tbmp.Dispose()
