const defaultSettings = {
  sound_enabled: true,
  highscore: 0,
  fullscreen: true, // Sync default with launch flag 
  free_play: false, // if free play is true - do not show insert credits message. 
  rotation: false,
  grid_rows: 15,
  grid_columns: 7,
  major_prize_row: 0, 
  minor_prize_row: 4,
  sfx_path: "https://lambda.vgmtreasurechest.com/soundtracks/stacker-arcade-gamerip-2004",
  electron_menu_bar: true, // set to false for debugging.,
  credits_required:1,
};

window.addEventListener('DOMContentLoaded', async () => { 

  /*

TODO: 

🎮 Add attract-mode auto demo

Let AI play:

if (this.state === STATE.ATTRACT) {
  this._simulatePlay();
}


🕹 Add payout odds tuning?
this.winBias = 0.85; // 85% chance to shave blocks
💰 Simulate real arcade behavior
Slightly shift alignment randomly
Prevent perfect stacking streaks


🧠 Input buffering (arcade polish)

Currently:

Click during animation = ignored


Lazy Load Sounds: 
Preload only critical sounds
 
*/ 
// ═══════════════════════════════════════════════════════════════
//  STACKER — Full Arcade Port
// ═══════════════════════════════════════════════════════════════

let isElectron = false;  
if (navigator.userAgent.toLowerCase().includes(' electron/') || typeof process !== 'undefined' && process.versions && process.versions.electron) {
    isElectron = true;
};


const DEFAULT_SETTINGS = defaultSettings;
  
const SETTINGS =  isElectron 
  ? await window.electron.call("read-from-file", 'settings.json') 
  : DEFAULT_SETTINGS;
// ── Sound config ─────────────────────────────────────────────
// Set SOUND_ENABLED = true and place MP3s in ./sfx/ to use real audio.
// File names match the arcade asset list exactly.
const SOUND_ENABLED = SETTINGS.sound_enabled;
const SFX_PATH = SETTINGS.sfx_path; 
const SFX_MAP = {
  attract:      "/tbzuxdbx/006. Music - Attract mode music.mp3",
  start:        "/vaqewwrs/061. SFX - Start up.mp3",
  place:        "/nnzjymsd/046. SFX - Button.mp3", 
  blockFall:    "/lpqkdlwa/045. SFX - Block Fall.mp3",
  miss:         "/lxeeietj/047. SFX - Buzz.mp3",
  minorPrize:   "/tmbymnhu/058. SFX - Minor prize win.mp3",
  majorPrize:   "/tmbymnhu/058. SFX - Major prize win.mp3",
  gameOver:     "/faldlrbg/053. SFX - Game over.mp3",
  coin:         "/ecymndbz/054. SFX - Insert coin.mp3",
  tick:         "/rewtdmar/062. SFX - Tick tock (Loop).mp3",
  attract_mode_sfx:"/kimknlrc/043. SFX - Attract mode sound.mp3",
  attract_mode_sfx2:"/ikcertto/044. SFX - Attraction.mp3",
  vo_careful:   "/pakwefph/066. Voice - Careful.mp3",
  vo_getTop:    "/ogrotdig/075. Voice - Get to the top.mp3",
  vo_takeMeToTop:    "/qadrwkku/099. Voice - Take me to the top.mp3",
  vo_lastBlock: "/tjqcpssj/100. Voice - This is the last block.mp3",
  vo_buildUp:   "/xxvltjnq/065. Voice - Build them up.mp3",
  vo_excellent: "/efoedfoe/072. Voice - Excellent.mp3",
  vo_wow:       "/gvjjrghq/110. Voice - Wow jackpot prize winner.mp3",
  vo_ohNo:      "/joqnrtus/084. Voice - Oh no, game over.mp3",
  vo_stacker:   "/oruvwteo/095. Voice - Stacker!!!.mp3",
  vo_stackerrr:   "/jbijvbtr/096. Voice - Stacker... rrrr.mp3",
  vo_comePlay: "/ddfugvjk/068. Voice - Come on, play stacker.mp3",
  vo_comeOn: "/sqbiosav/067. Voice - Come on, give me your best shot.mp3",
  vo_bet: "/bnmvqros/077. Voice - I bet you can build me to the top.mp3",
  vo_bet2: "/dkrbinpl/083. Voice - Oh bet you can stack the blocks.mp3",
  vo_whoCanStackMe: "/klbwgqlj/105. Voice - Who can stack me to the top.mp3",
  vo_pressStartToPlay: "/kuqwmsbh/087. Voice - Press start to play.mp3"
}; 
  
class SoundManager {
  constructor() {
    this._cache = {};
    this._current = null;
    this._positions = {}; // store playback positions
  }

  preloadAll() {
    console.log(SOUND_ENABLED);
    if (!SOUND_ENABLED) return;

    console.log("Preloading all sound effects...");

    Object.keys(SFX_MAP).forEach(key => {
      this._load(key);
    });
  }

  _load(key) {
    if (!SOUND_ENABLED) return null;

    if (!this._cache[key]) {
      const path = SFX_PATH + encodeURI(SFX_MAP[key]);

      const a = new Audio(path);
      a.preload = "auto";
      a.load();

      this._cache[key] = a;
    }
    return this._cache[key];
  }

  play(key, loop = false) {
    if (!SOUND_ENABLED) return;

    const a = this._load(key);
    if (!a) return;

    a.loop = loop;

    // resume if position exists, otherwise start fresh
    a.currentTime = this._positions[key] || 0;

    a.play().catch(e => console.warn(`Playback failed for ${key}:`, e));
  }

  stop(key) {
    const a = this._cache[key];
    if (a) {
      a.pause();
      a.currentTime = 0;
      this._positions[key] = 0;
    }
  }

  // ✅ Updated stopAll with preserve list
  stopAll(preserveKeys = []) {
    Object.keys(this._cache).forEach(key => {
      const a = this._cache[key];
      if (!a) return;

      if (preserveKeys.includes(key)) {
        // pause and remember position
        this._positions[key] = a.currentTime;
        a.pause();
      } else {
        // full stop
        a.pause();
        a.currentTime = 0;
        this._positions[key] = 0;
      }
    });
  }

  resume(key) {
    const a = this._cache[key];
    if (a) {
      a.currentTime = this._positions[key] || 0;
      a.play().catch(e => console.warn(`Resume failed for ${key}:`, e));
    }
  }
}

// ── Event bus ────────────────────────────────────────────────
function fireEvent(name, detail={}) {
  window.dispatchEvent(new CustomEvent("stacker", { detail: { event: name, ...detail } }));
  // flash UI indicator
  const el = document.getElementById("ev-" + name.toLowerCase().replace(/ /g,""));
  if (el) {
    el.classList.add("fired");
    setTimeout(() => el.classList.remove("fired"), 400);
  }
}

// ── Helpers ──────────────────────────────────────────────────
const rand = (min,max) => Math.floor(Math.random()*(max+1-min))+min;
const lerp = (a,b,t) => a+(b-a)*t;


const StorageManager = {
  dbName: "StackerDB",
  storeName: "highscores",

  // 1. Safety wrapper for standard storage
  async save(key, value) {
    try {
      window.sessionStorage.setItem(key, value);
      console.log("Saved to sessionStorage");
    } catch (e) {
      console.warn("sessionStorage denied, using IndexedDB fallback.");
      await this.saveToIndexedDB(key, value);
    }
  },

  // 2. Async IndexedDB Logic
  saveToIndexedDB(key, value) {
    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = (e) => {
        e.target.result.createObjectStore(this.storeName, { keyPath: "key" });
      };
      request.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction(this.storeName, "readwrite");
        tx.objectStore(this.storeName).put({ key, value });
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
      };
    });
  },

  // 3. Smart Retrieval
  async get(key) {
    // Try sessionStorage first
    try {
      const val = window.sessionStorage.getItem(key);
      if (val !== null) return val;
    } catch (e) {
      // If blocked, try IndexedDB
      return await this.getFromIndexedDB(key);
    }
    return null;
  },

  getFromIndexedDB(key) {
    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction(this.storeName, "readonly");
        const store = tx.objectStore(this.storeName);
        const query = store.get(key);
        query.onsuccess = () => {
          resolve(query.result ? query.result.value : 0);
          db.close();
        };
      };
      request.onerror = () => resolve(0);
    });
  }
};
  
  
// ── Canvas setup ─────────────────────────────────────────────
const cv = document.getElementById("c");
const COLS=7, ROWS=15;
const CELL=52, PAD=2;
const CW = COLS*CELL + PAD*2;
const CH = ROWS*CELL + PAD*2 + 80; // +80 for top header
const DPR = Math.min(window.devicePixelRatio||1, 2);
cv.width  = CW*DPR;
cv.height = CH*DPR;
cv.style.width  = CW+"px";
cv.style.height = CH+"px";
const ctx = cv.getContext("2d");
ctx.scale(DPR, DPR);

