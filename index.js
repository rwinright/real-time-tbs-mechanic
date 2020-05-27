let {
  init,
  initKeys,
  keyPressed,
  Sprite,
  Pool,
  initPointer,
  onPointerDown,
  pointerOver,
  pointerPressed,
  pointer,
  track,
  GameLoop,
} = kontra;

let { canvas, context } = init();
initKeys();
initPointer();

let activeSquad = 1;
let activePlayer = 1;

let startTurn = false;
let winText = "";

const swapTurnButton = Sprite({
  x: canvas.width / 2 - 35,
  y: canvas.height / 2 - 15,
  height: 30,
  width: 70,
  color: "green",
});

// let player1 = new Sprite({
//   x: canvas.width / 2 - 10, // starting x,y position of the sprite
//   y: 20,
//   health: 20,
//   color: "red", // fill color of the sprite rectangle
//   playerKey: "p1",
//   width: 20, // width and height of the sprite rectangle
//   height: 20,
//   moveSpeed: 2,
//   stamina: 100,
//   anchor: { x: 0.5, y: 0.5 },
// });

// let player2 = new Sprite({
//   x: canvas.width / 2 - 10, // starting x,y position of the sprite
//   y: canvas.height - 20,
//   health: 20,
//   color: "blue", // fill color of the sprite rectangle
//   playerKey: "p2",
//   width: 20, // width and height of the sprite rectangle
//   height: 20,
//   moveSpeed: 2,
//   stamina: 100,
//   anchor: { x: 0.5, y: 0.5 },
// });

let squads = [
  {
    squadName: 1,
    players: [],
  },
  {
    squadName: 2,
    players: [],
  },
];

const buildTeams = (squads) => {
  squads.forEach((squad) => {
    for (let j = 0; j < 3; j++) {
      let player = new Sprite({
        x: (canvas.width / 2 - 10) * j * 0.33, // starting x,y position of the sprite
        y: squad.squadName === 1 ? 20 : canvas.height - 20,
        health: 20,
        color: squad.squadName === 1 ? "blue" : "red", // fill color of the sprite rectangle
				playerKey: j + 1,
				team: squad.squadName,
        width: 20, // width and height of the sprite rectangle
        height: 20,
        moveSpeed: 2,
        stamina: 100,
        anchor: { x: 0.5, y: 0.5 },
      });
      squad.players.push(player);
    }
  });
};

buildTeams(squads);

console.log(squads);

const bulletPool = Pool({
  create: Sprite,
  size: 1,
  maxSize: 5000, //Adjust this to set the number of pooled bullets on the screen at once.
});

