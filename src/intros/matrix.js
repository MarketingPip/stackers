export class ArcadeBooter  {
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

    // Matrix Configuration
    this.fontSize = 16;
    this.columns = Math.floor((this.cv.width / this.DPR) / this.fontSize);
    this.drops = new Array(this.columns).fill(1);
    this.chars = "日Hｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ2345789Z*+-<>|";

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
      this.cv.removeEventListener("mousedown", this.handleInput);
      this.cv.removeEventListener("touchstart", this.handleInput);
      this.onComplete();
    }
  }

  drawMatrix() {
    const { ctx } = this;
    const CW = this.cv.width / this.DPR;
    const CH = this.cv.height / this.DPR;

    // Semi-transparent black rectangle to create trailing effect
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(0, 0, CW, CH);

    ctx.font = `${this.fontSize}px monospace`;

    for (let i = 0; i < this.drops.length; i++) {
      const text = this.chars.charAt(Math.floor(Math.random() * this.chars.length));
      
      // Lead character is white
      ctx.fillStyle = "#fff";
      ctx.fillText(text, i * this.fontSize, this.drops[i] * this.fontSize);

      // Following characters are green
      ctx.fillStyle = "#0F0";
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#0F0";
      ctx.fillText(text, i * this.fontSize, (this.drops[i] - 1) * this.fontSize);
      ctx.shadowBlur = 0;

      if (this.drops[i] * this.fontSize > CH && Math.random() > 0.975) {
        this.drops[i] = 0;
      }
      this.drops[i]++;
    }
  }

  render() {
    if (this.onCompleteCalled) return;

    const now = Date.now();
    const elapsed = now - this.startTime;
    const CW = this.cv.width / this.DPR;
    const CH = this.cv.height / this.DPR;

    this.drawMatrix();

    // --- PHASE: OVERLAY LOGIC ---
    if (elapsed > 2000) {
      this.waitingForTap = true;

      // Darken background slightly for readability
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      this.ctx.fillRect(CW / 2 - 150, CH / 2 - 40, 300, 80);

      this.ctx.textAlign = "center";
      this.ctx.font = "bold 24px 'Courier New'";
      this.ctx.fillStyle = "#0F0";
      this.ctx.fillText("SYSTEM OVERRIDE", CW / 2, CH / 2 - 5);

      if (this.isElectron) {
        // Auto-transition after 6 seconds
        if (elapsed > 6000) this.handleInput();
      } else {
        // Blinking prompt
        this.ctx.font = "14px 'Courier New'";
        this.ctx.globalAlpha = Math.floor(now / 500) % 2 ? 1 : 0.2;
        this.ctx.fillText("TAP TO ENTER SOURCE", CW / 2, CH / 2 + 25);
        this.ctx.globalAlpha = 1;
      }
    }

    requestAnimationFrame(() => this.render());
  }
}
