// Particle System Animation
// An interactive particle system with dynamic connections and visual effects
// Created with p5.js

// System configuration variables
let particles = [];
const numParticles = 150; // Number of particles in the system
const maxSpeed = 2;       // Maximum particle velocity
const particleSize = 5;   // Base size for particles
const connectionDistance = 120; // Maximum distance for particle connections
let colorShift = 0;       // For global color cycling effect
let repulsionMode = false; // Toggle between attraction and repulsion
let lastFrameTimes = [];  // Array to track frame times for FPS calculation
let fpsUpdateInterval = 10; // Update FPS display every 10 frames

// Performance optimization variables
let useQuadtree = true;   // Use spatial partitioning for faster neighbor finding
let quadtree;             // Quadtree for spatial partitioning
let lastFrameCount = 0;   // For FPS calculation
let frameRateVal = 0;     // Current frame rate

/**
 * Setup function - runs once at the beginning
 * Initializes the canvas, particles, and other settings
 */
function setup() {
  // Create canvas that fills the window
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 1);
  
  // Initialize particles
  for (let i = 0; i < numParticles; i++) {
    particles.push(new Particle());
  }
  
  // Set text properties for instructions
  textSize(16);
  textAlign(LEFT, TOP);
  
  // Initialize quadtree
  quadtree = new QuadTree(new Boundary(width/2, height/2, width/2, height/2), 4);
}

/**
 * Main draw loop - runs continuously
 * Updates and renders all elements of the animation
 */
function draw() {
  // Calculate FPS
  if (frameCount % fpsUpdateInterval === 0) {
    const currentTime = millis();
    if (lastFrameCount > 0) {
      const elapsed = currentTime - lastFrameTimes[lastFrameTimes.length - 1];
      frameRateVal = (fpsUpdateInterval / (elapsed / 1000)).toFixed(1);
    }
    lastFrameTimes.push(currentTime);
    if (lastFrameTimes.length > 10) lastFrameTimes.shift();
    lastFrameCount = frameCount;
  }
  
  // Set background with slight transparency for trail effect
  background(0, 0, 0, 0.05); // More pronounced trail effect
  
  // Update color shift for cycling colors
  colorShift = (colorShift + 0.2) % 360;
  
  // Reset quadtree each frame if using it
  if (useQuadtree) {
    quadtree = new QuadTree(new Boundary(width/2, height/2, width/2, height/2), 4);
    // Insert all particles into the quadtree
    for (let particle of particles) {
      quadtree.insert(particle);
    }
  }
  
  // Update and display particles
  for (let i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].display();
    
    // Find and connect nearby particles
    if (useQuadtree) {
      // Use quadtree for efficient neighbor finding
      let range = new Circle(particles[i].pos.x, particles[i].pos.y, connectionDistance);
      let neighbors = [];
      quadtree.query(range, neighbors);
      
      for (let neighbor of neighbors) {
        // Skip self-connections and duplicates (only connect i->j where j>i)
        if (neighbor === particles[i] || particles.indexOf(neighbor) <= i) continue;
        
        let d = dist(particles[i].pos.x, particles[i].pos.y, neighbor.pos.x, neighbor.pos.y);
        if (d < connectionDistance) {
          drawConnection(particles[i], neighbor, d);
        }
      }
    } else {
      // Brute force approach - check all pairs
      for (let j = i + 1; j < particles.length; j++) {
        let d = dist(particles[i].pos.x, particles[i].pos.y, particles[j].pos.x, particles[j].pos.y);
        if (d < connectionDistance) {
          drawConnection(particles[i], particles[j], d);
        }
      }
    }
  }
  
  // Display UI information
  displayUI();
}

/**
 * Draw a connection line between two particles
 */
function drawConnection(p1, p2, distance) {
  // Calculate alpha and stroke weight based on distance
  let alpha = map(distance, 0, connectionDistance, 1, 0);
  let sw = map(distance, 0, connectionDistance, 2, 0.1);
  strokeWeight(sw);
  
  // Create rainbow effect with shifting base color
  let connectionHue = (p1.hue + colorShift) % 360;
  stroke(connectionHue, 80, 100, alpha);
  
  line(p1.pos.x, p1.pos.y, p2.pos.x, p2.pos.y);
}

/**
 * Display UI elements including instructions and stats
 */
function displayUI() {
  // Semi-transparent background for text
  noStroke();
  fill(0, 0, 0, 0.5);
  rect(10, 10, 300, 110, 10);
  
  // Display instructions and stats
  fill(255);
  text("Click and drag: " + (repulsionMode ? "Repel" : "Attract") + " particles", 20, 20);
  text("Press 'R' to toggle between attract/repel modes", 20, 45);
  text("Press 'A' to add particles, 'D' to remove", 20, 70);
  text("Particles: " + particles.length + " | FPS: " + frameRateVal, 20, 95);
}

/**
 * Particle class - represents a single particle in the system
 */
class Particle {
  constructor() {
    this.pos = createVector(random(width), random(height));
    this.vel = createVector(random(-maxSpeed, maxSpeed), random(-maxSpeed, maxSpeed));
    this.acc = createVector(0, 0);
    this.hue = random(360);
    this.baseSize = random(particleSize * 0.5, particleSize * 1.5);
    this.size = this.baseSize;
    this.pulseSpeed = random(0.02, 0.06);
    this.pulseOffset = random(TWO_PI);
  }
  
