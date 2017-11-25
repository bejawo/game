var scale = 40;
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

CanvasDisplay.prototype.clear = function() {
    this.canvas.parentNode.removeChild(this.canvas);
};

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
    //var player = this.level.player;
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