let BOARD_TOP = 80; // px offset for header

const sfx = new SoundManager();
sfx.preloadAll(); // preload all sounds. 
// ── Prizes config ─────────────────────────────────────────────
const PRIZES = [
  { label:"MAJOR PRIZE", color:"#4af", row:0  },
  { label:"MINOR PRIZE", color:"#ff4", row:4  },
];

// ── Win animation frames (7-wide × 15-tall) ───────────────────
const WIN_SEQ = [
[[1,1,1,1,1,1,1],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]],
  

[[0,0,0,0,0,0,0],[0,1,0,0,0,1,0],[0,1,0,1,0,1,0],[0,1,1,0,1,1,0],[0,1,0,0,0,1,0],[0,0,0,0,0,0,0],[0,0,0,1,0,0,0],[0,0,0,1,0,0,0],[0,0,0,1,0,0,0],[0,0,0,1,0,0,0],[0,1,0,0,0,1,0],[0,1,1,0,0,1,0],[0,1,0,1,0,1,0],[0,1,0,0,1,1,0],[0,1,0,0,0,1,0]]
];

const STACKER_BITMAP = [
    [0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],
  
  // S
  [0,1,1,1,1,1,0],[1,0,0,0,0,0,1],[1,0,0,0,0,0,0],[0,1,1,1,1,1,0],[0,0,0,0,0,0,1],[1,0,0,0,0,0,1],[0,1,1,1,1,1,0],
  [0,0,0,0,0,0,0],
  // T
  [1,1,1,1,1,1,1],[0,0,1,1,1,0,0],[0,0,1,1,1,0,0],[0,0,1,1,1,0,0],[0,0,1,1,1,0,0],[0,0,1,1,1,0,0],[0,0,1,1,1,0,0],
  [0,0,0,0,0,0,0],
  // A
  [0,1,1,1,1,1,0],[1,0,0,0,0,0,1],[1,0,0,0,0,0,1],[1,1,1,1,1,1,1],[1,0,0,0,0,0,1],[1,0,0,0,0,0,1],[1,0,0,0,0,0,1],
  [0,0,0,0,0,0,0],
  // C
  [0,1,1,1,1,1,0],[1,0,0,0,0,0,1],[1,0,0,0,0,0,0],[1,0,0,0,0,0,0],[1,0,0,0,0,0,0],[1,0,0,0,0,0,1],[0,1,1,1,1,1,0],
  [0,0,0,0,0,0,0],
  // K
  [1,0,0,0,0,1,0],[1,0,0,0,1,0,0],[1,0,0,1,0,0,0],[1,0,1,0,0,0,0],[1,1,0,0,0,0,0],[1,0,1,0,0,0,0],[1,0,0,1,0,0,0],
  [0,0,0,0,0,0,0],
  // E
  [1,1,1,1,1,1,1],[1,0,0,0,0,0,0],[1,0,0,0,0,0,0],[1,1,1,1,1,0,0],[1,0,0,0,0,0,0],[1,0,0,0,0,0,0],[1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0],
  // R
  [1,1,1,1,1,0,0],[1,0,0,0,0,1,0],[1,0,0,0,0,1,0],[1,1,1,1,1,0,0],[1,0,1,0,0,0,0],[1,0,0,1,0,0,0],[1,0,0,0,1,0,0],
  // trailing blank rows so the last letter fully scrolls off
  [0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],
];  
// ═══════════════════════════════════════════════════════════════
//  GAME STATES
// ═══════════════════════════════════════════════════════════════
const STATE = { ATTRACT:0, PLAYING:1, PLACING:2, GAMEOVER:3, BOARDCLEAR:4, PRIZE:5, STARTING:6 };

// ── Particle system ───────────────────────────────────────────
class Particle {
  constructor(x,y,color) {
    this.x=x; this.y=y; this.color=color;
    this.vx=(Math.random()-0.5)*6;
    this.vy=(Math.random()-0.7)*8;
    this.life=1; this.decay=0.02+Math.random()*0.03;
    this.size=3+Math.random()*4;
  }
  update() { this.x+=this.vx; this.vy+=0.25; this.y+=this.vy; this.life-=this.decay; }
  draw(ctx) {
    ctx.globalAlpha=this.life;
    ctx.fillStyle=this.color;
    ctx.fillRect(this.x-this.size/2, this.y-this.size/2, this.size, this.size);
    ctx.globalAlpha=1;
  }
} 

// ═══════════════════════════════════════════════════════════════
//  MAIN GAME CLASS
// ═══════════════════════════════════════════════════════════════

async function getHighscore(){
  if(isElectron){
  const settings = await window.electron.call("read-from-file", 'settings.json');
  return settings.highscore;
  }
  return await StorageManager.get("stacker_hs") || 0;
}  

