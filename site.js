
document.querySelector('.menu')?.addEventListener('click',()=>document.querySelector('nav').classList.toggle('open'));
document.querySelectorAll('.topic button').forEach(b=>b.addEventListener('click',()=>{
  const t=b.closest('.topic'); const open=t.classList.toggle('open');
  b.setAttribute('aria-expanded',open?'true':'false');
}));
