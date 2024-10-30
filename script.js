//selecting canvas 
const canvas = document.querySelector("canvas"); // select the canvas element of html DOM
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//Variables and Constants 
const c = canvas.getContext("2d"); // c is the context of the canvas, allow to draw shapes on the canvas 

//selecting DOM elements by their ids 
const scoreCurr = document.getElementById("scoreCurr")
const highScore = document.getElementById("highScore")
const scoreCard = document.getElementById("scoreCard")
const finalScore = document.getElementById("finalScore")
const startGamebtn = document.getElementById("startGameBtn")
const viewProfile = document.getElementById("viewProfile")
const popUp = document.getElementById("popUp")
const popText = document.getElementById("popText")


//initial game variable  
const friction = 0.99 // to slow down particles 
let x = canvas.width/2 // x position of the player
let y = canvas.height/2 // y position of the player
let projectiles = []
let enemies = []
let particles = []
let score = 0
let highest = localStorage.getItem("highest") || 0 //??? what , from where ?
let animationId // keep track of the animation frame 
let spanEnenmiesInterval  // keep track of the interval of the enemies
let spawnTime = 1000 // time interval to spawn enemies starts at 1000ms (1 second )
highScore.innerHTML = highest //??

// starting Ball class 
class Ball {
    constructor(x, y, radius, color){
        this.x = x //x position of the ball
        this.y = y //y position of the ball
        this.radius = radius 
        this.color = color
    }
    draw(){ //this method creates and fills a circular shape on the canvas 
        c.beginPath() //start drawing
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false) //draw a circle
        c.fillStyle = this.color // set the color of the circle
        c.fill() // fill the circle with the color
    }
    update(){ //
        this.draw()
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
    }
}

//starting shooter class , has the same basic properties as the Ball class
class Shooter extends Ball {
    constructor(x, y, radius, color,velocity){
        super(x, y, radius, color) // call the constructor of the parent class
        this.velocity = velocity    
    }
    update(){ //moves ball by adding the velocity to its current position
        this.draw()
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
    }
}

//starting Particle class , has the same basic properties as the shooter class but has bit of tranperancy to give fading effect

class Particle extends Shooter{
    constructor(x, y, radius, color, velocity){
        super(x, y, radius, color, velocity) // call the constructor of the parent class
        this.alpha = 1 //opacity of the particle
    }
    draw(){ //this method creates and fills a circular shape on the canvas 
        c.save() // save the current state of the canvas
        c.globalAlpha = this.alpha // set the opacity of the particle in canvas 
        super.draw() 
        c.restore() // restore the previous state of the canvas
    }
    update(){ // applies friction to reduce partcile's speed and decrease its opacity 
        this.draw()
        this.velocity.x *= friction
        this.velocity.y *= friction
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
        this.alpha -= 0.01  // this gives it a fast moving effect , one projectile is moade up of lots of circles with increasing opacity 
    }
}


// personal touch - the score checking function to reveal profile
const buttonRequirements = {
    about: {score:2000, unlocked:false,message:"cleared level 0 , about section unlocked"},
    educaton : {score:4000, unlocked:false,message:"cleared level 1 , education section unlocked"},
    skills : {score:6000, unlocked:false,message:"cleared level 2, skills section unlocked"},
    projects : {score:8000, unlocked:false,message:"cleared level 3, projects section unlocked"},
    experience : {score:10000, unlocked:false,message:"cleared level 4, experience section unlocked"},
    contact : {score:13000, unlocked:false,message:"cleared level 5, contact section unlocked and now that you have unlocked all sections have fun checking them out"},
};

function checkScore(score) {
   Object.keys(buttonRequirements).forEach( (buttonID) => {
    const requirement = buttonRequirements[buttonID];

    if(score = requirement.score && !requirement.unlocked) {
        requirement.unlocked = true;
        document.getElementById(buttonID).style.display = "block";

        //display custom message 
        displayUnlockMessage(requirement.message);
    } 
    

   });
   if (Object.values(buttonRequirements).some(req => req.unlocked)) {
    viewProfile.style.display = "block";
}
}


let messageTimeout;
function displayUnlockMessage(message) {
    if(messageTimeout) clearTimeout(messageTimeout);

    popUp.innerHTML = message;
    popUp.style.display = "block";

    messageTimeout = setTimeout(() => { // wait three seconds before hiding the message
        popUp.style.display = "none";
    }, 3000);
}

// ------- the end --------


// to update the score everytime shooter hits the enemy
function updateScore(times = 1) {
    spawnTime *= 0.999 // decrease the spawn time of the enemies
    score += 100 * times // increase the score by 100 times the number of enemies hit
    scoreCurr.innerHTML = score // update the score in the DOM
    checkScore(highest) // check if the score is enough to unlock the profile
}



// calculate valocity from center(x,y) to the mouse poition(x1,y1)
function calculateVelocity(x, y, x1 = canvas.width/2, y1= canvas.height/2
) { //why use canvas.width and not mouse pos ?????????
    const angle = Math.atan2(y1 - y, x1 - x) // calculate the angle between the center and the mouse position
    return {x: Math.cos(angle), y: Math.sin(angle)} // return the x and y components of the velocity
}