async function saveSettingsToDisk(score){
  const settingsFile = await window.electron.call("read-from-file", 'settings.json');
  settingsFile.highscore = score; // updated score  
  await window.electron.call("write-to-file", 'settings.json', JSON.stringify(settingsFile))  
}

async function setHighscore(score){
  if(isElectron){
   saveSettingsToDisk(score);
  }
  return await StorageManager.save("stacker_hs", score);
}    
  
  

  class Timer {
  constructor() {
    this.startTime = Date.now();
  }

  // Get elapsed time in milliseconds
  elapsed() {
    return Date.now() - this.startTime;
  }

  // Reset the timer
  reset() {
    this.startTime = Date.now();
  }
}
  
const HIGHSCORE = await getHighscore();
class Stacker {
  constructor(creditsRequired=1) {
    this.state = STATE.ATTRACT;
    this.pauseActions = false;
    this.board = [];
    this.pos = {x:0, y:ROWS-1};
    this.dir = "r";
    this.rowLen = 3; // (user can set blocks to start with here via settings)
    this.moveInterval = 100;
    this.mvTm = 0;
    this.placeTime = 0;
    this.plcInt = 250;
    this.plcTmSt = 0;
    this.credits_required = creditsRequired;
    this.mssLps = 3;
    this.mnrPrzLps = 3;
    this.blocksDropped = [];
    this.tmpDropped = [];
    this.breakPoints = [[12,2],[6,1]];
    this.endTime = 0;
    this.loseTmSt = 0;
    this.loseInt = 250;
    this.lftOvrBks = [];
    this.brdClrTm = 0;
    this.brdClrTmSt = 0;
    this.brdClrInt = 15;
    this.blnkFrm = 0;
    this.minorWinBlocks = [];
    this.particles = [];
    this.attractTm = 0;
    this.attractPlays = 0;
    this.attractPhase = 3; 
    this.attractBlink = 0;
    this.score = 0;
    this.highScore = HIGHSCORE;
    this.credits = 0; // hook coin mech via INSERT_COIN
    this.mvTmDec = 5;
    this.flashMsg = "";
    this.flashTm = 0;
    this.scanline = 0;
    this._frame = 0;

    this._resetBoard();
    this._bindInput();
    this._lastTs = 0;
    requestAnimationFrame(ts => this._loop(ts));
  }

  _resetBoard() {
    this.board = Array.from({length:ROWS}, () => Array(COLS).fill(0));
  }

  // ── Public: insert coin (call from Arduino / coin mech) ─────
  insertCoin() {
    this.credits++;
    sfx.play("coin");
    fireEvent("insertcoin", { credits: this.credits });
    this._flash("CREDIT " + this.credits);
    this._draw();
  if(this.state === STATE.ATTRACT) {
    if(this.credits >= this.credits_required && this.pauseActions != true ||   this.credits_required === 0 && this.pauseActions != true){
    // Stop everything EXCEPT keep "music" resumable 
    sfx.stopAll(['attract']);

    sfx.play("vo_pressStartToPlay");
 
      setTimeout(() => {
        if(this.state != STATE.STARTING){
          sfx.resume("attract");
        };
      }, 2000); // 3000 ms = 3 seconds
      
    };
  }
  }  

  // ── Input ────────────────────────────────────────────────────
 _bindInput() {
    cv.addEventListener("click", async (e) => {
      await this._action(e);
    });
  
    document.addEventListener("keydown", async (e) => {
      if (e.code === "Space" || e.code === "Enter" || e.code === "ArrowDown") {
        e.preventDefault();
        await this._action(e);
      }
      if (e.code === "KeyC") {
        this.insertCoin();
      }
    });
  
    cv.addEventListener(
      "touchstart",
       (e) => {
        e.preventDefault();
        this._action(e);
      },
      { passive: false }
    );
  }
  
  async _action(e) {
 
   if (this.demoActive) {
      this._stopDemo();
    }
    if(this.pauseActions === true){
     return;
    }
    if (this.state === STATE.ATTRACT) {
      if (this.credits > 0) {
        this.credits--;
        await this._startGame();
      } else {
        this._flash("INSERT COIN  [C KEY]");  
      }
      return;
    } 
    if (this.state === STATE.PLAYING) {
      this._placeRow(e);
      return;
    }
    if (this.state === STATE.GAMEOVER && this.endTime===0 && this.brdClrTm===0) {
      this.state = STATE.ATTRACT;
      sfx.play("attract", true);
     // sfx.setPersistent("music", true);
    }
  }

  // ── Game start ───────────────────────────────────────────────  
  async _startGame() {
  // Stop any running demo immediately
  if (this.demoActive) this._stopDemo();
  this.demoPlayed = false;

  this.state = STATE.STARTING;
  this.pauseActions = true;
  const delay = ms => new Promise(res => setTimeout(res, ms));

  if (!this.countDownTimer) this.countDownTimer = 5;
  const timer = setInterval(() => {
    this.countDownTimer--;
    if (this.countDownTimer < 0) {
      clearInterval(timer);
      this.countDownTimer = 5;
    }
  }, 1000);

  sfx.stopAll();
  sfx.play("place");
  sfx.play("start");
  await delay(5000);

  this.pauseActions = false;
  fireEvent("start");
  this._resetBoard();
  this.pos          = { x: rand(0, COLS - 1), y: ROWS - 1 };
  this.dir          = this.pos.x >= COLS - 1 ? "l" : "r";
  this.rowLen       = 3;
  this.moveInterval = 100;
  this.mvTm         = 0;
  this.placeTime    = 0;
  this.blocksDropped = [];
  this.tmpDropped    = [];
  this.lftOvrBks     = [];
  this.brdClrTm      = 0;
  this.endTime       = 0;
  this.blnkFrm       = 0;
  this.score         = 0;
  this.particles     = [];
  this.flashMsg      = "";
  this.state = STATE.PLAYING;
}