  update() {
    // Add mouse interaction - particles are attracted/repelled by mouse when pressed
    if (mouseIsPressed) {
      let mouse = createVector(mouseX, mouseY);
      let dir = p5.Vector.sub(mouse, this.pos);
      let distance = dir.mag();
      
      // Only apply force if mouse is not too close (prevents extreme acceleration)
      if (distance > 5) {
        dir.normalize();
        
        // Direction depends on mode (attract or repel)
        if (repulsionMode) {
          dir.mult(-1); // Reverse direction for repulsion
        }
        
        // Strength inversely proportional to distance (with limits)
        let strength = constrain(1 / (distance * 0.03), 0, 0.8);
        dir.mult(strength);
        
        this.acc = dir;
      }
    } else {
      this.acc = createVector(0, 0);
    }
    
    // Apply small random movement for more organic feel
    this.acc.add(p5.Vector.random2D().mult(0.01));
    
    // Update physics
    this.vel.add(this.acc);
    this.vel.limit(maxSpeed);
    this.pos.add(this.vel);
    
    // Apply slight drag for more natural movement
    this.vel.mult(0.99);
    
    // Wrap around edges
    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.y < 0) this.pos.y = height;
    if (this.pos.y > height) this.pos.y = 0;
    
    // Pulsing size effect
    this.size = this.baseSize + sin(frameCount * this.pulseSpeed + this.pulseOffset) * (this.baseSize * 0.3);
    
    // Gradually shift hue for color cycling effect
    this.hue = (this.hue + 0.1) % 360;
  }
  
  display() {
    // Create glowing effect with multiple layers
    for (let i = 3; i > 0; i--) {
      let alpha = map(i, 3, 1, 0.1, 0.8);
      let size = this.size * map(i, 3, 1, 2, 1);
      noStroke();
      fill(this.hue, 80, 100, alpha);
      ellipse(this.pos.x, this.pos.y, size);
    }
    
    // Core of the particle
    fill(this.hue, 80, 100, 1);
    ellipse(this.pos.x, this.pos.y, this.size * 0.7);
  }
}

/**
 * Boundary class - represents a rectangular area for the quadtree
 */
class Boundary {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
  
  contains(point) {
    return (
      point.pos.x >= this.x - this.w &&
      point.pos.x < this.x + this.w &&
      point.pos.y >= this.y - this.h &&
      point.pos.y < this.y + this.h
    );
  }
  
  intersects(range) {
    return !(
      range.x - range.r > this.x + this.w ||
      range.x + range.r < this.x - this.w ||
      range.y - range.r > this.y + this.h ||
      range.y + range.r < this.y - this.h
    );
  }
}

/**
 * Circle class - represents a circular query area for the quadtree
 */
class Circle {
  constructor(x, y, r) {
    this.x = x;
    this.y = y;
    this.r = r;
  }
}

/**
 * QuadTree class - spatial partitioning structure for efficient neighbor finding
 */
class QuadTree {
  constructor(boundary, capacity) {
    this.boundary = boundary;
    this.capacity = capacity;
    this.points = [];
    this.divided = false;
  }
  
  // Create four children nodes
  subdivide() {
    let x = this.boundary.x;
    let y = this.boundary.y;
    let w = this.boundary.w / 2;
    let h = this.boundary.h / 2;
    
    let ne = new Boundary(x + w, y - h, w, h);
    let nw = new Boundary(x - w, y - h, w, h);
    let se = new Boundary(x + w, y + h, w, h);
    let sw = new Boundary(x - w, y + h, w, h);
    
    this.northeast = new QuadTree(ne, this.capacity);
    this.northwest = new QuadTree(nw, this.capacity);
    this.southeast = new QuadTree(se, this.capacity);
    this.southwest = new QuadTree(sw, this.capacity);
    
    this.divided = true;
  }
  
  // Insert a point into the quadtree
  insert(point) {
    if (!this.boundary.contains(point)) {
      return false;
    }
    
    if (this.points.length < this.capacity) {
      this.points.push(point);
      return true;
    }
    
    if (!this.divided) {
      this.subdivide();
    }
    
    return (
      this.northeast.insert(point) ||
      this.northwest.insert(point) ||
      this.southeast.insert(point) ||
      this.southwest.insert(point)
    );
  }
  
  // Find all points within a circular range
  query(range, found) {
    if (!found) found = [];
    
    if (!this.boundary.intersects(range)) {
      return found;
    }
    
    for (let p of this.points) {
      let d = dist(range.x, range.y, p.pos.x, p.pos.y);
      if (d < range.r) {
        found.push(p);
      }
    }
    
    if (this.divided) {
      this.northeast.query(range, found);
      this.northwest.query(range, found);
      this.southeast.query(range, found);
      this.southwest.query(range, found);
    }
    
    return found;
  }
}

/**
 * Handle window resize events
 */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

/**
 * Handle keyboard input
 */
function keyPressed() {
  // Toggle between attraction and repulsion modes
  if (key === 'r' || key === 'R') {
    repulsionMode = !repulsionMode;
  }
  
  // Add particles with 'A' key
  if (key === 'a' || key === 'A') {
    for (let i = 0; i < 10; i++) {
      particles.push(new Particle());
    }
  }
  
  // Remove particles with 'D' key
  if ((key === 'd' || key === 'D') && particles.length > 10) {
    for (let i = 0; i < 10; i++) {
      particles.pop();
    }
  }
  
  // Toggle quadtree optimization with 'Q' key
  if (key === 'q' || key === 'Q') {
    useQuadtree = !useQuadtree;
  }
  
  // Space to clear all particles and start fresh
  if (key === ' ' && particles.length > 0) {
    particles = [];
    for (let i = 0; i < numParticles; i++) {
      particles.push(new Particle());
    }
  }
  
  return false; // Prevent default behavior
}
