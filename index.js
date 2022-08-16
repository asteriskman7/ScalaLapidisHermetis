"use strict";

/*
TODO:
make sliding follow the curve of the slide
*/

// scala lapidis hermetis = ladder of the hermetic stone
// et casus = and bad luck / falling down

class App {
  constructor() {
    this.boardColors = ['hsl(33,28%,82%)', 'hsl(33,28%,72%)'];
    this.canvas = document.getElementById('cmain');
    this.ctx = this.canvas.getContext('2d');
    this.boardBuffer = document.createElement('canvas');
    this.boardBuffer.width = this.canvas.width;
    this.boardBuffer.height = this.canvas.height;
    this.boardctx = this.boardBuffer.getContext('2d');
    this.images = {
      pstone: document.getElementById('imgpstone')
    };
    this.symbols = {
      mercury: '\u263f',
      salt: '\ud83d\udf14',
      sulfur: '\ud83d\udf0d',
      air: '\ud83d\udf01',
      earth: '\ud83d\udf03',
      fire: '\ud83d\udf02',
      water: '\ud83d\udf04',
      lead: '\u2644',
      tin: '\u2643',
      crucible: '\ud83d\udf66',
      retort: '\ud83d\udf6d',
      alembic: '\u2697',
      sun: '\u2600',
      moon: '\u263e',
      0: '\u25cb',
      1: '\u25cf',
      2: '\u007c',
      3: '\u25b3',
      4: '\u25fb',
      5: '\u26e7'
    };

    //init board items
    this.sources = [
      {gtype: 'source', type: 'salt', pos: 10},
      {gtype: 'source', type: 'mercury', pos: 20},
      {gtype: 'source', type: 'sulfur', pos: 30},
      {gtype: 'source', type: 'water', pos: 40},
      {gtype: 'source', type: 'fire', pos: 50},
      {gtype: 'source', type: 'earth', pos: 60},
      {gtype: 'source', type: 'air', pos: 70},
      {gtype: 'source', type: 'lead', pos: 80},
      {gtype: 'source', type: 'tin', pos: 90},
      {gtype: 'source', type: 'ps', pos: 100}
    ];

    this.levelPaths = {
      salt: [
        {from: 12, to: 6, limit: 2},
        {from: 16, to: 4, limit: 3},
        {from: 6, to: 15, limit: 4},
        {from: 3, to: 18, limit: 5}
      ],
      mercury: [
        {from: 22, to: 2, limit: 4},
        {from: 25, to: 14, limit: 3},
        {from: 17, to: 24, limit: 5}
      ],
      sulfur: [
        {from: 32, to: 12, limit: 2},
        {from: 37, to: 16, limit: 3},
        {from: 14, to: 28, limit: 5}
      ],
      water: [
        {from: 43, to: 4, limit: 2},
        {from: 46, to: 25, limit: 3},
        {from: 13, to: 45, limit: 5}
      ],
      fire: [
        {from: 52, to: 47, limit: 2},
        {from: 56, to: 26, limit: 4},
        {from: 39, to: 58, limit: 5}
      ],
      earth: [
        {from: 63, to: 44, limit: 2},
        {from: 69, to: 13, limit: 4},
        {from: 34, to: 65, limit: 5}
      ],
      air: [
        {from: 79, to: 42, limit: 3},
        {from: 77, to: 55, limit: 4},
        {from: 53, to: 74, limit: 5}
      ],
      lead: [
       {from: 83, to: 23, limit: 2},
       {from: 85, to: 34, limit: 3},
       {from: 49, to: 88, limit: 5},
      ],
      tin: [
        {from: 93, to: 66, limit: 2},
        {from: 96, to: 54, limit: 3},
        {from: 98, to: 5, limit: 4},
        {from: 9, to: 92, limit: 5}
      ],
      ps: []
    }

    this.loadFromStorage();

    this.paths = [];
    Object.keys(this.levelPaths).forEach( l => {
      this.levelPaths[l].forEach( p => {
        p.gtype = 'path';
        p.level = l;
        this.paths.push(p);
      });
    });
    this.paths.sort( (a, b) => b.from - a.from );
    this.updateActivePaths();

    this.updateGridMap();


    this.drawBoard(this.boardctx);

    setInterval(() => this.tick(), 1000/60);
    setInterval(() => this.saveToStorage(), 5000);

    document.getElementById('dialog').style.display = this.state.introShown ? 'none' : 'flex';
    document.getElementById('buttonDialog').onclick = () => this.dialogClick();
    this.resetClicks = 0;
    document.getElementById('buttonReset').onclick = () => this.resetClick();

    //font-family: 'Almendra SC', serif;
  }
 
