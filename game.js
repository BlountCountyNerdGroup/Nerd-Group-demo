var health = 1500;
var damagePerBomb = 10;

// if you go above 100, it will lag heavily
var numOfEnemies = 1000; 

// caption at top of screen
var caption1 = 'Health: ';

// caption below caption1
var caption2 = 'Survived: ';

// change to any number between 0.9 and 1
var drag = 0.95;

// bombs have a random speed between these 2 numbers
var bombLowSpeed = 100;
var bombHighSpeed = 140;

function createPlanet() {
    var x = 200;
    var y = 200;

    var width = 400;
    var height = 400;

    var planetImage = this.add.image(x, y, 'space', 'purple-planet');

    // sets scale of planet
    planetImage.setDisplaySize(width, height);
}































































// highest speed the ship can go
var shipMaxVelocity = 100000;

function hitShip (ship, enemy) {
    xparticles.emitParticleAt(ship.x, ship.y);
    this.cameras.main.shake(500, 0.001);

    if (gameHasStarted) {
        health -= 10;
        healthDisplay.setText('Health: ' + health);
    }

    if (health <= 0) {
        gameOver();
    }

    enemy.kill();
}

function hitEnemy (bullet, enemy) {
    xparticles.emitParticleAt(enemy.x, enemy.y);

    this.cameras.main.shake(500, 0.01);

    bullet.kill();
    enemy.kill();
}

var config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    input: {
        gamepad: true
    },
    physics: {
        default: "arcade",
        arcade: {
            debug: false,
            fps: 60,
            gravity: { y: 0 }
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
        extend: {
            checkBulletVsEnemy: checkBulletVsEnemy,
            launchEnemy: launchEnemy,
            hitShip: hitShip,
            hitEnemy: hitEnemy
        }
    }
};

var ship;
var gamepad;
var text;
var bullets;
var enemies;
var lastFired = 0;
var fire;
var xparticles;
var scene;
var timeSurvived = 0;
var hasAlreadyLost = false;
var gameHasStarted = false;

var game = new Phaser.Game(config);

var Bullet = new Phaser.Class({

    Extends: Phaser.Physics.Arcade.Image,

    initialize:

    function Bullet (scene)
    {
        Phaser.Physics.Arcade.Image.call(this, scene, 0, 0, 'space', 'blaster');

        this.setBlendMode(1);
        this.setDepth(1);

        this.speed = 800;
        this.lifespan = 1000;

        this._temp = new Phaser.Math.Vector2();
    },

    fire: function (ship)
    {
        this.lifespan = 1000;

        this.setActive(true);
        this.setVisible(true);
        this.setAngle(ship.body.rotation);
        this.setPosition(ship.x, ship.y);

        this.body.reset(ship.x, ship.y);

        this.body.setSize(10, 10, true);

        var angle = Phaser.Math.DegToRad(ship.body.rotation);

        this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);

        this.body.velocity.x *= 2;
        this.body.velocity.y *= 2;
    },

    update: function (time, delta)
    {
        this.lifespan -= delta;

        if (this.lifespan <= 0)
        {
            this.kill();
        }
    },

    kill: function ()
    {
        this.setActive(false);
        this.setVisible(false);
        this.body.stop();
    }

});

var Enemy = new Phaser.Class({

    Extends: Phaser.Physics.Arcade.Sprite,

    initialize:

    function Enemy (scene)
    {
        Phaser.Physics.Arcade.Sprite.call(this, scene, 500, 500, 'mine-sheet');

        this.setDepth(1);

        this.speed = 100;
        this.checkOutOfBounds = false;
        this.target = new Phaser.Math.Vector2();
    },

    launch: function ()
    {
        this.play('mine-anim');

        this.checkOutOfBounds = false;

        var p = Phaser.Geom.Rectangle.RandomOutside(spaceOuter, spaceInner);
        
        // mutates x and y values of this.target to be a random coord inside of spaceInner
        spaceInner.getRandomPoint(this.target);

        this.speed = Phaser.Math.Between(bombLowSpeed, bombHighSpeed);

        this.setActive(true);
        this.setVisible(true);
        this.setPosition(p.x, p.y);

        var angle = Phaser.Math.Angle.BetweenPoints(p, this.target);

        this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
    },

    update: function (time, delta)
    {
        var withinGame = spaceInner.contains(this.x, this.y);

        if (!this.checkOutOfBounds && withinGame)
        {
            this.checkOutOfBounds = true;
        }
        else if (this.checkOutOfBounds && !withinGame)
        {
            this.kill();
        }
    },

    kill: function ()
    {
        this.setActive(false);
        this.setVisible(false);
        this.body.stop();
        this.scene.launchEnemy();
    }

});

function preload ()
{
    this.load.image('background', 'nebula.jpeg');
    this.load.atlas('space', 'space.png', 'space.json');
    this.load.atlas('explosion', 'explosion.png', 'explosion.json');
}

