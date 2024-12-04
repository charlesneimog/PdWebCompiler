let drawInterval = 0;
let drawCounter = 0;
let clearInterval = 0;
let clearCounter = 0;
let cloneInstance = 0;
let flow = 30;
let time = 0; // Time variable for sine wave
let noiseTime = 0; // Time variable for noise function
let breakCounter = 0;
let breakThreshold = 500; // When to trigger a pattern break
let breakingFlow = false;
const minFlow = 5;
const maxFlow = 50; // Adjusted for a wider range of flow
const breakDuration = 200; // How long the break pattern lasts

function setup() {
  let w = window.innerWidth;
  let h = window.innerHeight;

  let canvas = createCanvas(w, h);
  canvas.parent("p5js");

  // Center the canvas
  canvas.style('display', 'block');
  canvas.style('margin', 'auto');

  background(255);

  // Initialize random intervals
  drawInterval = 0;
  clearInterval = floor(random(5, 50)); // Clear after 5 to 35 circles
}

function draw() {
  // Use a combination of sine and noise to control flow
  let speedModifier = noise(noiseTime) * 0.5 + 0.5; // Noise-based modulation
  let sineWave = sin(time) * 0.5 + 0.5; // Sine wave modulation between 0 and 1
  flow = map(sineWave * speedModifier, 0, 1, minFlow, maxFlow); 
  time += 0.03; // Adjust main sine wave speed
  noiseTime += 0.01; // Adjust noise function speed

  // Handle the pattern breaker
  if (breakingFlow) {
    flow = maxFlow * random(2, 5);
    breakCounter++;
    if (breakCounter > breakDuration) {
      breakingFlow = false;
      breakCounter = 0;
    }
  } else {
    // Randomly decide to break the pattern
    if (random() < 0.005) { // Low probability of breaking
      breakingFlow = true;
    }
  }

  if (drawCounter >= drawInterval) {
    drawSomething();
    drawCounter = 0;
    drawInterval = floor(random(1, flow));
    clearCounter++;

    if (Pd4Web !== null && typeof Pd4Web !== 'undefined') {
      if (Pd4Web.sendList) {
        let models = [11, 12, 13];
        let model = models[floor(random(0, models.length))];
        Pd4Web.sendFloat("s-m", model);
        Pd4Web.sendList("note", [cloneInstance, random(48, 84), random(40, 80)]);
        Pd4Web.sendList("note", [cloneInstance, random(48, 84), random(40, 80)]);

        cloneInstance++;
        if (cloneInstance > 9) {
          cloneInstance = 0;
          Pd4Web.sendBang("clear");
        }
      } else {
        // draw in the center "Click to start to play"
        fill(0);
        textSize(32);
        textAlign(CENTER, CENTER);
        text("Click to start to play", width / 2, height / 2);

      }

    }

    if (clearCounter >= clearInterval) {
      background(255);
      clearCounter = 0;
      clearInterval = floor(random(5, 25));
    }
  }

  drawCounter++;
}

// Function to draw a random shape
function drawSomething() {
  let form = floor(random(1, 5)); // Random shape selector
  fill(random(0, 255), random(0, 255), random(0, 255));

  let width = window.innerWidth;
  let height = window.innerHeight;
  let d = random(20, 100);
  let x = random(d / 2, width - d / 2);
  let y = random(d / 2, height - d / 2);

  
  // random shape
  beginShape();
  let size = random(10, 100);
  let x1 = random(0, width);
  let y1 = random(0, height);
  for (let i = 0; i < 10; i++) {
    let x = random(x1, x1 + random(-size, size));
    let y = random(y1, y1 + random(-size, size));
    vertex(x, y);
  }
  endShape(CLOSE);
}