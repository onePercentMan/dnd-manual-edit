/* =====================================================
   ELEMENTS
   ===================================================== */

const nameEl  = document.querySelector('.name');
const editBtn = document.querySelector('.edit-btn');

/* HIT */
const hitCount = document.querySelector('.hit-count');
const hitMod   = document.querySelector('.hit-mod');
const hitOut   = document.querySelector('.hit-output');
const hitCopy  = document.querySelector('.hit-copy');
const hitAdv   = document.querySelector('.hit-adv');

/* DAMAGE */
const dmgCount = document.querySelector('.dmg-count');
const dmgDie   = document.querySelector('.dmg-die');
const dmgMod   = document.querySelector('.dmg-mod');
const dmgOut   = document.querySelector('.dmg-output');
const dmgCopy  = document.querySelector('.dmg-copy');

let editingName = false;

/* =====================================================
   COPY FEEDBACK
   ===================================================== */

function copyWithFeedback(button, text) {
  navigator.clipboard.writeText(text).then(() => {
    const original = button.innerText;
    button.innerText = 'Copied!';
    button.classList.add('copied');

    setTimeout(() => {
      button.innerText = original;
      button.classList.remove('copied');
    }, 1200);
  });
}

/* =====================================================
   LABEL HELPERS (TaleSpire chat syntax)
   ===================================================== */

function baseName() {
  return nameEl.innerText.trim();
}

function hitLabel(roll) {
  return `!${baseName()} Hit:${roll}`;
}

function dmgLabel(roll) {
  return `!${baseName()} Dmg:${roll}`;
}

/* =====================================================
   BUILDERS
   ===================================================== */

function buildHit(countOverride = null) {
  const count = countOverride ?? Number(hitCount.value);
  const mod   = Number(hitMod.value);

  let roll = `${count}d20`;
  if (mod > 0) roll += `+${mod}`;
  if (mod < 0) roll += `${mod}`;

  hitOut.innerText = roll;
  return roll;
}

function buildDamage() {
  let roll = `${dmgCount.value}d${dmgDie.value}`;

  if (dmgMod.value > 0) roll += `+${dmgMod.value}`;
  if (dmgMod.value < 0) roll += `${dmgMod.value}`;

  dmgOut.innerText = roll;
  return roll;
}

/* =====================================================
   ADV VALIDATION
   ===================================================== */

function updateAdv() {
  hitAdv.classList.toggle('disabled', Number(hitCount.value) !== 1);
}

/* =====================================================
   INPUT LISTENERS
   ===================================================== */

[hitCount, hitMod].forEach(el => {
  el.addEventListener('input', () => {
    buildHit();
    updateAdv();
    save();
  });
});

[dmgCount, dmgDie, dmgMod].forEach(el => {
  el.addEventListener('input', () => {
    buildDamage();
    save();
  });
});

/* =====================================================
   COPY ACTIONS
   ===================================================== */

hitCopy.addEventListener('click', () => {
  copyWithFeedback(hitCopy, hitLabel(buildHit()));
});

hitAdv.addEventListener('click', () => {
  if (hitAdv.classList.contains('disabled')) return;
  copyWithFeedback(hitAdv, hitLabel(buildHit(2)));
});

dmgCopy.addEventListener('click', () => {
  copyWithFeedback(dmgCopy, dmgLabel(buildDamage()));
});

/* =====================================================
   NAME EDIT
   ===================================================== */

editBtn.addEventListener('click', () => {
  editingName = !editingName;
  nameEl.contentEditable = editingName;

  if (editingName) {
    nameEl.focus();
  } else {
    localStorage.setItem('baseName', baseName());
  }

  editBtn.innerText = editingName ? 'Save' : 'Edit';
});

/* =====================================================
   PERSISTENCE
   ===================================================== */

function save() {
  /* NOTE: hitCount is intentionally NOT saved */
  localStorage.setItem('diceData', JSON.stringify({
    hitMod: hitMod.value,
    dmgCount: dmgCount.value,
    dmgDie: dmgDie.value,
    dmgMod: dmgMod.value
  }));
}

(function load() {
  const data = JSON.parse(localStorage.getItem('diceData') || '{}');
  const savedName = localStorage.getItem('baseName');

  if (savedName) nameEl.innerText = savedName;

  /* ALWAYS reset hit count to 1 */
  hitCount.value = 1;
  hitMod.value   = data.hitMod ?? 0;

  dmgCount.value = data.dmgCount ?? 1;
  dmgDie.value   = data.dmgDie ?? 8;
  dmgMod.value   = data.dmgMod ?? 0;

  buildHit();
  buildDamage();
  updateAdv();
})();
