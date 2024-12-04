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

let background_color = 255;

let svg_count = 0;

function setup() {
  let w = window.innerWidth - 20;
  let h = window.innerHeight - 20;

  let canvas = createCanvas(w, h);
  canvas.parent("p5js");

  // Center the canvas
  canvas.style('display', 'block');
  canvas.style('margin', 'auto');

  background(255);

  // Initialize random intervals
  drawInterval = 0;
  clearInterval = floor(random(5, 35)); // Clear after 5 to 35 circles
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
    flow = maxFlow * 2; // Force a fast flow during the break
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

    if (typeof Pd4Web !== 'undefined') {
      if (Pd4Web.sendList) {
        let models = [10, 11, 12, 13, 14, 15, 16];
        let model = models[floor(random(0, 21))];
        Pd4Web.sendFloat("s-m", model);
        Pd4Web.sendList("note", [cloneInstance, random(48, 84), random(40, 80)]);
        Pd4Web.sendList("note", [cloneInstance, random(48, 84), random(40, 80)]);

        cloneInstance++;
        if (cloneInstance > 9) {
          cloneInstance = 0;
          Pd4Web.sendBang("clear");
        }
      }
    }

    if (clearCounter >= clearInterval) {
      // it is possible to save as png
      save("pattern" + svg_count + ".png");
      svg_count++;
      background(255);
      
      clearCounter = 0;
      clearInterval = floor(random(5, 25));
    }
  }

  drawCounter++;
}

// Function to draw a random shape
function drawSomething() {
  let form = floor(random(1, 4)); // Random shape selector
  fill(random(0, 255), random(0, 255), random(0, 255));

  let width = window.innerWidth - 80;
  let height = window.innerHeight - 80;
  let d = random(20, 100);
  let x = random(d / 2, width - d / 2);
  let y = random(d / 2, height - d / 2);

  if (form === 1) {
    ellipse(x, y, d);
  } else if (form === 2) {
    rect(x, y, d, d);
  } else if (form === 3) {
    triangle(x, y, x + d, y, x + d / 2, y + d);
  }
}
