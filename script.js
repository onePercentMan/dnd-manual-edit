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
   HELPERS
========================= */

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
   ACTIONS
========================= */

function dieSelect(value = "4") {
  return `
    <select class="die" title="Type of die">
      ${["4", "6", "8", "10", "12", "100"]
        .map(d => `<option value="${d}" ${d === value ? "selected" : ""}>D${d}</option>`)
        .join("")}
    </select>
  `;
}

function damageTypeSelect(value = "") {
  return `
    <select
      class="dmg-type"
      title="Damage Type (ie: Slashing, Fire, Force, etc.)"
    >
      ${DAMAGE_TYPES.map(
        t => `<option value="${t}" ${t === value ? "selected" : ""}>${t || "Type"}</option>`
      ).join("")}
    </select>
  `;
}

function damageRow(data = {}) {
  return `
    <div class="row dmg-row">
      <input
        class="damage-label"
        value="${data.label ?? "DMG"}"
        title="Damage Label"
      >
      <input
        class="count"
        type="number"
        value="${data.count ?? 1}"
        title="Dice Count / Number of Dice"
      >
      ${dieSelect(data.die ?? "4")}
      <input
        class="mod"
        type="text"
        value="${data.mod ?? "0"}"
        title="Damage Modifier"
      >
      ${damageTypeSelect(data.type ?? "")}
      <button class="copy-dmg">Copy</button>
      <button class="del-dmg">✕</button>
    </div>
  `;
}

function createAction(data = {}) {
  const el = document.createElement("div");
  el.className = "action";

  el.innerHTML = `
    <div class="header">
      <button class="del-action">Delete</button>
      <input
        class="name"
        value="${data.name ?? ""}"
        placeholder="Weapon / Action / Spell Name"
      >
    </div>

    <div class="name-warning">⚠ Please name this action before using it</div>
    <div class="field-warning">⚠ Modifiers must be numbers only</div>

    <div class="roll">
      <div class="rollname">Hit</div>
      <div class="row">
        <span class="small">Modifier</span>
        <input
          class="hit-mod"
          type="text"
          value="${data.hitMod ?? "0"}"
          title="Modifier"
        >
        <button class="hit">Copy</button>
        <button class="adv">Adv/Dis</button>
      </div>
    </div>

    <div class="roll">
      <div class="rollname">Damage</div>
      <div class="damage-options"></div>
      <button class="add-dmg">Add Damage Option</button>
    </div>
  `;

  const nameInput = el.querySelector(".name");
  const hitMod = el.querySelector(".hit-mod");
  const dmgBox = el.querySelector(".damage-options");

  function enforceName() {
    const invalid = !nameInput.value.trim();
    el.classList.toggle("needs-name", invalid);
    return invalid;
  }

  function enforceModifier(...mods) {
    const invalid = mods.some(m => !isValidModifier(m.value));
    el.classList.toggle("invalid-field", invalid);
    return invalid;
  }

  (data.damages?.length ? data.damages : [{}]).forEach(d =>
    dmgBox.insertAdjacentHTML("beforeend", damageRow(d))
  );

  function bindDamage() {
    dmgBox.querySelectorAll(".dmg-row").forEach(row => {
      const btn = row.querySelector(".copy-dmg");
      const del = row.querySelector(".del-dmg");
      const label = row.querySelector(".damage-label");
      const count = row.querySelector(".count");
      const die = row.querySelector(".die");
      const mod = row.querySelector(".mod");
      const type = row.querySelector(".dmg-type");

      btn.onclick = () => {
        if (enforceName() || enforceModifier(mod)) return;

        const safeLabel = label.value.trim() || "DMG";
        const typeText = type.value ? ` [${type.value}]` : "";

        copy(
          btn,
          `!${nameInput.value} (${safeLabel}${typeText}):${formatRoll(
            `${count.value}D${die.value}`,
            mod.value
          )}`
        );
      };

      del.onclick = () => {
        if (dmgBox.children.length <= 1) return;
        row.remove();
        saveActions();
      };

      [label, count, die, mod, type].forEach(i => (i.oninput = saveActions));
    });
  }

  el.querySelector(".add-dmg").onclick = () => {
    dmgBox.insertAdjacentHTML("beforeend", damageRow());
    bindDamage();
    saveActions();
  };

  el.querySelector(".del-action").onclick = () => {
    el.remove();
    saveActions();
  };

  el.querySelector(".hit").onclick = e => {
    if (enforceName() || enforceModifier(hitMod)) return;
    copy(e.target, `!${nameInput.value} Hit:${formatRoll("1D20", hitMod.value)}`);
  };

  el.querySelector(".adv").onclick = e => {
    if (enforceName() || enforceModifier(hitMod)) return;
    copy(e.target, `!${nameInput.value} Hit:${formatRoll("2D20", hitMod.value)}`);
  };

  nameInput.oninput = saveActions;
  hitMod.oninput = saveActions;

  bindDamage();
  enforceName();
  app.appendChild(el);
}

/* =========================
   PERSISTENCE
========================= */

function saveActions() {
  const actions = [...document.querySelectorAll(".action")].map(a => ({
    name: a.querySelector(".name").value,
    hitMod: a.querySelector(".hit-mod").value,
    damages: [...a.querySelectorAll(".dmg-row")].map(r => ({
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
   TABLES
========================= */

function renderTable(containerId, rows, storageKey, suffix = "") {
  const box = document.getElementById(containerId);
  const saved = JSON.parse(localStorage.getItem(storageKey)) || {};

  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th>Name</th>
        <th class="mod">Mod</th>
        <th></th>
        <th></th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");

  rows.forEach(name => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${name}</td>
      <td class="mod">
        <input type="text" value="${saved[name] ?? "0"}">
      </td>
      <td class="copy">
        <button class="copy-btn">Copy</button>
      </td>
      <td class="copy">
        <button class="adv-btn">Adv/Dis</button>
      </td>
    `;

    const input = tr.querySelector("input");
    const copyBtn = tr.querySelector(".copy-btn");
    const advBtn = tr.querySelector(".adv-btn");

    function invalid() {
      return !isValidModifier(input.value);
    }

    copyBtn.onclick = () => {
      if (invalid()) return;
      copy(copyBtn, `!${name}${suffix}:${formatRoll("1D20", input.value)}`);
    };

    advBtn.onclick = () => {
      if (invalid()) return;
      copy(advBtn, `!${name}${suffix}:${formatRoll("2D20", input.value)}`);
    };

    input.oninput = () => {
      saved[name] = input.value;
      localStorage.setItem(storageKey, JSON.stringify(saved));
    };

    tbody.appendChild(tr);
  });

  box.appendChild(table);
}

/* =========================
   INIT
========================= */

addBtn.onclick = () => {
  createAction();
  saveActions();
};

loadActions();
if (!app.children.length) createAction();

renderTable(
  "skills",
  [
    "Athletics",
    "Acrobatics",
    "Stealth",
    "Perception",
    "Insight",
    "Investigation",
    "Arcana",
    "History",
    "Nature",
    "Religion",
    "Deception",
    "Intimidation",
    "Performance",
    "Persuasion",
    "Sleight of Hand",
    "Survival",
  ],
  SKILLS_KEY
);

renderTable(
  "abilities",
  ["STR", "DEX", "CON", "INT", "WIS", "CHA"],
  ABILITIES_KEY,
  " Check"
);

renderTable(
  "saves",
  ["STR", "DEX", "CON", "INT", "WIS", "CHA"],
  SAVES_KEY,
  " Save"
);