//Animation Loop 
function animate(){
    animationId = requestAnimationFrame(animate) // call the animate function recursively
    c.fillStyle = "rgba(0,0,0,0.1)" // set the color of the canvas
    c.fillRect(0,0,canvas.width,canvas.height) // fill the canvas with the color ???????
    player.draw() // draw the player on the canvas  ???????? is it in-built function

    //update and remove  partciles
    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            setTimeout(() => {
                particles.splice(index, 1)
            },0)
        } 
        else {
            particle.update()

        }
    })

    projectiles.forEach((projectile,index) => {
        projectile.update()
        if (
            projectile.x + projectile.radius < 1 || 
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius< 0 ||
            projectile.y - projectile.radius > canvas.height 
            
        ) {
            setTimeout(() => {
                projectiles.splice(index,1)
            }, 0)
        }
    })


 
 //Update and destroy Enemies , Create Explosions and Increase Score
 enemies.forEach((enemy, index) => { //iterate over each enemy in the enemies array
    enemy.update() // moves enemy closer to the player's position

    // Calculate distance between player(player.x, player.y) and enemy(enemy.x, enemy.y) using Math.hypot(perpendicular,base) which gives hypotenuse/distance between them ???? or just use diatance formula?
    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y)

    // Checking if player and enemy is collided 
    if (dist - enemy.radius - player.radius < 1) {  // is enemy and player collide then game end .
        stopGame()
    }

    projectiles.forEach((projectile, projectileIndex) => { 
        const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y) 

        //when Projectiles touch Enemy 
        if(dist - enemy.radius - projectile.radius < 0 ) {
            // Create Particles explosion
            for (let i=0; i < enemy.radius * 1; i++) { // ?? why multiply by one 
                particles.push(
                    new Particle(
                        projectile.x,
                        projectile.y,
                        Math.random() * 3,
                        enemy.color,
                        {
                          x: (Math.random() - 0.5) * (Math.random() * 9.8 - 0.5) , // randomized x and y for velocity and explosion like effect 
                          y:  (Math.random() - 0.5) * (Math.random() * 9.8 - 0.5) ,
                        }

                    )
                )
            }
            
            //enemy shrinking or destruction 
            if (enemy.radius - 10 > 10){
                updateScore()
                enemy.radius -= 8 // reduces its size ??
                setTimeout(() =>{ // projectiles removed using splice within setTimeout to avoid modifying the array during iteration
                    projectiles.splice(projectileIndex, 1) //?? iteration?? where 
                }, 0)
            }  else {
                updateScore(2.5) 
                setTimeout(() => {
                     enemies.splice(index,1) 
                     projectiles.splice(projectileIndex,1)
                },0)

            }
        }
    })
 })

} // animation end 





//Shoot enemy - triggered by mouse clicks , calculating the direction and speed of projectiles based on mouse position
function shootEnemy(e) {
    let x = canvas.width / 2,
       y = canvas.height /2

    v = calculateVelocity(x, y, e.clientX , e.clientY)  //??? why is no let or const mentioned
    v.x *= 5.5
    v.y *= 5.5

    projectiles.push(new Shooter(x,y,5,'white',v))
}

// Reinitializing Variables for Starting a New Game 
function init() { // ??? like why ?
    player = new Ball(x,y,10,'white')
    projectiles = [] 
    enemies = []
    particles = []
    score = 0
    spawnTime = 1000
    highScore.innerHTML = score
    scoreCurr.innerHTML = score
    highScore.innerHTML = highest //?? where is highest variable ?

}

//Stop Game function 
function stopGame() {
    clearInterval(spanEnemiesInterval) 
    cancelAnimationFrame(animationId) // exit animation
    canvas.removeEventListener('click', shootEnemy) // Stop shooting 
    scoreCard.style.display = 'flex' // the dialogue box to show score 
    if(score > highest) {
        highest = score 
        localStorage.setItem('highest', highest)
    }
    finalScore.innerHTML = score //total score on the scorecard

}


// Spawning Random Enemies
function spanEnemies() {
   // Spawn a enemy every second 
   spanEnemiesInterval = setTimeout(() => {
    let x, y 
    const radius = Math.random() * 16 + 14
    if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius  //?? position of enemies ??
        y = Math.random() * canvas.height
    } else {
        x = Math.random() * canvas.width
        y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius
    }
     
    //hsl - hue , aturation and lightness  the varibal part is the hue , generating a rnadom number from 0 to 360
    const color =  `hsl(${Math.floor(Math.random() * 360)} , 50%, 50%)`// template literal for embedding variable in string 
    enemies.push(new Shooter(x,y, radius, color, calculateVelocity(x,y)))
    spanEnemies() // balls are generate continously 
   }, spawnTime)
}

if (Array.from(buttons).some(button => button.classList.contains('visible'))) {
    document.getElementById('viewProfile').style.display = 'block';
  }

// Start new Game 
function startGame() {
    x = canvas.width / 2
    y = canvas.height / 2
    canvas.addEventListener('click',shootEnemy)
    init()
    animate()
    clearInterval(spanEnenmiesInterval) // ?? stands for ?
    spanEnemies()
    scoreCard.style.display = 'none'
    viewProfile.style.display = 'none'

    if (Array.from(buttons).some(button => button.classList.contains('visible'))) {
        document.getElementById('viewProfile').style.display = 'block';
      }
}

// start Game Button 
startGamebtn.addEventListener('click',startGame)









