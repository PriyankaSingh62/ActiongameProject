class SpaceActionGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.healthElement = document.getElementById('health');
        this.gameOverElement = document.getElementById('gameOver');
        this.finalScoreElement = document.getElementById('finalScore');
        this.restartBtn = document.getElementById('restartBtn');
        
        this.gameState = 'playing';
        this.score = 0;
        this.health = 100;
        
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 60,
            width: 40,
            height: 40,
            speed: 5,
            color: '#00ff00'
        };
        
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        this.powerUps = [];
        
        this.keys = {};
        this.lastShot = 0;
        this.shootCooldown = 200;
        this.enemySpawnRate = 0.02;
        this.powerUpSpawnRate = 0.005;
        
        this.setupEventListeners();
        this.gameLoop();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        this.restartBtn.addEventListener('click', () => {
            this.restartGame();
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.player.x = e.clientX - rect.left - this.player.width / 2;
        });
        
        this.canvas.addEventListener('click', () => {
            if (this.gameState === 'playing') {
                this.shoot();
            }
        });
    }
    
    shoot() {
        const now = Date.now();
        if (now - this.lastShot < this.shootCooldown) return;
        
        this.bullets.push({
            x: this.player.x + this.player.width / 2,
            y: this.player.y,
            width: 4,
            height: 10,
            speed: 8,
            color: '#ffff00'
        });
        
        this.lastShot = now;
    }
    
    spawnEnemy() {
        if (Math.random() < this.enemySpawnRate) {
            this.enemies.push({
                x: Math.random() * (this.canvas.width - 30),
                y: -30,
                width: 30,
                height: 30,
                speed: Math.random() * 3 + 2,
                color: '#ff4444',
                health: 1
            });
        }
    }
    
    spawnPowerUp() {
        if (Math.random() < this.powerUpSpawnRate) {
            this.powerUps.push({
                x: Math.random() * (this.canvas.width - 20),
                y: -20,
                width: 20,
                height: 20,
                speed: 2,
                type: Math.random() < 0.5 ? 'health' : 'rapidFire',
                color: Math.random() < 0.5 ? '#00ff00' : '#ff00ff'
            });
        }
    }
    
    updatePlayer() {
        if (this.keys['ArrowLeft'] && this.player.x > 0) {
            this.player.x -= this.player.speed;
        }
        if (this.keys['ArrowRight'] && this.player.x < this.canvas.width - this.player.width) {
            this.player.x += this.player.speed;
        }
        if (this.keys['ArrowUp'] && this.player.y > 0) {
            this.player.y -= this.player.speed;
        }
        if (this.keys['ArrowDown'] && this.player.y < this.canvas.height - this.player.height) {
            this.player.y += this.player.speed;
        }
        if (this.keys[' ']) {
            this.shoot();
        }
    }
    
    updateBullets() {
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= bullet.speed;
            return bullet.y > -bullet.height;
        });
    }
    
    updateEnemies() {
        this.enemies = this.enemies.filter(enemy => {
            enemy.y += enemy.speed;
            return enemy.y < this.canvas.height + enemy.height;
        });
    }
    
    updatePowerUps() {
        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.y += powerUp.speed;
            return powerUp.y < this.canvas.height + powerUp.height;
        });
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            return particle.life > 0;
        });
    }
    
    checkCollisions() {
        // Bullets vs Enemies
        this.bullets.forEach((bullet, bulletIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                if (this.isColliding(bullet, enemy)) {
                    this.bullets.splice(bulletIndex, 1);
                    this.enemies.splice(enemyIndex, 1);
                    this.score += 10;
                    this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                }
            });
        });
        
        // Player vs Enemies
        this.enemies.forEach((enemy, enemyIndex) => {
            if (this.isColliding(this.player, enemy)) {
                this.enemies.splice(enemyIndex, 1);
                this.health -= 20;
                this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                this.updateHealthDisplay();
            }
        });
        
        // Player vs PowerUps
        this.powerUps.forEach((powerUp, powerUpIndex) => {
            if (this.isColliding(this.player, powerUp)) {
                this.powerUps.splice(powerUpIndex, 1);
                this.applyPowerUp(powerUp.type);
            }
        });
        
        // Check game over
        if (this.health <= 0) {
            this.gameState = 'gameOver';
            this.showGameOver();
        }
    }
    
    isColliding(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    createExplosion(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 30,
                color: `hsl(${Math.random() * 60 + 10}, 100%, 50%)`
            });
        }
    }
    
    applyPowerUp(type) {
        if (type === 'health') {
            this.health = Math.min(100, this.health + 30);
            this.updateHealthDisplay();
        } else if (type === 'rapidFire') {
            this.shootCooldown = 100;
            setTimeout(() => {
                this.shootCooldown = 200;
            }, 5000);
        }
        this.score += 25;
    }
    
    updateHealthDisplay() {
        this.healthElement.textContent = this.health;
        if (this.health <= 30) {
            this.healthElement.parentElement.classList.add('warning');
        } else {
            this.healthElement.parentElement.classList.remove('warning');
        }
    }
    
    showGameOver() {
        this.finalScoreElement.textContent = this.score;
        this.gameOverElement.style.display = 'block';
    }
    
    restartGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.health = 100;
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        this.powerUps = [];
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height - 60;
        this.shootCooldown = 200;
        
        this.scoreElement.textContent = this.score;
        this.updateHealthDisplay();
        this.gameOverElement.style.display = 'none';
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw player
        this.ctx.fillStyle = this.player.color;
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // Draw bullets
        this.bullets.forEach(bullet => {
            this.ctx.fillStyle = bullet.color;
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });
        
        // Draw enemies
        this.enemies.forEach(enemy => {
            this.ctx.fillStyle = enemy.color;
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        });
        
        // Draw power-ups
        this.powerUps.forEach(powerUp => {
            this.ctx.fillStyle = powerUp.color;
            this.ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        });
        
        // Draw particles
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x, particle.y, 3, 3);
        });
        
        // Update score display
        this.scoreElement.textContent = this.score;
    }
    
    gameLoop() {
        if (this.gameState === 'playing') {
            this.updatePlayer();
            this.updateBullets();
            this.updateEnemies();
            this.updatePowerUps();
            this.updateParticles();
            this.spawnEnemy();
            this.spawnPowerUp();
            this.checkCollisions();
        }
        
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new SpaceActionGame();
});