  loadFromStorage() {
    const rawState = localStorage.getItem('SLH');

    this.state = {
      crucibles: [{
        pos: 1,
        targetPos: 1,
        basePos: 1,
        moveStart: 0,
        state: 'roll'
      }],
      mercury: 0,
      salt: 0,
      sulfur: 0,
      air: 0,
      earth: 0,
      fire: 0,
      water: 0,
      lead: 0,
      tin: 0,
      ps: 0,
      maxMove: 2,
      moveSpeed: 1,
      collectMult: 1,
      t: 0,
      progress: 0,
      progressRate: 0.000000003170979195, //this number makes it take 10 years
      introShown: false,
      startTime: (new Date()).getTime()
    };

    if (rawState !== null) {
      const loadedState = JSON.parse(rawState);
      this.state = {...this.state, ...loadedState};
    }

    this.saveToStorage();
  }

  saveToStorage() {
    const saveString = JSON.stringify(this.state);
    localStorage.setItem('SLH', saveString);
  }

  reset() {
    localStorage.removeItem('SLH');
    window.location.reload();
  }

  finishGrid() {
    this.state.crucibles[0].pos = 1;
    this.state.crucibles[0].targetPos = 1;
    this.state.crucibles[0].basePos = 1;
    this.state.crucibles[0].state = 'roll';

    //remove some items
    for (let i = 0; i < 10; i++) {
      const typeIndex = Math.floor(Math.random() * 9);
      const type = this.sources[typeIndex].type;
      this.state[type] = Math.max(0, this.state[type] - 1);
    }
    this.updateActivePaths();

    this.state.progress = this.state.progress * 1.10;
  }

  updateGridMap() {
    this.gridMap = {};

    this.paths.forEach( p => {
      if (this.gridMap[p.from] !== undefined) {
        throw 'duplicate map';
      }
      this.gridMap[p.from] = p;
    });

    this.sources.forEach( s => {
      if (this.gridMap[s.pos] !== undefined) {
        throw 'duplicate map';
      }
      this.gridMap[s.pos] = s;
    });
  }

  tick() {
    this.update();
    this.draw();
  }

  updateActivePaths() {
    const ALLACTIVE = false;
    let anyUpdates = false;
    this.paths.forEach( p => {
      if (p.from > p.to) {
        //slide
        const newState = this.state[p.level] < p.limit || ALLACTIVE;
        anyUpdates = anyUpdates || (newState !== p.active);
        p.active = newState;
      } else {
        //ladder
        const newState = this.state[p.level] >= p.limit || ALLACTIVE;
        anyUpdates = anyUpdates || (newState !== p.active);
        p.active = newState;
      }
    });
    if (anyUpdates) {
      this.drawBoard(this.boardctx);
    }
  }

  forcePos(pos) {
    const c = this.state.crucibles[0];
    c.state = 'roll';
    c.pos = pos;
  }

  getProgressRate() {
    return Math.pow(9, this.state.ps) * this.state.progressRate;
  }

