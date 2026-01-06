/* =========================
   NORMAL COPY BUTTON
   ========================= */
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.classList.contains('disabled')) return;

    const valueEl = btn.previousElementSibling;
    const rawText = valueEl.innerText.trim();

    copyWithFeedback(btn, `!(${rawText})`);
  });
});

/* =========================
   ADV / DIS COPY BUTTON
   ========================= */
document.querySelectorAll('.adv-copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.classList.contains('disabled')) return;

    // span is two siblings back: [span][copy][adv]
    const valueEl = btn.previousElementSibling.previousElementSibling;
    const rawText = valueEl.innerText.trim();

    // Convert leading 1D → 2D
    const advText = rawText.replace(/^1D/i, '2D');

    copyWithFeedback(btn, `!(${advText})`);
  });
});

/* =========================
   SHARED COPY FEEDBACK
   ========================= */
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

/* =========================
   EDIT / SAVE MODE
   ========================= */
const editBtn = document.querySelector('.edit-btn');

const editables = [
  document.querySelector('.name'),
  document.querySelector('.hitRollValue'),
  document.querySelector('.DmgRollValue')
];

const copyButtons = document.querySelectorAll('.copy-btn');
const advButtons = document.querySelectorAll('.adv-copy-btn');

let isEditing = false;

/* Load saved values on startup */
editables.forEach(el => {
  const key = el.className;
  const savedValue = localStorage.getItem(key);
  if (savedValue) {
    el.innerText = savedValue;
  }
});

/* Toggle Edit / Save */
editBtn.addEventListener('click', () => {
  isEditing = !isEditing;

  editables.forEach(el => {
    el.contentEditable = isEditing;

    if (!isEditing) {
      localStorage.setItem(el.className, el.innerText.trim());
    }
  });

  // Disable copy buttons while editing
  [...copyButtons, ...advButtons].forEach(btn => {
    btn.classList.toggle('disabled', isEditing);
  });

  editBtn.innerText = isEditing ? 'Save' : 'Edit';
});
