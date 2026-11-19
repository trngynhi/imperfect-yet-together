const rectSize = 160;
const rectDict = {};
const maxItr = 160;

let xNum, yNum;
let ctx;

let colorStr = '#5FAAC0-#EACB35-#E65E59-#D65C9D-#A5B94A-#8869C5';
let palette = colorStr.split('-');

let quotes = [];
let displayQuote;

// bg texture for missing blocks
let texturedBg;

// random missing blocks
let missingBlocks = new Set();


// setup the canvas
async function setup() {
  const canvas = createCanvas(1920, 1080);

  // place canvas inside artwork section
  canvas.parent('canvas-container');

  // load quote boxes overlay
  quotes = await Promise.all([
    loadImage("assets/quote-box-01.png"),
    loadImage("assets/quote-box-02.png"),
    loadImage("assets/quote-box-03.png"),
    loadImage("assets/quote-box-04.png"),
    loadImage("assets/quote-box-05.png"),
    loadImage("assets/quote-box-06.png")
  ]);

  // load the textured image for missing blocks
  texturedBg = await loadImage("assets/textured-bg.png");

  xNum = int(width / rectSize);
  yNum = int(height / rectSize);

  ctx = drawingContext;

  initRects();
  generateMissingBlocks();

  // randomized quote on each refresh
  displayQuote = random(quotes);

  // setup scroll cue
  setupScrollCue();
}


// main drawing function
function draw() {
  background(255);
  noStroke();

  mergeRects(maxItr);

  drawRects();
  drawArcs();

  drawMissingBlocks();

  // Display randomized quote overlay
  image(displayQuote, 0, 0, width, height);

  noLoop();
}


// scroll cue
function setupScrollCue() {
  const scrollIndicator = document.getElementById('scroll-indicator');
  const artworkSection = document.getElementById('artwork-section');

  if (!scrollIndicator || !artworkSection) return;

  function updateScrollCue() {
    const artworkTop = artworkSection.getBoundingClientRect().top;

    // hide cue when the artwork section enters the screen
    if (artworkTop <= window.innerHeight) {
      scrollIndicator.classList.add('hidden');
    } else {
      scrollIndicator.classList.remove('hidden');
    }
  }

  window.addEventListener('scroll', updateScrollCue);
  updateScrollCue();
}

// based on The Parametric Terrance's original code, with further modifications and development for this assignment.
// STEP 1: initialize rectangles
function initRects() {
  for (let x = 0; x < xNum + 1; x++) {
    for (let y = 0; y < yNum + 1; y++) {
      rectDict[`${x},${y}`] = rectSize;
    }
  }
}

// make random missing blocks
function generateMissingBlocks() {
  let keys = Object.keys(rectDict);

  // percentage of randomly missing blocks
  let missingCount = int(keys.length * 0.12);

  while (missingBlocks.size < missingCount) {
    let randomKey = random(keys);
    missingBlocks.add(randomKey);
  }
}


// STEP 2: merge rectangles
function mergeRects(iter = 100) {
  let currIter = 0;

  while (currIter < iter) {
    let keys = Object.keys(rectDict);
    let randKey = random(keys);
    let currSize = rectDict[randKey];

    let choice = randKey.split(',');
    choice.forEach((d, i) => choice[i] = int(d));

    let newSpan = int(random(2, 4));

    // check if rectangles fit inside the canvas
    if (
      choice[0] + newSpan > xNum ||
      choice[1] + newSpan > yNum ||
      currSize > rectSize
    ) {
      currIter++;
      continue;
    }

    // check for overlapping rectangles
    let tobeDelete = [];
    let checkVals = [];

    for (let i = 0; i < newSpan; i++) {
      for (let j = 0; j < newSpan; j++) {
        let idx = `${choice[0] + i},${choice[1] + j}`;

        tobeDelete.push(idx);
        checkVals.push(rectDict[idx]);
      }
    }

    // prevent merging over missing blocks
    if (
      checkVals.includes(undefined) ||
      checkVals.some(d => d > rectSize) ||
      tobeDelete.some(d => missingBlocks.has(d))
    ) {
      currIter++;
      continue;
    }

    tobeDelete.forEach(d => delete rectDict[d]);
    rectDict[randKey] = newSpan * rectSize;

    currIter++;
  }
}


// STEP 3: draw rectangles
function drawRects() {
  noStroke();

  Object.entries(rectDict).forEach(entry => {
    let [k, size] = entry;
    let [x, y] = k.split(',');

    let xPos = int(x) * rectSize;
    let yPos = int(y) * rectSize;

    if (missingBlocks.has(k)) return;

    fill(random(palette));
    rect(xPos, yPos, size, size);
  });
}


// STEP 4: draw arcs
function drawArcs() {
  noStroke();

  Object.entries(rectDict).forEach(item => {
    let key = item[0];

    if (missingBlocks.has(key)) return;

    let pos = key.split(',');
    pos = pos.map(d => int(d));

    let startX = pos[0] * rectSize;
    let startY = pos[1] * rectSize;
    let size = item[1];

    let pts = [
      [startX, startY],
      [startX + size, startY],
      [startX + size, startY + size],
      [startX, startY + size]
    ];

    let largeRect = false;
    let i = int(random(0, 2));
    let step = 2;

    // large arcs
    if (size > 2 * rectSize + 0.1) {
      largeRect = true;
    }

    while (i < pts.length && largeRect) {
      fill(random(palette));

      arc(
        pts[i][0], pts[i][1],
        rectSize * 3, rectSize * 3,
        PI / 2 * i, PI / 2 * (i + 1),
        PIE
      );

      i += step;
    }

    // small arcs
    if (size > rectSize + 0.1) {
      i = 0;
      step = 1;
    }

    while (i < pts.length) {
      fill(random(palette));

      arc(
        pts[i][0], pts[i][1],
        rectSize, rectSize,
        PI / 2 * i, PI / 2 * (i + 1),
        PIE
      );

      i += step;
    }
  });
}

// STEP 5: draw textured missing blocks
function drawMissingBlocks() {
  noStroke();

  missingBlocks.forEach(key => {
    let pos = key.split(',');
    let x = int(pos[0]) * rectSize;
    let y = int(pos[1]) * rectSize;

    // use the textured image to fill in the missing blocks
    if (texturedBg) {
      image(texturedBg, x, y, rectSize, rectSize);
    } else {
      fill('#E8DFCE');
      rect(x, y, rectSize, rectSize);
    }
  });
}