  // ── Place row ────────────────────────────────────────────────
  _placeRow(e) {
    const g = this;
    if (g.placeTime !== 0) return;
    if (g.board[g.pos.y].indexOf(1) === -1) return;

    let missed = 0;
    const losDff = 0 - g.pos.x;
    const rosDff = (g.pos.x + g.rowLen) - COLS;
    if (losDff > 0)      g.rowLen -= losDff;
    else if (rosDff > 0) g.rowLen -= rosDff;

    if (g.pos.y < ROWS-1) {
      g.tmpDropped = [];
      let mi = 0;
      for (let m=0; m<COLS; m++) {
        if (g.board[g.pos.y][m] > g.board[g.pos.y+1][m]) {
          let b2bGap = 0;
          for (let df=0; df<(ROWS-1)-g.pos.y; df++) {
            if (g.board[g.pos.y+df+1][m]!==1) b2bGap++;
          }
          g.tmpDropped[mi++] = {x:m, y:g.pos.y, gap:b2bGap};
          g.blocksDropped.push({x:m, y:g.pos.y, gap:b2bGap});
          missed++;
        }
      }
      g.tmpDropped.sort((a,b)=>b.gap-a.gap);
      //const maxGap = (ROWS-1) - g.pos.y;

      g.rowLen -= missed;
       
      if(g.rowLen != 0 && missed != 0){
        sfx.play("blockFall");
      }
    }

    fireEvent("place", { row: g.pos.y, rowLen: g.rowLen, missed });

    if (missed > 0) {
      sfx.play("miss");
      fireEvent("miss", { count: missed, row: g.pos.y });
      this._flash("MISS ×" + missed);
      // particles at dropped positions
      g.tmpDropped.forEach(d => {
        for (let p=0;p<8;p++) this.particles.push(new Particle(
          PAD + d.x*CELL + CELL/2, BOARD_TOP + PAD + d.y*CELL + CELL/2, "#f84"
        ));
      });
    } else {
      sfx.play("place");
      this.score += g.pos.y === PRIZES[0].row ? 500 : g.pos.y === PRIZES[1].row ? 200 : 10 * (ROWS - g.pos.y);
      // particles for perfect place
      for (let p=0;p<6;p++) this.particles.push(new Particle(
        PAD + (g.pos.x + Math.random()*g.rowLen)*CELL, BOARD_TOP + PAD + g.pos.y*CELL, "#4af"
      ));
    }

    if (g.rowLen > 0 && g.pos.y > 0) {
      for (const bp of g.breakPoints) {
        if (g.pos.y === bp[0] && g.rowLen > bp[1]) g.rowLen = bp[1];
      }
      g.mvTm = g.moveInterval;
      g.blnkFrm = 1;
      g.plcTmSt = g.plcInt;
      if (missed > 0) {
        g.plcTmSt += g.plcInt * (g.tmpDropped[0].gap + g.mssLps*2);
      } else if (g.pos.y === PRIZES[1].row) {
        g.minorWinBlocks = [...g.board[g.pos.y+1]];
        g.plcTmSt *= g.mnrPrzLps * 2;
        sfx.play("minorPrize");
        fireEvent("minor", { row: g.pos.y, board: g.board });
        this._flash("MINOR PRIZE!");
      }
      g.placeTime = g.plcTmSt;
      g.pos.x = rand(0, COLS-1);
      if      (g.pos.x >= COLS-1)              g.dir = "l";
      else if (g.pos.x <= 0-(g.rowLen-1))      g.dir = "r";
    } else {
      g.blnkFrm = 0;
      if (g.rowLen === 0) {
        // lose
        sfx.play("gameOver");
        sfx.play("vo_ohNo");
        fireEvent("gameover", { win:false, score: this.score });
        g.loseTmSt = 4000;
      } else {
        // win — reached top!
        sfx.play("majorPrize");
        sfx.play("vo_wow");
        fireEvent("major", { board: g.board, score: this.score });
        this._flash("★ MAJOR PRIZE! ★");
        // big particle burst
        for (let p=0;p<60;p++) this.particles.push(new Particle(
          CW/2, BOARD_TOP + 40, ["#4af","#ff4","#f4f","#4f4","#fa4"][p%5]
        ));
        g.loseTmSt = 5000;
      }
      g.endTime = g.loseTmSt;
      this.state = STATE.GAMEOVER;
      if (this.score > this.highScore) {
        this.highScore = this.score;
        setHighscore(this.highScore);
       // localStorage.setItem("stacker_hs", this.highScore);
      }
    }
    this._draw();
  }

  _flash(msg, dur=1500) {
    this.flashMsg = msg;
    this.flashTm  = dur;
  }

  


 
_startDemo() {
  this.demoActive        = true;
  this._aiCooldown       = 0;
  this._aiFirstRowSteps  = null;

  // Boot a real game in-place — state stays STATE.ATTRACT
  this._resetBoard();
  this.pos           = { x: rand(0, COLS - 1), y: ROWS - 1 };
  this.dir           = this.pos.x >= COLS - 1 ? "l" : "r";
  this.rowLen        = 3;
  this.moveInterval  = 100;
  this.mvTm          = 0;
  this.placeTime     = 0;
  this.blocksDropped = [];
  this.tmpDropped    = [];
  this.lftOvrBks     = [];
  this.brdClrTm      = 0;
  this.endTime       = 0;
  this.blnkFrm       = 0;
  this.score         = 0;
  this.particles     = [];
  this.flashMsg      = "";
  // DO NOT change this.state — stays STATE.ATTRACT
}

_stopDemo() {

  this.state = STATE.ATTRACT;
  this.demoActive = false;
  this.demoPlayed = true;
 
 
}

// AI "thumb" — only fires during demo, calls the real _placeRow
_simulatePlay(dt) {
  if (!this.demoActive) return;
  if (this.placeTime > 0) return;

  this._aiCooldown = (this._aiCooldown || 0) - dt;
  if (this._aiCooldown > 0) return;

  // First row — press after random steps
  if (this.pos.y === ROWS - 1) {
    if (!this._aiFirstRowSteps) this._aiFirstRowSteps = rand(3, 8);
    if (this.mvTm <= 0) {
      if (--this._aiFirstRowSteps <= 0) {
        this._aiFirstRowSteps = null;
        this._aiCooldown = this.moveInterval * 2;
        this._placeRow({});
      }
    }
    return;
  }

  // Only decide at movement tick boundary
  if (this.mvTm > 16) return;

  const below = this.board[this.pos.y + 1];
  let overlap = 0;
  for (let i = 0; i < this.rowLen; i++) {
    const x = this.pos.x + i;
    if (x >= 0 && x < COLS && below[x] === 1) overlap++;
  }

  const pct  = this.rowLen > 0 ? overlap / this.rowLen : 0;
  const prob = pct >= 1.0  ? 0.82
             : pct >= 0.66 ? 0.38
             : pct >= 0.33 ? 0.06
             : 0.01;

  if (Math.random() < prob) {
    this._aiCooldown = this.moveInterval + this.plcInt;
    this._placeRow({});
  }
} 

  
  // ═══════════════════════════════════════════════════════════
  //  MAIN LOOP
  // ═══════════════════════════════════════════════════════════
  _loop(ts) {
    const dt = Math.min(ts - this._lastTs, 50);
    this._lastTs = ts;
    this._frame++;
    this.scanline = (this.scanline + 0.5) % CH;

    if (this.flashTm > 0) this.flashTm -= dt;
 
    this.particles = this.particles.filter(p => p.life > 0);
    this.particles.forEach(p => p.update());
  
   if (this.state === STATE.ATTRACT || this.state === STATE.STARTING) {
  this._updateAttract(dt);
}
else if (this.state === STATE.PLAYING) {
  this._updatePlaying(dt);

  // 👇 Demo AI runs only while playing
  if (this.demoActive) {
    this._simulatePlay(dt);
  }
}
else if (this.state === STATE.GAMEOVER) {
  this._updateGameover(dt);
}

    this._draw();
    requestAnimationFrame(ts2 => this._loop(ts2));
  }

