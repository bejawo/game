var maxStep = 0.05;

var playerXSpeed = 7;
var gravity = 30;
var jumpSpeed = 17;

var arrowCodes = {37: "left", 38: "up", 39: "right"};
var arrows = trackKeys(arrowCodes);

var levelPlan = [[
    "xxxxxxxxxx",
    "          ",
    "          ",
    "          ",
    "          ",
    "        xx",
    "         x",
    "         x",
    "x  @  x  x",
    "xxxxxxxxxx"
]];

var GAME_LEVELS = levelPlan;

var actorChars = {
    "@": Player
};


function Level(plan) {
    this.width = plan[0].length;
    this.height = plan.length;
    this.grid = [];
    this.actors = [];

    for (var y = 0; y < this.height; y++) {
        var line = plan[y];
        var gridLine = [];
        for (var x = 0; x < this.width; x++) {
            var ch = line[x];
            var fieldType = null;
            var Actor = actorChars[ch];
            if (Actor)
                this.actors.push(new Actor(new Vector(x, y), ch));
            else if (ch == "x")
                fieldType = "wall";
            gridLine.push(fieldType);
        }
        this.grid.push(gridLine);
    }

    this.player = this.actors.filter(function(actor) {
        return actor.type == "player";
    })[0];
}

Level.prototype.isFinished = function() {
    return this.status != null && this.finishDelay < 0;
};

Level.prototype.obstacleAt = function(pos, size) {
    var xStart = Math.floor(pos.x);
    var xEnd = Math.ceil(pos.x + size.x);
    var yStart = Math.floor(pos.y);
    var yEnd = Math.ceil(pos.y + size.y);

    if (xStart < 0 || xEnd > this.width || yStart < 0)
        return "wall"; // keep player inside level
    if (yEnd > this.height)
        return "lava"; // kill player if they fall through floor
    for (var y = yStart; y < yEnd; y++) {
        for (var x = xStart; x < xEnd; x++) {
             var fieldType = this.grid[y][x];
            if (fieldType) return fieldType;
        }
    }
};

Level.prototype.actorAt = function(actor) {
    for (var i = 0; i< this.actors.length; i++) {
        var other = this.actors[i];
        if (other != actor &&
            actor.pos.x + actorChars.size.x > other.pos.x &&
            actor.pos.x < other.pos.x + other.size.x &&
            actor.pos.y + actorChars.size.y > other.pos.y &&
            actor.pos.y < other.pos.y + other.size.y)
            return other;
    }
};

Level.prototype.animate = function(step, keys) {
    if (this.animate != null)
        this.finishDelay -= step;

    while (step > 0) {
        var thisStep = Math.min(step, maxStep);
        this.actors.forEach(function(actor) {
            actor.act(thisStep, this, keys);
        }, this);
        step -= thisStep;
    }
};

Level.prototype.playerTouched = function(type, actor) {
    if (type == "lava" && this.status == null) {
        this.status = "lost";
        this.finishDelay = 1;
    } else if (type == "coin") {
        this.actors = this.actors.filter(function(other) {
            return other != actor;
        });
        if (!this.actors.some(function(actor) {
            return actor.type == "coin";
        })) {
            this.status = "won";
            this.finishDelay = 1;
        }
    }
};


function Vector(x, y) {
    this.x = x;
    this.y = y;
}
Vector.prototype.plus = function(other) {
    return new Vector(this.x + other.x, this.y + other.y);
};
Vector.prototype.times = function(factor) {
    return new Vector(this.x * factor.x, this.y * factor.y);
};

function Player(pos) {
    this.pos = pos.plus(new Vector(0, -0.5));
    this.size = new Vector(0.8, 1.5);
    this.speed = new Vector(0, 0);
}
Player.prototype.type = "player";

Player.prototype.moveX = function(step, level, keys) {
    this.speed.x = 0;
    if (keys.left) this.speed.x -= playerXSpeed;
    if (keys.right) this.speed.x += playerXSpeed;

    var motion = new Vector(this.speed.x * step, 0);
    var newPos = this.pos.plus(motion);
    var obstacle = level.obstacleAt(newPos, this.size);
    if (obstacle)
        level.playerTouched(obstacle);
    else
        this.pos = newPos;
};

