export class ROMCHECK {
  constructor(canvas, context, onComplete) {
    this.cv = canvas;
    this.ctx = context;
    this.onComplete = onComplete;
    this.startTime = Date.now();

    this.DPR = Math.min(window.devicePixelRatio || 1, 2);
    this.cv.width = Math.round(this.cv.clientWidth * this.DPR);
    this.cv.height = Math.round(this.cv.clientHeight * this.DPR);
    this.ctx.setTransform(this.DPR, 0, 0, this.DPR, 0, 0);

    // Generate fake ROM entries with CRC + address
    this.logs = this.generateROMLogs();

    this.waitingForTap = false;
    this.onCompleteCalled = false;

    this.handleInput = this.handleInput.bind(this);
    if (isElectron === false) {
      this.cv.addEventListener("mousedown", this.handleInput);
      this.cv.addEventListener("touchstart", this.handleInput);
    }

    this.render();
  }

  generateROMLogs() {
    const makeHex = (len) =>
      [...Array(len)]
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join("")
        .toUpperCase();

    const romNames = [
      "P1 ROM", "P2 ROM",
      "S FIX ROM",
      "M1 AUDIO ROM",
      "V1 PCM ROM",
      "V2 PCM ROM",
      "C1 GFX ROM",
      "C2 GFX ROM",
      "C3 GFX ROM",
      "C4 GFX ROM"
    ];

    let addr = 0x000000;

    const logs = romNames.map(name => {
      const size = 0x20000;
      const line = `${name.padEnd(14, " ")} ${addr
        .toString(16)
        .padStart(6, "0")
        .toUpperCase()}  CRC:${makeHex(4)}  OK`;
      addr += size;
      return line;
    });

    return [
      "----- ROM CHECK -----",
      ...logs,
      " ",
      "WORK RAM TEST........",
      "VIDEO RAM TEST.......",
      "PALETTE RAM TEST.....",
      " ",
      "CHECKSUM VERIFY......OK",
      "ALL TESTS PASSED",
      "SYSTEM READY"
    ];
  }

  handleInput() {
    if (
      (this.waitingForTap && !this.onCompleteCalled) ||
      (isElectron === true && !this.onCompleteCalled)
    ) {
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

    // Background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, CW, CH);

    // CRT glow effect
    ctx.shadowColor = "#33ff99";
    ctx.shadowBlur = 8;

    // -------- PHASE 1: ROM + RAM CHECK --------
    if (elapsed < 6000) {
      ctx.fillStyle = "#33ff99";
      ctx.font = "14px 'Courier New'";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      const lineDelay = 180;
      const visibleLines = Math.floor(elapsed / lineDelay);

      let y = 50;

      for (let i = 0; i < visibleLines; i++) {
        if (!this.logs[i]) continue;

        let text = this.logs[i];

        // Animate RAM test progress
        if (text.includes("WORK RAM TEST")) {
          const pct = Math.min(100, Math.floor((elapsed % 1000) / 10));
          text = `WORK RAM TEST........${pct}%`;
          if (pct === 100) text = "WORK RAM TEST........OK";
        }

        if (text.includes("VIDEO RAM TEST")) {
          const pct = Math.min(100, Math.floor((elapsed % 1200) / 12));
          text = `VIDEO RAM TEST.......${pct}%`;
          if (pct === 100) text = "VIDEO RAM TEST.......OK";
        }

        if (text.includes("PALETTE RAM TEST")) {
          const pct = Math.min(100, Math.floor((elapsed % 900) / 9));
          text = `PALETTE RAM TEST.....${pct}%`;
          if (pct === 100) text = "PALETTE RAM TEST.....OK";
        }

        ctx.fillText(text, 40, y);
        y += 18;
      }

      // Cursor
      const cursorY = 50 + visibleLines * 18;
      if (Math.floor(now / 200) % 2) {
        ctx.fillText("_", 40, cursorY);
      }
    }

    // -------- PHASE 2: SYSTEM READY --------
    else if (elapsed < 8000) {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillStyle = "#33ff99";
      ctx.font = "bold 32px 'Courier New'";
      ctx.fillText("SYSTEM READY", CW / 2, CH / 2 - 20);

      ctx.font = "14px 'Courier New'";
      ctx.fillText("INSERT COIN", CW / 2, CH / 2 + 20);
    }

    // -------- PHASE 3: WAIT FOR INPUT --------
    else {
      if (isElectron === false) {
        this.waitingForTap = true;

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.globalAlpha = Math.floor(now / 500) % 2 ? 1 : 0;
        ctx.fillStyle = "#33ff99";
        ctx.font = "14px 'Courier New'";
        ctx.fillText("PRESS START", CW / 2, CH / 2 + 60);
        ctx.globalAlpha = 1;
      } else {
        this.handleInput();
      }
    }

    ctx.shadowBlur = 0;

    requestAnimationFrame(() => this.render());
  }
}
