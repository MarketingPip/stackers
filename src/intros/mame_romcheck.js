class MameIntro {
  constructor(canvas, context, onComplete) {
    this.cv = canvas;
    this.ctx = context;
    this.onComplete = onComplete;
    this.startTime = Date.now();
    this.isElectron = typeof isElectron !== 'undefined' ? isElectron : false;

    this.DPR = Math.min(window.devicePixelRatio || 1, 2);
    this.cv.width = Math.round(this.cv.clientWidth * this.DPR);
    this.cv.height = Math.round(this.cv.clientHeight * this.DPR);
    this.ctx.setTransform(this.DPR, 0, 0, this.DPR, 0, 0);

    this.waitingForTap = false;
    this.onCompleteCalled = false;
    
    // MAME Diagnostic Data
    this.roms = [
      { id: "M68000", addr: "000000", status: "OK" },
      { id: "Z80-MAIN", addr: "F00000", status: "OK" },
      { id: "YM2610", addr: "A00000", status: "OK" },
      { id: "SFIX", addr: "C00000", status: "OK" },
      { id: "V-ROM 1", addr: "E00000", status: "OK" },
      { id: "V-ROM 2", addr: "E80000", status: "OK" }
    ];

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
      this.onComplete();
    }
  }

  render() {
    if (this.onCompleteCalled) return;

    const now = Date.now();
    const elapsed = now - this.startTime;
    const { ctx, cv } = this;
    const CW = cv.width / this.DPR;
    const CH = cv.height / this.DPR;

    // 1. Classic Arcade Dark Blue Background
    ctx.fillStyle = "#000088";
    ctx.fillRect(0, 0, CW, CH);

    // 2. Scanline Overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    for (let i = 0; i < CH; i += 4) {
      ctx.fillRect(0, i, CW, 1);
    }

    // 3. Header
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 24px monospace";
    ctx.fillText("HARDWARE TEST", CW / 2, 60);
    
    // Header underline
    ctx.fillRect(CW / 2 - 100, 70, 200, 2);

    // 4. ROM Check List
    ctx.textAlign = "left";
    ctx.font = "16px monospace";
    const startY = 120;
    const lineSpacing = 25;

    this.roms.forEach((rom, index) => {
      const lineTime = 400; // time per line
      if (elapsed > index * lineTime) {
        const y = startY + (index * lineSpacing);
        
        // Label
        ctx.fillStyle = "#CCCCCC";
        ctx.fillText(rom.id.padEnd(10, "."), 60, y);
        
        // Address
        ctx.fillStyle = "#FFFF00";
        ctx.fillText(rom.addr, 180, y);

        // Status (blinks green when appearing)
        const isAppearing = elapsed < (index * lineTime) + 100;
        ctx.fillStyle = isAppearing ? "#FFFFFF" : "#00FF00";
        ctx.fillText(rom.status, 280, y);
      }
    });

    // 5. Final Verification
    if (elapsed > this.roms.length * 400 + 500) {
      this.waitingForTap = true;
      
      ctx.textAlign = "center";
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 20px monospace";
      ctx.fillText("RAM/ROM CHECK OK", CW / 2, CH - 100);

      if (this.isElectron) {
        if (elapsed > 5000) this.handleInput();
      } else {
        // Arcade "Insert Coin" Style Prompt
        ctx.globalAlpha = Math.floor(now / 400) % 2;
        ctx.fillStyle = "#FFFF00";
        ctx.fillText("> PRESS START <", CW / 2, CH - 60);
        ctx.globalAlpha = 1;
      }
    }

    requestAnimationFrame(() => this.render());
  }
}
