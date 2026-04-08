class ArcadeBooter  {
  constructor(canvas, context, onComplete) {
    this.cv = canvas;
    this.ctx = context;
    this.onComplete = onComplete;
    this.startTime = Date.now();

    // Device Pixel Ratio (clamped to 2 for stability)
    this.DPR = Math.min(window.devicePixelRatio || 1, 2);
    this.cv.width = Math.round(this.cv.clientWidth * this.DPR);
    this.cv.height = Math.round(this.cv.clientHeight * this.DPR);
    this.ctx.setTransform(this.DPR, 0, 0, this.DPR, 0, 0);
 
    this.logs = [
      "MEMORY CHECK............OK",
      "I/O CHIPSET.............OK",
      "SOUND ROM...............LOADED",
      "VIDEO DRIVER............READY",
      "INITIALIZING STACKER OS..."
    ];

    this.waitingForTap = false;
    this.onCompleteCalled = false;
    this.handleInput = this.handleInput.bind(this);
    if(isElectron === false){
    this.cv.addEventListener("mousedown", this.handleInput);
    this.cv.addEventListener("touchstart", this.handleInput);
    };
    this.render();
  }

  handleInput() {
    if (this.waitingForTap && !this.onCompleteCalled || isElectron === true && !this.onCompleteCalled) {
      this.onCompleteCalled = true;
      this.cv.removeEventListener("mousedown", this.handleInput);
      this.cv.removeEventListener("touchstart", this.handleInput);
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

    // Clear Screen
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, CW, CH);

    // -------- PHASE 1: BIOS --------
    if (elapsed < 3000) {
      ctx.fillStyle = "#4af";
      ctx.font = "14px 'Courier New'";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      const lineCount = Math.floor(elapsed / 500);
      for (let i = 0; i <= lineCount; i++) {
        if (this.logs[i]) ctx.fillText(`> ${this.logs[i]}`, 30, 60 + i * 25);
      }

      if (Math.floor(elapsed / 300) % 2) {
        ctx.fillRect(30, 65 + Math.min(lineCount, 4) * 25, 10, 2);
      }
    }

    // -------- PHASE 2: Logo Reveal --------
    else if (elapsed < 6000) {
      const alpha = Math.min(1, (elapsed - 3000) / 1000);
      ctx.globalAlpha = alpha;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.shadowColor = "#4af";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 50px 'Courier New'";
      ctx.fillText("OPENSTACKER", CW / 2, CH / 2);

      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ff4";
      ctx.font = "12px 'Courier New'";
      ctx.fillText("POWERED BY JARED VAN VALKENGOED", CW / 2, CH / 2 + 40);

      ctx.globalAlpha = 1;
    }

    // -------- PHASE 3: Tap to Continue --------
    else {
      if(isElectron === false){
       // if in browser, wait for tap to start sounds.
      this.waitingForTap = true;
  
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // Blinking effect 
      ctx.globalAlpha = Math.floor(now / 500) % 2 ? 1 : 0;
      ctx.fillStyle = "#fff";
      ctx.font = "14px 'Courier New'";
      ctx.fillText("TAP TO CONTINUE", CW / 2, CH / 2);
      ctx.globalAlpha = 1;
      }else{
        this.handleInput();
      }
      
      
    }

    requestAnimationFrame(() => this.render());
  }
}
