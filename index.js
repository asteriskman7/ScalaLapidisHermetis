"use strict";

/*
TODO:
get player states stored in global state
get item collection locations on board
get shoots and ladders on board
start players moving on board random amounds
start collecting items based on landing on things
allow method for transmuting items into something tradable
allow method for buying upgrades
improve page title visuals
style the "players" as humunculi
*/

class App {
  constructor() {
    this.boardColors = ['hsl(33,28%,82%)', 'hsl(33,28%,72%)'];
    this.canvas = document.getElementById('cmain');
    this.ctx = this.canvas.getContext('2d');
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
      {type: 'mercury', pos: 10},
      {type: 'salt', pos: 20},
      {type: 'sulfur', pos: 30},
      {type: 'air', pos: 40},
      {type: 'earth', pos: 50},
      {type: 'fire', pos: 60},
      {type: 'water', pos: 70},
      {type: 'lead', pos: 80},
      {type: 'tin', pos: 90},
      {type: 'ps', pos: 100}
    ];

    this.loadFromStorage();

    setInterval(() => this.tick(), 1000/4);
    setInterval(() => this.saveToStorage(), 5000);

    //font-family: 'Almendra SC', serif;
  }
 
  loadFromStorage() {
    const rawState = localStorage.getItem('SLH');

    this.state = {
      crucibles: [{pos: 1}]
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

  tick() {
    this.update();
    this.draw();
  }

  update() { 
    //let newPos = this.players[0].pos + 1;
    //if (newPos > 100) {newPos = 1;}
    //this.players[0].pos = newPos;
  
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
    this.sources.forEach( s => {
      const xy = this.posToXY(s.pos);
      if (s.type !== 'ps') {
        ctx.fillText(this.symbols[s.type], xy.x + 25, xy.y + 25);
      } else {
        ctx.drawImage(this.images.pstone, xy.x, xy.y);
      }
    });

    ctx.restore();
  }

  drawCrucibles(ctx) {
    ctx.save();
    ctx.font = "36px 'Almendra SC'";
    this.state.crucibles.forEach( p => {
      const xy = this.posToXY(p.pos);
      ctx.textBaseline = 'top';
      ctx.fillText(this.symbols.crucible, xy.x, xy.y);
    });
    ctx.restore();
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    //draw board
    this.drawBoard(ctx);

    //items on board

    //draw crucibles
    this.drawCrucibles(ctx);

    //draw ui
  }
}

const app = new App();
