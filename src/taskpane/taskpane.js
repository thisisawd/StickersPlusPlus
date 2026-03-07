/* ============================================================
   Stickers++ — Main Taskpane Logic
   ============================================================ */

import "./taskpane.css";
import { generateStickerSet } from "../modules/stickerGenerator.js";
import { renderStickers, insertStickerIntoPage } from "../modules/stickerRenderer.js";
import { StickerPackStore } from "../modules/stickerStore.js";

// ── State ──────────────────────────────────────────────────
var currentView = "copilot"; // "copilot" | "loading" | "stickers"
var selectedSticker = null;
var selectedPackId = null;
var store = null;

// ── Helpers ────────────────────────────────────────────────
function getEl(id) {
  return document.getElementById(id);
}

// ── Initialization ─────────────────────────────────────────
/* global Office */
Office.onReady(function (info) {
  try {
    // Clear any sticker packs that have broken/placeholder images
    try {
      var rawPacks = JSON.parse(localStorage.getItem("stickersplusplus_packs") || "[]");
      var cleanPacks = rawPacks.filter(function (pack) {
        // Keep only packs where at least one sticker has a real image (not SVG placeholder)
        return pack.stickers && pack.stickers.some(function (s) {
          return s.imageDataUrl && s.imageDataUrl.length > 100;
        });
      });
      if (cleanPacks.length !== rawPacks.length) {
        localStorage.setItem("stickersplusplus_packs", JSON.stringify(cleanPacks));
        console.log("Cleaned " + (rawPacks.length - cleanPacks.length) + " broken sticker packs");
      }
    } catch (cleanErr) {
      console.warn("Pack cleanup error:", cleanErr);
    }

    store = new StickerPackStore();
    initApp();
  } catch (e) {
    // Show error in the page for debugging
    document.body.innerHTML = "<pre style='color:red;padding:20px;'>Init Error: " + e.message + "\n" + e.stack + "</pre>";
  }
});

function initApp() {
  // Bind events
  var btnGeneratePrompt = getEl("btn-generate-prompt");
  if (btnGeneratePrompt) btnGeneratePrompt.addEventListener("click", handleGenerate);
  getEl("btn-add").addEventListener("click", handleAddSticker);
  getEl("btn-delete").addEventListener("click", handleDeletePack);
  getEl("btn-generate").addEventListener("click", handleGenerateFromFooter);
  getEl("btn-copilot").addEventListener("click", function () { switchToCopilotView(); });

  // Enter key in prompt
  getEl("sticker-prompt").addEventListener("keydown", function (e) {
    if (e.key === "Enter") handleGenerate();
  });

  // Suggestion chips
  var chips = document.querySelectorAll(".suggestion-chip");
  for (var i = 0; i < chips.length; i++) {
    (function (chip) {
      chip.addEventListener("click", function () {
        getEl("sticker-prompt").value = chip.getAttribute("data-prompt");
        handleGenerate();
      });
    })(chips[i]);
  }

  // Load saved packs into sidebar
  loadSavedPacks();

  // Show copilot view by default
  showView("copilot");
}

// ── View Management ────────────────────────────────────────
function showView(name) {
  currentView = name;
  var viewIds = ["copilot", "loading", "stickers"];
  for (var i = 0; i < viewIds.length; i++) {
    var el = getEl("view-" + viewIds[i]);
    if (el) {
      if (viewIds[i] === name) {
        el.classList.remove("hidden");
      } else {
        el.classList.add("hidden");
      }
    }
  }
}

// ── Sidebar Management ─────────────────────────────────────
function loadSavedPacks() {
  var packs = store.getAllPacks();
  for (var i = 0; i < packs.length; i++) {
    addPackToSidebar(packs[i]);
  }
}

function addPackToSidebar(pack) {
  var sidebar = getEl("sidebar");
  var btn = document.createElement("button");
  btn.className = "sidebar-icon";
  btn.title = pack.name;
  btn.setAttribute("aria-label", pack.name);
  btn.setAttribute("data-pack-id", pack.id);

  // Use the first sticker's image as the pack icon, scaled down
  if (pack.stickers && pack.stickers.length > 0 && pack.stickers[0].svg) {
    var wrapper = document.createElement("div");
    wrapper.style.cssText = "width:36px;height:36px;display:flex;align-items:center;justify-content:center;overflow:hidden;";
    wrapper.innerHTML = pack.stickers[0].svg;
    var svgEl = wrapper.querySelector("svg");
    if (svgEl) {
      svgEl.setAttribute("width", "32");
      svgEl.setAttribute("height", "32");
      svgEl.style.maxWidth = "32px";
      svgEl.style.maxHeight = "32px";
    }
    btn.appendChild(wrapper);
  } else if (pack.stickers && pack.stickers.length > 0 && pack.stickers[0].imageDataUrl) {
    var img = document.createElement("img");
    img.src = pack.stickers[0].imageDataUrl;
    img.alt = pack.name;
    img.style.cssText = "width:32px;height:32px;object-fit:contain;";
    btn.appendChild(img);
  } else if (pack.stickers && pack.stickers.length > 0 && pack.stickers[0].imageUrl) {
    var img2 = document.createElement("img");
    img2.src = pack.stickers[0].imageUrl;
    img2.alt = pack.name;
    img2.style.cssText = "width:32px;height:32px;object-fit:contain;";
    btn.appendChild(img2);
  } else {
    btn.innerHTML = '<i class="ms-Icon ms-Icon--Sticker" style="font-size:24px;color:#7B2FF2;"></i>';
  }

  (function (packId) {
    btn.addEventListener("click", function () { selectPack(packId); });
  })(pack.id);
  sidebar.appendChild(btn);
}

