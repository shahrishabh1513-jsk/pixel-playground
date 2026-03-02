class ArcheryGame {
  constructor() {
    this.svg = document.querySelector("svg");
    this.cursor = this.svg.createSVGPoint();
    this.arrows = document.querySelector(".arrows");
    this.target = { x: 900, y: 249.5 };
    this.lineSegment = { x1: 875, y1: 280, x2: 925, y2: 220 };
    this.pivot = { x: 100, y: 250 };
    this.randomAngle = 0;
    this.shots = 0;
    this.bullseyes = 0;
    this.hits = 0;
    this.soundEnabled = true;
    this.isDragging = false;
    this.currentPower = 0;
    
    this.initializeEventListeners();
    this.initializeStats();
    this.createAudioElements();
    this.setupInitialAim();
  }

  setupInitialAim() {
    // Set initial aim point
    aim({ clientX: 320, clientY: 300 });
  }

  initializeEventListeners() {
    this.svg.addEventListener("mousedown", (e) => this.startDraw(e));
    this.svg.addEventListener("touchstart", (e) => {
      e.preventDefault();
      this.startDraw(e.touches[0]);
    });
    
    document.getElementById('resetGame').addEventListener('click', () => this.resetGame());
    document.getElementById('soundToggle').addEventListener('click', () => this.toggleSound());
    document.getElementById('infoBtn').addEventListener('click', () => this.showInfo());
  }

  initializeStats() {
    this.updateStats();
  }

  createAudioElements() {
    // Create simple audio contexts (using Web Audio API would be better, but keeping it simple)
    this.sounds = {
      draw: new Audio(),
      shoot: new Audio(),
      hit: new Audio(),
      bullseye: new Audio()
    };
    
    // Set volume
    Object.values(this.sounds).forEach(sound => {
      sound.volume = 0.2;
    });
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    const soundToggle = document.getElementById('soundToggle');
    soundToggle.innerHTML = this.soundEnabled ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
  }

  showInfo() {
    alert('🎯 ARCHERY MASTER\n\nClick and drag to draw the bow.\nRelease to shoot!\n\nBullseye = 10 points\nHit = 5 points');
  }

  playSound(type) {
    if (!this.soundEnabled) return;
    // Simple beep simulation (since we can't include actual audio files)
    console.log(`🔊 ${type} sound`);
  }

  startDraw(e) {
    this.isDragging = true;
    this.randomAngle = (Math.random() * Math.PI * 0.03) - 0.015;
    this.playSound('draw');
    
    TweenMax.to(".arrow-angle use", 0.3, { opacity: 1 });
    
    const aimHandler = (e) => this.aim(e);
    const stopHandler = () => this.release();
    
    window.addEventListener("mousemove", aimHandler);
    window.addEventListener("touchmove", (e) => this.aim(e.touches[0]));
    window.addEventListener("mouseup", stopHandler, { once: true });
    window.addEventListener("touchend", stopHandler, { once: true });
    
    this.aim(e);
  }

  aim(e) {
    if (!this.isDragging) return;
    
    const point = this.getMouseSVG(e);
    point.x = Math.min(point.x, this.pivot.x - 7);
    point.y = Math.max(point.y, this.pivot.y + 7);
    
    const dx = point.x - this.pivot.x;
    const dy = point.y - this.pivot.y;
    const angle = Math.atan2(dy, dx) + this.randomAngle;
    const bowAngle = angle - Math.PI;
    const distance = Math.min(Math.sqrt((dx * dx) + (dy * dy)), 50);
    const scale = Math.min(Math.max(distance / 30, 1), 2);
    
    // Update power meter
    this.currentPower = Math.round((distance / 50) * 100);
    document.getElementById('meterFill').style.width = this.currentPower + '%';
    
    TweenMax.to("#bow", 0.2, {
      scaleX: scale,
      rotation: bowAngle + "rad",
      transformOrigin: "right center",
      ease: Power2.easeOut
    });
    
    TweenMax.to(".arrow-angle", 0.2, {
      rotation: bowAngle + "rad",
      svgOrigin: "100 250",
      ease: Power2.easeOut
    });
    
    TweenMax.to(".arrow-angle use", 0.2, {
      x: -distance,
      ease: Power2.easeOut
    });
    
    TweenMax.to("#bow polyline", 0.2, {
      attr: {
        points: "88,200 " + Math.min(this.pivot.x - ((1 / scale) * distance), 88) + ",250 88,300"
      },
      ease: Power2.easeOut
    });

    const radius = distance * 9;
    const offset = {
      x: (Math.cos(bowAngle) * radius),
      y: (Math.sin(bowAngle) * radius)
    };
    const arcWidth = offset.x * 3;

    TweenMax.to("#arc", 0.2, {
      attr: {
        d: "M100,250c" + offset.x + "," + offset.y + "," + (arcWidth - offset.x) + "," + (offset.y + 50) + "," + arcWidth + ",50"
      },
      autoAlpha: distance/60,
      ease: Power2.easeOut
    });
  }

  release() {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    this.shots++;
    this.updateStats();
    this.playSound('shoot');
    
    // Hide instruction
    const instruction = document.getElementById('instruction');
    instruction.style.opacity = '0.3';
    
    window.removeEventListener("mousemove", this.aim);
    window.removeEventListener("touchmove", this.aim);

    TweenMax.to("#bow", 0.4, {
      scaleX: 1,
      transformOrigin: "right center",
      ease: Elastic.easeOut.config(1, 0.3)
    });
    
    TweenMax.to("#bow polyline", 0.4, {
      attr: {
        points: "88,200 88,250 88,300"
      },
      ease: Elastic.easeOut.config(1, 0.3)
    });

    // Create and shoot arrow
    this.shootArrow();
    
    TweenMax.to("#arc", 0.3, {
      opacity: 0,
      delay: 0.2
    });
    
    TweenMax.set(".arrow-angle use", {
      opacity: 0
    });
    
    // Reset power meter
    document.getElementById('meterFill').style.width = '0%';
  }

  shootArrow() {
    const newArrow = document.createElementNS("http://www.w3.org/2000/svg", "use");
    newArrow.setAttributeNS('http://www.w3.org/1999/xlink', 'href', "#arrow");
    this.arrows.appendChild(newArrow);

    const path = MorphSVGPlugin.pathDataToBezier("#arc");
    
    TweenMax.to([newArrow], 0.5, {
      force3D: true,
      bezier: {
        type: "cubic",
        values: path,
        autoRotate: ["x", "y", "rotation"]
      },
      onUpdate: () => this.checkHit(newArrow),
      onComplete: () => this.onMiss(),
      ease: Linear.easeNone
    });
  }

  checkHit(arrow) {
    const transform = arrow._gsTransform;
    if (!transform) return;
    
    const radians = transform.rotation * Math.PI / 180;
    
    const arrowSegment = {
      x1: transform.x,
      y1: transform.y,
      x2: (Math.cos(radians) * 60) + transform.x,
      y2: (Math.sin(radians) * 60) + transform.y
    };

    const intersection = this.getIntersection(arrowSegment, this.lineSegment);
    
    if (intersection && intersection.segment1 && intersection.segment2) {
      TweenMax.pauseAll();
      
      const dx = intersection.x - this.target.x;
      const dy = intersection.y - this.target.y;
      const distance = Math.sqrt((dx * dx) + (dy * dy));
      
      if (distance < 7) {
        this.bullseyes++;
        this.playSound('bullseye');
        this.showMessage('bullseye');
        
        // Show bullseye graphics
        TweenMax.to(".bullseye-graphics", 0.3, { opacity: 1, scale: 1.2, ease: Back.easeOut });
        TweenMax.to(".bullseye-graphics", 0.3, { delay: 1, opacity: 0, scale: 1 });
      } else if (distance < 20) {
        this.hits++;
        this.playSound('hit');
        this.showMessage('hit');
        
        // Show hit graphics
        TweenMax.to(".hit-graphics", 0.3, { opacity: 1, scale: 1.2, ease: Back.easeOut });
        TweenMax.to(".hit-graphics", 0.3, { delay: 1, opacity: 0, scale: 1 });
      }
      
      this.updateStats();
    }
  }

  onMiss() {
    if (this.shots > this.hits + this.bullseyes) {
      this.showMessage('miss');
      
      // Show miss graphics
      TweenMax.to(".miss-graphics", 0.3, { opacity: 1, scale: 1.2, ease: Back.easeOut });
      TweenMax.to(".miss-graphics", 0.3, { delay: 1, opacity: 0, scale: 1 });
    }
  }

  showMessage(type) {
    const selector = `.message.${type}`;
    
    TweenMax.killTweensOf(selector);
    
    TweenMax.set(selector, { opacity: 1 });
    
    TweenMax.fromTo(selector, 0.4, {
      scale: 0.5,
      opacity: 0
    }, {
      scale: 1.2,
      opacity: 1,
      ease: Back.easeOut.config(2)
    });
    
    TweenMax.to(selector, 0.3, {
      delay: 1,
      scale: 0.5,
      opacity: 0,
      ease: Back.easeIn
    });
  }

  updateStats() {
    const accuracy = this.shots > 0 ? Math.round(((this.hits + this.bullseyes) / this.shots) * 100) : 0;
    
    document.getElementById('accuracy').textContent = accuracy + '%';
    document.getElementById('bullseyeCount').textContent = this.bullseyes;
    document.getElementById('shotCount').textContent = this.shots;
  }

  resetGame() {
    this.shots = 0;
    this.bullseyes = 0;
    this.hits = 0;
    this.updateStats();
    
    // Clear all arrows
    while (this.arrows.firstChild) {
      this.arrows.removeChild(this.arrows.firstChild);
    }
    
    // Reset bow
    TweenMax.set("#bow", {
      scaleX: 1,
      rotation: 0
    });
    
    TweenMax.set("#bow polyline", {
      attr: {
        points: "88,200 88,250 88,300"
      }
    });
    
    TweenMax.set(".arrow-angle use", {
      x: 0,
      opacity: 0
    });
    
    TweenMax.set("#arc", {
      opacity: 0
    });
    
    // Reset instruction
    const instruction = document.getElementById('instruction');
    instruction.style.opacity = '1';
    
    // Reset power meter
    document.getElementById('meterFill').style.width = '0%';
    
    // Hide all messages
    TweenMax.set(".message, .miss-graphics, .hit-graphics, .bullseye-graphics", { opacity: 0 });
  }

  getMouseSVG(e) {
    this.cursor.x = e.clientX;
    this.cursor.y = e.clientY;
    return this.cursor.matrixTransform(this.svg.getScreenCTM().inverse());
  }

  getIntersection(segment1, segment2) {
    const dx1 = segment1.x2 - segment1.x1;
    const dy1 = segment1.y2 - segment1.y1;
    const dx2 = segment2.x2 - segment2.x1;
    const dy2 = segment2.y2 - segment2.y1;
    const cx = segment1.x1 - segment2.x1;
    const cy = segment1.y1 - segment2.y1;
    const denominator = dy2 * dx1 - dx2 * dy1;
    
    if (Math.abs(denominator) < 0.000001) return null;
    
    const ua = (dx2 * cy - dy2 * cx) / denominator;
    const ub = (dx1 * cy - dy1 * cx) / denominator;
    
    return {
      x: segment1.x1 + ua * dx1,
      y: segment1.y1 + ua * dy1,
      segment1: ua >= 0 && ua <= 1,
      segment2: ub >= 0 && ub <= 1
    };
  }
}

