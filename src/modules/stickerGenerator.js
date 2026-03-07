/* ============================================================
   Stickers++ — AI Sticker Generation Module
   ============================================================
   Uses Azure AI Foundry FLUX-1.1-pro for real AI image generation.
   ============================================================ */

// ── Configuration ──────────────────────────────────────────
var AI_CONFIG = {
  endpoint: "https://FHL-2026.cognitiveservices.azure.com/openai/v1/images/generations",
  apiKey: __AZURE_AI_KEY__,
  model: "FLUX-1.1-pro",
};

// ── Public API ─────────────────────────────────────────────

export function generateStickerSet(prompt, count) {
  count = count || 8;
  var labels = buildLabels(prompt, count);
  return generateWithFlux(prompt, labels);
}

// ── Azure AI Foundry FLUX-1.1-pro ──────────────────────────

function generateWithFlux(prompt, labels) {
  var stickers = [];
  var queue = labels.slice();

  function nextBatch() {
    if (queue.length === 0) return Promise.resolve();
    // Generate 1 at a time (FLUX is fast)
    var label = queue.shift();
    var stickerPrompt = buildStickerPrompt(prompt, label);

    return fetch(AI_CONFIG.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": AI_CONFIG.apiKey,
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        prompt: stickerPrompt,
      }),
    })
    .then(function (res) {
      if (!res.ok) return res.text().then(function (t) { throw new Error("FLUX " + res.status + ": " + t); });
      return res.json();
    })
    .then(function (data) {
      var b64 = data.data[0].b64_json;
      stickers.push({
        id: "sticker-" + Date.now() + "-" + stickers.length,
        label: label,
        imageDataUrl: "data:image/jpeg;base64," + b64,
      });
    })
    .catch(function (err) {
      console.warn("FLUX failed for " + label + ":", err);
      // push a placeholder on failure
      stickers.push({
        id: "sticker-" + Date.now() + "-" + stickers.length,
        label: label,
        svg: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#f0f0f0"/><text x="50" y="55" text-anchor="middle" font-size="10" fill="#999">' + label + '</text></svg>',
      });
    })
    .then(nextBatch);
  }

  return nextBatch().then(function () {
    return { name: prompt, stickers: stickers };
  });
}

function buildStickerPrompt(setName, label) {
  var key = setName.toLowerCase().trim();
  var style = STYLE_MAPS[key] || null;
  if (style) {
    return label + ", " + style;
  }
  // Default generic sticker style
  return label + ", sticker illustration, clean white background, " +
    "die-cut sticker style, vibrant colors, no text, digital art";
}

// ── Style Maps (per-category prompt styling) ───────────────
var STYLE_MAPS = {
  "base 10 blocks": "realistic math manipulative, base ten blocks, educational classroom material, clean white background, 3D rendering, no text, simple and clear",
  "math manipulatives": "realistic math manipulative, educational classroom material, clean white background, 3D rendering, no text, simple and clear",
  "2d shapes": "geometric 2D shape, flat solid color, clean precise edges, mathematical diagram style, clean white background, no text, no face, no character, simple geometry",
  "2d shapes stickers": "geometric 2D shape, flat solid color, clean precise edges, mathematical diagram style, clean white background, no text, no face, no character, simple geometry",
  "3d shapes": "3D geometric solid shape, shaded realistic rendering, mathematical model, clean white background, no text, no face, no character, simple 3D geometry",
  "3d shapes stickers": "3D geometric solid shape, shaded realistic rendering, mathematical model, clean white background, no text, no face, no character, simple 3D geometry",
  "pusheen cat stickers": "cute Pusheen cat character, kawaii style, soft colors, thick outlines, clean white background, die-cut sticker, no text, adorable illustration",
  "pusheen": "cute Pusheen cat character, kawaii style, soft colors, thick outlines, clean white background, die-cut sticker, no text, adorable illustration",
  "orca whale stickers": "cute cartoon orca whale, kawaii ocean animal, vibrant blue and black, clean white background, die-cut sticker style, no text, playful illustration",
  "orcas": "cute cartoon orca whale, kawaii ocean animal, vibrant blue and black, clean white background, die-cut sticker style, no text, playful illustration",
  "gold stars and rewards": "shiny reward sticker, classroom achievement, metallic gold, clean white background, die-cut sticker, no text, simple illustration",
  "gold stars": "shiny reward sticker, classroom achievement, metallic gold, clean white background, die-cut sticker, no text, simple illustration",
  "checkmarks and corrections": "grading symbol, teacher correction mark, bold simple icon, clean white background, die-cut sticker, no text",
  "checkmarks": "grading symbol, teacher correction mark, bold simple icon, clean white background, die-cut sticker, no text",
  "science lab equipment": "realistic science lab equipment, educational illustration, clean white background, detailed diagram style, no text",
  "science lab": "realistic science lab equipment, educational illustration, clean white background, detailed diagram style, no text",
  "reading and books": "cozy reading illustration, books and literature, warm colors, clean white background, die-cut sticker style, no text, charming illustration",
  "reading": "cozy reading illustration, books and literature, warm colors, clean white background, die-cut sticker style, no text, charming illustration",
};