  update() { 
    if (this.state.progress >= 1) {
      if (!this.state.finished) {
        this.state.endTime = (new Date()).getTime();
      }
      this.state.finished = true;
      this.showEnd();
      return;
    }

    this.state.t += 1 / 60;
    this.state.progress += this.getProgressRate() / 60;

    if (Math.random() > 0.9999) {
      document.getElementById('peek').style.opacity = 0.1;
      console.log('peek');
      setTimeout(() => {
        console.log('unpeek');
        document.getElementById('peek').style.opacity = 0;
      }, 3000);
    }

    //move crucibles
    this.state.crucibles.forEach( c => {
      switch (c.state) {
        case 'roll': {
          const move = Math.floor(Math.random() * this.state.maxMove) + 1;
          c.targetPos = Math.min(100, c.pos + move);
          c.basePos = c.pos;
          c.moveStart = this.state.t;
          c.state = 'move-grid';
          c.xy = this.posToXY(c.pos);
          break;
        }
        case 'move-grid': {
          //how long have we been moving so far
          const moveTime = this.state.t - c.moveStart;
          //how many grid spaces have we already passesd
          const prevGrids = Math.floor(moveTime * this.state.moveSpeed)
          //what fraction of the way on our way to the next grid position are we
          const f = (moveTime - prevGrids / this.state.moveSpeed) * this.state.moveSpeed;
          const tempFrom = c.pos + Math.floor(moveTime * this.state.moveSpeed);
          const tempTo = tempFrom + 1;
          const fromxy = this.posToXY(tempFrom);
          const toxy = this.posToXY(tempTo);
          c.xy = {x: fromxy.x + f * (toxy.x - fromxy.x), y: fromxy.y + f * (toxy.y - fromxy.y)};

          if (tempFrom == c.targetPos) {
            c.state = 'destination';
            c.pos = c.targetPos;
          }
          break;
        }
        case 'move-path': {
          const moveTime = this.state.t - c.moveStart;
          //should only take 1/moveSpeed to traverse entire path
          const f = moveTime / this.state.moveSpeed;
          const fromxy = this.posToXY(c.basePos);
          const toxy = this.posToXY(c.targetPos);
          c.xy = {x: fromxy.x + f * (toxy.x - fromxy.x), y: fromxy.y + f * (toxy.y - fromxy.y)};

          if (f >= 1) {
            c.state = 'destination';
            c.pos = c.targetPos;
          }
          break;
        }
        case 'destination': {
          //figure out what is at our destination and do some action
          const gridItem = this.gridMap[c.pos];
          if (gridItem !== undefined) {
            switch (gridItem.gtype) {
              case 'path': {
                if (gridItem.active) {
                  c.targetPos = gridItem.to;
                  c.basePos = c.pos;
                  c.moveStart = this.state.t;
                  c.xy = this.posToXY(c.pos);
                  c.state = 'move-path';
                } else {
                  c.state = 'roll';
                }
                break;
              }
              case 'source': {
                this.state[gridItem.type] = Math.min(5, this.state[gridItem.type] + this.state.collectMult);
                this.updateActivePaths();
                c.state = 'roll';
                if (gridItem.type == 'ps') {
                  this.finishGrid();
                }
                break;
              }
            }
          } else {
            c.state = 'roll';
          }
          break;
        }

      }
    });
    
  }

  posToXY(pos) {
    const gridSize = 50;
    const xoffset = 90;
    const yoffset = 10;
    const y = Math.floor((pos-1) / 10);
    let x = (pos - 1 ) % 10;
    if ((y % 2) === 1) {
      x = 9 - x;
    }
    return {x: x * gridSize + xoffset, y: (9 - y) * gridSize + yoffset};
  }

