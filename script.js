const app = document.getElementById("app");
const addBtn = document.getElementById("add");

const STORAGE_KEY = "dice_actions";

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

function dieSelect(value = "8") {
  return `
    <select class="die">
      ${["4","6","8","10","12"].map(d =>
        `<option value="${d}" ${d===value?"selected":""}>d${d}</option>`
      ).join("")}
    </select>
  `;
}

function damageRow(data = {}) {
  return `
    <div class="row dmg-row">
      <input class="damage-label" value="${data.label || "Damage"}">
      <input type="number" class="count" value="${data.count ?? 1}" min="1">
      ${dieSelect(data.die || "8")}
      <input type="number" class="mod" value="${data.mod ?? 0}">
      <button class="copy-dmg">Copy</button>
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
      <input class="name" value="${data.name || "New Action"}">
    </div>

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
  const hitMod = el.querySelector(".hit-mod");
  const dmgBox = el.querySelector(".damage-options");

  (data.damages?.length ? data.damages : [{}]).forEach(d =>
    dmgBox.insertAdjacentHTML("beforeend", damageRow(d))
  );

  el.querySelector(".hit").onclick = e =>
    copy(e.target, `!${nameInput.value} Hit:1d20+${hitMod.value}`);

  el.querySelector(".adv").onclick = e =>
    copy(e.target, `!${nameInput.value} Hit:2d20+${hitMod.value}`);

  el.querySelector(".add-dmg").onclick = () => {
    if (dmgBox.children.length >= 2) return;
    dmgBox.insertAdjacentHTML("beforeend", damageRow({ label: "Alt" }));
    bindDamage();
    saveAll();
  };

  function bindDamage() {
    dmgBox.querySelectorAll(".dmg-row").forEach(row => {
      const btn = row.querySelector(".copy-dmg");
      const label = row.querySelector(".damage-label");
      const count = row.querySelector(".count");
      const die = row.querySelector(".die");
      const mod = row.querySelector(".mod");

      btn.onclick = () => {
        let roll = `${count.value}d${die.value}`;
        if (mod.value > 0) roll += `+${mod.value}`;
        if (mod.value < 0) roll += mod.value;

        copy(btn, `!${nameInput.value} Dmg (${label.value}):${roll}`);
      };

      [label, count, die, mod].forEach(el =>
        el.addEventListener("input", saveAll)
      );
    });
  }

  [nameInput, hitMod].forEach(el =>
    el.addEventListener("input", saveAll)
  );

  bindDamage();
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
if (!app.children.length) createAction({ name: "True Name Trident" });