  // ── Attract update ───────────────────────────────────────────
  _updateAttract(dt) {
  this.attractTm += dt;
  this.attractBlink = Math.floor(this.attractTm / 500) % 2;

  if (!this.attractTimer) this.attractTimer = new Timer();

  // ── Periodic attract voice lines ──────────────────────────
  if (this.attractTimer.elapsed() >= 40037) {
    const sounds = [
      "vo_comePlay","vo_stacker","vo_comeOn","vo_bet",
      "vo_takeMeToTop","vo_stackerrr","vo_whoCanStackMe",
      "attract_mode_sfx","attract_mode_sfx"
    ];
    sfx.play(sounds[Math.floor(Math.random() * sounds.length)]);
    this.attractTimer.reset();
  }

  // ── Demo is actively running — don't advance phases ───────
  if (this.demoActive) {
    this._updatePlaying(dt);
    this._simulatePlay(dt);

    // Demo game ended: rowLen hit 0 (miss-out) or reached top
    const gameEnded = this.state === STATE.GAMEOVER;
    if (gameEnded) {
      this._stopDemo();
      this.attractPhase = 0;   // restart attract cycle from phase 0
      this.attractTm    = 0;
      this.demoPlayed   = true; // don't auto-start demo again this cycle
    }
    return; // ← skip all phase-cycling logic below
  }

  // ── Normal phase cycling (only when demo is NOT running) ──
 if (this.attractTm > 8000) {
  this.attractTm = 0;
  this.attractPhase = (this.attractPhase + 1) % 5;

  if (this.attractPhase === 4 && !this.demoActive && !this.demoPlayed) {
    this._startDemo();
  }
}

if (this.attractPhase === 0 && this.attractTm < 100) {
  this.demoPlayed = false;
}

  // ── Scroll animation (phase 3) ────────────────────────────
  if (!this.scroll) {
    this.scroll = { offset: -ROWS, speed: 0.025, done: false };
  }
  const s = this.scroll;
  if (this.attractPhase === 3 && !s.done) {
    s.offset += s.speed * dt;
    if (s.offset >= STACKER_BITMAP.length + ROWS) {
      s.done = true;
      this.attractPhase = (this.attractPhase + 1) % 5;
      this.attractTm = 0;
      if (this.attractPhase === 4 && !this.demoPlayed) this._startDemo();
    }
  }
  if (this.attractPhase !== 3) {
    s.offset = -ROWS;
    s.done   = false;
  }
}

  // ── Playing update ───────────────────────────────────────────
  _updatePlaying(dt) {
    const g = this;
   if(!g.hasVoiceLinePlayed){
    g.hasVoiceLinePlayed = {'vo_lastBlock':false, 'vo_careful':false};
   }
    if (g.placeTime === 0) {
      if (g.mvTm === 0) {
        if      (g.dir==="r") { g.pos.x++; if (g.pos.x >= COLS-1)         g.dir="l"; }
        else if (g.dir==="l") { g.pos.x--; if (g.pos.x <= 0-(g.rowLen-1)) g.dir="r"; }

        for (let i=0; i<g.rowLen; i++) {
          if (g.pos.x+i < COLS && g.pos.x+i > -1) g.board[g.pos.y][g.pos.x+i]=1;
          if (g.pos.x > 0)                          g.board[g.pos.y][g.pos.x-1]=0;
          if (g.pos.x+g.rowLen < COLS)              g.board[g.pos.y][g.pos.x+g.rowLen]=0;
        }
        g.mvTm = g.moveInterval;
        // voice lines at key rows
        if (g.pos.y === 14 && !g.hasVoiceLinePlayed['vo_lastBlock']){          //sfx.play("vo_lastBlock");
                                                    g.hasVoiceLinePlayed['vo_lastBlock'] = true;
         }
        
        if (g.pos.y === 10 && !g.hasVoiceLinePlayed['vo_careful']){   //sfx.play("vo_careful");
                                                                   g.hasVoiceLinePlayed['careful'] = true;
              }
        
      } else {
        g.mvTm = Math.max(0, g.mvTm - dt);
      }
    } else {
      g.placeTime -= dt;
      if (g.tmpDropped[0] || g.pos.y === PRIZES[1].row) {
        const loops = (g.tmpDropped[0] ? g.mssLps : g.mnrPrzLps)*2;
        for (let f=1; f<(g.plcTmSt/g.plcInt)+loops; f++) {
          if (g.placeTime < g.plcTmSt - g.plcInt*f &&
              g.placeTime >= g.plcTmSt - g.plcInt*f - dt) {
            if (g.tmpDropped[0]) {
              if (f > g.tmpDropped[0].gap) g.blnkFrm = g.blnkFrm===0?1:0;
              for (const d of g.tmpDropped) {
                const yf = d.y+f;
                if (f <= d.gap) {
                  if (yf < ROWS)   g.board[yf][d.x] = 1;
                  if (yf-1 >= 0)   g.board[yf-1][d.x] = 0;
                } else {
                  if (d.y+d.gap < ROWS) g.board[d.y+d.gap][d.x] = g.blnkFrm;
                }
              }
            } else {
              g.blnkFrm = g.blnkFrm===0?1:0;
              for (let x=0;x<COLS;x++)
                g.board[g.pos.y][x] = g.blnkFrm===0 ? 1 : (g.minorWinBlocks[x]??0);
            }
          }
        }
      }
      if (g.placeTime < 0) {
        g.placeTime = 0;
        g.pos.y--;
        g.moveInterval = Math.max(1, g.moveInterval - g.mvTmDec);
      }
    }
  }

