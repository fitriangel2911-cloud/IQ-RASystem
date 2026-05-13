Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\fitri angelina\.gemini\antigravity\brain\3270495e-aff7-4483-8bda-49e168fb482b\media__1778637180146.png"
$destPath = "C:\Users\fitri angelina\Downloads\IQ-RASystem\IQ-RASystem\public\logo-new.png"

Write-Host "Loading source image from $sourcePath"
$bmp = New-Object System.Drawing.Bitmap($sourcePath)

$minX = $bmp.Width
$maxX = 0
$minY = $bmp.Height
$maxY = 0

Write-Host "Scanning pixels to detect yellow logo bounding box..."
# Scan pixels with step size 2 for maximum performance
for ($x = 0; $x -lt $bmp.Width; $x += 2) {
    for ($y = 0; $y -lt $bmp.Height; $y += 2) {
        $c = $bmp.GetPixel($x, $y)
        
        # Condition for golden/yellow color (R > 150, G > 130, B < 100)
        if ($c.R -gt 160 -and $c.G -gt 130 -and $c.B -lt 100) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

if ($maxX -le $minX -or $maxY -le $minY) {
    Write-Error "Could not detect yellow logo! Using default central fallback crop..."
    # Fallback: Crop the center 400x400 square
    $minX = [int]($bmp.Width / 2) - 200
    $minY = [int]($bmp.Height / 2) - 200
    $width = 400
    $height = 400
} else {
    Write-Host "Logo detected! Bounding box: X=[$minX to $maxX], Y=[$minY to $maxY]"
    # Add padding to make it proportional and square
    $padding = 40
    
    $rawW = $maxX - $minX
    $rawH = $maxY - $minY
    
    # Center-align and make square
    $targetSize = [Math]::Max($rawW, $rawH) + ($padding * 2)
    
    $centerX = $minX + ($rawW / 2)
    $centerY = $minY + ($rawH / 2)
    
    $cropX = [int]($centerX - ($targetSize / 2))
    $cropY = [int]($centerY - ($targetSize / 2))
    
    # Constrain to image borders
    if ($cropX -lt 0) { $cropX = 0 }
    if ($cropY -lt 0) { $cropY = 0 }
    if (($cropX + $targetSize) -gt $bmp.Width) { $targetSize = $bmp.Width - $cropX }
    if (($cropY + $targetSize) -gt $bmp.Height) { $targetSize = $bmp.Height - $cropY }
    
    $width = [int]$targetSize
    $height = [int]$targetSize
}

Write-Host "Cropping viewport: x=$cropX, y=$cropY, w=$width, h=$height"

# Crop operation
$cropArea = New-Object System.Drawing.Rectangle($cropX, $cropY, $width, $height)
$bmpCrop = $bmp.Clone($cropArea, $bmp.PixelFormat)

# Free memory of source image to allow saving
$bmp.Dispose()

# Save cropped image
Write-Host "Saving cropped logo to $destPath"
$bmpCrop.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmpCrop.Dispose()

Write-Host "SUCCESS: Cropped logo generated successfully!"
