/* ============================================================
   Stickers++ — Sticker Renderer Module
   ============================================================
   Handles rendering stickers into the grid and inserting them
   into OneNote pages via the Office JS API.
   ============================================================ */

/**
 * Render an array of stickers into a grid container.
 */
export function renderStickers(stickers, container, onSelect) {
  container.innerHTML = "";

  for (var i = 0; i < stickers.length; i++) {
    (function (sticker) {
      var item = document.createElement("div");
      item.className = "sticker-item";
      item.setAttribute("role", "button");
      item.setAttribute("aria-label", sticker.label);
      item.tabIndex = 0;

      // Render SVG, base64 data URL, or remote image
      if (sticker.svg) {
        item.innerHTML = sticker.svg;
      } else if (sticker.imageDataUrl) {
        var img = document.createElement("img");
        img.src = sticker.imageDataUrl;
        img.alt = sticker.label;
        item.appendChild(img);
      } else if (sticker.imageUrl) {
        var img2 = document.createElement("img");
        img2.src = sticker.imageUrl;
        img2.alt = sticker.label;
        item.appendChild(img2);
      }

      // Label
      var label = document.createElement("span");
      label.className = "sticker-label";
      label.textContent = sticker.label;
      item.appendChild(label);

      // Click handler
      item.addEventListener("click", function () {
        if (onSelect) onSelect(sticker, item);
      });

      // Keyboard
      item.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (onSelect) onSelect(sticker, item);
        }
      });

      container.appendChild(item);
    })(stickers[i]);
  }
}

/**
 * Insert a sticker into the current OneNote page.
 */
export function insertStickerIntoPage(sticker) {
  if (sticker.svg) {
    return insertSvgSticker(sticker);
  } else if (sticker.imageDataUrl) {
    return insertDataUrlSticker(sticker);
  } else if (sticker.imageUrl) {
    return insertImageSticker(sticker);
  }
  return Promise.reject(new Error("No image data"));
}

function insertSvgSticker(sticker) {
  return svgToDataUrl(sticker.svg, 200, 200).then(function (dataUrl) {
    var base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
    return insertBase64IntoPage(base64);
  });
}

function insertDataUrlSticker(sticker) {
  var base64 = sticker.imageDataUrl.replace(/^data:image\/[a-z]+;base64,/, "");
  return insertBase64IntoPage(base64);
}

function insertImageSticker(sticker) {
  return imageUrlToBase64(sticker.imageUrl).then(function (base64) {
    return insertBase64IntoPage(base64);
  });
}

function insertBase64IntoPage(base64) {
  /* global OneNote */
  return OneNote.run(function (context) {
    var page = context.application.getActivePage();
    page.addOutline(100, 100,
      '<img src="data:image/png;base64,' + base64 + '" width="100" height="100" />');
    return context.sync();
  });
}

/**
 * Convert SVG string → PNG data URL via Canvas.
 */
function svgToDataUrl(svgString, width, height) {
  return new Promise(function (resolve, reject) {
    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");

    var img = new Image();
    var svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    var url = URL.createObjectURL(svgBlob);

    img.onload = function () {
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = function (err) {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

/**
 * Fetch a remote image URL and return base64.
 */
function imageUrlToBase64(imageUrl) {
  return fetch(imageUrl)
    .then(function (response) { return response.blob(); })
    .then(function (blob) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () { resolve(reader.result.split(",")[1]); };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    });
}