  // ── Gameover update ──────────────────────────────────────────
  _updateGameover(dt) {
    const g = this;
    g.hasVoiceLinePlayed = {1:false, 2:false};
    if (g.endTime > 0) {
      g.endTime -= dt;
      for (let go=0; go<g.loseTmSt/g.loseInt; go++) {
        if (go > 5 &&
            g.endTime < g.loseTmSt - g.loseInt*go &&
            g.endTime >= g.loseTmSt - g.loseInt*go - dt) {
          g.blnkFrm = g.blnkFrm===0?1:0;
          if (g.rowLen > 0 && g.pos.y === 0) {
            for (let y=0;y<ROWS;y++) for (let x=0;x<COLS;x++)
              g.board[y][x] = WIN_SEQ[g.blnkFrm][y][x];
          } else {
            for (const fb of g.tmpDropped) g.board[fb.y][fb.x] = g.blnkFrm;
          }
        }
      }
      if (g.endTime < 0) {
        g.endTime = 0;
        let bkCount=0, bkFrms=0;
        for (let yi=0;yi<ROWS;yi++) {
          const y=(ROWS-1)-yi;
          for (let x=0;x<COLS;x++) {
            if (g.board[y][x]===1) {
              g.lftOvrBks[bkCount++] = {x, y};
              bkFrms += ROWS-y;
            }
          }
        }
        g.brdClrTmSt = bkFrms * g.brdClrInt;
        g.brdClrTm   = g.brdClrTmSt;
        this.state = STATE.BOARDCLEAR;
      }
    } else if (g.brdClrTm > 0) {
      this.state = STATE.BOARDCLEAR;
    }
    
    if (this.demoActive && this.state === STATE.BOARDCLEAR && this.brdClrTm <= 0) {
  this._stopDemo();
}
    
  }

  // ── Board clear update ───────────────────────────────────────
  _updateBoardClear(dt) {
    const g = this;
    if (g.brdClrTm > 0) {
      g.brdClrTm -= dt;
      for (let bf=0;bf<g.brdClrTmSt/g.brdClrInt;bf++) {
        if (g.brdClrTm < g.brdClrTmSt - g.brdClrInt*bf &&
            g.brdClrTm >= g.brdClrTmSt - g.brdClrInt*bf - dt) {
          if (g.lftOvrBks.length > 0) {
            g.lftOvrBks[0].y++;
            if (g.lftOvrBks[0].y === ROWS-1) sfx.play("blockFall");
            if (g.lftOvrBks[0].y > ROWS-1) {
              g.board[g.lftOvrBks[0].y-1][g.lftOvrBks[0].x] = 0;
              g.lftOvrBks.shift();
            } else {
              g.board[g.lftOvrBks[0].y  ][g.lftOvrBks[0].x] = 1;
              g.board[g.lftOvrBks[0].y-1][g.lftOvrBks[0].x] = 0;
            }
          }
        }
      }
      if (g.brdClrTm < 0) {
        g.brdClrTm = 0;
        this.state = STATE.ATTRACT;
        sfx.play("attract", true);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  RENDERING
  // ═══════════════════════════════════════════════════════════
  _draw() {
    ctx.clearRect(0,0,CW,CH);

    // Background gradient
    const bg = ctx.createLinearGradient(0,0,0,CH);
    bg.addColorStop(0,"#000814");
    bg.addColorStop(1,"#001122");
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,CW,CH);

    if (this.state === STATE.ATTRACT || this.state === STATE.STARTING) {
      this._drawAttract();
    } else {
      this._drawHeader();
      this._drawBoard();
      this._drawPrizeLines();
      if (this.state === STATE.GAMEOVER || this.state === STATE.BOARDCLEAR) {
        this._drawGameoverOverlay();
      }
    }

    this._drawParticles();
    this._drawFlash();
    this._drawScanlines();
    this._drawCRT();

    // Board clear runs even in gameover state
    if (this.state === STATE.BOARDCLEAR)
       
      this._updateBoardClear(16);
  }

  // ── Attract screen ───────────────────────────────────────────
  _drawAttract() {
    
    /// TODO: probably improve screen when waiting for countdown in game - show visual if this.pauseActions === true override prize display phases.. (real countdown possibly.)
    
 
const d = this.demo;
if (d && d.cells) {
  // Draw all locked + active demo cells on top of the faded background
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (d.cells[row][col] === 1) {
        const px = PAD + col * CELL;
        const py = BOARD_TOP + PAD + row * CELL;

        // Prize-row colours match the real board
        let color = "#4af";
        if (row === PRIZES[0].row) color = "#4af";
        else if (row === PRIZES[1].row) color = "#ff4";

        ctx.shadowColor = color;
        ctx.shadowBlur  = 10;
        ctx.fillStyle   = color;
        ctx.fillRect(px + 1, py + 1, CELL - 3, CELL - 3);
        ctx.shadowBlur = 0;
      }
    }
  }
}
    
    const t = this.attractTm;

    // animated blocks demo
    ctx.save();
    ctx.globalAlpha = 0.25;
    for (let y=0;y<ROWS;y++) for (let x=0;x<COLS;x++) {
      const v = Math.sin(t/400 + x*0.8 + y*0.5)*0.5+0.5;
      ctx.fillStyle = `hsl(${200+x*15},80%,${10+v*20}%)`;
      ctx.fillRect(PAD+x*CELL, BOARD_TOP+PAD+y*CELL, CELL-2, CELL-2);
    }
    ctx.restore();

    // logo
    ctx.save();
    const logoY = 60 + Math.sin(t/600)*6;
    ctx.textAlign = "center";

    // glow
    ctx.shadowColor = "#4af";
    ctx.shadowBlur = 30;
    ctx.font = "bold 52px 'Courier New'";
    ctx.fillStyle = "#fff";
    ctx.fillText("STACKER", CW/2, logoY);
 
    ctx.shadowBlur = 0;
    ctx.font = "bold 13px 'Courier New'";
    ctx.fillStyle = "#4af";
    ctx.fillText("★  ARCADE EDITION  ★", CW/2, logoY+28);
 
    
    if (this.pauseActions != true) {

    // prize display phases
    ctx.font = "bold 15px 'Courier New'";
    if (this.attractPhase === 0) {
      ctx.fillStyle = "#ff4";
      ctx.fillText("STACK BLOCKS TO WIN", CW/2, CH/2-20);
      ctx.fillStyle = "#4af";
      ctx.fillText("MAJOR  &  MINOR  PRIZES", CW/2, CH/2+10);
    } else if (this.attractPhase === 1) {
      ctx.fillStyle = "#4af";
      ctx.fillText("MAJOR PRIZE", CW/2, CH/2-40);
      ctx.fillStyle = "#fff";
      ctx.font = "11px 'Courier New'";  
      ctx.fillText("Reach the TOP row perfectly", CW/2, CH/2-18);
      ctx.fillStyle = "#ff4";
      ctx.font = "bold 15px 'Courier New'";
      ctx.fillText("MINOR PRIZE", CW/2, CH/2+20);
      ctx.fillStyle = "#fff";
      ctx.font = "11px 'Courier New'";
      ctx.fillText("Line up row 4 perfectly", CW/2, CH/2+42);
    } else if (this.attractPhase === 2) {
      ctx.fillStyle = "#4af";
      ctx.fillText("HIGH SCORE", CW/2, CH/2-20);
      ctx.fillStyle = "#ff4";
      ctx.font = "bold 28px 'Courier New'";
      ctx.fillText(String(this.highScore).padStart(6,"0"), CW/2, CH/2+16);
    } else if (this.attractPhase === 3 && this.scroll && !this.scroll.done) {
    const bmpLen = STACKER_BITMAP.length;
    const off    = this.scroll.offset; // fractional row index into bitmap

    for (let row = 0; row < ROWS; row++) {
      // which bitmap row maps to this grid row?
      const bmpRow = Math.floor(off + row) % bmpLen;
      const cells  = STACKER_BITMAP[bmpRow];

      for (let col = 0; col < COLS; col++) {
        if (!cells) continue;
        if (!cells[col]) continue;

        const px = PAD + col * CELL;
        const py = BOARD_TOP + PAD + row * CELL;

        // sub-pixel vertical blend: fade between adjacent rows
        const frac   = (off + row) % 1;
        const nextRow = STACKER_BITMAP[(bmpRow + 1) % bmpLen];
        const alpha  = nextRow[col] ? 1 : (1 - frac * 0.6);

        ctx.save();
        ctx.globalAlpha = alpha * 0.55;
        ctx.shadowColor = "#4af";
        ctx.shadowBlur  = 14;
        ctx.fillStyle   = "#4af";
        ctx.fillRect(px + 1, py + 1, CELL - 3, CELL - 3);
        ctx.restore();
      }
    }
  } else  if (this.attractPhase === 4 && this.demoActive) {
    this._drawHeader();
    this._drawBoard();
    this._drawPrizeLines();

    ctx.save();
    ctx.textAlign = "center";

    // Faint DEMO watermark
    ctx.globalAlpha = 0.10;
    ctx.font        = "bold 68px 'Courier New'";
    ctx.fillStyle   = "#fff";
    ctx.fillText("DEMO", CW / 2, CH / 2 + 20);

    // Blinking insert-coin prompt
    if (this.attractBlink) {
      ctx.globalAlpha = 0.85;
      ctx.font        = "bold 13px 'Courier New'";
      ctx.fillStyle   = this.credits > 0 ? "#4f4" : "#fa4";
      ctx.fillText(
        this.credits > 0 ? "▶  PRESS  TO  PLAY  ◀" : "INSERT  COIN  [C KEY]",
        CW / 2, CH - 14
      );
    }
    ctx.restore();
    return;
  }
      
   }
    
    
    // blink insert/press
    if (this.attractBlink && this.pauseActions != true) {
      ctx.font = "bold 14px 'Courier New'";
      ctx.fillStyle = "#fff";
      const msg = this.credits > 0 ? "▶  PRESS  TO  PLAY  ◀" : "INSERT  COIN  [C KEY]";
      ctx.fillStyle = this.credits>0 ? "#4f4" : "#fa4";
      ctx.fillText(msg, CW/2, CH-30);
    } 
     
     if (this.attractBlink && this.pauseActions === true) {
       
       
        ctx.font = "bold 14px 'Courier New'";
      ctx.fillStyle = "#fff";
      const msg = "GET READY";
      ctx.fillStyle =  "#fa4";
      ctx.fillText(msg, CW/2, CH-30);
     }
    
    if (this.pauseActions === true) {
      
       ctx.fillStyle = "#4af";
      ctx.fillText("COUNTDOWN", CW/2, CH/2-20);
      ctx.fillStyle = "#ff4";
      ctx.font = "bold 28px 'Courier New'";
      ctx.fillText(this.countDownTimer, CW/2, CH/2+16);
      
      
      
    }

    ctx.font = "11px 'Courier New'";
    ctx.fillStyle = "#4af6";
    ctx.fillText(`CREDITS: ${this.credits}`, CW/2, CH-10);

    ctx.restore();
  }
 