function create ()
{
    scene = this;

    spaceOuter = new Phaser.Geom.Rectangle(-200, -200, window.innerWidth + 300, window.innerHeight + 300);
    spaceInner = new Phaser.Geom.Rectangle(0, 0, window.innerWidth, window.innerHeight);

    this.textures.addSpriteSheetFromAtlas('mine-sheet', { atlas: 'space', frame: 'mine', frameWidth: 64 });
    this.anims.create({ key: 'mine-anim', frames: this.anims.generateFrameNumbers('mine-sheet', { start: 0, end: 15 }), frameRate: 20, repeat: -1 });

    this.add.tileSprite(0, 0, 4000, 2400, 'background');
    createPlanet.call(this);


    this.instructions = [];

    this.instructions.push(scene.add.text((window.innerWidth/2 - 300), (window.innerHeight/2 - 100), 'Press A to start', { font: '70px Courier', fill: '#00ff00' }));
    this.instructions.push(scene.add.text((window.innerWidth/2 - 250), (window.innerHeight/2), 'Avoid the bombs!', { font: '60px Courier', fill: '#00ff00' }));

    healthDisplay = this.add.text((window.innerWidth/2), 10, caption1 + health, { font: '30px Courier', fill: '#00ff00' });

    timeSurvivedText = this.add.text((window.innerWidth/2), 50, caption2 + timeSurvived + ' seconds', { font: '30px Courier', fill: '#00ff00' });

    text = this.add.text(10, 10, '', { font: '30px Courier', fill: '#00ff00' })
    
    this.input.gamepad.on('down', function (pad, button, index) {
        if (!gameHasStarted) {
            bullets = this.physics.add.group({
                classType: Bullet,
                maxSize: 30,
                runChildUpdate: true
            });

            ship = this.physics.add.image(400, 300, 'space', 'ship').setDepth(2);

            ship.setDamping(true);
            ship.setDrag(drag);
            ship.setMaxVelocity(shipMaxVelocity);

            enemies = this.physics.add.group({
                classType: Enemy,
                maxSize: -1,
                runChildUpdate: true
            });

            surviveTimer = this.time.addEvent({
                delay: 1000, 
                loop: true, 
                callback: () => {
                    timeSurvived += 1;
                    timeSurvivedText.setText('Survived: ' + timeSurvived + ' seconds');
                    gameHasStarted = true;
                }
            });
        
            pad.setAxisThreshold(.1);

            gamepad = pad;

            for (var i=0; i < this.instructions.length; i++) {
                this.instructions[i].destroy();
            }

            xparticles = this.add.particles('explosion');

            xparticles.createEmitter({
                frame: [ 'smoke-puff', 'cloud', 'smoke-puff' ],
                angle: { min: 240, max: 300 },
                speed: { min: 200, max: 300 },
                quantity: 6,
                lifespan: 2000,
                alpha: { start: 1, end: 0 },
                scale: { start: 1.5, end: 0.5 },
                on: false
            }); 
        
        
            xparticles.createEmitter({
                frame: 'red',
                angle: { min: 0, max: 360, steps: 32 },
                lifespan: 1000,
                speed: 400,
                quantity: 32,
                scale: { start: 0.3, end: 0 },
                on: false
            });
        
            xparticles.createEmitter({
                frame: 'muzzleflash2',
                lifespan: 200,
                scale: { start: 2, end: 0 },
                rotate: { start: 0, end: 180 },
                on: false
            });
        
            let particles = this.add.particles('space');
        
            let emitter = particles.createEmitter({
                frame: 'blue',
                speed: 200,
                lifespan: {
                    onEmit: function (particle, key, t, value)
                    {
                        return Phaser.Math.Percent(ship.body.speed, 0, 400) * 2000;
                    }
                },
                alpha: {
                    onEmit: function (particle, key, t, value)
                    {
                        return Phaser.Math.Percent(ship.body.speed, 0, 400);
                    }
                },
                angle: {
                    onEmit: function (particle, key, t, value)
                    {
                        var v = Phaser.Math.Between(-10, 10);
                        return (ship.angle - 180) + v;
                    }
                },
                scale: { start: 0.6, end: 0 },
                blendMode: 'ADD'
            });
        
            emitter.startFollow(ship);
        
            this.physics.add.overlap(bullets, enemies, this.hitEnemy, this.checkBulletVsEnemy, this);
            this.physics.add.collider(ship, enemies, this.hitShip, false, this);
        
            for (var i = 0; i < numOfEnemies; i++) {
                this.launchEnemy();
            }
        }

    }, this);
}

function launchEnemy ()
{
    var b = enemies.get();

    if (b)
    {
        b.launch();
    }
}

function checkBulletVsEnemy (bullet, enemy)
{
    return (bullet.active && enemy.active);
}

function gameOver() {
    if (!hasAlreadyLost) {
        scene.add.text((window.innerWidth/2 - 300), (window.innerHeight/2 - 100), 'GAME OVER', { font: '120px Courier', fill: '#00ff00' });
        scene.add.text((window.innerWidth/2 - 400), (window.innerHeight/2), 'You survived ' + timeSurvived + ' seconds', { font: '60px Courier', fill: '#00ff00' });
        ship.setActive(false);
        ship.setVisible(false);
        surviveTimer.destroy();
        hasAlreadyLost = true;
    }
}

function update (time)
{

    text.setText([
        this.input.gamepad.pad1.leftStick.x,
        // ship.body.angularVelocity
    ]);

    if (!gamepad)
    {
        return;
    }

    ship.setAngularVelocity(300 * gamepad.leftStick.x);

    if (gamepad.leftStick.y <= 0)
    {
        this.physics.velocityFromRotation(ship.rotation, Math.abs(800 * gamepad.leftStick.y), ship.body.acceleration);
    }

    this.physics.world.wrap(ship, 32);

    if (gamepad.A && time > lastFired)
    {
        var bullet = bullets.get();

        if (bullet)
        {
            bullet.fire(ship);

            lastFired = time + 100;
        }
    }
}
