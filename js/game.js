// Anderson Ferminiano
// 25th June 2011
// contato@andersonferminiano.com -- feel free to contact me for help :)
// www.andersonferminiano.com


var paddleVel = 100;
var paddleWidth = 50;
var paddleHeight = 10;
var ballRadius = 7;
var nbricks = new b2Vec2(5,5);
var bricks = new Array(nbricks.y);
var nlives = 3;
var lives;
var score;
var initId = 0;
var victoryCount;
var player;
var ball;
var world = createWorld();
var ctx;
var canvasWidth;
var canvasHeight;
var canvasTop;
var canvasLeft;
var keys = [];
var destroyQueue = [];


function step() {
	var gameOverText;
	if (ball.GetCenterPosition().y > canvasHeight - ballRadius){
		if (--lives == 0) {
			gameOverText = 'You lose.';
		}
		else {
			var vec = new b2Vec2(canvasWidth/2,.8*canvasHeight);
			ball.SetCenterPosition(vec,0);
			vec.y = canvasHeight - paddleHeight - 1;
			player.SetCenterPosition(vec,0);
			vec.x = 0;
			vec.y = 0;
			ball.SetLinearVelocity(vec);
		}
	}
	else if (world.m_bodyCount == victoryCount){
		gameOverText = 'You win!';
	}



	handleInteractions();

	var stepping = false;
	var timeStep = 1.0/60;
	var iteration = 1;
	world.Step(timeStep, iteration);
	ctx.clearRect(0, 0, canvasWidth, canvasHeight);
	drawWorld(world, ctx);
	ctx.font = '12px verdana';
	ctx.textAlign = 'left';
	ctx.fillText('Lives: ' + lives, 3, 15);
	ctx.font = '72px verdana';
	ctx.textAlign = 'center';
	ctx.strokeText(score, canvasWidth/2, canvasHeight*2/3);
	if (gameOverText) {
		ctx.font = '32px verdana';
		ctx.textAlign = 'center';
		ctx.strokeText(gameOverText, canvasWidth/2, canvasHeight/2);
	}
	else {
		setTimeout('step()', 10);
	}
}

function showWin(){
	ctx.fillStyle    = '#000';
	ctx.font         = '30px verdana';
	ctx.textBaseline = 'top';
	ctx.fillText('Ye! you made it!', 30, 0);
	ctx.fillText('thank you, andersonferminiano.com', 30, 30);
	ctx.fillText('@andferminiano', 30, 60);
}

function handleInteractions(){

	// handle collisions
	var collision = world.m_contactList;
	if (collision != null && (collision.GetShape1().GetUserData() == 'ball' || collision.GetShape2().GetUserData() == 'ball')){
		if (collision.GetShape1().GetUserData() != 'side' && collision.GetShape2().GetUserData() != 'side'){
			var collisionObj = (collision.GetShape2().GetUserData() == 'ball' ? collision.GetShape1() :  collision.GetShape2());
			if (collisionObj.GetUserData() == 'player') {
				var vel = ball.GetLinearVelocity();
				vel.x = -paddleVel * Math.sin((collisionObj.GetPosition().x-ball.GetCenterPosition().x)/paddleWidth);
			}
			else if (destroyQueue.indexOf(bricks[collisionObj.GetUserData().y][collisionObj.GetUserData().x]) == -1) {
				destroyQueue.push(bricks[collisionObj.GetUserData().y][collisionObj.GetUserData().x]);
			}
		}
	}
	// delete boxes
	else {
		for (var i = 0; i < destroyQueue.length; i++) {
			var brick = destroyQueue.pop();
			score += nbricks.y - brick.GetShapeList().GetUserData().y;
			world.DestroyBody(brick);
		}
	}

	// left/right arrows
	var vel = player.GetLinearVelocity();
	if (keys[37]){
		vel.x = -paddleVel;
	}
	else if (keys[39]){
		vel.x = paddleVel;
	}
	else {
		vel.x = 0;
	}
	vel.y=0;
	player.SetLinearVelocity(vel);

	// start motion
	vel = ball.GetLinearVelocity();
	if (vel.y == 0 && keys[32]){
		vel.y=2*paddleVel;
		ball.SetLinearVelocity(vel);
	}
	// add in general relativity...
	else if(vel.y != 0) {
		ball.ApplyForce(new b2Vec2(0, -1138), ball.GetCenterPosition());
		ball.ApplyForce(new b2Vec2(0, 10*vel.y/Math.abs(vel.y)), ball.GetCenterPosition());
	}
}


