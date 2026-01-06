document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const valueEl = btn.previousElementSibling;
    const rawText = valueEl.innerText.trim();

    // Wrap copied value
    const copiedText = `!(${rawText})`;

    navigator.clipboard.writeText(copiedText).then(() => {
      const originalText = btn.innerText;
      btn.innerText = 'Copied!';
      btn.classList.add('copied');

      setTimeout(() => {
        btn.innerText = originalText;
        btn.classList.remove('copied');
      }, 1500);
    });
  });
});