  drawBoard(ctx) {
    ctx.save();
    //draw grid
    const gridSize = 50;
    const xoffset = 90;
    const yoffset = 10;
    ctx.font = "12px 'Almendra SC'";
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        const colorIndex = (x + y) % 2;
        ctx.fillStyle = this.boardColors[colorIndex];
        const dx = xoffset + gridSize * x;
        const dy = yoffset + gridSize * (9 - y);
        ctx.fillRect(dx, dy, gridSize, gridSize);
        ctx.fillStyle = this.boardColors[1 - colorIndex];
        ctx.fillStyle = 'black';
        const gridNum = y * 10 + ((y % 2 === 1) ? (9-x) : (x)) + 1;
        ctx.fillText(gridNum, dx + 5, dy + gridSize - 5); 
      }
    }

    ctx.font = "36px 'Almendra SC'";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'hsl(33,28%,32%)';
    this.sources.forEach( s => {
      const xy = this.posToXY(s.pos);
      if (s.type !== 'ps') {
        ctx.fillText(this.symbols[s.type], xy.x + 25, xy.y + 25);
      } else {
        ctx.drawImage(this.images.pstone, xy.x, xy.y);
      }
    });

    ctx.restore();

    this.drawPaths(ctx);
  }

  drawPaths(ctx) {
    ctx.strokeStyle = 'hsl(33,28%,32%)';
    const gridSize = 50;
    this.paths.forEach( p => {
      if (!p.active) {return;}
      const fromxy = this.posToXY(p.from);
      const toxy = this.posToXY(p.to);
      if (p.from > p.to) {
        //chute
        let basex;
        let topOffsetx;
        if (toxy.x <= fromxy.x) {
          basex = toxy.x + gridSize / 4;
          topOffsetx = gridSize / 3;
        } else {
          basex = toxy.x + gridSize * 3 / 4;
          topOffsetx = -gridSize / 3;
        }
        const basey = toxy.y + gridSize / 3;
        const dx = fromxy.x - toxy.x;
        const dy = fromxy.y - toxy.y;
        ctx.beginPath();
        ctx.moveTo(basex, basey);
        const a = 2;
        const b = 10;
        const d = b ** a - 1;


        const segments = 10;
        for (let u = 0; u < 1; u += 1/segments) {
          const v = (Math.pow(b, a * u) - 1) / d;
          ctx.lineTo(basex + dx * u, basey + dy * v);
        }

        for (let u = 1; u > 0; u -= 1/segments) {
          const v = (Math.pow(b, a * u) - 1) / d;
          ctx.lineTo(basex + dx * u + topOffsetx, basey + dy * v + gridSize / 3);
        }
        ctx.lineTo(basex, basey);
        ctx.fillStyle = 'hsl(33,28%,72%)';
        ctx.fill();
        ctx.stroke();
      } else {
        //ladder
        //draw edges
        ctx.beginPath();
        ctx.moveTo(fromxy.x + gridSize / 4, fromxy.y + gridSize / 2);
        ctx.lineTo(toxy.x + gridSize / 4, toxy.y + gridSize / 2);
        ctx.moveTo(fromxy.x + gridSize * 0.75, fromxy.y + gridSize / 2);
        ctx.lineTo(toxy.x + gridSize * 0.75, toxy.y + gridSize / 2);
        //draw rungs
        const distx = fromxy.x - toxy.x;
        const disty = fromxy.y - toxy.y;
        const dist = Math.sqrt(distx * distx + disty * disty);
        const rungCount = Math.round(dist / 20);
        const dx = distx / rungCount;
        const dy = disty / rungCount;
        for (let i = 0; i < rungCount; i++) {
          ctx.moveTo(fromxy.x - dx * (i + 0.5) + gridSize / 4, fromxy.y - dy * (i + 0.5) + gridSize / 2);
          ctx.lineTo(fromxy.x - dx * (i + 0.5) + gridSize * 0.75, fromxy.y - dy * (i + 0.5) + gridSize / 2);
        }
        ctx.stroke();
      }
    });
  }

  drawCrucibles(ctx) {
    ctx.save();
    ctx.font = "36px 'Almendra SC'";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const gridSize = 50;
    this.state.crucibles.forEach( c => {
      let xy;
      if (c.state.split`-`[0] === 'move') {
        xy = c.xy;
        const targetxy = this.posToXY(c.targetPos);
        ctx.fillText(this.symbols.alembic, targetxy.x + gridSize / 2, targetxy.y + gridSize / 2);
      } else {
        xy = this.posToXY(c.pos);
      }
      ctx.fillStyle = 'hsl(33,28%,32%)';
      ctx.fillText(this.symbols.crucible, xy.x + gridSize / 2, xy.y + gridSize / 2);
    });
    ctx.restore();
  }

  drawCollectables(ctx) {
    ctx.font = "36px 'Almendra SC'";
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'hsl(33,28%,32%)';
    this.sources.forEach( (s, i) => {
      const xy = this.posToXY(s.pos);
      ctx.textAlign = 'right';
      if (s.type !== 'ps') {
        ctx.fillText(this.symbols[s.type], 35, xy.y + 10);
      } else {
        ctx.drawImage(this.images.pstone, 5, xy.y);
      }
      //ctx.fillText(this.state[s.type], 55, xy.y + 10);
      const value = this.state[s.type];
      ctx.textAlign = 'center';
      ctx.fillText(this.symbols[value], 60, xy.y + 10);
    });
  }

  timeToObj(t) {
    const result = {};

    result.y = Math.floor(t / (365 * 24 * 60 * 60));
    t = t % (365 * 24 * 60 * 60);
    result.d = Math.floor(t / (24 * 60 * 60));
    t = t % (24 * 60 * 60);
    result.h = Math.floor(t / (60 * 60));
    t = t % (60 * 60);
    result.m = Math.floor(t / 60);
    t = t % 60;
    result.s = Math.round(t);

    return result;
  }

  drawProgress(ctx) {
    ctx.save();
    //draw text
    const tr = this.timeToObj((1 - this.state.progress) / this.getProgressRate());
    ctx.font = "32px 'Almendra SC'";
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'hsl(33,28%,32%)';
    ctx.fillText(`Work remaining: ${tr.y.toString().padStart(2, 0)}y ${tr.d.toString().padStart(3, 0)}d ${tr.h.toString().padStart(2, 0)}h ${tr.m.toString().padStart(2, 0)}m ${tr.s.toString().padStart(2, 0)}s`, this.canvas.width / 2, 520);

    //draw progress bar
    const p = this.state.progress;
    const fullWidth = 580;
    const height = 40;
    ctx.fillRect(10, 550, fullWidth, height);
    ctx.fillStyle = 'hsl(33, 28%, 72%)';
    ctx.fillRect(10, 550, p * fullWidth, height);
    ctx.font = "16px 'Almendra SC'";
    if (p > 0.1) {
      ctx.fillStyle = 'hsl(33, 28%, 32%)';
      ctx.fillText(this.symbols.sun, p * fullWidth - 5, 555);
    }
    if (p < 0.9) {
      ctx.fillStyle = 'hsl(33, 28%, 72%)';
      ctx.fillText(this.symbols.moon, p * fullWidth + 22, 555);
    }
    ctx.restore();
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(this.boardBuffer, 0, 0);

    this.drawCrucibles(ctx);

    this.drawCollectables(ctx);

    this.drawProgress(ctx);
  }

  dialogClick() {
    this.state.introShown = true;
    document.getElementById('dialog').style.display = 'none';
  }

  showEnd() {
    if (!this.endShown) {
      const playTime = (this.state.endTime - this.state.startTime) / 1000;
      const to = this.timeToObj(playTime);
      const playTimeStr = `${to.y.toString().padStart(2, 0)}y ${to.d.toString().padStart(3, 0)}d ${to.h.toString().padStart(2, 0)}h ${to.m.toString().padStart(2, 0)}m ${to.s.toString().padStart(2, 0)}s`;
      
      document.getElementById('dialogtxt').innerHTML = `
      Congratulations!<br><br> This is delicious!...I mean you've saved
      the world!
      <br><br>
      You took ${playTimeStr} though I could have done it much faster..
      <br><br>
      <button id='buttonDialog' onclick='app.reset()'>Reset</button>
      `;
      document.getElementById('dialog').style.display = 'flex';
      this.endShown = true;
    }
  }

  resetClick() {
    this.resetClicks = this.resetClicks + 1;
    const clicksLeft = 3 - this.resetClicks;
    document.getElementById('buttonReset').innerText = `Reset in ${clicksLeft} clicks`;
    if (clicksLeft <= 0) {
      this.reset();
    }

    setTimeout(() => this.resetReset(), 5000);
  }

  resetReset() {
    this.resetClicks = 0;
    document.getElementById('buttonReset').innerText = `Reset`;
  }
}

const app = new App();