  // ── Header ───────────────────────────────────────────────────
  _drawHeader() {
    ctx.textAlign = "left";
    ctx.font = "bold 11px 'Courier New'";
    ctx.fillStyle = "#4af8";
    ctx.fillText("SCORE", 8, 18);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 20px 'Courier New'";
    ctx.fillText(String(this.score).padStart(6,"0"), 8, 38);
   
    ctx.textAlign = "center";
    ctx.font = "bold 24px 'Courier New'";
    ctx.fillStyle = "#4af";
    ctx.shadowColor="#4af"; ctx.shadowBlur=12;
    ctx.fillText("STACKER", CW/2, 34);
    ctx.shadowBlur=0;

    ctx.textAlign = "right";
    ctx.font = "bold 11px 'Courier New'";
    ctx.fillStyle = "#4af8";
    ctx.fillText("BEST", CW-8, 18);
    ctx.fillStyle = "#ff4";
    ctx.font = "bold 20px 'Courier New'";
    ctx.fillText(String(this.highScore).padStart(6,"0"), CW-8, 38);

    // header separator
    ctx.fillStyle = "#4af3";
    ctx.fillRect(0, 42, CW, 1);

    // credits
    ctx.textAlign = "center";
    ctx.font = "10px 'Courier New'";
    ctx.fillStyle = "#4af6";
    ctx.fillText(`CREDITS: ${this.credits}`, CW/2, 56);

    ctx.textAlign = "left";
  }

