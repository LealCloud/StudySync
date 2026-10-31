export const themeScript = `(function(){try{
  var t=localStorage.getItem('theme')||'system';
  var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);
  var r=document.documentElement;
  r.setAttribute('data-theme',d?'dark':'light');
  r.style.colorScheme=d?'dark':'light';
}catch(e){}})();`;
