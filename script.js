/* ==========================================================================
   Ciudad Maderas · script.js
   Todo es mejora progresiva: si algo falla, la página sigue completa y legible.
   Módulos: WhatsApp · cargador · encabezado/menú · revelado · scroll ·
            canvas del hero · tilt 3D · contadores · botones magnéticos ·
            visor de imágenes · cursor · formulario · preguntas.
   ========================================================================== */
(function () {
  'use strict';

  /* ----------------------------------------------------------------------
     CONFIGURACIÓN
     Número de WhatsApp del asesor: 10 dígitos, sin +52 ni espacios.
     Es el ÚNICO lugar del código donde vive. Si queda vacío, el botón
     flotante y el envío del formulario se ocultan solos.
     ---------------------------------------------------------------------- */
  const WHATSAPP_NUMERO = '4423636107';

  const root = document.documentElement;
  root.classList.add('js'); // a partir de aquí se activan los estados iniciales de animación

  /* ---------- Utilidades ---------- */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  const clamp = (v, a, b) => Math.min(b === undefined ? 1 : b, Math.max(a === undefined ? 0 : a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const mq = (q) => (window.matchMedia ? window.matchMedia(q) : { matches: false });
  const reduced = mq('(prefers-reduced-motion: reduce)').matches;
  const finePointer = mq('(hover: hover) and (pointer: fine)').matches;
  const hasAnime = () => typeof window.anime === 'function';
  const safe = (fn, nombre) => {
    try { fn(); } catch (err) { if (window.console && console.warn) console.warn('[Ciudad Maderas] ' + nombre, err); }
  };

  /* ======================================================================
     1. WHATSAPP
     ====================================================================== */
  const waUrl = (mensaje) => 'https://wa.me/52' + WHATSAPP_NUMERO + '?text=' + encodeURIComponent(mensaje);

  function initWhatsApp() {
    if (!WHATSAPP_NUMERO) {
      root.classList.add('sin-wa'); // oculta botón flotante y envío del formulario
      return;
    }
    $$('[data-wa]').forEach((a) => {
      a.href = waUrl(a.getAttribute('data-wa') || 'Hola, vi su página de Ciudad Maderas y me gustaría más información.');
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });
  }

  function initWaLabel() {
    const flotante = $('#wa-float');
    if (!flotante || !WHATSAPP_NUMERO || reduced) return;
    setTimeout(() => {
      flotante.classList.add('show-label');
      setTimeout(() => flotante.classList.remove('show-label'), 5200);
    }, 7000);
  }

  /* ======================================================================
     2. CARGADOR (el respaldo en CSS lo oculta aunque este código falle)
     ====================================================================== */
  function initCargador() {
    const cargador = $('#cargador');
    if (!cargador) return;
    const pct = $('#cargador-pct');
    const duracion = reduced ? 300 : 1500;
    const t0 = performance.now();
    (function tick(now) {
      const p = clamp((now - t0) / duracion, 0, 1);
      const e = 1 - Math.pow(1 - p, 3);
      if (pct) pct.textContent = String(Math.round(e * 100));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
    // Se retira del DOM cuando termina la animación de salida (≈ 2.3 s)
    setTimeout(() => {
      cargador.setAttribute('aria-hidden', 'true');
      if (cargador.parentNode) cargador.parentNode.removeChild(cargador);
      root.classList.add('is-ready');
    }, reduced ? 800 : 2500);
  }

  /* ======================================================================
     3. ENCABEZADO Y MENÚ MÓVIL
     ====================================================================== */
  function initMenu() {
    const burger = $('.burger');
    const nav = $('#menu');
    if (!burger || !nav) return;
    const setMenu = (abierto) => {
      root.classList.toggle('menu-open', abierto);
      burger.setAttribute('aria-expanded', String(abierto));
      burger.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
    };
    burger.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
    $$('a', nav).forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
    const escritorio = mq('(min-width: 960px)');
    const alCambiar = (e) => { if (e.matches) setMenu(false); };
    if (escritorio.addEventListener) escritorio.addEventListener('change', alCambiar);
    else if (escritorio.addListener) escritorio.addListener(alCambiar);
  }

  /* ======================================================================
     4. DIVIDIR EL MANIFIESTO EN PALABRAS (se iluminan con el scroll)
     ====================================================================== */
  function initSplit() {
    $$('[data-split]').forEach((el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const nodos = [];
      while (walker.nextNode()) nodos.push(walker.currentNode);
      nodos.forEach((nodo) => {
        const frag = document.createDocumentFragment();
        nodo.nodeValue.split(/(\s+)/).forEach((trozo) => {
          if (!trozo) return;
          if (/^\s+$/.test(trozo)) {
            frag.appendChild(document.createTextNode(trozo));
          } else {
            const w = document.createElement('span');
            w.className = 'w';
            w.textContent = trozo;
            frag.appendChild(w);
          }
        });
        nodo.parentNode.replaceChild(frag, nodo);
      });
      el.__palabras = $$('.w', el);
    });
  }

  /* ======================================================================
     5. REVELADO AL HACER SCROLL
     ====================================================================== */
  function initReveal() {
    const els = $$('[data-reveal]');
    if (!els.length) return;
    if (reduced || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        io.unobserve(el);
        el.classList.add('is-in');
        // Al terminar, se retira el estado de animación: el elemento queda con sus estilos normales
        const retraso = (parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0) * 120;
        setTimeout(() => {
          el.removeAttribute('data-reveal');
          el.classList.remove('is-in');
        }, 1700 + retraso);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach((el) => io.observe(el));
  }

  /* ======================================================================
     6. EFECTOS LIGADOS AL SCROLL
        barra de progreso · encabezado · manifiesto · imagen que se abre ·
        tarjetas apiladas · camino que crece · parallax
     ====================================================================== */
  function initScroll() {
    const barra = $('.progreso');
    const header = $('#header');
    const manifiesto = $('[data-split]');
    const palabras = (manifiesto && manifiesto.__palabras) || [];
    const escenario = $('[data-open]');
    const pilares = $$('.pilar');
    const lista = $('#camino-lista');
    const pasos = $$('.paso');
    const parallax = $$('[data-parallax]');
    let vh = window.innerHeight;
    let pendiente = false;
    let topes = [];

    const medir = () => {
      vh = window.innerHeight;
      topes = pilares.map((p) => parseFloat(getComputedStyle(p).top) || 0);
    };

    const actualizar = () => {
      pendiente = false;
      const y = window.pageYOffset || document.documentElement.scrollTop || 0;

      // progreso de lectura + encabezado sólido
      if (barra) {
        const max = Math.max(1, document.documentElement.scrollHeight - vh);
        barra.style.setProperty('--sp', clamp(y / max).toFixed(4));
      }
      if (header) header.classList.toggle('is-solid', y > 24);

      if (reduced) {
        palabras.forEach((w) => w.classList.add('on'));
        pasos.forEach((p) => p.classList.add('is-on'));
        return;
      }

      // manifiesto: las palabras se encienden de a poco
      if (manifiesto && palabras.length) {
        const r = manifiesto.getBoundingClientRect();
        if (r.bottom > -120 && r.top < vh + 120) {
          const p = clamp((vh * 0.8 - r.top) / (r.height + vh * 0.35));
          const hasta = p * palabras.length;
          for (let i = 0; i < palabras.length; i += 1) palabras[i].classList.toggle('on', i < hasta);
        }
      }

      // imagen panorámica que se abre en grande
      if (escenario) {
        const r = escenario.getBoundingClientRect();
        const p = clamp((vh - r.top) / (vh * 0.82));
        escenario.style.setProperty('--open', (1 - Math.pow(1 - p, 3)).toFixed(3));
      }

      // tarjetas que se apilan: la anterior se encoge y se oscurece
      pilares.forEach((p, i) => {
        const siguiente = pilares[i + 1];
        if (!siguiente) return;
        const r = p.getBoundingClientRect();
        const rs = siguiente.getBoundingClientRect();
        const cubre = clamp(1 - (rs.top - topes[i]) / Math.max(r.height, 1));
        p.style.setProperty('--s', (1 - cubre * 0.06).toFixed(4));
        p.style.setProperty('--dim', (cubre * 0.38).toFixed(3));
      });

      // camino: la línea dorada crece y enciende cada paso
      if (lista) {
        const r = lista.getBoundingClientRect();
        const linea = vh * 0.66;
        lista.style.setProperty('--p', clamp((linea - r.top - 17) / Math.max(r.height - 35, 1)).toFixed(4));
        pasos.forEach((paso) => paso.classList.toggle('is-on', paso.getBoundingClientRect().top < linea));
      }

      // parallax suave dentro de los recortes de imagen
      parallax.forEach((el) => {
        const host = el.parentElement;
        const r = host.getBoundingClientRect();
        if (r.bottom < -60 || r.top > vh + 60) return;
        const desfase = r.top + r.height / 2 - vh / 2;
        const vel = parseFloat(el.getAttribute('data-parallax')) || 0.05;
        const limite = r.height * 0.05;
        el.style.setProperty('--py', clamp(-desfase * vel, -limite, limite).toFixed(1) + 'px');
      });
    };

    const pedir = () => {
      if (!pendiente) {
        pendiente = true;
        requestAnimationFrame(actualizar);
      }
    };

    medir();
    actualizar();
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', () => { medir(); pedir(); });
    window.addEventListener('load', () => { medir(); pedir(); });
  }

  /* ======================================================================
     7. HERO: anillos de árbol en perspectiva + luciérnagas doradas
        (animación constante, se pausa fuera de pantalla)
     ====================================================================== */
  function initHeroCanvas() {
    const hero = $('.hero');
    const canvas = $('.hero__canvas');
    if (!hero || !canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ANILLOS = 14;
    let W = 0, H = 0, dpr = 1, cx = 0, cy = 0, paso = 60;
    let particulas = [];
    let corriendo = false, raf = 0, t = 0, ultimo = 0;
    const raton = { x: 0, y: 0, activo: false };

    // sprite de brillo pre-renderizado (más barato que sombras)
    const brillo = document.createElement('canvas');
    brillo.width = brillo.height = 64;
    const bctx = brillo.getContext('2d');
    const grad = bctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,244,210,1)');
    grad.addColorStop(0.28, 'rgba(240,212,143,.6)');
    grad.addColorStop(1, 'rgba(240,212,143,0)');
    bctx.fillStyle = grad;
    bctx.fillRect(0, 0, 64, 64);

    function sembrar() {
      const n = W < 640 ? 36 : 70;
      particulas = [];
      for (let i = 0; i < n; i += 1) {
        particulas.push({
          x: Math.random() * W, y: Math.random() * H,
          r: 0.7 + Math.random() * 1.8,
          vy: 0.1 + Math.random() * 0.3, vx: (Math.random() - 0.5) * 0.14,
          ph: Math.random() * 6.283, tw: 0.7 + Math.random() * 1.5
        });
      }
    }

    function dibujar(tiempo, dtf) {
      ctx.clearRect(0, 0, W, H);

      // anillos concéntricos (como los de un tronco) con ondulación y pulso viajero
      for (let i = 0; i < ANILLOS; i += 1) {
        const r = (i + 1) * paso + Math.sin(tiempo * 0.6 + i * 0.7) * 4;
        const onda = 0.012 + i * 0.0014;
        const seg = Math.max(56, Math.floor(r / 5));
        ctx.beginPath();
        for (let k = 0; k <= seg; k += 1) {
          const a = (k / seg) * 6.2832;
          const w = 1 + onda * Math.sin(a * 3 + tiempo * 0.5 + i) + onda * 0.7 * Math.sin(a * 5 - tiempo * 0.35 + i * 1.3);
          const x = cx + Math.cos(a) * r * w;
          const y = cy + Math.sin(a) * r * w * 0.44;
          if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        const pos = (tiempo * 0.9) % (ANILLOS + 3);
        const pulso = Math.max(0, 1 - Math.abs(pos - i) / 2.2);
        const alpha = 0.06 + 0.2 * (1 - i / ANILLOS) + pulso * 0.4;
        ctx.strokeStyle = 'rgba(240,212,143,' + alpha.toFixed(3) + ')';
        ctx.lineWidth = 0.8 + pulso * 1.3;
        if (i % 3 === 1) {
          ctx.setLineDash([2, 10]);
          ctx.lineDashOffset = -tiempo * 18 * (i % 2 ? 1 : -1);
        } else {
          ctx.setLineDash([]);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // luciérnagas
      for (let i = 0; i < particulas.length; i += 1) {
        const p = particulas[i];
        p.y -= p.vy * dtf;
        p.x += p.vx * dtf + Math.sin(tiempo * 0.6 + p.ph) * 0.1 * dtf;
        if (p.y < -12) { p.y = H + 12; p.x = Math.random() * W; }
        if (p.x < -12) p.x = W + 12; else if (p.x > W + 12) p.x = -12;
        if (raton.activo && dtf > 0) {
          const dx = p.x - raton.x, dy = p.y - raton.y, d2 = dx * dx + dy * dy;
          if (d2 < 19600 && d2 > 1) {
            const d = Math.sqrt(d2), f = ((140 - d) / 140) * 1.2;
            p.x += (dx / d) * f; p.y += (dy / d) * f;
          }
        }
      }
      ctx.lineWidth = 0.6;
      for (let i = 0; i < particulas.length; i += 1) {
        const a = particulas[i];
        for (let j = i + 1; j < particulas.length; j += 1) {
          const b = particulas[j];
          const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 < 12100) {
            ctx.strokeStyle = 'rgba(240,212,143,' + ((1 - Math.sqrt(d2) / 110) * 0.2).toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        if (raton.activo) {
          const dx = a.x - raton.x, dy = a.y - raton.y, d2 = dx * dx + dy * dy;
          if (d2 < 22500) {
            ctx.strokeStyle = 'rgba(255,244,210,' + ((1 - Math.sqrt(d2) / 150) * 0.35).toFixed(3) + ')';
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(raton.x, raton.y); ctx.stroke();
          }
        }
      }
      for (let i = 0; i < particulas.length; i += 1) {
        const p = particulas[i];
        const tw = Math.sin(tiempo * p.tw + p.ph);
        ctx.globalAlpha = 0.35 + 0.65 * tw * tw;
        const s = p.r * 7;
        ctx.drawImage(brillo, p.x - s, p.y - s, s * 2, s * 2);
      }
      ctx.globalAlpha = 1;
    }

    function medir() {
      const r = hero.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const vis = $('.hero__visual');
      if (vis) {
        const v = vis.getBoundingClientRect();
        cx = v.left - r.left + v.width / 2;
        cy = v.top - r.top + v.height / 2;
      } else {
        cx = W * 0.7; cy = H * 0.5;
      }
      paso = Math.max(W, H) * 0.052;
      sembrar();
      if (!corriendo) dibujar(2.2, 0);
    }

    function bucle(ahora) {
      raf = 0;
      if (!corriendo) return;
      const dt = Math.min((ahora - (ultimo || ahora)) / 1000, 0.05);
      ultimo = ahora;
      t += dt;
      dibujar(t, dt * 60);
      raf = requestAnimationFrame(bucle);
    }
    function iniciar() {
      if (corriendo || reduced) return;
      corriendo = true; ultimo = 0;
      raf = requestAnimationFrame(bucle);
    }
    function detener() {
      corriendo = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    medir();
    setTimeout(medir, 2600); // recalcula el centro cuando ya terminó la entrada del hero
    if ('ResizeObserver' in window) new ResizeObserver(medir).observe(hero);
    else window.addEventListener('resize', medir);

    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      raton.x = e.clientX - r.left; raton.y = e.clientY - r.top; raton.activo = e.pointerType === 'mouse';
    });
    hero.addEventListener('pointerleave', () => { raton.activo = false; });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => {
        if (es[0].isIntersecting && !document.hidden) iniciar(); else detener();
      }, { threshold: 0 }).observe(hero);
    } else {
      iniciar();
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) detener(); else if (hero.getBoundingClientRect().bottom > 0) iniciar();
    });
  }

  /* ======================================================================
     8. TILT 3D (solo con mouse)
     ====================================================================== */
  function initTilt() {
    if (!finePointer || reduced) return;
    $$('[data-tilt]').forEach((el) => {
      const esHero = el.classList.contains('house__tilt');
      const alcance = esHero ? $('.hero') : el;
      const max = esHero ? 9 : 7;
      if (!alcance) return;
      alcance.addEventListener('pointermove', (e) => {
        const caja = (esHero ? el.parentElement : el).getBoundingClientRect();
        const mx = esHero ? window.innerWidth / 2 : caja.width / 2;
        const my = esHero ? window.innerHeight / 2 : caja.height / 2;
        const nx = clamp((e.clientX - (caja.left + caja.width / 2)) / mx, -1, 1);
        const ny = clamp((e.clientY - (caja.top + caja.height / 2)) / my, -1, 1);
        el.style.setProperty('--ry', (nx * max).toFixed(2) + 'deg');
        el.style.setProperty('--rx', (-ny * max).toFixed(2) + 'deg');
      });
      alcance.addEventListener('pointerleave', () => {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ======================================================================
     9. CONTADORES (anime.js si está disponible; si no, respaldo propio)
     ====================================================================== */
  function initContadores() {
    const els = $$('[data-count]');
    if (!els.length) return;
    const fmt = (n) => Math.round(n).toLocaleString('es-MX');
    const final = (el) => { el.textContent = fmt(Number(el.getAttribute('data-count'))); };
    if (reduced || !('IntersectionObserver' in window)) { els.forEach(final); return; }

    const correr = (el) => {
      const fin = Number(el.getAttribute('data-count'));
      if (hasAnime()) {
        const o = { v: 0 };
        window.anime({
          targets: o, v: fin, duration: 2200, easing: 'easeOutExpo',
          update: () => { el.textContent = fmt(o.v); },
          complete: () => final(el)
        });
      } else {
        const t0 = performance.now();
        (function tick(ahora) {
          const p = clamp((ahora - t0) / 2200, 0, 1);
          el.textContent = fmt(fin * (1 - Math.pow(1 - p, 4)));
          if (p < 1) requestAnimationFrame(tick); else final(el);
        })(t0);
      }
    };

    els.forEach((el) => { el.textContent = '0'; });
    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        correr(en.target);
      });
    }, { threshold: 0.6 });
    els.forEach((el) => io.observe(el));
  }

  /* ======================================================================
     10. BOTONES: brillo que sigue al cursor + imán con rebote elástico
     ====================================================================== */
  function initBotones() {
    $$('.btn').forEach((b) => {
      const iman = b.classList.contains('btn--mag');
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.setProperty('--bx', (e.clientX - r.left) + 'px');
        b.style.setProperty('--by', (e.clientY - r.top) + 'px');
        if (iman && finePointer && !reduced) {
          const dx = (e.clientX - r.left) / r.width - 0.5;
          const dy = (e.clientY - r.top) / r.height - 0.5;
          if (hasAnime()) window.anime.remove(b);
          b.style.transform = 'translateX(' + (dx * 10).toFixed(1) + 'px) translateY(' + (dy * 8 - 2).toFixed(1) + 'px)';
        }
      });
      b.addEventListener('pointerleave', () => {
        if (!iman || reduced) return;
        if (hasAnime()) {
          window.anime.remove(b);
          window.anime({ targets: b, translateX: 0, translateY: 0, duration: 900, easing: 'easeOutElastic(1, .5)' });
        } else {
          b.style.transform = '';
        }
      });
    });
  }

  /* ======================================================================
     11. VISOR: amplía las imágenes en grande
     ====================================================================== */
  function initVisor() {
    const visor = $('#visor');
    if (!visor) return;
    const marco = $('#visor-marco');
    const pie = $('#visor-pie');
    const cerrar = $('.visor__cerrar', visor);
    let origen = null;

    const abrir = (boton) => {
      const recorte = boton.parentElement.querySelector('.crop');
      if (!recorte) return;
      const copia = recorte.cloneNode(true);
      copia.removeAttribute('style');
      $$('.crop__in', copia).forEach((n) => { n.removeAttribute('style'); n.removeAttribute('data-parallax'); });
      $$('img', copia).forEach((im) => im.removeAttribute('loading'));
      const cs = getComputedStyle(recorte);
      const ratio = (parseFloat(cs.getPropertyValue('--cw')) || 1.5) / (parseFloat(cs.getPropertyValue('--ch')) || 1);
      marco.style.setProperty('--ratio', ratio.toFixed(3));
      while (marco.firstChild) marco.removeChild(marco.firstChild);
      marco.appendChild(copia);
      pie.textContent = boton.getAttribute('data-caption') || '';
      origen = boton;
      visor.classList.add('is-open');
      visor.setAttribute('aria-hidden', 'false');
      root.classList.add('visor-open');
      cerrar.focus();
    };
    const cerrarVisor = () => {
      if (!visor.classList.contains('is-open')) return;
      visor.classList.remove('is-open');
      visor.setAttribute('aria-hidden', 'true');
      root.classList.remove('visor-open');
      if (origen) origen.focus();
    };

    document.addEventListener('click', (e) => {
      const boton = e.target.closest ? e.target.closest('[data-zoom]') : null;
      if (boton) abrir(boton);
    });
    cerrar.addEventListener('click', cerrarVisor);
    visor.addEventListener('click', (e) => { if (e.target === visor || e.target.classList.contains('visor__fig')) cerrarVisor(); });
    document.addEventListener('keydown', (e) => {
      if (!visor.classList.contains('is-open')) return;
      if (e.key === 'Escape') cerrarVisor();
      if (e.key === 'Tab') { e.preventDefault(); cerrar.focus(); }
    });
  }

  /* ======================================================================
     12. CURSOR DECORATIVO (solo con mouse)
     ====================================================================== */
  function initCursor() {
    if (!finePointer || reduced) return;
    const c = $('.cursor');
    if (!c) return;
    const punto = $('i', c);
    const aro = $('b', c);
    let x = -100, y = -100, ax = -100, ay = -100, raf = 0;
    const tick = () => {
      ax = lerp(ax, x, 0.18);
      ay = lerp(ay, y, 0.18);
      punto.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) translate(-50%,-50%)';
      aro.style.transform = 'translate3d(' + ax + 'px,' + ay + 'px,0) translate(-50%,-50%)';
      raf = (Math.abs(ax - x) > 0.1 || Math.abs(ay - y) > 0.1) ? requestAnimationFrame(tick) : 0;
    };
    window.addEventListener('pointermove', (e) => {
      x = e.clientX; y = e.clientY;
      if (!raf) raf = requestAnimationFrame(tick);
      const sobre = e.target.closest ? e.target.closest('a, button, summary, label, [data-zoom], input, select, textarea') : null;
      c.classList.toggle('is-hover', Boolean(sobre));
    }, { passive: true });
  }

  /* ======================================================================
     13. FORMULARIO → WHATSAPP
     ====================================================================== */
  function initFormulario() {
    const form = $('#form-contacto');
    if (!form) return;
    const error = $('.form__error', form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!WHATSAPP_NUMERO) return;
      const campos = form.elements;
      const nombre = (campos.nombre.value || '').trim();
      if (!nombre) {
        if (error) error.hidden = false;
        campos.nombre.focus();
        return;
      }
      if (error) error.hidden = true;
      const marcado = form.querySelector('input[name="interes"]:checked');
      const interes = marcado ? marcado.value : 'información general';
      const cuando = campos.cuando ? campos.cuando.value : '';
      const extra = (campos.mensaje.value || '').trim();
      let mensaje = 'Hola Carlos, soy ' + nombre + '. Me interesa ' + interes + '.';
      if (cuando) mensaje += ' Quiero empezar ' + cuando + '.';
      if (extra) mensaje += ' ' + extra;
      mensaje += ' Te escribo desde la página de Ciudad Maderas.';
      const ventana = window.open(waUrl(mensaje), '_blank', 'noopener');
      if (!ventana) window.location.href = waUrl(mensaje);
    });
    if (form.elements.nombre) {
      form.elements.nombre.addEventListener('input', () => { if (error) error.hidden = true; });
    }
  }

  /* ======================================================================
     14. PREGUNTAS FRECUENTES: solo una abierta a la vez
     ====================================================================== */
  function initFaq() {
    const items = $$('.faq');
    items.forEach((d) => {
      d.addEventListener('toggle', () => {
        if (!d.open) return;
        items.forEach((o) => { if (o !== d) o.open = false; });
      });
    });
  }

  /* ======================================================================
     ARRANQUE (cada módulo aislado: si uno falla, los demás siguen)
     ====================================================================== */
  safe(initWhatsApp, 'whatsapp');
  safe(initCargador, 'cargador');
  safe(initMenu, 'menu');
  safe(initSplit, 'split');
  safe(initReveal, 'reveal');
  safe(initScroll, 'scroll');
  safe(initHeroCanvas, 'canvas');
  safe(initTilt, 'tilt');
  safe(initContadores, 'contadores');
  safe(initBotones, 'botones');
  safe(initVisor, 'visor');
  safe(initCursor, 'cursor');
  safe(initFormulario, 'formulario');
  safe(initFaq, 'faq');
  safe(initWaLabel, 'waLabel');
})();
