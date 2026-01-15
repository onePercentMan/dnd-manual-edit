const app = document.getElementById("app");
const addBtn = document.getElementById("add");

const ACTIONS_KEY = "dice_actions";
const SKILLS_KEY = "dice_skills";
const ABILITIES_KEY = "dice_abilities";
const SAVES_KEY = "dice_saves";

/* =========================
   Helpers
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

function toast(message) {
  const t = document.createElement("div");
  t.className = "toast";
  t.innerText = message;

  // HARD position lock (fixes your issue)
  t.style.position = "fixed";
  t.style.bottom = "20px";
  t.style.right = "20px";
  t.style.zIndex = "9999";

  document.body.appendChild(t);

  // trigger animation AFTER insertion
  requestAnimationFrame(() => {
    t.classList.add("show");
  });

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
   ACTIONS
========================= */

function dieSelect(value = "4") {
  return `
    <select class="die">
      ${["4", "6", "8", "10", "12", "100"]
        .map(
          (d) =>
            `<option value="${d}" ${
              d === value ? "selected" : ""
            }>D${d}</option>`
        )
        .join("")}
    </select>
  `;
}

function damageRow(data = {}) {
  return `
    <div class="row dmg-row">
      <input class="damage-label" value="${data.label ?? "DMG"}">
      <input class="count" type="number" value="${data.count ?? 1}">
      ${dieSelect(data.die ?? "4")}
      <input class="mod" type="text" value="${data.mod ?? "0"}">
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
      <input class="name" value="${
        data.name ?? ""
      }" placeholder="Weapon / Action / Spell Name">
    </div>

    <div class="name-warning">⚠ Please name this action before using it</div>
    <div class="field-warning">⚠ Modifiers must be numbers only</div>

    <div class="roll">
      <div class="rollname">Hit</div>
      <div class="row">
        <span class="small">Modifier</span>
        <input class="hit-mod" type="text" value="${data.hitMod ?? "0"}">
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
    const invalid = mods.some((m) => !isValidModifier(m.value));
    el.classList.toggle("invalid-field", invalid);
    return invalid;
  }

  // restore saved damages
  (data.damages?.length ? data.damages : [{}]).forEach((d) =>
    dmgBox.insertAdjacentHTML("beforeend", damageRow(d))
  );

  // hit
  el.querySelector(".hit").onclick = (e) => {
    if (enforceName() || enforceModifier(hitMod)) return;
    copy(
      e.target,
      `!${nameInput.value} Hit:${formatRoll("1D20", hitMod.value)}`
    );
  };

  el.querySelector(".adv").onclick = (e) => {
    if (enforceName() || enforceModifier(hitMod)) return;
    copy(
      e.target,
      `!${nameInput.value} Hit:${formatRoll("2D20", hitMod.value)}`
    );
  };

  // delete action (FIXED)
  el.querySelector(".del-action").onclick = () => {
    const label = nameInput.value || "Unnamed Action";
    el.remove();
    saveActions();
    toast(`Deleted action: ${label}`);
  };

  el.querySelector(".add-dmg").onclick = () => {
    dmgBox.insertAdjacentHTML("beforeend", damageRow());
    bindDamage();
    saveActions();
  };

  function bindDamage() {
    dmgBox.querySelectorAll(".dmg-row").forEach((row) => {
      const btn = row.querySelector(".copy-dmg");
      const del = row.querySelector(".del-dmg");
      const label = row.querySelector(".damage-label");
      const count = row.querySelector(".count");
      const die = row.querySelector(".die");
      const mod = row.querySelector(".mod");

      btn.onclick = () => {
        if (enforceName() || enforceModifier(mod)) return;
        copy(
          btn,
          `!${nameInput.value} (${label.value}):${formatRoll(
            `${count.value}D${die.value}`,
            mod.value
          )}`
        );
      };

      del.onclick = () => {
        if (dmgBox.children.length <= 1) return;

        const dmgLabel = label.value || "DMG";
        const actionName = nameInput.value || "Unnamed Action";

        row.remove();
        saveActions();

        toast(`Deleted damage: ${dmgLabel} (from ${actionName})`);
      };

      [label, count, die, mod].forEach((i) => (i.oninput = saveActions));
    });
  }

  // FIX: warning now updates live
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
   Persistence
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
    })),
  }));
  localStorage.setItem(ACTIONS_KEY, JSON.stringify(actions));
}

function loadActions() {
  const saved = JSON.parse(localStorage.getItem(ACTIONS_KEY));
  if (saved) saved.forEach(createAction);
}

/* =========================
   TABLES (unchanged)
========================= */

function renderTable(containerId, rows, storageKey, suffix = "") {
  const box = document.getElementById(containerId);
  const saved = JSON.parse(localStorage.getItem(storageKey)) || {};

  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr><th>Name</th><th class="mod">Mod</th><th></th></tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector("tbody");

  rows.forEach((name) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${name}</td>
      <td class="mod"><input type="text" value="${saved[name] ?? "0"}"></td>
      <td class="copy"><button>Copy</button></td>
    `;

    const input = tr.querySelector("input");
    const btn = tr.querySelector("button");

    btn.onclick = () => {
      if (!isValidModifier(input.value)) return;
      copy(btn, `!${name}${suffix}:${formatRoll("1D20", input.value)}`);
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