// Keep original functions for compatibility with the reference code
var svg = document.querySelector("svg");
var cursor = svg.createSVGPoint();
var arrows = document.querySelector(".arrows");
var randomAngle = 0;
var target = { x: 900, y: 249.5 };
var lineSegment = { x1: 875, y1: 280, x2: 925, y2: 220 };
var pivot = { x: 100, y: 250 };

function aim(e) {
  var point = getMouseSVG(e);
  point.x = Math.min(point.x, pivot.x - 7);
  point.y = Math.max(point.y, pivot.y + 7);
  var dx = point.x - pivot.x;
  var dy = point.y - pivot.y;
  var angle = Math.atan2(dy, dx) + randomAngle;
  var bowAngle = angle - Math.PI;
  var distance = Math.min(Math.sqrt((dx * dx) + (dy * dy)), 50);
  var scale = Math.min(Math.max(distance / 30, 1), 2);
  
  TweenMax.to("#bow", 0.3, {
    scaleX: scale,
    rotation: bowAngle + "rad",
    transformOrigin: "right center"
  });
  
  TweenMax.to(".arrow-angle", 0.3, {
    rotation: bowAngle + "rad",
    svgOrigin: "100 250"
  });
  
  TweenMax.to(".arrow-angle use", 0.3, {
    x: -distance
  });
  
  TweenMax.to("#bow polyline", 0.3, {
    attr: {
      points: "88,200 " + Math.min(pivot.x - ((1 / scale) * distance), 88) + ",250 88,300"
    }
  });

  var radius = distance * 9;
  var offset = {
    x: (Math.cos(bowAngle) * radius),
    y: (Math.sin(bowAngle) * radius)
  };
  var arcWidth = offset.x * 3;

  TweenMax.to("#arc", 0.3, {
    attr: {
      d: "M100,250c" + offset.x + "," + offset.y + "," + (arcWidth - offset.x) + "," + (offset.y + 50) + "," + arcWidth + ",50"
    },
    autoAlpha: distance/60
  });
}

function getMouseSVG(e) {
  cursor.x = e.clientX;
  cursor.y = e.clientY;
  return cursor.matrixTransform(svg.getScreenCTM().inverse());
}

function getIntersection(segment1, segment2) {
  var dx1 = segment1.x2 - segment1.x1;
  var dy1 = segment1.y2 - segment1.y1;
  var dx2 = segment2.x2 - segment2.x1;
  var dy2 = segment2.y2 - segment2.y1;
  var cx = segment1.x1 - segment2.x1;
  var cy = segment1.y1 - segment2.y1;
  var denominator = dy2 * dx1 - dx2 * dy1;
  if (denominator == 0) return null;
  
  var ua = (dx2 * cy - dy2 * cx) / denominator;
  var ub = (dx1 * cy - dy1 * cx) / denominator;
  return {
    x: segment1.x1 + ua * dx1,
    y: segment1.y1 + ua * dy1,
    segment1: ua >= 0 && ua <= 1,
    segment2: ub >= 0 && ub <= 1
  };
}

// Initialize game
document.addEventListener("DOMContentLoaded", () => {
  window.game = new ArcheryGame();
});