#!/bin/bash

# Configuration
SFX_PATH="https://lambda.vgmtreasurechest.com/soundtracks/stacker-arcade-gamerip-2004"
TARGET_DIR="./stacker_sfx"

# Create directory
mkdir -p "$TARGET_DIR"

# Array of file paths
FILES=(
    "/tbzuxdbx/006. Music - Attract mode music.mp3"
    "/vaqewwrs/061. SFX - Start up.mp3"
    "/nnzjymsd/046. SFX - Button.mp3"
    "/lpqkdlwa/045. SFX - Block Fall.mp3"
    "/lxeeietj/047. SFX - Buzz.mp3"
    "SFX - Minor prize win.mp3"
    "SFX - Major prize win.mp3"
    "/faldlrbg/053. SFX - Game over.mp3"
    "/ecymndbz/054. SFX - Insert coin.mp3"
    "SFX - Tick tock (Loop).mp3"
    "Voice - Careful.mp3"
    "Voice - Get to the top.mp3"
    "Voice - This is the last block.mp3"
    "Voice - Build them up.mp3"
    "Voice - Excellent.mp3"
    "Voice - Wow jackpot prize winner.mp3"
    "/joqnrtus/084. Voice - Oh no, game over.mp3"
    "Voice - Stacker!!!.mp3"
)

echo "Starting download to $TARGET_DIR..."

for FILE in "${FILES[@]}"; do
    # Ensure leading slash
    [[ $FILE != /* ]] && FILE="/$FILE"
    
    # Extract just the filename for saving
    FILENAME=$(basename "$FILE")
    
    # URL encode spaces to %20 for curl
    ENCODED_URL=$(echo "$SFX_PATH$FILE" | sed 's/ /%20/g')
    
    echo "Downloading: $FILENAME"
    curl -L -s -o "$TARGET_DIR/$FILENAME" "$ENCODED_URL"
done

echo "Finished!"