// ── Label Generation ───────────────────────────────────────

var LABEL_MAPS = {
  "pusheen cat stickers": ["Pusheen sleeping", "Pusheen eating pizza", "Pusheen with sunglasses", "Pusheen reading a book", "Pusheen as astronaut", "Pusheen with heart", "Pusheen dancing", "Pusheen with rainbow"],
  "pusheen": ["Pusheen sleeping", "Pusheen eating pizza", "Pusheen with sunglasses", "Pusheen reading a book", "Pusheen as astronaut", "Pusheen with heart", "Pusheen dancing", "Pusheen with rainbow"],
  "orca whale stickers": ["Orca jumping", "Orca swimming", "Baby orca with mom", "Orca breaching", "Orca blowing water", "Orca waving fin", "Orca with fish", "Orca pod"],
  "orcas": ["Orca jumping", "Orca swimming", "Baby orca with mom", "Orca breaching", "Orca blowing water", "Orca waving fin", "Orca with fish", "Orca pod"],
  "math manipulatives": ["Ones unit cube", "Tens rod", "Hundreds flat", "Counting cubes", "Fraction circles", "Number line", "Dice", "Calculator"],
  "base 10 blocks": ["Ones unit cube (single small cube)", "Tens rod (10 cubes in a row)", "Hundreds flat (10x10 grid of cubes)", "Ones and tens together", "Tens and hundreds together", "Place value chart with blocks", "Ones tens hundreds together", "Thousand cube (10x10x10)"],
  "2d shapes": ["Circle", "Square", "Triangle", "Rectangle", "Pentagon", "Hexagon", "Octagon", "Oval", "Rhombus", "Trapezoid", "Parallelogram", "Star"],
  "2d shapes stickers": ["Circle", "Square", "Triangle", "Rectangle", "Pentagon", "Hexagon", "Octagon", "Oval", "Rhombus", "Trapezoid", "Parallelogram", "Star"],
  "3d shapes": ["Sphere", "Cube", "Cylinder", "Cone", "Rectangular prism", "Triangular prism", "Pyramid", "Torus (donut shape)", "Hemisphere", "Triangular pyramid (tetrahedron)"],
  "3d shapes stickers": ["Sphere", "Cube", "Cylinder", "Cone", "Rectangular prism", "Triangular prism", "Pyramid", "Torus (donut shape)", "Hemisphere", "Triangular pyramid (tetrahedron)"],
  "gold stars and rewards": ["Gold star", "Silver star", "Trophy", "Thumbs up", "Crown", "Medal", "Ribbon", "Diamond"],
  "gold stars": ["Gold star", "Silver star", "Trophy", "Thumbs up", "Crown", "Medal", "Ribbon", "Diamond"],
  "checkmarks and corrections": ["Green checkmark", "Red X mark", "Question mark", "Exclamation point", "Circle mark", "Arrow pointer", "Highlight marker", "Smiley face"],
  "checkmarks": ["Green checkmark", "Red X mark", "Question mark", "Exclamation point", "Circle mark", "Arrow pointer", "Highlight marker", "Smiley face"],
  "encouraging messages": ["Great job ribbon", "Well done trophy", "Keep it up star", "Awesome fireworks", "Fantastic rainbow", "Brilliant lightbulb", "Nice work medal", "Super star badge"],
  "encouragement": ["Great job ribbon", "Well done trophy", "Keep it up star", "Awesome fireworks", "Fantastic rainbow", "Brilliant lightbulb", "Nice work medal", "Super star badge"],
  "science lab equipment": ["Beaker", "Test tube", "Microscope", "Magnet", "Atom model", "Planet", "Rocket", "Thermometer"],
  "science lab": ["Beaker", "Test tube", "Microscope", "Magnet", "Atom model", "Planet", "Rocket", "Thermometer"],
  "reading and books": ["Open book", "Stack of books", "Bookmark", "Reading glasses", "Pencil", "Scroll", "Lightbulb idea", "Wise owl"],
  "reading": ["Open book", "Stack of books", "Bookmark", "Reading glasses", "Pencil", "Scroll", "Lightbulb idea", "Wise owl"],
  "animals": ["Cute cat", "Happy dog", "Wise owl", "Jumping frog", "Baby penguin", "Smiling dolphin", "Friendly bear", "Little bunny"],
  "weather": ["Sunshine", "Rainbow", "Rain cloud", "Snowflake", "Lightning bolt", "Tornado", "Crescent moon", "Shooting star"],
  "food": ["Red apple", "Slice of pizza", "Ice cream cone", "Cupcake", "Banana", "Cookie", "Watermelon slice", "Donut"],
  "sports": ["Soccer ball", "Basketball", "Baseball bat", "Tennis racket", "Football", "Hockey stick", "Swimming goggles", "Gold medal"],
};

function buildLabels(prompt, count) {
  var key = prompt.toLowerCase().trim();
  if (LABEL_MAPS[key]) return LABEL_MAPS[key].slice(0, count);
  var labels = [];
  for (var i = 0; i < count; i++) {
    labels.push(prompt + " design " + (i + 1));
  }
  return labels;
}