Player.prototype.moveY = function(step, level, keys) {
    this.speed.y += step * gravity;
    var motion = new Vector(0, this.speed.y * step);
    var newPos = this.pos.plus(motion);
    var obstacle = level.obstacleAt(newPos, this.size);
    if (obstacle) {
        level.playerTouched(obstacle);
        if (keys.up && this.speed.y > 0)
            this.speed.y = -jumpSpeed;
        else
            this.speed.y = 0;
    } else {
        this.pos = newPos;
    }
};

Player.prototype.act = function(step, level, keys) {
    this.moveX(step, level, keys);
    this.moveY(step, level, keys);

    var otherActor = level.actorAt(this);
    if (otherActor)
        level.playerTouched(otherActor.type, otherActor);

    // Losing animation
    if (level.status == "lost") {
        this.pos.y += step;
        this.size.y -= step;
    }
};


function trackKeys(codes) {
    var pressed = Object.create(null);
    function handler(event) {
        if (codes.hasOwnProperty(event.keyCode)) {
            var down = event.type == "keydown";
            pressed[codes[event.keyCode]] = down;
            event.preventDefault();
        }
    }
    addEventListener("keydown", handler);
    addEventListener("keyup", handler);
    return pressed;
}

function runAnimation(frameFunc) {
    var lastTime = null;
    function frame(time) {
        var stop = false;
        if (lastTime != null) {
            var timeStep = Math.min(time - lastTime, 100) / 1000;
            stop = frameFunc(timeStep) === false;
        }
        lastTime = time;
        if (!stop)
            requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

function runLevel(level, Display, andThen) {
    var display = new Display(document.body, level);
    runAnimation(function(step) {
        level.animate(step, arrows);
        display.drawFrame(step);
        if (level.isFinished()) {
            display.clear();
            if (andThen)
                andThen(level.status);
            return false;
        }
    });
}

function runGame(plans, Display) {
    function startLevel(n) {
        runLevel(new Level(plans[n]), Display, function(status) {
            if (status == "lost")
                startLevel(n);
            else if (n < plans.length - 1)
                startLevel(n + 1);
            else
                console.log("You win!");
        });
    }
    startLevel(0);
}

var simpleLevel = new Level(levelPlan);



/**
 * Display stuff
 */

var scale = 20;
//var playerXOverlap = 4;

function CanvasDisplay(parent, level) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = Math.min(600, level.width * scale);
    this.canvas.height = Math.min(450, level.height * scale);
    parent.appendChild(this.canvas);
    this.cx = this.canvas.getContext("2d");

    this.level = level;

    // viewport

    this.drawFrame();
}

CanvasDisplay.prototype.drawFrame = function() {
    // this.updateViewport();
    this.clearDisplay();
    this.drawBackground();
    this.drawActors();
};

CanvasDisplay.prototype.clearDisplay = function() {
    this.cx.fillStyle = "#ccc";
    this.cx.fillRect(0, 0, this.canvas.width, this.canvas.height);
};

CanvasDisplay.prototype.drawBackground = function() {
    var xStart = 0;
    var xEnd = this.level.width; // viewport
    var yStart = 0;
    var yEnd = this.level.height; // viewport
    for (var y = yStart; y < yEnd; y++) {
        for (var x = xStart; x < xEnd; x++) {
            var tile = this.level.grid[y][x];
            if (tile == null) continue;
            var screenX = x * scale; // viewport
            var screenY = y * scale; // viewport
            //var tileX = tile == "lava" ? scale : 0;
            switch (tile) {
                case "wall":
                    this.cx.fillStyle = "#ddd";
                    break;
                default:
                this.cx.fillStyle = "#6bf442";
            }
            this.cx.fillRect(screenX, screenY, scale, scale);
        }
    }
};

CanvasDisplay.prototype.drawPlayer = function(x, y, width, height) {
    var player = this.level.player;
    //width += playerXOverlap * 2;
    //x -= playerXOverlap;
    //if (player.speed.x != 0)
        // flip player
    this.cx.fillRect(x, y, width, height);
};

CanvasDisplay.prototype.drawActors = function() {
    this.level.actors.forEach(function(actor) {
        var width = actor.size.x * scale;
        var height = actor.size.y * scale;
        var x = actor.pos.x * scale; // viewport
        var y = actor.pos.y * scale; // viewport
        if (actor.type == "player") {
            this.drawPlayer(x, y, width, height);
        } else {
            this.cx.fillStyle = "#666"; // lava or coin
            this.drawRect(x, y, width, height);
        }
    }, this);
};



runGame(GAME_LEVELS, CanvasDisplay);