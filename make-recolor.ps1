Add-Type -AssemblyName System.Drawing

$src = "C:\Users\fitri angelina\.gemini\antigravity\brain\3270495e-aff7-4483-8bda-49e168fb482b\media__1778637180146.png"
$dest = "C:\Users\fitri angelina\Downloads\IQ-RASystem\IQ-RASystem\public\logo-recolored.png"

Write-Host "Loading source image: $src"
$bmp = New-Object System.Drawing.Bitmap($src)
$outBmp = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Sample base background colors
$c1 = $bmp.GetPixel(10, 10)
$c2 = $bmp.GetPixel($bmp.Width - 11, 10)
$c3 = $bmp.GetPixel(10, $bmp.Height - 11)
$c4 = $bmp.GetPixel($bmp.Width - 11, $bmp.Height - 11)

$avgR = ($c1.R + $c2.R + $c3.R + $c4.R) / 4
$avgG = ($c1.G + $c2.G + $c3.G + $c4.G) / 4
$avgB = ($c1.B + $c2.B + $c3.B + $c4.B) / 4

$minX = $bmp.Width
$maxX = 0
$minY = $bmp.Height
$maxY = 0

# Step 1: Process image with noise removal spatial masking
for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        
        # ABSOLUTE SPATIAL FILTER: Any pixel outside the central zone is automatically background noise.
        # This instantly kills the top-left speckles shown in the screenshot!
        if ($x -lt 220 -or $x -gt 760 -or $y -lt 220 -or $y -gt 760) {
            $outBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            continue
        }
        
        $c = $bmp.GetPixel($x, $y)
        
        # Color distance with higher tolerance for border cleanup
        $dr = $c.R - $avgR
        $dg = $c.G - $avgG
        $db = $c.B - $avgB
        $dist = [Math]::Sqrt($dr*$dr + $dg*$dg + $db*$db)
        
        # Aggressive background threshold (78) to kill halos
        if ($dist -lt 78) {
            $outBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            # Map to Rich Emerald Green (#043121 base, peaking at #0a5439 for depth)
            $luma = ($c.R + $c.G + $c.B) / (3 * 255)
            $factor = [Math]::Pow($luma, 0.7) # Dynamic gamma compression to pop highlights
            
            $newR = [int](10 * $factor)
            $newG = [int](85 * $factor) # Slightly more luminous green to maximize contrast inside the gold badge
            $newB = [int](55 * $factor)
            
            if ($newR -gt 255) { $newR = 255 }
            if ($newG -gt 255) { $newG = 255 }
            if ($newB -gt 255) { $newB = 255 }
            
            $outBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $newR, $newG, $newB))
            
            # Trace bounds
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

$bmp.Dispose()

# Step 2: Tightest possible crop with almost 0 padding (adds 3px to protect pixel edges)
if ($maxX -gt $minX -and $maxY -gt $minY) {
    $padding = 3
    $rawW = $maxX - $minX
    $rawH = $maxY - $minY
    
    $size = [Math]::Max($rawW, $rawH) + ($padding * 2)
    
    $cx = $minX + ($rawW / 2)
    $cy = $minY + ($rawH / 2)
    
    $cropX = [int]($cx - ($size / 2))
    $cropY = [int]($cy - ($size / 2))
    
    if ($cropX -lt 0) { $cropX = 0 }
    if ($cropY -lt 0) { $cropY = 0 }
    if (($cropX + $size) -gt $outBmp.Width) { $size = $outBmp.Width - $cropX }
    if (($cropY + $size) -gt $outBmp.Height) { $size = $outBmp.Height - $cropY }
    
    $cropArea = New-Object System.Drawing.Rectangle($cropX, $cropY, $size, $size)
    $finalBmp = $outBmp.Clone($cropArea, $outBmp.PixelFormat)
    $outBmp.Dispose()
    
    Write-Host "Exporting perfectly cropped image: $dest"
    $finalBmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $finalBmp.Dispose()
} else {
    $outBmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $outBmp.Dispose()
}

Write-Host "NOISE FILTERED RECOLOR PROCESS COMPLETED SUCCESSFULLY!"
