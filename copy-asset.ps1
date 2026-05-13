$src = "C:\Users\fitri angelina\.gemini\antigravity\brain\9b80942c-ba6d-4704-ba15-37a6c64573ab\islamic_pattern_bg_v2_1778591947248.png"
$dest = "c:\Users\fitri angelina\Downloads\IQ-RASystem\IQ-RASystem\public\pattern-bg.png"
[System.IO.File]::Copy($src, $dest, $true)
Write-Host "Done"
