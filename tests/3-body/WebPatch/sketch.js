//
//  Three body problem, coded by GPT-4, March 24, 2023
//

// Global variables for the masses
let mass1, mass2, mass3, mass4, mass5;

function setup() {
  let w = 800;
  let h = 500;
  createCanvas(w, h, WEBGL);

  // Initialize the masses
  mass1 = new Mass(0, 0, 40, -0.02, -0.01, color(0, 255, 0), 2);
  mass2 = new Mass(-w / 8, 0, 8, 0.1, 0.1, color(255, 0, 0), 1);
  mass3 = new Mass(w / 8, 0, 9, 0, 0, color(0, 150, 255), 3);
  mass4 = new Mass(0, -h / 8, 5, 0, 0, color(150, 255, 255), 4);
  mass5 = new Mass(0, h / 8, 7, 0, 0, color(155, 255, 0), 5);
}

function draw() {
  background(255);

  // Update and display the masses
  mass1.update();
  mass2.update();
  mass3.update();
  mass4.update();
  mass5.update();

  mass1.display();
  mass2.display();
  mass3.display();
  mass4.display();
  mass5.display();

  // Apply gravitational force between the masses
  applyGravity(mass1, mass2);
  applyGravity(mass1, mass3);
  applyGravity(mass1, mass4);
  applyGravity(mass1, mass5);

  applyGravity(mass2, mass3);
  applyGravity(mass2, mass4);
  applyGravity(mass2, mass5);

  applyGravity(mass3, mass4);
  applyGravity(mass3, mass5);

  applyGravity(mass4, mass5);

  // check
  checkCollision(mass1, mass2);
  checkCollision(mass1, mass3);
  checkCollision(mass1, mass4);
  checkCollision(mass1, mass5);

  checkCollision(mass2, mass3);
  checkCollision(mass2, mass4);
  checkCollision(mass2, mass5);

  checkCollision(mass3, mass4);
  checkCollision(mass3, mass5);

  checkCollision(mass4, mass5);
}

function checkCollision(m1, m2) {
  let distance = dist(m1.pos.x, m1.pos.y, m2.pos.x, m2.pos.y);
  let combinedRadius = m1.radius + m2.radius;
  let proximityThreshold = 7; // Define "very close" threshold distance

  // Check if the objects are within the "very close" range
  if (distance <= combinedRadius + proximityThreshold) {
    let mynumber = parseInt(m1.id + "" + m2.id);
    if (Pd4Web) {
      if (Pd4Web.sendBang) {
        Pd4Web.sendBang("m-" + mynumber);
      }
    }
  }

  let random = Math.floor(Math.random() * 100000);
  if (random > 99998) {
    console.log("change");
    if (Pd4Web) {
      if (Pd4Web.sendList) {
        Pd4Web.sendList("pd-random", ["bang"]);
      }
    }
  }
}

class Mass {
  constructor(x, y, radius, vx, vy, col, id) {
    this.pos = createVector(x, y);
    this.vel = createVector(vx, vy);
    this.acc = createVector(0, 0);
    this.radius = radius;
    this.mass = radius * 10;
    this.col = col;
    this.id = id;
  }

  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }

  display() {
    fill(this.col);
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.radius * 2);
  }

  applyForce(force) {
    let f = p5.Vector.div(force, this.mass);
    this.acc.add(f);
  }
}

function applyGravity(m1, m2) {
  let G = 0.7; // Gravitational constant
  let r = p5.Vector.sub(m1.pos, m2.pos);
  let distanceSq = r.magSq();
  distanceSq = constrain(distanceSq, 100, 10000);
  let force = (-G * m1.mass * m2.mass) / distanceSq;
  let gravity = r.setMag(force);
  m1.applyForce(gravity);
  m2.applyForce(gravity.mult(-1));
}
