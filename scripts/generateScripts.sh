# Generate Powershell Version
jq -r '
"$SFX_PATH = \"" + .baseUrl + "\"
$TARGET_DIR = \"./stacker_sfx\"

if (!(Test-Path $TARGET_DIR)) { New-Item -ItemType Directory -Path $TARGET_DIR }

$FILES = @(",
(.files[] | @json),
")

foreach ($file in $FILES) {
    if (!$file.StartsWith(\"/\")) { $file = \"/\" + $file }
    
    $fileName = [System.IO.Path]::GetFileName($file)
    $fullUrl = $SFX_PATH + $file
    $destPath = Join-Path $TARGET_DIR $fileName
    
    Write-Host \"Downloading: $fileName\"
    Invoke-WebRequest -Uri $fullUrl.Replace(\" \", \"%20\") -OutFile $destPath
}

Write-Host \"Done!\"
"
' assets.json > downloadsfx.ps1

# Generate Bash Version
jq -r '
"#!/bin/bash

BASE_URL=\"" + .baseUrl + "\"
TARGET_DIR=\"./stacker_sfx\"

mkdir -p \"$TARGET_DIR\"

FILES=(",
(.files[] | @sh),
")

for file in \"\${FILES[@]}\"; do
  [[ \"$file\" != /* ]] && file=\"/$file\"
  
  filename=$(basename \"$file\")
  url=\"$BASE_URL$file\"
  
  echo \"Downloading: $filename\"
  curl -L \"${url// /%20}\" -o \"$TARGET_DIR/$filename\"
done

echo \"Done!\"
"
' assets.json > download.sh

chmod +x downloadsfx.sh