function selectPack(packId) {
  selectedPackId = packId;
  selectedSticker = null;
  getEl("btn-add").style.display = "";
  getEl("btn-add").disabled = true;
  getEl("btn-generate-text").textContent = "Generate Again";

  // Update active states in sidebar
  var icons = document.querySelectorAll(".sidebar-icon");
  for (var i = 0; i < icons.length; i++) {
    icons[i].classList.remove("active");
  }
  var activeBtn = document.querySelector('[data-pack-id="' + packId + '"]');
  if (activeBtn) activeBtn.classList.add("active");

  // Show sticker grid
  var pack = store.getPack(packId);
  if (pack) {
    getEl("pack-title").textContent = pack.name;
    renderStickers(pack.stickers, getEl("sticker-grid"), handleStickerSelect);
    showView("stickers");
  }
}

function switchToCopilotView() {
  selectedPackId = null;
  selectedSticker = null;
  getEl("btn-add").style.display = "none";
  getEl("btn-generate-text").textContent = "Generate";

  var icons = document.querySelectorAll(".sidebar-icon");
  for (var i = 0; i < icons.length; i++) {
    icons[i].classList.remove("active");
  }
  getEl("btn-copilot").classList.add("active");

  getEl("sticker-prompt").value = "";
  showView("copilot");
}

// ── Sticker Selection ──────────────────────────────────────
function handleStickerSelect(sticker, element) {
  // Deselect previous
  var selected = document.querySelectorAll(".sticker-item.selected");
  for (var i = 0; i < selected.length; i++) {
    selected[i].classList.remove("selected");
  }

  selectedSticker = sticker;
  element.classList.add("selected");
  getEl("btn-add").disabled = false;
}

// ── Generation ─────────────────────────────────────────────
function handleGenerate() {
  var prompt = getEl("sticker-prompt").value.trim();
  if (!prompt) {
    getEl("sticker-prompt").focus();
    return;
  }

  // Show loading
  getEl("loading-subtext").textContent = 'Creating "' + prompt + '" sticker set';
  showView("loading");

  generateStickerSet(prompt).then(function (stickerSet) {
    // Save the pack
    var pack = store.addPack({
      name: stickerSet.name || prompt,
      prompt: prompt,
      stickers: stickerSet.stickers,
    });

    // Add to sidebar
    addPackToSidebar(pack);

    // Select the new pack
    selectPack(pack.id);

    showToast('"' + pack.name + '" sticker set created!');
  }).catch(function (error) {
    console.error("Failed to generate stickers:", error);
    showToast("Failed to generate stickers. Please try again.");
    showView("copilot");
  });
}

function handleGenerateFromFooter() {
  if (currentView === "stickers" && selectedPackId) {
    // Regenerate current pack
    var pack = store.getPack(selectedPackId);
    if (pack) {
      getEl("sticker-prompt").value = pack.prompt || pack.name;
    }
  }
  switchToCopilotView();
  getEl("sticker-prompt").focus();
}

function handleEditPack() {
  if (selectedPackId) {
    var pack = store.getPack(selectedPackId);
    if (pack) {
      getEl("sticker-prompt").value = pack.prompt || pack.name;
      switchToCopilotView();
      getEl("sticker-prompt").focus();
    }
  }
}

// ── Add Sticker to Page ────────────────────────────────────
function handleAddSticker() {
  if (!selectedSticker) return;

  insertStickerIntoPage(selectedSticker).then(function () {
    showToast("Sticker added to page!");
  }).catch(function (error) {
    console.error("Failed to add sticker:", error);
    showToast("Failed to add sticker. Please try again.");
  });
}

// ── Delete Pack ────────────────────────────────────────────
function handleDeletePack() {
  if (!selectedPackId) return;
  var pack = store.getPack(selectedPackId);
  var packName = pack ? pack.name : "";

  store.deletePack(selectedPackId);

  // Remove from sidebar
  var sidebarBtn = document.querySelector('[data-pack-id="' + selectedPackId + '"]');
  if (sidebarBtn) sidebarBtn.parentNode.removeChild(sidebarBtn);

  showToast('"' + packName + '" deleted.');
  switchToCopilotView();
}

// ── Toast Notification ─────────────────────────────────────
function showToast(message) {
  // Remove existing toast
  var existing = document.querySelector(".toast");
  if (existing) existing.parentNode.removeChild(existing);

  var toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  getEl("app").appendChild(toast);

  requestAnimationFrame(function () {
    toast.classList.add("show");
  });

  setTimeout(function () {
    toast.classList.remove("show");
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 2500);
}
