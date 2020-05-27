let {
  init,
  initKeys,
  keyPressed,
  Sprite,
  Pool,
  initPointer,
  onPointerDown,
  pointer,
  GameLoop,
} = kontra;

let { canvas, context } = init();
initKeys();
initPointer();

let turnCounter = 'p1';

let player1 = new Sprite({
  x: 100, // starting x,y position of the sprite
  y: 20,
	color: "red", // fill color of the sprite rectangle
	playerKey: "p1",
  width: 20, // width and height of the sprite rectangle
  height: 20,
  moveSpeed: 2,
  stamina: 100,
  anchor: { x: 0.5, y: 0.5 },
});

let player2 = new Sprite({
  x: 100, // starting x,y position of the sprite
  y: canvas.height - 20,
	color: "blue", // fill color of the sprite rectangle
	playerKey: "p2",
  width: 20, // width and height of the sprite rectangle
  height: 20,
  moveSpeed: 2,
  stamina: 100,
  anchor: { x: 0.5, y: 0.5 },
});

const bulletPool = Pool({
  create: Sprite,
  size: 1,
  maxSize: 5000, //Adjust this to set the number of pooled players on the screen at once.
});

let loop = GameLoop({
  // create the main game loop
  update: function () {
    // update the game state
    player1.update();
		player2.update();
		if(turnCounter === "p1"){
			movePlayer(player1);
			playerSwitcher(player1, player2);
			onPointerDown(() => {
				shoot(player1, pointer);
			});
		} else {
			movePlayer(player2);
			playerSwitcher(player2, player1);
			onPointerDown(() => {
				shoot(player2, pointer);
			});
		}

    
    // console.log(pointer)
		bulletPool.update();
		
		if(keyPressed("r")){
			restartGame();
		}
  },
  render: function () {
    // render the game state
    player1.render();
    textMaker(
      context,
      player1.x - player1.width /2,
      player1.y - player1.height + 4,
      player1.stamina,
      10
    );
    bulletPool.render();
		player2.render();
		textMaker(
      context,
      player2.x - player2.width /2,
      player2.y - player2.height + 4,
      player2.stamina,
      10
    );
  },
});

const movePlayer = (player) => {
  let playerHorizontal = keyPressed("d") - keyPressed("a");
  let playerVertical = keyPressed("s") - keyPressed("w");

  if ((playerHorizontal || playerVertical) && player.stamina > 0) {
    drainStamina(2, player);
  }

  player.dx = player.stamina > 0 ? playerHorizontal * player.moveSpeed : 0;
  player.dy = player.stamina > 0 ? playerVertical * player.moveSpeed : 0;
};

const shoot = (player, cursor) => {
  if (player.stamina < 1) return;
  drainStamina(16, player);

  let betweenDistance = Between(player.x, player.y, cursor.x, cursor.y);

  let bulletX = Math.sin(betweenDistance);
  let bulletY = -Math.cos(betweenDistance);

  let aimVector = { x: bulletX, y: bulletY };

  bulletPool.get({
    x: player.x,
    y: player.y,
    color: "green",
    width: 5,
    anchor: { x: 0.5, y: 0.5 },
    height: 5,
    ttl: Infinity,
    dx: aimVector.x * 5,
    dy: aimVector.y * 5,
  });
};

const Between = (x1, y1, x2, y2) => {
  //Get the arc tangent of two objects and rotate it 90 degrees in radians.
  return Math.atan2(y2 - y1, x2 - x1) + 1.5708;
};

//Control how much stamina they have before they have to stop moving and switch turns
const drainStamina = (drainAmount, player) => {
	player.stamina -= drainAmount / 2;
	if(player.stamina < 0){
		player.stamina = 0;
	}
};

const textMaker = (context, x, y, text, size) => {
  if (!size) {
    size = 10;
  }
  context.fillStyle = "white";
  context.font = `${size}px Courier New`;
  context.fillText(text, x, y);
};

const restartGame = () => {
	player1 = new Sprite({
		x: 100, // starting x,y position of the sprite
		y: 20,
		color: "red", // fill color of the sprite rectangle
		width: 20, // width and height of the sprite rectangle
		height: 20,
		moveSpeed: 2,
		stamina: 100,
		anchor: { x: 0.5, y: 0.5 },
	});

	player2 = new Sprite({
		x: 100, // starting x,y position of the sprite
		y: canvas.height - 20,
		color: "blue", // fill color of the sprite rectangle
		width: 20, // width and height of the sprite rectangle
		height: 20,
		moveSpeed: 10,
		stamina: 100,
		anchor: { x: 0.5, y: 0.5 },
	});
}

const playerSwitcher = (player, otherPlayer) => {
	if(player.stamina < 1){
		otherPlayer.stamina = 100;
		turnCounter = otherPlayer.playerKey;
	}
}

loop.start(); // start the game
