Add-Type -AssemblyName System.Drawing

$path = "c:\Users\ADMIN-PC\Documents\ANTIGRAVITY\GAME\the-vivarium-web\public\assets\environment\ground\env_terrain_surface_grass.png"
$bmp = New-Object System.Drawing.Bitmap($path)

Write-Host "Height: $($bmp.Height)"
for ($y = 0; $y -lt $bmp.Height; $y += 6) {
    $a0 = $bmp.GetPixel(0, $y).A
    $a5 = $bmp.GetPixel(5, $y).A
    $a6 = $bmp.GetPixel(6, $y).A
    $a505 = $bmp.GetPixel(505, $y).A
    $a506 = $bmp.GetPixel(506, $y).A
    $a511 = $bmp.GetPixel(511, $y).A
    Write-Host "Y=$y | X[0]=$a0, X[5]=$a5, X[6]=$a6 || X[505]=$a505, X[506]=$a506, X[511]=$a511"
}
$bmp.Dispose()
