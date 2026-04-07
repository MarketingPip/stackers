$SFX_PATH = "https://lambda.vgmtreasurechest.com/soundtracks/stacker-arcade-gamerip-2004"
$TARGET_DIR = "./stacker_sfx"

if (!(Test-Path $TARGET_DIR)) { New-Item -ItemType Directory -Path $TARGET_DIR }

$FILES = @(
    "/tbzuxdbx/006. Music - Attract mode music.mp3",
    "/vaqewwrs/061. SFX - Start up.mp3",
    "/nnzjymsd/046. SFX - Button.mp3",
    "/lpqkdlwa/045. SFX - Block Fall.mp3",
    "/lxeeietj/047. SFX - Buzz.mp3",
    "SFX - Minor prize win.mp3",
    "SFX - Major prize win.mp3",
    "/faldlrbg/053. SFX - Game over.mp3",
    "/ecymndbz/054. SFX - Insert coin.mp3",
    "SFX - Tick tock (Loop).mp3",
    "Voice - Careful.mp3",
    "Voice - Get to the top.mp3",
    "Voice - This is the last block.mp3",
    "Voice - Build them up.mp3",
    "Voice - Excellent.mp3",
    "Voice - Wow jackpot prize winner.mp3",
    "/joqnrtus/084. Voice - Oh no, game over.mp3",
    "Voice - Stacker!!!.mp3"
)

foreach ($file in $FILES) {
    if (!$file.StartsWith("/")) { $file = "/" + $file }
    
    $fileName = [System.IO.Path]::GetFileName($file)
    $fullUrl = $SFX_PATH + $file
    $destPath = Join-Path $TARGET_DIR $fileName
    
    Write-Host "Downloading: $fileName"
    Invoke-WebRequest -Uri $fullUrl.Replace(" ", "%20") -OutFile $destPath
}

Write-Host "Done!"