  // ── Board ─────────────────────────────────────────────────────
  _drawBoard() {
    const g = this;
    for (let y=0;y<ROWS;y++) {
      for (let x=0;x<COLS;x++) {
        const px = PAD + x*CELL;
        const py = BOARD_TOP + PAD + y*CELL;
        const on = g.board[y][x]===1;
        if (on) {
          // radial gradient for lit block
          const cx2 = px+CELL/2, cy2=py+CELL/2;
          const grd = ctx.createRadialGradient(cx2,cy2,2,cx2,cy2,CELL*0.7);
          // different colours for prize rows
          if (y === PRIZES[0].row) {
            grd.addColorStop(0,"#fff");
            grd.addColorStop(0.4,"#4af");
            grd.addColorStop(1,"#048");
          } else if (y === PRIZES[1].row) {
            grd.addColorStop(0,"#fff");
            grd.addColorStop(0.4,"#ff8");
            grd.addColorStop(1,"#880");
          } else {
            grd.addColorStop(0,"#9ff");
            grd.addColorStop(0.5,"#5cf");
            grd.addColorStop(1,"#048");
          }
          ctx.fillStyle = grd;
          // glow
          ctx.shadowColor = y===PRIZES[0].row?"#4af":y===PRIZES[1].row?"#ff4":"#5cf";
          ctx.shadowBlur = 12;
        } else {
          ctx.fillStyle = y===PRIZES[0].row?"#001830":y===PRIZES[1].row?"#181800":"#011";
          ctx.shadowBlur = 0;
        }
        ctx.fillRect(px+1, py+1, CELL-3, CELL-3);
        ctx.shadowBlur = 0;

        // grid lines on empty cells
        if (!on) {
          ctx.strokeStyle = "#4af1";
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px+1, py+1, CELL-3, CELL-3);
        }
      }
    }
    // row number hint (small)
    ctx.font = "8px 'Courier New'";
    ctx.textAlign = "right";
    ctx.fillStyle = "#4af4";
    for (let y=0;y<ROWS;y++) {
      ctx.fillText(y, PAD-1, BOARD_TOP+PAD+y*CELL+CELL/2+3);
    }
    ctx.textAlign = "left";
  }

  // ── Prize lines ───────────────────────────────────────────────
  _drawPrizeLines() {
    for (const p of PRIZES) {
      const y = BOARD_TOP + PAD + p.row*CELL;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(PAD, y, COLS*CELL, CELL-1);
      ctx.shadowBlur = 0;

      // label on left
      ctx.save();
      ctx.translate(PAD-6, y + CELL/2);
      ctx.rotate(-Math.PI/2);
      ctx.textAlign = "center";
      ctx.font = "bold 8px 'Courier New'";
      ctx.fillStyle = p.color;
      ctx.fillText(p.label, 0, 0);
      ctx.restore();
    }
  }

  // ── Gameover overlay ──────────────────────────────────────────
  _drawGameoverOverlay() {
    if (this.endTime > 0) return;
    // only show after board clear
    if (this.state !== STATE.BOARDCLEAR && this.endTime === 0 && this.brdClrTm === 0) {
      ctx.fillStyle = "rgba(0,0,20,0.7)";
      ctx.fillRect(0, CH/2-50, CW, 100);
      ctx.textAlign = "center";
      ctx.font = "bold 20px 'Courier New'";
      ctx.fillStyle = "#f44";
      ctx.shadowColor="#f44"; ctx.shadowBlur=20;
      ctx.fillText("GAME OVER", CW/2, CH/2-10);
      ctx.shadowBlur=0;
      ctx.font = "bold 18px 'Courier New'";
      ctx.fillStyle = "#ff4";
      ctx.fillText("SCORE: " + String(this.score).padStart(6,"0"), CW/2, CH/2+18);
      if (Math.floor(this._frame/30)%2) {
        ctx.font = "12px 'Courier New'";
        ctx.fillStyle = "#4af";
        ctx.fillText("PRESS TO CONTINUE", CW/2, CH/2+44);
      }
      ctx.textAlign = "left";
    }
  }

  // ── Particles ─────────────────────────────────────────────────
  _drawParticles() {
    this.particles.forEach(p => p.draw(ctx));
  }

  // ── Flash message ─────────────────────────────────────────────
  _drawFlash() {
    if (!this.flashMsg || this.flashTm <= 0) return;
    const alpha = Math.min(1, this.flashTm/300);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = "center";
    ctx.font = "bold 16px 'Courier New'";
    ctx.fillStyle = "#fff";
    ctx.shadowColor = "#4af"; ctx.shadowBlur = 16;
    ctx.fillText(this.flashMsg, CW/2, BOARD_TOP + 30);
    ctx.shadowBlur=0;
    ctx.restore();
  }

  // ── Scanlines ─────────────────────────────────────────────────
  _drawScanlines() {
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = "#000";
    for (let y=0;y<CH;y+=2) ctx.fillRect(0,y,CW,1);
    ctx.restore();
  }

  // ── CRT vignette ──────────────────────────────────────────────
  _drawCRT() {
    const vg = ctx.createRadialGradient(CW/2,CH/2,CH*0.3,CW/2,CH/2,CH*0.9);
    vg.addColorStop(0,"rgba(0,0,0,0)");
    vg.addColorStop(1,"rgba(0,0,0,0.55)");
    ctx.fillStyle = vg;
    ctx.fillRect(0,0,CW,CH);
  }
}
 
// ── Boot ──────────────────────────────────────────────────────
  
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
 
 new ArcadeBooter(cv, ctx, () => {
  // This callback runs ONLY after the 6-second animation finishes
  
  const game = new Stacker(SETTINGS.credits_required);
  sfx.play("attract", true);
   
 }) 
  
// ── External API for Arduino / hardware integration ───────────
window.STACKER = {
  insertCoin: () => game.insertCoin(),
  getState:   () => ({
    state: game.state,
    score: game.score,
    row:   game.pos?.y,
    rowLen: game.rowLen,
    board:  game.board,
  }),
  fireAction: async () => game._action({}),
};

  
let rotated = false;

function fitToScreen() {
  const margin = 0;

  const wrap = document.getElementById('wrap');
  const cv = document.getElementById('c');
  const side = document.getElementById('side');

  // Calculate available width and height for the canvas
  const availableWidth = window.innerWidth - side.offsetWidth - margin - 16; // 16 = gap
  const availableHeight = window.innerHeight - margin;

  const scaleX = availableWidth / CW;
  const scaleY = availableHeight / CH;

  const scale = Math.min(scaleX, scaleY);

  cv.style.width = `${CW * scale}px`;
  cv.style.height = `${CH * scale}px`;
 
 

  // Keep canvas in normal flow
  cv.style.position = "relative";
}
   
window.addEventListener("resize", fitToScreen);
fitToScreen(); 
 
/*
  HARDWARE INTEGRATION EXAMPLE (Arduino via WebSerial / WebHID):
  ─────────────────────────────────────────────────────────────
  navigator.serial.requestPort().then(port => {
    // on coin pulse:   window.STACKER.insertCoin()
    // on button press: window.STACKER.fireAction()
    // listen for events:
    window.addEventListener('stacker', e => {
      // e.detail.event can be:
      //   "insertcoin" | "start" | "place" | "miss" |
      //   "minor" | "major" | "gameover"
      // Send serial signal to Arduino to activate prize dispenser etc.
      sendSerial(e.detail);
    });
  });
*/



/// UI For Buttons

const rotateBtn = document.getElementById("rotateBtn");

const devBtn = document.getElementById("devBtn");

devBtn.onclick = () => {
  const devPanel = document.querySelector('.dev-panel');
  devPanel.classList.toggle('hidden')
} 

rotateBtn.onclick = () => {
  rotated = !rotated;
const side = document.getElementById('side');
  const wrap = document.getElementById('wrap');
  // Optional rotation
  if (rotated) {
    cv.style.transform = "rotate(90deg)";
    cv.style.transformOrigin = "center center";
    side.classList.add("hidden")
     devBtn.classList.add("hidden")
    //side.style.transform = "rotate(90deg)";
   // side.style.transformOrigin = "center center";
    //wrap.style["align-items"] = "flex-end";
  } else {
    devBtn.classList.remove("hidden")
    cv.style.transform = "none";
   // wrap.style["align-items"] = "flex-start";
    side.classList.remove("hidden")
  }
};

if (SETTINGS.fullscreen && !document.fullscreenElement) {   document.documentElement.requestFullscreen();
}  
  
const fsBtn = document.getElementById("fsBtn");

fsBtn.onclick = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};  
});
