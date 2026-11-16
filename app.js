(function () {
  const canvas = document.getElementById('garden');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = window.innerWidth || 800;
  let height = window.innerHeight || 600;

  function resize() {
    width = canvas.width = window.innerWidth || document.documentElement.clientWidth || 800;
    height = canvas.height = window.innerHeight || document.documentElement.clientHeight || 600;
  }
  window.addEventListener('resize', resize);
  resize();

  // Temas de cielo
  const skies = [
    { name: '🌙 Noche', top: '#090d1e', mid: '#1b264f', bot: '#3a2e5c', stars: 1, hill1: '#0d1b1e', hill2: '#081214' },
    { name: '🌅 Atardecer', top: '#2b1055', mid: '#b5446e', bot: '#f79d65', stars: 0.45, hill1: '#1d2d24', hill2: '#121f18' },
    { name: '☀️ Amanecer', top: '#3a7bd5', mid: '#8ec5fc', bot: '#ffe29f', stars: 0.25, hill1: '#2d5a3c', hill2: '#1e4029' }
  ];
  let currentSky = 0;

  // Estrellas decorativas de fondo
  const bgStars = Array.from({ length: 95 }, () => ({
    x: Math.random(),
    y: Math.random() * 0.62,
    r: Math.random() * 1.5 + 0.4,
    twinkle: Math.random() * Math.PI * 2
  }));

  // Estrellas interactivas con frases bonitas
  const starQuotes = [
    'me encanta cuando sonries :) .',
    'aunque seas enojona te quiero mucho <3.',
    'Si pudiera pedir un deseo en cada estrella, seria estar a tu lado.',
    'Tu sonrisa ilumina más que mil constelaciones.',
    'Gracias por existir y hacer mi mundo mucho más bonito.',
    'En un cielo lleno de estrellas, tú eres la que más brilla.',
    'eres tan bonita que con verte me enamoro mas .',
    'te quiero mucho sabias ?.'
  ];

  const interactiveStars = [
    { rx: 0.14, ry: 0.22, quote: starQuotes[0], phase: 0.2, visited: false },
    { rx: 0.26, ry: 0.38, quote: starQuotes[1], phase: 1.1, visited: false },
    { rx: 0.36, ry: 0.16, quote: starQuotes[2], phase: 2.3, visited: false },
    { rx: 0.52, ry: 0.45, quote: starQuotes[3], phase: 0.8, visited: false },
    { rx: 0.65, ry: 0.18, quote: starQuotes[4], phase: 3.0, visited: false },
    { rx: 0.74, ry: 0.39, quote: starQuotes[5], phase: 1.7, visited: false },
    { rx: 0.88, ry: 0.34, quote: starQuotes[6], phase: 2.6, visited: false },
    { rx: 0.18, ry: 0.50, quote: starQuotes[7], phase: 0.5, visited: false }
  ];

  let activeStar = null;
  let quoteTimeout = null;
  const starQuoteBox = document.getElementById('starQuoteBox');
  const starQuoteText = document.getElementById('starQuoteText');

  // Audio ambiental y campanita con Web Audio API
  let audioCtx = null;
  let musicInterval = null;
  const musicBtn = document.getElementById('musicBtn');

  function ensureAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(function () {});
    }
  }

  function playNote(freq) {
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.055, audioCtx.currentTime + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 3.0);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 3.1);
    } catch (err) {}
  }

  function playChime() {
    try {
      ensureAudio();
      playNote(783.99);
      setTimeout(function () {
        playNote(1046.5);
      }, 120);
    } catch (err) {}
  }

  function showStarQuote(star) {
    activeStar = star;
    star.visited = true;

    const sx = star.rx * width;
    const sy = star.ry * height;
    const clampedX = Math.max(165, Math.min(width - 165, sx));
    const clampedY = Math.max(115, sy);

    if (starQuoteText) starQuoteText.textContent = '“' + star.quote + '”';
    if (starQuoteBox) {
      starQuoteBox.style.left = clampedX + 'px';
      starQuoteBox.style.top = clampedY + 'px';
      starQuoteBox.classList.add('show');
    }

    playChime();

    clearTimeout(quoteTimeout);
    quoteTimeout = setTimeout(function () {
      if (starQuoteBox) starQuoteBox.classList.remove('show');
      activeStar = null;
    }, 4800);
  }

  // Luciérnagas
  const fireflies = Array.from({ length: 26 }, () => ({
    x: Math.random() * width,
    y: height * 0.48 + Math.random() * height * 0.45,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.4,
    phase: Math.random() * Math.PI * 2,
    size: Math.random() * 2.5 + 1.5
  }));

  // Pétalos flotantes
  const petalColors = ['#ff8fa3', '#ffb3c1', '#ffd6e0', '#ffe5ec'];
  const petals = Array.from({ length: 16 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 5 + 3,
    speedY: Math.random() * 0.6 + 0.3,
    sway: Math.random() * 2,
    angle: Math.random() * Math.PI * 2,
    color: petalColors[Math.floor(Math.random() * petalColors.length)]
  }));

  // Clase Flor
  class Flower {
    constructor(x, y, type, maxScale = 1) {
      this.x = x;
      this.y = y;
      this.type = type;
      this.growth = 0;
      this.maxScale = maxScale;
      this.stemHeight = (70 + Math.random() * 65) * maxScale;
      this.swayOffset = Math.random() * Math.PI * 2;
      this.colorVariant = Math.random();
    }

    update(dt) {
      if (this.growth < 1) {
        this.growth = Math.min(1, this.growth + dt * 0.85);
      }
    }

    draw(c, time) {
      const ease = 1 - Math.pow(1 - this.growth, 3);
      const sway = Math.sin(time * 1.4 + this.swayOffset) * 10 * ease;
      const currentH = this.stemHeight * ease;
      const topX = this.x + sway;
      const topY = this.y - currentH;

      c.beginPath();
      c.moveTo(this.x, this.y);
      c.quadraticCurveTo(this.x + sway * 0.4, this.y - currentH * 0.5, topX, topY);
      c.strokeStyle = '#387642';
      c.lineWidth = 3.2 * this.maxScale;
      c.lineCap = 'round';
      c.stroke();

      if (ease > 0.35) {
        const leafScale = Math.min(1, (ease - 0.35) / 0.65) * this.maxScale;
        this.drawLeaf(c, this.x + sway * 0.35, this.y - currentH * 0.42, -0.6, leafScale);
        this.drawLeaf(c, this.x + sway * 0.55, this.y - currentH * 0.62, 0.6, leafScale);
      }

      if (ease > 0.5) {
        const bloom = ((ease - 0.5) / 0.5) * this.maxScale;
        c.save();
        c.translate(topX, topY);
        c.rotate(sway * 0.015);
        c.scale(bloom, bloom);

        if (this.type === 'rose') this.drawRose(c);
        else if (this.type === 'sunflower') this.drawSunflower(c);
        else if (this.type === 'tulip') this.drawTulip(c);
        else this.drawDaisy(c);

        c.restore();
      }
    }

    drawLeaf(c, x, y, angle, scale) {
      c.save();
      c.translate(x, y);
      c.rotate(angle);
      c.scale(scale, scale);
      c.beginPath();
      c.moveTo(0, 0);
      c.quadraticCurveTo(14, -10, 26, 0);
      c.quadraticCurveTo(14, 10, 0, 0);
      c.fillStyle = '#4a9356';
      c.fill();
      c.restore();
    }

    drawRose(c) {
      const palette = this.colorVariant > 0.35
        ? ['#a4133c', '#c9184a', '#ff4d6d', '#ff758f']
        : ['#c9184a', '#ff758f', '#ffb3c1', '#ffd6e0'];

      for (let layer = 0; layer < 4; layer++) {
        const count = 6 - layer;
        const radius = 18 - layer * 3.5;
        c.fillStyle = palette[layer];
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2 + layer * 0.5;
          c.beginPath();
          c.arc(Math.cos(a) * radius * 0.45, Math.sin(a) * radius * 0.45, radius * 0.65, 0, Math.PI * 2);
          c.fill();
        }
      }
    }

    drawSunflower(c) {
      const petalsCount = 16;
      for (let i = 0; i < petalsCount; i++) {
        c.save();
        c.rotate((i / petalsCount) * Math.PI * 2);
        c.beginPath();
        c.ellipse(0, -16, 4.5, 12, 0, 0, Math.PI * 2);
        c.fillStyle = i % 2 === 0 ? '#ffd166' : '#f4a261';
        c.fill();
        c.restore();
      }
      c.beginPath();
      c.arc(0, 0, 10, 0, Math.PI * 2);
      c.fillStyle = '#4a2c18';
      c.fill();
    }

    drawTulip(c) {
      const colors = this.colorVariant > 0.5
        ? ['#ff5d8f', '#ff87ab']
        : ['#9d4edd', '#c77dff'];
      c.fillStyle = colors[0];
      c.beginPath();
      c.ellipse(-6, -6, 8, 15, -0.2, 0, Math.PI * 2);
      c.ellipse(6, -6, 8, 15, 0.2, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = colors[1];
      c.beginPath();
      c.ellipse(0, -8, 8, 16, 0, 0, Math.PI * 2);
      c.fill();
    }

    drawDaisy(c) {
      const petalsCount = 12;
      c.fillStyle = '#ffffff';
      for (let i = 0; i < petalsCount; i++) {
        c.save();
        c.rotate((i / petalsCount) * Math.PI * 2);
        c.beginPath();
        c.ellipse(0, -13, 3.8, 10, 0, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
      c.beginPath();
      c.arc(0, 0, 6.5, 0, Math.PI * 2);
      c.fillStyle = '#ffb703';
      c.fill();
    }
  }

  const flowers = [];
  const types = ['rose', 'sunflower', 'tulip', 'daisy'];

  function seedInitialGarden() {
    flowers.length = 0;
    const count = Math.min(26, Math.max(10, Math.floor(width / 38)));
    for (let i = 0; i < count; i++) {
      const x = width * 0.08 + Math.random() * width * 0.84;
      const y = height * 0.72 + Math.random() * height * 0.24;
      const type = types[i % types.length];
      const f = new Flower(x, y, type, 0.8 + Math.random() * 0.45);
      f.growth = Math.random() * 0.4;
      flowers.push(f);
    }
    flowers.sort((a, b) => a.y - b.y);
  }
  seedInitialGarden();

  let selectedType = 'rose';

  canvas.addEventListener('pointerdown', (e) => {
    const clickX = e.clientX;
    const clickY = e.clientY;

    let hitStar = null;
    let minDist = 28;
    for (const star of interactiveStars) {
      const sx = star.rx * width;
      const sy = star.ry * height;
      const dist = Math.hypot(clickX - sx, clickY - sy);
      if (dist < minDist) {
        minDist = dist;
        hitStar = star;
      }
    }

    if (hitStar) {
      showStarQuote(hitStar);
      return;
    }

    const y = Math.max(height * 0.66, Math.min(height * 0.98, clickY));
    flowers.push(new Flower(clickX, y, selectedType, 0.85 + Math.random() * 0.4));
    flowers.sort((a, b) => a.y - b.y);
  });

  canvas.addEventListener('pointermove', (e) => {
    const overStar = interactiveStars.some((star) => {
      const sx = star.rx * width;
      const sy = star.ry * height;
      return Math.hypot(e.clientX - sx, e.clientY - sy) < 26;
    });
    canvas.style.cursor = overStar ? 'pointer' : 'crosshair';
  });

  function drawSparkleStar(c, x, y, radius, alpha, isActive, isVisited) {
    c.save();
    c.translate(x, y);

    const grad = c.createRadialGradient(0, 0, 1, 0, 0, radius * 2.8);
    grad.addColorStop(0, isActive ? 'rgba(255, 235, 140, 0.95)' : `rgba(255, 240, 180, ${alpha * 0.7})`);
    grad.addColorStop(1, 'rgba(255, 240, 180, 0)');
    c.fillStyle = grad;
    c.beginPath();
    c.arc(0, 0, radius * 2.8, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = isActive ? '#fffbe6' : (isVisited ? '#ffd166' : '#ffffff');
    c.beginPath();
    const longR = isActive ? radius * 1.7 : radius * 1.35;
    const shortR = radius * 0.32;
    for (let i = 0; i < 8; i++) {
      const r = i % 2 === 0 ? longR : shortR;
      const a = (i * Math.PI) / 4;
      if (i === 0) c.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    c.closePath();
    c.fill();

    c.restore();
  }

  let lastTime = performance.now();
  function animate(now) {
    const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;
    const time = now / 1000;

    const sky = skies[currentSky];

    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, sky.top);
    grad.addColorStop(0.55, sky.mid);
    grad.addColorStop(1, sky.bot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    if (sky.stars > 0) {
      bgStars.forEach((s) => {
        const alpha = (0.35 + 0.65 * Math.sin(time * 2 + s.twinkle)) * sky.stars;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 235, 175, 0.14)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    interactiveStars.forEach((s, idx) => {
      const sx = s.rx * width;
      const sy = s.ry * height;
      if (idx === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    });
    ctx.stroke();
    ctx.restore();

    interactiveStars.forEach((s) => {
      const pulse = 0.65 + 0.35 * Math.sin(time * 2.8 + s.phase);
      const r = 6.5 + Math.sin(time * 2.8 + s.phase) * 1.5;
      drawSparkleStar(ctx, s.rx * width, s.ry * height, r, pulse, activeStar === s, s.visited);
    });

    ctx.save();
    ctx.beginPath();
    ctx.arc(width * 0.85, height * 0.17, 30, 0, Math.PI * 2);
    ctx.fillStyle = currentSky === 0 ? 'rgba(255, 250, 220, 0.85)' : 'rgba(255, 235, 170, 0.6)';
    ctx.shadowColor = 'rgba(255, 240, 190, 0.8)';
    ctx.shadowBlur = 35;
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = sky.hill1;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.72);
    ctx.quadraticCurveTo(width * 0.35, height * 0.62, width, height * 0.74);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.fill();

    ctx.fillStyle = sky.hill2;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.78);
    ctx.quadraticCurveTo(width * 0.65, height * 0.67, width, height * 0.78);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.fill();

    flowers.forEach((f) => {
      f.update(dt);
      f.draw(ctx, time);
    });

    fireflies.forEach((ff) => {
      ff.x += ff.vx + Math.sin(time + ff.phase) * 0.25;
      ff.y += ff.vy + Math.cos(time * 0.8 + ff.phase) * 0.2;
      if (ff.x < 0) ff.x = width;
      if (ff.x > width) ff.x = 0;

      const glow = 0.35 + 0.65 * Math.sin(time * 3 + ff.phase);
      ctx.save();
      ctx.beginPath();
      ctx.arc(ff.x, ff.y, ff.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220, 255, 140, ${glow})`;
      ctx.shadowColor = '#d4ff70';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.restore();
    });

    petals.forEach((p) => {
      p.y += p.speedY;
      p.x += Math.sin(time + p.sway) * 0.6;
      p.angle += 0.02;
      if (p.y > height + 10) {
        p.y = -10;
        p.x = Math.random() * width;
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  document.querySelectorAll('.flower-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.flower-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedType = btn.dataset.type;
    });
  });

  const skyBtn = document.getElementById('skyBtn');
  if (skyBtn) {
    skyBtn.addEventListener('click', () => {
      currentSky = (currentSky + 1) % skies.length;
      skyBtn.textContent = skies[currentSky].name;
    });
  }

  const titleEl = document.getElementById('titleText');
  const msgEl = document.getElementById('msgText');
  const sigEl = document.getElementById('sigText');
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('t') && titleEl) titleEl.innerText = urlParams.get('t');
  if (urlParams.has('m') && msgEl) msgEl.innerText = urlParams.get('m');
  if (urlParams.has('s') && sigEl) sigEl.innerText = urlParams.get('s');

  const card = document.getElementById('card');
  const toggleCardBtn = document.getElementById('toggleCardBtn');
  if (toggleCardBtn && card) {
    toggleCardBtn.addEventListener('click', () => {
      card.classList.toggle('hidden');
      toggleCardBtn.textContent = card.classList.contains('hidden') ? '👁️ Mostrar tarjeta' : '👁️ Ocultar tarjeta';
    });
  }

  if (musicBtn) {
    musicBtn.addEventListener('click', () => {
      if (!musicInterval) {
        ensureAudio();
        const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
        playNote(scale[0]);
        musicInterval = setInterval(() => {
          const note = scale[Math.floor(Math.random() * scale.length)];
          playNote(note);
        }, 1600);
        musicBtn.textContent = '🎵 Música: On';
        musicBtn.classList.add('active');
      } else {
        clearInterval(musicInterval);
        musicInterval = null;
        musicBtn.textContent = '🎵 Música: Off';
        musicBtn.classList.remove('active');
      }
    });
  }
})();