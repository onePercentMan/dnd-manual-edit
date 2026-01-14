const app = document.getElementById("app");
const addBtn = document.getElementById("add");

const STORAGE_KEY = "dice_actions";

/* =========================
   Toast helper
========================= */

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = message;

  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 200);
  }, 5000);
}

/* =========================
   Clipboard helper
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

/* =========================
   UI builders
========================= */

function dieSelect(value = "4") {
  return `
    <select class="die">
      ${["4","6","8","10","12","100"].map(d =>
        `<option value="${d}" ${d === value ? "selected" : ""}>D${d}</option>`
      ).join("")}
    </select>
  `;
}

function damageRow(data = {}) {
  return `
    <div class="row dmg-row">
      <input class="damage-label" value="${data.label ?? "DMG"}">
      <input type="number" class="count" value="${data.count ?? 1}" min="1">
      ${dieSelect(data.die ?? "4")}
      <input type="number" class="mod" value="${data.mod ?? 0}">
      <button class="copy-dmg">Copy</button>
      <button class="del-dmg">✕</button>
    </div>
  `;
}

/* =========================
   Core action builder
========================= */

function createAction(data = {}) {
  const el = document.createElement("div");
  el.className = "action";

  el.innerHTML = `
    <div class="header">
      <button class="del-action">Delete</button>
      <input
        class="name"
        value="${data.name ?? ""}"
        placeholder="Weapon / Action / Spell Name">
    </div>

    <div class="name-warning">⚠ Please name this action before using it</div>

    <div class="roll">
      <div class="rollname">Hit</div>
      <div class="row">
        <span class="small">Modifier</span>
        <input type="number" class="hit-mod" value="${data.hitMod ?? 0}">
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
  const warning = el.querySelector(".name-warning");
  const hitMod = el.querySelector(".hit-mod");
  const dmgBox = el.querySelector(".damage-options");
  const delActionBtn = el.querySelector(".del-action");

  function nameMissing() {
    return !nameInput.value.trim();
  }

  function enforceName() {
    if (nameMissing()) {
      el.classList.add("needs-name");
      return true;
    }
    el.classList.remove("needs-name");
    return false;
  }

  (data.damages?.length ? data.damages : [{}]).forEach(d =>
    dmgBox.insertAdjacentHTML("beforeend", damageRow(d))
  );

  /* ---- Hit ---- */

  el.querySelector(".hit").onclick = e => {
    if (enforceName()) return;
    copy(e.target, `!${nameInput.value} Hit:1D20+${hitMod.value}`);
  };

  el.querySelector(".adv").onclick = e => {
    if (enforceName()) return;
    copy(e.target, `!${nameInput.value} Hit:2D20+${hitMod.value}`);
  };

  /* ---- Delete Action ---- */

  delActionBtn.onclick = () => {
    const actionName = nameInput.value || "Unnamed Action";
    el.remove();
    saveAll();
    showToast(`Deleted action "${actionName}"`);
  };

  /* ---- Damage ---- */

  el.querySelector(".add-dmg").onclick = () => {
    dmgBox.insertAdjacentHTML("beforeend", damageRow({ label: "DMG" }));
    bindDamage();
    saveAll();
  };

  function bindDamage() {
    dmgBox.querySelectorAll(".dmg-row").forEach(row => {
      const btn = row.querySelector(".copy-dmg");
      const del = row.querySelector(".del-dmg");
      const label = row.querySelector(".damage-label");
      const count = row.querySelector(".count");
      const die = row.querySelector(".die");
      const mod = row.querySelector(".mod");

      btn.onclick = () => {
        if (enforceName()) return;

        let roll = `${count.value}D${die.value}`;
        if (mod.value > 0) roll += `+${mod.value}`;
        if (mod.value < 0) roll += mod.value;

        copy(btn, `!${nameInput.value} (${label.value}):${roll}`);
      };

      del.onclick = () => {
        if (dmgBox.children.length <= 1) return;

        const deletedLabel = label.value || "DMG";
        const actionName = nameInput.value || "Unnamed Action";

        row.remove();
        saveAll();
        bindDamage();

        showToast(`Deleted "${deletedLabel}" damage from "${actionName}"`);
      };

      [label, count, die, mod].forEach(el =>
        el.addEventListener("input", () => {
          enforceName();
          saveAll();
        })
      );
    });
  }

  nameInput.addEventListener("input", () => {
    enforceName();
    saveAll();
  });

  hitMod.addEventListener("input", () => {
    enforceName();
    saveAll();
  });

  bindDamage();
  enforceName();
  app.appendChild(el);
}

/* =========================
   Persistence
========================= */

function saveAll() {
  const actions = [...document.querySelectorAll(".action")].map(a => ({
    name: a.querySelector(".name").value,
    hitMod: a.querySelector(".hit-mod").value,
    damages: [...a.querySelectorAll(".dmg-row")].map(r => ({
      label: r.querySelector(".damage-label").value,
      count: r.querySelector(".count").value,
      die: r.querySelector(".die").value,
      mod: r.querySelector(".mod").value
    }))
  }));

  localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
}

function loadAll() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (!saved) return;
  saved.forEach(createAction);
}

/* =========================
   Init
========================= */

addBtn.onclick = () => {
  createAction();
  saveAll();
};

loadAll();
if (!app.children.length) createAction();