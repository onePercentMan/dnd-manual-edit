/* =====================================================
   ELEMENT REFERENCES
   ===================================================== */

/* Name */
const nameEl = document.querySelector('.name');
const editBtn = document.querySelector('.edit-btn');

/* HIT ROLL */
const hitCount = document.querySelector('.hit-count');
const hitMod = document.querySelector('.hit-mod');
const hitOut = document.querySelector('.hit-output');
const hitCopy = document.querySelector('.hit-copy');
const hitAdv = document.querySelector('.hit-adv');

/* DAMAGE ROLL */
const dmgCount = document.querySelector('.dmg-count');
const dmgDie = document.querySelector('.dmg-die');
const dmgMod = document.querySelector('.dmg-mod');
const dmgOut = document.querySelector('.dmg-output');
const dmgCopy = document.querySelector('.dmg-copy');

let editingName = false;

/* =====================================================
   ROLL BUILDERS
   ===================================================== */

function buildHit(countOverride = null) {
    const count = countOverride ?? Number(hitCount.value);
    const mod = Number(hitMod.value);

    let roll = `${count}D20`;

    if (mod > 0) roll += `+${mod}`;
    if (mod < 0) roll += `${mod}`;

    hitOut.innerText = roll;
    return roll;
}

function buildDamage() {
    const count = Number(dmgCount.value);
    const die = dmgDie.value;
    const mod = Number(dmgMod.value);

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
    const isValid = Number(hitCount.value) === 1;
    hitAdv.classList.toggle('disabled', !isValid);
}

/* =====================================================
   INPUT HANDLERS (ALWAYS LIVE)
   ===================================================== */

/* Hit inputs */
[hitCount, hitMod].forEach(el => {
    el.addEventListener('input', () => {
        buildHit();
        updateHitAdvState();
        saveDiceData();
    });
});

/* Damage inputs */
[dmgCount, dmgDie, dmgMod].forEach(el => {
    el.addEventListener('input', () => {
        buildDamage();
        saveDiceData();
    });
});

/* =====================================================
   COPY BUTTONS
   ===================================================== */

hitCopy.addEventListener('click', () => {
    navigator.clipboard.writeText(`!(${buildHit()})`);
});

hitAdv.addEventListener('click', () => {
    if (hitAdv.classList.contains('disabled')) return;
    navigator.clipboard.writeText(`!(${buildHit(2)})`);
});

dmgCopy.addEventListener('click', () => {
    navigator.clipboard.writeText(`!(${buildDamage()})`);
});

/* =====================================================
   NAME EDIT MODE (ONLY EDITABLE FIELD)
   ===================================================== */

editBtn.addEventListener('click', () => {
    editingName = !editingName;

    nameEl.contentEditable = editingName;

    if (editingName) {
        nameEl.focus();
    }


    if (!editingName) {
        localStorage.setItem('charName', nameEl.innerText.trim());
    }

    editBtn.innerText = editingName ? 'Save' : 'Edit';
});

/* =====================================================
   PERSISTENCE
   ===================================================== */

function saveDiceData() {
    localStorage.setItem('diceData', JSON.stringify({
        hitCount: hitCount.value,
        hitMod: hitMod.value,
        dmgCount: dmgCount.value,
        dmgDie: dmgDie.value,
        dmgMod: dmgMod.value
    }));
}

(function loadSavedData() {
    const diceData = JSON.parse(localStorage.getItem('diceData') || '{}');
    const savedName = localStorage.getItem('charName');

    if (savedName) nameEl.innerText = savedName;

    hitCount.value = diceData.hitCount ?? 1;
    hitMod.value = diceData.hitMod ?? 0;

    dmgCount.value = diceData.dmgCount ?? 1;
    dmgDie.value = diceData.dmgDie ?? 8;
    dmgMod.value = diceData.dmgMod ?? 0;

    buildHit();
    buildDamage();
    updateHitAdvState();
})();
