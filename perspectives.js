(() => {
 const form=document.getElementById('perspective-search');
 const results=document.getElementById('perspective-results');
 const articles=[...results.querySelectorAll('article')];
 function update(){
  const words=document.getElementById('keywords').value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const context=document.getElementById('context').value.toLocaleLowerCase().trim();
  const subject=document.getElementById('subject').value;
  const direction=document.getElementById('sort').value==='oldest'?1:-1;
  let count=0;
  articles.sort((a,b)=>direction*a.dataset.date.localeCompare(b.dataset.date)).forEach(article=>{
   const text=(article.textContent+' '+article.dataset.context+' '+article.dataset.subject).toLocaleLowerCase();
   article.hidden=!(words.every(word=>text.includes(word))&&(!context||article.dataset.context.toLocaleLowerCase().split('|').some(category=>category.includes(context)))&&(!subject||article.dataset.subject===subject));
   if(!article.hidden)count++;
   results.append(article);
  });
  document.getElementById('result-count').textContent=`${count} perspective${count===1?'':'s'}`;
  document.getElementById('no-results').hidden=count!==0;
 }
 form.addEventListener('submit',event=>event.preventDefault());
 form.addEventListener('input',update);form.addEventListener('change',update);
 update();
})();
