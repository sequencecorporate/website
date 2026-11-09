// Add each article's published LinkedIn post URL below. Leave null until it exists.
// This file can be uploaded on its own when a discussion link becomes available.
(() => {
 const posts = {
  'are-we-looking-at-ai-through-the-right-lens': null,
  'when-computer-says-no-becomes-a-risk': null,
 };
 document.querySelectorAll('[data-discussion]').forEach(block => {
  const url = posts[block.dataset.discussion];
  if (!url) return;
  let parsed; try { parsed = new URL(url); } catch { return; }
  if (parsed.protocol !== 'https:' || !/(^|\.)linkedin\.com$/.test(parsed.hostname)) return;
  const link = block.querySelector('.discussion-link');
  link.href = parsed.href; link.hidden = false;
  block.querySelector('.discussion-pending').hidden = true;
 });
})();
