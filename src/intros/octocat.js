class ArcadeBooter  {
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
    
    // Fake commit history for the drawing phase
    this.commits = ["feat: init head", "feat: add ears", "fix: tentacle_pos", "feat: whiskers", "docs: finalize"];

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

   drawOctocat(progress) {
  const { ctx } = this;
  const center = {
    x: (this.cv.width / this.DPR) / 2,
    y: (this.cv.height / this.DPR) / 2 - 20
  };

  // --- easing (makes animation feel alive)
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  const headP = ease(Math.min(progress / 0.4, 1));
  const earP  = ease(Math.max(0, (progress - 0.35) / 0.25));
  const eyeP  = ease(Math.max(0, (progress - 0.55) / 0.2));
  const tentP = ease(Math.max(0, (progress - 0.7) / 0.3));

  ctx.save();

  // --- glow
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#4078c0";

  // ======================
  // HEAD (silhouette)
  // ======================
  ctx.beginPath();

  const r = 50 * headP;

  ctx.moveTo(center.x - r, center.y);

  ctx.bezierCurveTo(
    center.x - r - 10, center.y - r * 0.8,
    center.x - r * 0.4, center.y - r * 1.2,
    center.x, center.y - r
  );

  ctx.bezierCurveTo(
    center.x + r * 0.4, center.y - r * 1.2,
    center.x + r + 10, center.y - r * 0.8,
    center.x + r, center.y
  );

  ctx.bezierCurveTo(
    center.x + r + 10, center.y + r * 0.8,
    center.x + r * 0.4, center.y + r,
    center.x, center.y + r * 0.9
  );

  ctx.bezierCurveTo(
    center.x - r * 0.4, center.y + r,
    center.x - r - 10, center.y + r * 0.8,
    center.x - r, center.y
  );

  ctx.closePath();

  ctx.fillStyle = "#4078c0";
  ctx.fill();

  // ======================
  // EARS
  // ======================
  if (earP > 0) {
    ctx.globalAlpha = earP;

    ctx.beginPath();
    // left ear
    ctx.moveTo(center.x - 25, center.y - 35);
    ctx.lineTo(center.x - 45, center.y - 75);
    ctx.lineTo(center.x - 5, center.y - 50);
    ctx.closePath();

    // right ear
    ctx.moveTo(center.x + 25, center.y - 35);
    ctx.lineTo(center.x + 45, center.y - 75);
    ctx.lineTo(center.x + 5, center.y - 50);
    ctx.closePath();

    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // ======================
  // EYES
  // ======================
  if (eyeP > 0) {
    ctx.globalAlpha = eyeP;

    ctx.fillStyle = "#0d1117";
    ctx.beginPath();
    ctx.ellipse(center.x - 15, center.y - 5, 5, 7, 0, 0, Math.PI * 2);
    ctx.ellipse(center.x + 15, center.y - 5, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
  }

  // ======================
  // TENTACLES (animated)
  // ======================
  if (tentP > 0) {
    ctx.strokeStyle = "#4078c0";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";

    for (let i = -2; i <= 2; i++) {
      const offset = i * 18;

      ctx.beginPath();
      ctx.moveTo(center.x + offset, center.y + 45);

      const wave = Math.sin((Date.now() / 200) + i) * 6 * tentP;

      ctx.bezierCurveTo(
        center.x + offset + wave,
        center.y + 80,
        center.x + offset - wave,
        center.y + 110,
        center.x + offset + wave,
        center.y + 140 * tentP
      );

      ctx.stroke();
    }
  }

  ctx.restore();
}

  render() {
    if (this.onCompleteCalled) return;

    const now = Date.now();
    const elapsed = now - this.startTime;
    const { ctx, cv } = this;
    const CW = cv.width / this.DPR;
    const CH = cv.height / this.DPR;

    // 1. Dark Theme Background
    ctx.fillStyle = "#0d1117"; // GitHub Dark Mode Background
    ctx.fillRect(0, 0, CW, CH);

    // 2. The Drawing Progress
    const progress = Math.min(elapsed / 3000, 1);
    this.drawOctocat(progress);

    // 3. Side-Terminal "Commits"
    ctx.textAlign = "left";
    ctx.font = "12px monospace";
    this.commits.forEach((msg, i) => {
      if (elapsed > i * 600) {
        ctx.fillStyle = "#6e7681";
        const hash = Math.random().toString(16).substring(2, 8);
        ctx.fillText(`[${hash}] ${msg}`, 20, CH - 120 + (i * 18));
      }
    });

    // 4. Final State
    if (progress === 1) {
      this.waitingForTap = true;
      ctx.textAlign = "center";
      ctx.fillStyle = "#f0f6fc";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText("OCTOCAT INITIALIZED", CW / 2, CH / 2 + 80);

      if (this.isElectron) {
        if (elapsed > 5000) this.handleInput();
      } else {
        ctx.globalAlpha = Math.floor(now / 500) % 2 ? 1 : 0.3;
        ctx.font = "14px monospace";
        ctx.fillText(">> git checkout main <<", CW / 2, CH / 2 + 110);
        ctx.globalAlpha = 1;
      }
    }

    requestAnimationFrame(() => this.render());
  }
}
