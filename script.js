const app = document.getElementById("app");
const addBtn = document.getElementById("add");

const ACTIONS_KEY = "dice_actions";
const SKILLS_KEY = "dice_skills";
const ABILITIES_KEY = "dice_abilities";
const SAVES_KEY = "dice_saves";

/* =========================
   DAMAGE TYPES
========================= */

const DAMAGE_TYPES = [
  "",
  "Bludgeoning",
  "Piercing",
  "Slashing",
  "Fire",
  "Cold",
  "Lightning",
  "Thunder",
  "Acid",
  "Poison",
  "Necrotic",
  "Radiant",
  "Psychic",
  "Force",
];

/* =========================
   TEXT MEASUREMENT
========================= */

function measureTextWidth(text, font) {
  const canvas =
    measureTextWidth.canvas ||
    (measureTextWidth.canvas = document.createElement("canvas"));
  const ctx = canvas.getContext("2d");
  ctx.font = font;
  return ctx.measureText(text).width;
}

function sizeDamageTypeSelects() {
  const sample = document.querySelector(".dmg-type");
  if (!sample) return;

  const style = getComputedStyle(sample);
  const font = `${style.fontSize} ${style.fontFamily}`;

  let max = 0;
  DAMAGE_TYPES.forEach((t) => {
    if (!t) return;
    max = Math.max(max, measureTextWidth(t, font));
  });

  const finalWidth = Math.ceil(max) + 36;

  document.querySelectorAll(".dmg-type").forEach((sel) => {
    sel.style.width = `${finalWidth}px`;
  });
}

function resizeDamageTypesNextFrame() {
  requestAnimationFrame(() => sizeDamageTypeSelects());
}

/* =========================
   HELPERS
========================= */

function normalize(text) {
  return (text || "").toLowerCase();
}

function copy(btn, text) {
  navigator.clipboard.writeText(text).then(() => {
    const t = btn.innerText;
    btn.innerText = "Copied!";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.innerText = t;
      btn.classList.remove("copied");
    }, 1000);
  });
}

function toast(message) {
  const t = document.createElement("div");
  t.className = "toast";
  t.innerText = message;
  t.style.position = "fixed";
  t.style.bottom = "20px";
  t.style.right = "20px";
  t.style.zIndex = "9999";

  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));

  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 200);
  }, 2000);
}

function formatRoll(base, mod) {
  const m = Number(mod);
  if (m > 0) return `${base}+${m}`;
  if (m < 0) return `${base}${m}`;
  return base;
}

function isValidModifier(value) {
  return /^-?\d+$/.test(value);
}

/* =========================
   ACTION SEARCH
========================= */

function filterActions(query) {
  const q = normalize(query);

  document.querySelectorAll(".action").forEach((action) => {
    if (!q) {
      action.style.display = "";
      return;
    }

    const name = normalize(action.querySelector(".name")?.value);
    let match = name.includes(q);

    if (!match) {
      action.querySelectorAll(".dmg-row").forEach((row) => {
        const label = normalize(row.querySelector(".damage-label")?.value);
        const type = normalize(row.querySelector(".dmg-type")?.value);
        if (label.includes(q) || type.includes(q)) match = true;
      });
    }

    action.style.display = match ? "" : "none";
  });
}

/* =========================
   ACTIONS
========================= */

function dieSelect(value = "4") {
  return `
    <select class="die">
      ${["4", "6", "8", "10", "12", "100"]
        .map(
          (d) =>
            `<option value="${d}" ${d === value ? "selected" : ""}>D${d}</option>`,
        )
        .join("")}
    </select>
  `;
}

function damageTypeSelect(value = "") {
  return `
    <select class="dmg-type">
      ${DAMAGE_TYPES.map(
        (t) =>
          `<option value="${t}" ${t === value ? "selected" : ""}>${t || "Type"}</option>`,
      ).join("")}
    </select>
  `;
}

function damageRow(data = {}) {
  return `
    <div class="row dmg-row">
      <input class="damage-label" value="${data.label ?? "DMG"}">

      <div class="dmg-line">
        <input class="count" type="number" value="${data.count ?? 1}">
        ${dieSelect(data.die ?? "4")}
        <input class="mod" type="text" value="${data.mod ?? "0"}">
        ${damageTypeSelect(data.type ?? "")}
      </div>

      <div class="dmg-actions">
        <button class="copy-dmg">Copy</button>
        <button class="del-dmg">✕</button>
      </div>
    </div>
  `;
}


