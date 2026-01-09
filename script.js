/* =====================================================
   ELEMENT REFERENCES
   ===================================================== */

/* Base Name */
const nameEl  = document.querySelector('.name');
const editBtn = document.querySelector('.edit-btn');

/* HIT ROLL */
const hitCount = document.querySelector('.hit-count');
const hitMod   = document.querySelector('.hit-mod');
const hitOut   = document.querySelector('.hit-output');
const hitCopy  = document.querySelector('.hit-copy');
const hitAdv   = document.querySelector('.hit-adv');

/* DAMAGE ROLL */
const dmgCount = document.querySelector('.dmg-count');
const dmgDie   = document.querySelector('.dmg-die');
const dmgMod   = document.querySelector('.dmg-mod');
const dmgOut   = document.querySelector('.dmg-output');
const dmgCopy  = document.querySelector('.dmg-copy');

let editingName = false;

/* =====================================================
   COPY FEEDBACK HELPER
   ===================================================== */

function copyWithFeedback(button, text) {
  navigator.clipboard.writeText(text).then(() => {
    const originalText = button.innerText;

    button.innerText = 'Copied!';
    button.classList.add('copied');

    setTimeout(() => {
      button.innerText = originalText;
      button.classList.remove('copied');
    }, 1200);
  });
}

/* =====================================================
   LABEL HELPERS
   ===================================================== */

function getBaseName() {
  return nameEl.innerText.trim();
}

function formatHitOutput(roll) {
  const base = getBaseName();
  return base ? `${base} Hit !(${roll})` : `Hit !(${roll})`;
}

function formatDmgOutput(roll) {
  const base = getBaseName();
  return base ? `${base} Dmg !(${roll})` : `Dmg !(${roll})`;
}

/* =====================================================
   ROLL BUILDERS
   ===================================================== */

function buildHit(countOverride = null) {
  const count = countOverride ?? Number(hitCount.value);
  const mod   = Number(hitMod.value);

  let roll = `${count}D20`;
  if (mod > 0) roll += `+${mod}`;
  if (mod < 0) roll += `${mod}`;

  hitOut.innerText = roll;
  return roll;
}

function buildDamage() {
  const count = Number(dmgCount.value);
  const die   = dmgDie.value;
  const mod   = Number(dmgMod.value);

  let roll = `${count}D${die}`;
  if (mod > 0) roll += `+${mod}`;
  if (mod < 0) roll += `${mod}`;

  dmgOut.innerText = roll;
  return roll;
}

/* =====================================================
   ADV/DIS VALIDATION (HIT ONLY)
   ===================================================== */

function updateHitAdvState() {
  const valid = Number(hitCount.value) === 1;
  hitAdv.classList.toggle('disabled', !valid);
}

/* =====================================================
   INPUT HANDLERS
   ===================================================== */

[hitCount, hitMod].forEach(el => {
  el.addEventListener('input', () => {
    buildHit();
    updateHitAdvState();
    saveDiceData();
  });
});

[dmgCount, dmgDie, dmgMod].forEach(el => {
  el.addEventListener('input', () => {
    buildDamage();
    saveDiceData();
  });
});

/* =====================================================
   COPY BUTTONS (WITH FEEDBACK)
   ===================================================== */

hitCopy.addEventListener('click', () => {
  const roll = buildHit();
  copyWithFeedback(hitCopy, formatHitOutput(roll));
});

hitAdv.addEventListener('click', () => {
  if (hitAdv.classList.contains('disabled')) return;
  const roll = buildHit(2);
  copyWithFeedback(hitAdv, formatHitOutput(roll));
});

dmgCopy.addEventListener('click', () => {
  const roll = buildDamage();
  copyWithFeedback(dmgCopy, formatDmgOutput(roll));
});

/* =====================================================
   NAME EDIT MODE (ONLY EDITABLE FIELD)
   ===================================================== */

editBtn.addEventListener('click', () => {
  editingName = !editingName;
  nameEl.contentEditable = editingName;

  if (editingName) {
    nameEl.focus();
  } else {
    localStorage.setItem('baseName', nameEl.innerText.trim());
  }

  editBtn.innerText = editingName ? 'Save' : 'Edit';
});

/* =====================================================
   PERSISTENCE
   ===================================================== */

function saveDiceData() {
  localStorage.setItem('diceData', JSON.stringify({
    hitCount: hitCount.value,
    hitMod:   hitMod.value,
    dmgCount: dmgCount.value,
    dmgDie:   dmgDie.value,
    dmgMod:   dmgMod.value
  }));
}

(function loadSavedData() {
  const diceData  = JSON.parse(localStorage.getItem('diceData') || '{}');
  const savedName = localStorage.getItem('baseName');

  if (savedName) nameEl.innerText = savedName;

  hitCount.value = diceData.hitCount ?? 1;
  hitMod.value   = diceData.hitMod ?? 0;

  dmgCount.value = diceData.dmgCount ?? 1;
  dmgDie.value   = diceData.dmgDie ?? 8;
  dmgMod.value   = diceData.dmgMod ?? 0;

  buildHit();
  buildDamage();
  updateHitAdvState();
})();
