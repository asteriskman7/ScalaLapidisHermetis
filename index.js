"use strict";

/*
TODO:
start collecting items based on landing on things
draw something on the board to indicate the destination of a move
allow method for transmuting items into something tradable
allow method for buying upgrades
after getting the pstone you see a progress bar slowing increasing to
  immortaltiy. you can either wait for immortality or you can prestige
  to get more pstones that will make the progress bar go faster and
  make the whole game go faster
make crucible not have a transparent background
make sliding follow the curve of the slide
make sure that reloading will work no matter the saved crucible state (maybe force
  all crucibles to their destination location plus change state to roll on load?)
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
      alembic: '\u2697'
    };

    //init board items
    this.sources = [
      {gtype: 'source', type: 'mercury', pos: 10},
      {gtype: 'source', type: 'salt', pos: 20},
      {gtype: 'source', type: 'sulfur', pos: 30},
      {gtype: 'source', type: 'air', pos: 40},
      {gtype: 'source', type: 'earth', pos: 50},
      {gtype: 'source', type: 'fire', pos: 60},
      {gtype: 'source', type: 'water', pos: 70},
      {gtype: 'source', type: 'lead', pos: 80},
      {gtype: 'source', type: 'tin', pos: 90},
      {gtype: 'source', type: 'ps', pos: 100}
    ];

    this.paths = [
      {gtype: 'path', active: true, from: 3, to: 24},
      {gtype: 'path', active: true, from: 76, to: 46},
      {gtype: 'path', active: true, from: 77, to: 22},
      {gtype: 'path', active: true, from: 26, to: 2}
    ];

    this.updateGridMap();

    this.loadFromStorage();

    this.drawBoard(this.boardctx);

    setInterval(() => this.tick(), 1000/60);
    setInterval(() => this.saveToStorage(), 5000);

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
      maxMove: 1,
      moveSpeed: 1,
      t: 0
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

  updateGridMap() {
    this.gridMap = {};

    this.paths.forEach( p => {
      this.gridMap[p.from] = p;
    });

    this.sources.forEach( s => {
      this.gridMap[s.pos] = s;
    });
  }

  tick() {
    this.update();
    this.draw();
  }

  update() { 
    this.state.t += 1 / 60;
    //let newPos = this.players[0].pos + 1;
    //if (newPos > 100) {newPos = 1;}
    //this.players[0].pos = newPos;
    //let newPos = this.paths[0].to + 1;
    //if (newPos > 100) {newPos = 20;}
    //this.paths[0].to = newPos;
    //let newPos = this.paths[1].to + 1;
    //if (newPos > 70) {
    //  newPos = 1;
    //}
    //this.paths[1].to = newPos;

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
          if (gridItem !== undefined && gridItem.gtype === 'path') {
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
      } else {
        xy = this.posToXY(c.pos);
      }
      ctx.fillText(this.symbols.crucible, xy.x + gridSize / 2, xy.y + gridSize / 2);
    });
    ctx.restore();
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(this.boardBuffer, 0, 0);

    //draw crucibles
    this.drawCrucibles(ctx);

    //draw ui
  }
}

const app = new App();