let loop = GameLoop({
  // create the main game loop
  update: function () {
    // update the game state

    // playerUpdater(player1);
    // playerUpdater(player2);

    squads.forEach((squad) => {
			squad.players.forEach((player) => {
				playerUpdater(player);
				bulletCollision(player);
			});
      if (startTurn) {
        if (activeSquad === squad.squadName) {
          squad.players.forEach((player) => {
            if (activePlayer === player.playerKey) {
              movePlayer(player);
              playerSwitcher(player);
              onPointerDown(() => {
                shoot(player, pointer);
							});
						}
          });
				}
      } else {
        track(swapTurnButton);
				// checkWin();
				replenishStamina(squad);
        if (pointerPressed("left") && pointerOver(swapTurnButton)) {
          startTurn = true;
        }
      }
    });

    //Create number of teams (2)
    //Create all players in array. (3 per side)
    //Manage which team moves their players
    //Switch player turns on team
    //When all players have gone, switch entire team.

    // if (startTurn) {
    //   if (activeSquad === 1) {
    //     movePlayer(player1);
    //     squadSwitcher(player1, player2);
    //     onPointerDown(() => {
    //       shoot(player1, pointer);
    //     });
    //     bulletCollision(player2);
    //   } else {
    //     movePlayer(player2);
    //     squadSwitcher(player2, player1);
    //     onPointerDown(() => {
    //       shoot(player2, pointer);
    //     });
    //     bulletCollision(player1);
    //   }
    // } else {
    //   track(swapTurnButton);
    //   checkWin([player1, player2]);
    //   if (pointerPressed("left") && pointerOver(swapTurnButton)) {
    //     startTurn = true;
    //   }
    // }

    bulletPool.update();
  },
  render: function () {
    // render the game state
    bulletPool.render();

    squads.forEach((squad) => {
      squad.players.forEach((player) => playerRenderer(player));
    });

    if (winText) {
    }

    //Swap turn button
    if (!startTurn && !winText) {
      swapTurnButton.render();
      textMaker(
        context,
        swapTurnButton.x + 4,
        swapTurnButton.y + swapTurnButton.height / 2 + 2,
        `START T${activeSquad} TURN`,
        8
      );
    } else {
      textMaker(
        context,
        canvas.width / 2 - winText.length * 5,
        canvas.height / 2,
        winText,
        20,
        winText.includes("p1") ? "red" : "blue"
      );
    }
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
  if (player.stamina < 1 || player.health < 1 || !startTurn) return;
  drainStamina(16, player);

  let betweenDistance = Between(player.x, player.y, cursor.x, cursor.y);

  let bulletX = Math.sin(betweenDistance);
  let bulletY = -Math.cos(betweenDistance);

  let aimVector = { x: bulletX, y: bulletY };

  bulletPool.get({
    x: player.x,
    y: player.y,
    color: "green",
    damage: 5,
		width: 5,
		team: player.team,
    anchor: { x: 0.5, y: 0.5 },
    height: 5,
    ttl: Infinity,
    dx: aimVector.x * 5,
    dy: aimVector.y * 5,
  });
};

const Between = (x1, y1, x2, y2) => {
  //Get the arc tangent of two objects and rotate it 90 degrees clock-wise in radians.
  //The 90 degree turn is due to the location of where 0,0 lies in the top-right corner.
  return Math.atan2(y2 - y1, x2 - x1) + 1.5708;
};

//Control how much stamina they have before they have to stop moving and switch turns
const drainStamina = (drainAmount, player) => {
  player.stamina -= drainAmount / 2;
  if (player.stamina < 0) {
    player.stamina = 0;
  }
};

const replenishStamina = (currSquad) => {
	currSquad.players.forEach(player => {
		player.stamina < 100 ? player.stamina = 100 : null;
	});
}

const textMaker = (context, x, y, text, size, color) => {
  if (!size) {
    size = 10;
  }
  context.fillStyle = color ? color : "white";
  context.font = `${size}px Courier New`;
  context.fillText(text, x, y);
};

const squadSwitcher = () => {
  activeSquad++;
	startTurn = false;
  if (activeSquad > squads.length) {
    activeSquad = 1;
  }
};

const playerSwitcher = (currentPlayer) => {
  if (currentPlayer.stamina < 1) {
    activePlayer = currentPlayer.playerKey + 1;
  }

  if (activePlayer > 3) {
    squadSwitcher();
    activePlayer = 1;
  }
};

const bulletCollision = (player) => {
  let bullets = bulletPool.getAliveObjects();
  bullets.forEach((b) => {
		if(player.team !== b.team){
			if (b.collidesWith(player)) {
				//Collide functionality
				b.ttl = 0;
				player.health -= b.damage;
			}
		}
  });
};

const checkWin = (players) => {
  activePlayers = players.filter((player) => {
    if (player.health > 0) return player;
  });

  if (activePlayers.length === 1) {
    winText = `${activePlayers[0].playerKey} is the winner`;
    loop.stop();
  }
};

const playerUpdater = (player) => {
  if (player.health > 0) player.update();
};

const playerRenderer = (player) => {
  if (player.health > 0) {
    player.render();
    //Show stamina text
    textMaker(
      context,
      player.x - player.width / 2,
      player.y - player.height + 4,
      player.stamina,
      10
    );
    //show health text
    textMaker(
      context,
      player.x - player.width / 2 + 5,
      player.y + player.height / 2 - 8,
      player.health,
      10,
      "#90FF33"
    );
  }
};

loop.start(); // start the game
