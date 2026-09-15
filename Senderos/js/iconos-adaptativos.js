/* Senderos — iconos SVG adaptativos: conserva formas, trazos y detalles internos. */
(function () {
  const CACHE = new Map();
  const esIcono = src => src.includes('/icons/') && !src.toLowerCase().includes('logo.png') && src.toLowerCase().endsWith('.svg');
  function colorizarSvg(markup) {
    return markup
      .replace(/fill\s*=\s*["'](?:#333(?:333)?|#000(?:000)?|black)["']/gi, 'fill="currentColor"')
      .replace(/stroke\s*=\s*["'](?:#333(?:333)?|#000(?:000)?|black)["']/gi, 'stroke="currentColor"')
      .replace(/fill\s*:\s*(?:#333(?:333)?|#000(?:000)?|black)\b/gi, 'fill:currentColor')
      .replace(/stroke\s*:\s*(?:#333(?:333)?|#000(?:000)?|black)\b/gi, 'stroke:currentColor');
  }
  function obtenerSvg(src) {
    if (CACHE.has(src)) return CACHE.get(src);
    const promesa = fetch(src, {cache:'force-cache'}).then(r => {
      if (!r.ok) throw new Error('No se pudo cargar el icono: '+src);
      return r.text();
    }).then(colorizarSvg);
    CACHE.set(src, promesa); return promesa;
  }
  async function convertirIcono(img) {
    if (!img || img.dataset.iconDone) return;
    const src=img.getAttribute('src')||''; if(!esIcono(src)) return;
    img.dataset.iconDone='loading';
    try {
      const temp=document.createElement('div'); temp.innerHTML=(await obtenerSvg(src)).trim();
      const svg=temp.querySelector('svg'); if(!svg) throw new Error('SVG inválido');
      const width=img.getAttribute('width')||svg.getAttribute('width')||'18';
      const height=img.getAttribute('height')||svg.getAttribute('height')||'18';
      const alt=img.getAttribute('alt')||''; const classes=img.className||''; const style=img.getAttribute('style')||'';
      svg.removeAttribute('width'); svg.removeAttribute('height'); svg.classList.add('icon-svg');
      classes.split(/\s+/).filter(Boolean).forEach(c=>svg.classList.add(c));
      svg.style.cssText=style; svg.style.width=(parseFloat(width)||18)+'px'; svg.style.height=(parseFloat(height)||18)+'px';
      svg.style.display='inline-block'; svg.style.flexShrink='0'; svg.style.verticalAlign='middle';
      if(alt){svg.setAttribute('role','img');svg.setAttribute('aria-label',alt);}else svg.setAttribute('aria-hidden','true');
      svg.dataset.iconDone='1'; img.replaceWith(svg);
    } catch(e) { delete img.dataset.iconDone; console.warn('Senderos: no se pudo adaptar el icono SVG.',src,e); }
  }
  function convertirTodos(root){ if(!root?.querySelectorAll)return; root.querySelectorAll('img[src*="/icons/"]').forEach(convertirIcono); }
  function init(){ convertirTodos(document); const observer=new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===Node.ELEMENT_NODE) convertirTodos(n);}))); observer.observe(document.body,{childList:true,subtree:true}); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
