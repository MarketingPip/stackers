class NESIntro {
  constructor(canvas, context, onComplete) {
    this.cv = canvas;
    this.ctx = context;
    this.onComplete = onComplete;
    this.startTime = Date.now();
    this.isElectron = typeof isElectron !== 'undefined' ? isElectron : false;

    this.DPR = Math.min(window.devicePixelRatio || 1, 2);
    this.cv.width = Math.round(this.cv.clientWidth * this.DPR);
    this.cv.height = Math.round(this.cv.clientHeight * this.DPR);
    
    // Disable image smoothing for that crisp pixel art look
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.setTransform(this.DPR, 0, 0, this.DPR, 0, 0);

    // Official NES Palette Colors
    this.palette = {
      black: "#000000",
      white: "#FFFFFF",
      red: "#E40058",
      blue: "#0038CB",
      sky: "#3CBCFC",
      orange: "#F08100",
      yellow: "#F8B800"
    };

    this.waitingForTap = false;
    this.onCompleteCalled = false;
    this.handleInput = this.handleInput.bind(this);

    if (!this.isElectron) {
      this.cv.addEventListener("mousedown", this.handleInput);
      this.cv.addEventListener("touchstart", this.handleInput);
    }

    this.render();
  }

  handleInput() {
    if (!this.onCompleteCalled && this.waitingForTap) {
      this.onCompleteCalled = true;
      // Trigger a white flash before leaving
      this.flashStart = Date.now();
      setTimeout(() => this.onComplete(), 150);
    }
  }

  render() {
    if (this.onCompleteCalled && !this.flashStart) return;

    const now = Date.now();
    const elapsed = now - this.startTime;
    const { ctx, cv } = this;
    const CW = cv.width / this.DPR;
    const CH = cv.height / this.DPR;

    // 1. Draw Background (NES Sky Blue)
    ctx.fillStyle = this.palette.sky;
    ctx.fillRect(0, 0, CW, CH);

    // 2. Draw "Ground" Blocks (Classic Mario-style Tiles)
    const tileSize = 32;
    ctx.fillStyle = this.palette.orange;
    for (let x = 0; x < CW; x += tileSize) {
      ctx.fillRect(x, CH - tileSize, tileSize - 2, tileSize - 2);
    }

    // 3. Title Animation (Palette Cycling)
    // We cycle through reds and yellows for a "shimmering gold" logo
    const colors = [this.palette.red, this.palette.orange, this.palette.yellow, this.palette.white];
    const colorIndex = Math.floor(now / 100) % colors.length;
    
    ctx.textAlign = "center";
    ctx.font = "bold 48px 'Courier New'"; // Best approximation of blocky fonts
    
    // Drop shadow
    ctx.fillStyle = this.palette.black;
    ctx.fillText("STACKERS", CW / 2 + 4, CH / 2 + 4);
    
    // Main shimmering text
    ctx.fillStyle = colors[colorIndex];
    ctx.fillText("STACKERS", CW / 2, CH / 2);

    // 4. Input Prompt
    if (elapsed > 1500) {
      this.waitingForTap = true;
      
      if (this.isElectron) {
        // Auto-complete for Electron
        if (elapsed > 4000) this.handleInput();
      } else {
        // Blinking "Press Start"
        if (Math.floor(now / 400) % 2) {
          ctx.fillStyle = this.palette.white;
          ctx.font = "20px 'Courier New'";
          ctx.fillText("PRESS START", CW / 2, CH / 2 + 60);
        }
      }
    }

    // 5. Loading Bar (Block by block)
    const barWidth = 200;
    const progress = Math.min(1, elapsed / 2000);
    ctx.strokeStyle = this.palette.black;
    ctx.lineWidth = 4;
    ctx.strokeRect(CW / 2 - barWidth / 2, CH - 80, barWidth, 15);
    
    ctx.fillStyle = this.palette.red;
    ctx.fillRect(CW / 2 - barWidth / 2 + 2, CH - 78, (barWidth - 4) * progress, 11);

    // 6. Final Flash Effect
    if (this.onCompleteCalled) {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, CW, CH);
    }

    requestAnimationFrame(() => this.render());
  }
}
