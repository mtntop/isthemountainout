var Game = {
    display: null,
    thingMap: null,
    things: [],
    engine: null,
    player: null,
    ticker: null,
    scheduler: null,
    width: 21,
    height: 15,
    nextId: 0,
    score: 0,
    
    init: function() {
        this.display = new ROT.Display({width: this.width, height: this.height});
        document.body.appendChild(this.display.getContainer());

        this.thingDistribution = {
            '~': 25,
            '*': 25,
            '⚶': 20,
            '⛏': 1,
            '⛇': 2,
            '⛆': 15,
            '⛟': 1,
        }

        this.thingColors = {
            '~': '#fff',
            '*': '#fff',
            '⚶': '#1b6',
            '⛏': '#777',
            '⛇': '#fff',
            '⛆': '#53f',
            '⛟': '#b73'
        }

        this.player = new Player(10, 2);

        for(var i = 0; i < 3; i++)
        {
            var start = 7*i;
            var x = Math.floor(start + (ROT.RNG.getUniform() * 7));
            var y = Math.floor(15 - (ROT.RNG.getUniform() * 5));
            var key = ROT.RNG.getWeightedValue(this.thingDistribution)
            this.generateThing(x, y, key, this.thingColors[key]);
        }

        this.ticker = new Ticker();

        this.scheduler = new ROT.Scheduler.Simple();
        this.scheduler.add(this.ticker, true);

        this.engine = new ROT.Engine(this.scheduler);
        Game.display.drawText(8, 0, "%c{white}Ready?");
        setTimeout(this._countdown, 500);
    },

    generateThing: function(x, y, sym, color) {
        this.things.push(new Thing(x, y, sym, color, this.nextId));
        this.nextId++;
    },

    countdown: 3,
    _countdown: function() {
        Game.display.drawText(8, 0, "%c{black}%b{black}███████");
        Game.display.draw(10, 0, Game.countdown, "#fff");
        if(Game.countdown > 0)
        {
            setTimeout(Game._countdown, 500);
            Game.countdown--;
            return;
        }
        Game.engine.start();
    }
};

// THING BASE CLASS
var Thing = function(x, y, sym, color, id) {
    this._x = x;
    this._y = y;
    this._sym = sym;
    this._color = color;
    this._id = id;

    this._draw();
}

Thing.prototype._update = function() {
    var newY = this._y - 1;
    if(newY >= 0) {
        this._y = newY;
        this._draw();
    }
    else {
        this._y = -10;
        Game.things[this._id] = undefined;
        Game.nextId--;
        Game.score++;
    }

    if(this._y == Game.player._y && this._x == Game.player._x) {
        Game.ticker.playerHit = true;
    }
}

Thing.prototype._draw = function() {
    Game.display.draw(this._x, this._y, this._sym, this._color);
}

// PLAYER CLASS
var Player = function(x, y) {
    this._x = x;
    this._y = y;

    this._draw();
}

Player.prototype.hit = function() {
    this._y--;
    this._draw();
    if(this._y < 0) {
        Game.engine.lock();
        Game.display.drawText(4, 1, "%c{#ff0}%b{black}Knocked Out!");
        setTimeout(Game.ticker.restart, 3000);
    }
    else {
        Game.engine.lock();
        setTimeout(Game.ticker.unlock, 500);
    }
}

Player.prototype._update = function(dir) {
    var newX = this._x + dir[0];
    var newY = this._y + dir[1];
    if (newX >= Game.width || newX < 0) { // if oob return
        return;
    }

    this._x = newX;
    this._y = newY;
    this._draw();
}

Player.prototype._draw = function() {
    Game.display.draw(this._x, this._y, "⚲", "#ff0");
}

var Ticker = function() {
    this._keyMap = {}; //left, right, a, d
    this._keyMap[37] = 6;
    this._keyMap[39] = 2;
    this._keyMap[65] = 6;
    this._keyMap[68] = 2;
    this._totalNew = 0;
    this._dir = null;
    this.playerHit = false;
    this._newMult = 2;

    window.addEventListener("keydown", this);
}

Ticker.prototype.handleEvent = function(e) {
    var code = e.keyCode;
    if (!(code in this._keyMap)) {
        return;
    }
    this._dir = ROT.DIRS[8][this._keyMap[code]];
}

Ticker.prototype.act = function() {
    Game.engine.lock();
    Game.display.clear();
    //check for input
    if(this._dir != null)
    {
        Game.player._update(this._dir);
        this._dir = null;
    }
    else { // just draw the player
        Game.player._draw();
    }

    //update everything else
    for (var i = 0; i < Game.things.length; i++)
    {
        if (Game.things[i] != undefined) //because they can remove themselves
        {
            Game.things[i]._update();
        }
    }

    if(this.playerHit) {
        Game.player.hit();
        this.playerHit = false;
    }
    
    this._totalNew = Math.floor(ROT.RNG.getUniform() * this._newMult);
    for(var i = 0; i < this._totalNew; i++)
    {
        var x = Math.floor(ROT.RNG.getUniform() * Game.width);
        var y = Math.floor(15);
        var key = ROT.RNG.getWeightedValue(Game.thingDistribution);
        Game.generateThing(x, y, key, Game.thingColors[key]);
    }
    this._totalNew = 0;

    if(Game.score >= 3000) {
        this._newMult = (''+Game.score).slice(0, -3);
        console.log(this._newMult);
    }
    
    Game.display.drawText(0, 0, "%c{#ff0}%b{black}"+Game.score);

    setTimeout(this.unlock, 200);
}

Ticker.prototype.unlock = function() { Game.engine.unlock(); }
Ticker.prototype.restart = function() { window.location.reload(); }