function createAction(data = {}) {
  const el = document.createElement("div");
  el.className = "action";

  el.innerHTML = `
    <div class="header">
      <button class="del-action">Delete</button>
      <button class="add-dmg">Add Damage Option</button>
      <input class="name" value="${data.name ?? ""}" placeholder="Weapon / Action / Spell Name">
    </div>

    <div class="name-warning">⚠ Please name this action before using it</div>
    <div class="field-warning">⚠ Modifiers must be numbers only</div>

    <div class="roll">
      <div class="rollname">Hit</div>
      <div class="row">
        <span class="small">Modifier</span>
        <input class="hit-mod" type="text" value="${data.hitMod ?? "0"}">
        <div class="dmg-buttons">
          <button class="hit">Copy</button>
          <button class="adv">Adv/Dis</button>
        </div>
      </div>
    </div>

    <div class="roll">
      <div class="rollname">Damage</div>
      <div class="damage-options"></div>
    </div>
  `;

  const nameInput = el.querySelector(".name");
  const hitMod = el.querySelector(".hit-mod");
  const dmgBox = el.querySelector(".damage-options");

  function enforceName() {
    const bad = !nameInput.value.trim();
    el.classList.toggle("needs-name", bad);
    return bad;
  }

  (data.damages?.length ? data.damages : [{}]).forEach((d) =>
    dmgBox.insertAdjacentHTML("beforeend", damageRow(d)),
  );

  function bindDamage() {
    dmgBox.querySelectorAll(".dmg-row").forEach((row) => {
      const label = row.querySelector(".damage-label");
      const count = row.querySelector(".count");
      const die = row.querySelector(".die");
      const mod = row.querySelector(".mod");
      const type = row.querySelector(".dmg-type");
      const copyBtn = row.querySelector(".copy-dmg");
      const delBtn = row.querySelector(".del-dmg");

      copyBtn.onclick = () => {
        if (enforceName() || !isValidModifier(mod.value)) return;
        const safeLabel = label.value.trim() || "DMG";
        const typeText = type.value ? ` [${type.value}]` : "";
        copy(
          copyBtn,
          `!${nameInput.value} (${safeLabel}${typeText}):${formatRoll(
            `${count.value}D${die.value}`,
            mod.value,
          )}`,
        );
      };

      delBtn.onclick = () => {
        if (dmgBox.children.length <= 1) return;
        const dmgLabel = label.value || "DMG";
        row.remove();
        saveActions();
        toast(
          `Deleted damage: ${dmgLabel} (from ${nameInput.value || "Unnamed Action"})`,
        );
      };

      [label, count, die, mod].forEach((i) => (i.oninput = saveActions));
      type.onchange = () => {
        saveActions();
        resizeDamageTypesNextFrame();
      };
    });

    resizeDamageTypesNextFrame();
  }

  el.querySelector(".add-dmg").onclick = () => {
    dmgBox.insertAdjacentHTML("beforeend", damageRow());
    bindDamage();
    saveActions();
  };

  el.querySelector(".del-action").onclick = () => {
    el.remove();
    saveActions();
    toast(`Deleted action: ${nameInput.value || "Unnamed Action"}`);
  };

  el.querySelector(".hit").onclick = (e) => {
    if (enforceName()) return;
    copy(
      e.target,
      `!${nameInput.value} Hit:${formatRoll("1D20", hitMod.value)}`,
    );
  };

  el.querySelector(".adv").onclick = (e) => {
    if (enforceName()) return;
    copy(
      e.target,
      `!${nameInput.value} Hit:${formatRoll("2D20", hitMod.value)}`,
    );
  };

  nameInput.oninput = () => {
    enforceName();
    saveActions();
  };

  hitMod.oninput = saveActions;

  bindDamage();
  enforceName();
  app.appendChild(el);
}

/* =========================
   PERSISTENCE
========================= */

function saveActions() {
  const actions = [...document.querySelectorAll(".action")].map((a) => ({
    name: a.querySelector(".name").value,
    hitMod: a.querySelector(".hit-mod").value,
    damages: [...a.querySelectorAll(".dmg-row")].map((r) => ({
      label: r.querySelector(".damage-label").value,
      count: r.querySelector(".count").value,
      die: r.querySelector(".die").value,
      mod: r.querySelector(".mod").value,
      type: r.querySelector(".dmg-type").value,
    })),
  }));
  localStorage.setItem(ACTIONS_KEY, JSON.stringify(actions));
}

function loadActions() {
  const saved = JSON.parse(localStorage.getItem(ACTIONS_KEY));
  if (saved) saved.forEach(createAction);
}

/* =========================
   TABLES + INIT
========================= */

function renderTable(containerId, rows, storageKey, suffix = "") {
  const box = document.getElementById(containerId);
  const saved = JSON.parse(localStorage.getItem(storageKey)) || {};

  rows.forEach((name) => {
    if (!isValidModifier(saved[name])) saved[name] = "0";
  });
  localStorage.setItem(storageKey, JSON.stringify(saved));

  const table = document.createElement("table");
  table.innerHTML = `
    <thead><tr><th>Name</th><th class="mod">Mod</th><th></th><th></th></tr></thead>
    <tbody></tbody>
  `;

  rows.forEach((name) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${name}</td>
      <td class="mod"><input type="text" value="${saved[name]}"></td>
      <td><button class="copy-btn">Copy</button></td>
      <td><button class="adv-btn">Adv/Dis</button></td>
    `;
    const input = tr.querySelector("input");

    tr.querySelector(".copy-btn").onclick = (e) =>
      copy(e.target, `!${name}${suffix}:${formatRoll("1D20", input.value)}`);

    tr.querySelector(".adv-btn").onclick = (e) =>
      copy(e.target, `!${name}${suffix}:${formatRoll("2D20", input.value)}`);

    input.oninput = () => {
      saved[name] = input.value;
      localStorage.setItem(storageKey, JSON.stringify(saved));
    };

    table.querySelector("tbody").appendChild(tr);
  });

  box.appendChild(table);
}

/* INIT */

addBtn.onclick = () => {
  createAction();
  saveActions();
};

document.getElementById("action-search").oninput = (e) =>
  filterActions(e.target.value);

loadActions();
if (!app.children.length) createAction();

renderTable(
  "skills",
  [
    "Acrobatics",
    "Animal Handling",
    "Arcana",
    "Athletics",
    "Deception",
    "History",
    "Insight",
    "Intimidation",
    "Investigation",
    "Medicine",
    "Nature",
    "Perception",
    "Performance",
    "Persuasion",
    "Religion",
    "Sleight of Hand",
    "Stealth",
    "Survival",
  ],
  SKILLS_KEY,
);

renderTable(
  "abilities",
  ["STR", "DEX", "CON", "INT", "WIS", "CHA"],
  ABILITIES_KEY,
  " Check",
);
renderTable(
  "saves",
  ["STR", "DEX", "CON", "INT", "WIS", "CHA"],
  SAVES_KEY,
  " Save",
);

resizeDamageTypesNextFrame();
