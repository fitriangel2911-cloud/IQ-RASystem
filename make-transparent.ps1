Add-Type -AssemblyName System.Drawing

$src = "C:\Users\fitri angelina\.gemini\antigravity\brain\3270495e-aff7-4483-8bda-49e168fb482b\media__1778637180146.png"
$dest = "C:\Users\fitri angelina\Downloads\IQ-RASystem\IQ-RASystem\public\logo-transparent.png"

Write-Host "Processing Image: $src"
$bmp = New-Object System.Drawing.Bitmap($src)

# Create a matching 32-bit bitmap that supports alpha transparency
$outBmp = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Sample background green from top-left corner
$bg = $bmp.GetPixel(10, 10)
Write-Host "Sampled Background Green: R=$($bg.R), G=$($bg.G), B=$($bg.B)"

$minX = $bmp.Width
$maxX = 0
$minY = $bmp.Height
$maxY = 0

# Step 1: Chroma Key to remove background
for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $c = $bmp.GetPixel($x, $y)
        
        # Euclidean color distance from background color
        $dr = $c.R - $bg.R
        $dg = $c.G - $bg.G
        $db = $c.B - $bg.B
        $dist = [Math]::Sqrt($dr*$dr + $dg*$dg + $db*$db)
        
        # Threshold for background removal (gradient background, so threshold 55 is optimal)
        if ($dist -lt 60) {
            # Set to completely transparent
            $outBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            # Keep original pixel
            $outBmp.SetPixel($x, $y, $c)
            
            # Trace bounding box of the actual logo
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Logo Bounds detected: X=[$minX to $maxX], Y=[$minY to $maxY]"

# Dispose original
$bmp.Dispose()

# Step 2: Tightly crop the logo out with 16px padding
if ($maxX -gt $minX -and $maxY -gt $minY) {
    $padding = 16
    $w = ($maxX - $minX) + ($padding * 2)
    $h = ($maxY - $minY) + ($padding * 2)
    
    # Center coordinates for square crop
    $size = [Math]::Max($w, $h)
    $cx = $minX + (($maxX - $minX) / 2)
    $cy = $minY + (($maxY - $minY) / 2)
    
    $cropX = [int]($cx - ($size / 2))
    $cropY = [int]($cy - ($size / 2))
    
    # Constrain
    if ($cropX -lt 0) { $cropX = 0 }
    if ($cropY -lt 0) { $cropY = 0 }
    if (($cropX + $size) -gt $outBmp.Width) { $size = $outBmp.Width - $cropX }
    if (($cropY + $size) -gt $outBmp.Height) { $size = $outBmp.Height - $cropY }
    
    $cropArea = New-Object System.Drawing.Rectangle($cropX, $cropY, $size, $size)
    $finalBmp = $outBmp.Clone($cropArea, $outBmp.PixelFormat)
    
    $outBmp.Dispose()
    
    Write-Host "Saving cropped transparent logo to: $dest"
    $finalBmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $finalBmp.Dispose()
} else {
    # Fallback: save entire keyed image
    $outBmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
    $outBmp.Dispose()
}

Write-Host "PROCESS COMPLETED SUCCESSFULLY!"
