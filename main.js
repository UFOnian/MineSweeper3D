let inRows = HTMLInputElement.prototype;
let inCols = HTMLInputElement.prototype;
let inHeight = HTMLInputElement.prototype;
let inBombs = HTMLInputElement.prototype;
let inSafeAround = HTMLInputElement.prototype;
let lblMessage = HTMLSpanElement.prototype;
let btnReset = HTMLButtonElement.prototype;
let tBoard = HTMLTableElement.prototype;
Array.from(document.querySelectorAll("[id]"), v => eval(v.id + "=v"));

function td(obj = Cell.prototype) {
  let t = document.createElement('td');
  let b = t.appendChild(document.createElement('button'));
  b.cl = obj;
  return {
    t: t,
    b: b
  };
}

class SecondsTimer {
  constructor(displayElement) {
    this.#display = displayElement;
    this.reset();
  }
  #display = HTMLInputElement.prototype;
  #savedTime = 0;
  #differ = 0;
  #intervalID = 0;
  interval = 200; // display update rate by millsecomds
  reset() {
    clearInterval(this.#intervalID);
    this.#intervalID = 0;
    this.#savedTime = 0;
    this.#differ = 0;
    this.#display.value = 0;
  }
  start() {
    this.#differ = performance.now() - this.#savedTime;
    this.#intervalID = setInterval(() => { this.#update(); }, this.interval);
  }
  #update() {
    this.#savedTime = performance.now() - this.#differ;
    this.#display.value = ~~(this.#savedTime / 1000);
  }
  pause() {
    this.#update();
    clearInterval(this.#intervalID);
    this.#intervalID = 0;
  }
}

class Cell {
  static FLAG = 'P';
  static NONE = '';
  static BOMB = '#';
  #game = Board.prototype;
  #r = 0; get r() { return this.#r; }
  #c = 0; get c() { return this.#c; }
  #h = 0; get h() { return this.#h; }
  #i = 0; get i() { return this.#i; }
  #b = false; get b() { return this.#b; }
  setBomb() { this.#b = true; }
  el = {
    t: HTMLTableCellElement.prototype,
    b: HTMLButtonElement.prototype
  };
  get text() { return this.el.b.innerText; }
  set text(t) { this.el.b.innerText = t; }
  get opened() { return this.el.b.classList.contains("opened"); }
  set opened(f) { this.el.b.classList[f ? 'add' : 'remove']("opened"); }
  get flagged() { return this.el.b.classList.contains("flagged"); };
  set flagged(flagState) {
    if (flagState) {
      this.el.b.classList.add("flagged");
      this.text = Cell.FLAG;
    } else {
      this.el.b.classList.remove("flagged");
      this.text = Cell.NONE;
    }
  };
  around = [];
  get aroundCells() { return this.around.map(i => this.#game.tableArray[i]); }
  get aroundBombsCount() { return this.aroundCells.filter(c => c.b).length; }
  get aroundFlaggsCount() { return this.aroundCells.filter(c => c.flagged).length; }
  constructor(game, r, c, h) {
    this.#game = game;
    this.#r = r;
    this.#c = c;
    this.#h = h;
    this.#i = h * game.rowCount * game.colCount + r * game.colCount + c;
    this.el = td(this);
    for (let i = r - 1; i < r + 2 && i < game.rowCount; i++) {
      if (i < 0) continue;
      for (let j = c - 1; j < c + 2 && j < game.colCount; j++) {
        if (j < 0) continue;
        for (let k = h - 1; k < h + 2 && k < game.heightCount; k++) {
          if (k < 0) continue;
          if (!(i - r || j - c || k - h)) continue;
          this.around.push(k * game.colCount * game.rowCount + i * game.colCount + j);
        }
      }
    }
  }
  clicked() {
    if (this.#game.isGameOver) return;
    if (!this.#game.isInitialized) {
      if (!this.#game.init(this)) {
        return;
      }
    }
    if (this.flagged) return;
    if (!this.opened)
      this.open();
    else this.openAll();
  }
  forceOpen() { // open when GameOver
    if (!this.#b) return;
    if (this.opened) return;
    if (this.flagged) return;
    this.opened = true;
    this.text = Cell.BOMB;
  }
  open() {
    if (this.#game.isGameOver) return;
    if (this.flagged) return;
    if (this.opened) return;
    this.opened = true;
    if (this.#b) {
      this.text = Cell.BOMB;
      return this.#game.setGameOver();
    }
    if (this.aroundBombsCount)
      this.text = this.aroundBombsCount;
    else this.openAll();
    this.#game.checkCleared();
  }
  openAll() {
    if (this.aroundFlaggsCount != this.aroundBombsCount) return;
    this.aroundCells.forEach(c => c.open());
  }
  toggleFlag() {
    if (this.#game.isGameOver) return;
    if (!this.#game.isInitialized) return;
    if (this.opened) return;
    this.flagged = !this.flagged;
  }
};

class Board {
  rowCount = 0;
  colCount = 0;
  heightCount = 0;
  bombCount = 0;
  isGameOver = false;
  isCleard = false;
  isSafeAround = false;
  tableArray = [];
  table = [];
  tableElement = HTMLTableElement.prototype;
  bombsElement = HTMLInputElement.prototype;
  timerElement = HTMLInputElement.prototype;
  msgElement = HTMLElement.prototype;
  timer = SecondsTimer.prototype;
  isInitialized = false;
  valid = false;
  get remainBombsCount() {
    return this.isInitialized ? this.bombCount - this.tableArray.filter(c => c.flagged).length : this.bombCount;
  }
  get dispBombsCount() { return this.bombsElement.value; }
  set dispBombsCount(c) { this.bombsElement.value = c; }
  get dispMsg() { return this.msgElement.innerText; }
  set dispMsg(t) { this.msgElement.innerText = t; }

  constructor(tableElement, bombsElement, timerElement, msgElement) {
    this.tableElement = tableElement;
    this.bombsElement = bombsElement;
    this.timerElement = timerElement;
    this.msgElement = msgElement;
    this.timer = new SecondsTimer(timerElement);
    this.tableElement.addEventListener('click', ev => {
      if (!ev.target.cl) return ev.preventDefault();
      ev.target.cl.clicked();
    });
    this.tableElement.addEventListener('contextmenu', ev => {
      ev.preventDefault();
      if (!ev.target.cl) return;
      ev.target.cl.toggleFlag();
      this.dispBombsCount = this.remainBombsCount;
    });
  }
  reset(rowCount = 10, colCount = 10, heightCount = 10, bombCount = 10, isSafeAround = false) {
    this.dispMsg = "";
    this.valid = false;
    rowCount = Number(rowCount);
    colCount = Number(colCount);
    heightCount = Number(heightCount);
    bombCount = Number(bombCount);
    if (rowCount < 1) return this.dispMsg = `invalid Parameter: rowCount = ${rowCount}`;
    if (colCount < 1) return this.dispMsg = `invalid Parameter: colCount = ${colCount}`;
    if (heightCount < 1) return this.dispMsg = `invalid Parameter: heightCount = ${heightCount}`;
    if (bombCount < 1) return this.dispMsg = `invalid Parameter: bombCount = ${bombCount}`;
    if (rowCount * colCount * heightCount - (isSafeAround ? -27 : -1) <= bombCount)
      return this.dispMsg = `invalid Parameter: bombCount:${bombCount} over board size:${rowCount * colCount * heightCount}(= ${rowCount} * ${colCount} * ${heightCount})`;
    this.valid = true;
    this.rowCount = rowCount;
    this.colCount = colCount;
    this.heightCount = heightCount;
    this.bombCount = bombCount;
    this.isSafeAround = isSafeAround;

    this.tableElement.innerHTML = '';
    this.table = Array(heightCount).fill().map((v, h) => Array(rowCount).fill().map((v, r) => Array(colCount).fill().map((v, c) => new Cell(this, r, c, h))));
    this.tableArray = this.table.reduce((p, rc) => p.concat(rc.reduce((p, c) => p.concat(c), [])), []);
    this.table.forEach(
      (rc, hidx) => {
        let tbl = this.tableElement.appendChild(document.createElement('table'));
        let td = tbl.appendChild(document.createElement('tr')).appendChild(document.createElement('td'));
        td.colSpan = this.colCount;
        td.innerText = hidx + 1;
        rc.map(r => {
          let tr = tbl.appendChild(document.createElement('tr'));
          r.forEach(c => tr.appendChild(c.el.t));
        });
      }
    );
    this.isInitialized = false;
    this.isGameOver = false;
    this.isCleard = false;
    this.dispBombsCount = this.remainBombsCount;
    this.timer.reset();
  }
  init(cell = Cell.prototype) {
    if (!this.valid) return false;
    let cc = this.rowCount * this.colCount * this.heightCount;
    const cs = Array(cc).fill().map((v, i) => i);
    // set safe at start cell
    cs[cell.i] = cs[cc - 1];
    cc--;
    if (this.isSafeAround) {
      cell.around.forEach(i => {
        cs[i] = cs[cc - 1];
        cc--;
      });
    }
    Array(this.bombCount).fill().map((v, i) => {
      let t = ~~(Math.random() * (cc - i));
      this.tableArray[cs[t]].setBomb();
      cs[t] = cs[cc - i - 1];
    });
    this.timer.start();
    this.isInitialized = true;
    return true;
  }
  setGameOver() {
    this.isGameOver = true;
    this.timer.pause();
    this.dispMsg = 'Game Over...';
    this.tableArray.forEach(c => c.forceOpen());
  }
  checkCleared() {
    if (this.tableArray.some(c => !(c.b ^ c.opened))) {
      return;
    }
    this.dispMsg = 'Clear!';
    this.isGameOver = true;
    this.isCleard = true;
    this.timer.pause();
  }
}
let board = new Board(tBoard, inBombsRemain, inTimer, lblMessage);
btnReset.addEventListener("click", x => { board.reset(inRows.value, inCols.value, inHeight.value, inBombs.value, inSafeAround.checked) });
btnReset.click();