function initGame(){

	// create side boundaries
	createBox(world, 0, 0, 1, canvasHeight, true, 'side');
	createBox(world, canvasWidth-1, 0, 1, canvasHeight, true, 'side');
	createBox(world, 0, 0, canvasWidth, 1, true, 'side'); //top


	// create ball
	var ballSd = new b2CircleDef();
	ballSd.density = 0.1;
	ballSd.radius = ballRadius;
	ballSd.restitution = 1;
	ballSd.friction = 0;
	ballSd.userData = 'ball';
	var ballBd = new b2BodyDef();
	ballBd.linearDamping = 0;
	ballBd.allowSleep = false;
	ballBd.AddShape(ballSd);
	ballBd.position.Set(canvasWidth/2,.8*canvasHeight);
	ball = world.CreateBody(ballBd);


	// create player
	var paddleSd = new b2BoxDef();
	paddleSd.density = 1;
	paddleSd.extents.Set(paddleWidth,paddleHeight);
	paddleSd.restitution = 1;
	paddleSd.friction = 0;
	paddleSd.userData = 'player';
	var paddleBd = new b2BodyDef();
	paddleBd.linearDamping = 0;
	paddleBd.allowSleep = false;
	paddleBd.preventRotation = 1;
	paddleBd.AddShape(paddleSd);
	paddleBd.position.Set(canvasWidth/2, canvasHeight - paddleHeight - 1);
	player = world.CreateBody(paddleBd);

	victoryCount = world.m_bodyCount;
	lives = nlives;
	score = 0;


	// create bricks
	for (var m = 0; m<nbricks.y; m++) {
		bricks[m] = new Array(nbricks.x);
		for (var n = 0; n<nbricks.x; n++) {
			var brickSd = new b2BoxDef();
			brickSd.density = 0;
			brickSd.extents.Set(canvasWidth/nbricks.x/2 - 3,paddleHeight);
			brickSd.restitution = 1;
			brickSd.friction = 0;
			brickSd.userData = new b2Vec2(n,m);
			var brickBd = new b2BodyDef();
			brickBd.linearDamping = 0;
			brickBd.allowSleep = false;
			brickBd.preventRotation = 1;
			brickBd.AddShape(brickSd);
			brickBd.position.Set((n+.5)*canvasWidth/nbricks.x, (m+3)*canvasHeight/nbricks.y/5);
			bricks[m][n] = (world.CreateBody(brickBd));
		}
	}

}

function handleKeyDown(evt){
	keys[evt.keyCode] = true;
	handleReset(evt);
}


function handleKeyUp(evt){
	keys[evt.keyCode] = false;
}

function handleReset(evt) {
	if ((lives == 0 || world.m_bodyCount == victoryCount) && evt.keyCode == 32) {
		keys[evt.keyCode] = false;
		world = createWorld();
		initGame();
		step();
	}
}

Event.observe(window, 'load', function() {
	world = createWorld();
	ctx = $('game').getContext('2d');
	var canvasElm = $('game');
	canvasWidth = parseInt(canvasElm.width);
	canvasHeight = parseInt(canvasElm.height);
	canvasTop = parseInt(canvasElm.style.top);
	canvasLeft = parseInt(canvasElm.style.left);
	initGame();
	step();

	window.addEventListener('keydown',handleKeyDown,true);
	window.addEventListener('keyup',handleKeyUp,true);
});


// disable vertical scrolling from arrows :)
document.onkeydown=function(){return event.keyCode!=38 && event.keyCode!=40}
