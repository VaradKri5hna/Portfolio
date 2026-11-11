// High-Detail Interactive Blender 3D Viewport (Models from Varad's Scenes) + Portfolio Controls
(function () {
  // Theme Toggle
  const themeBtn = document.getElementById('themeToggle');
  const rootEl = document.documentElement;

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = rootEl.getAttribute('data-theme');
      const next = current === 'light' ? 'dark' : 'light';
      if (next === 'light') {
        rootEl.setAttribute('data-theme', 'light');
        themeBtn.textContent = '🌙';
      } else {
        rootEl.removeAttribute('data-theme');
        themeBtn.textContent = '☀️';
      }
    });
  }

  // Mobile Menu Drawer Toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileNavDrawer = document.getElementById('mobileNavDrawer');

  if (mobileMenuBtn && mobileNavDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = mobileNavDrawer.classList.toggle('open');
      mobileMenuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      mobileMenuBtn.textContent = isOpen ? '✕' : '☰';
    });

    mobileNavDrawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileNavDrawer.classList.remove('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.textContent = '☰';
      });
    });
  }

  // Artistic Cursor Spotlight Tracking
  const spotlight = document.getElementById('cursorSpotlight');
  if (spotlight) {
    window.addEventListener('pointermove', (e) => {
      spotlight.style.left = `${e.clientX}px`;
      spotlight.style.top = `${e.clientY}px`;
    });
  }

  // Artistic Background Canvas (Floating 3D Polyhedra & Glowing Constellation Nodes)
  const bgCanvas = document.getElementById('artBgCanvas');
  if (bgCanvas) {
    const bgCtx = bgCanvas.getContext('2d');
    let bgW = 0;
    let bgH = 0;

    function resizeBg() {
      bgW = window.innerWidth;
      bgH = window.innerHeight;
      bgCanvas.width = bgW;
      bgCanvas.height = bgH;
    }
    window.addEventListener('resize', resizeBg);
    resizeBg();

    const nodes = Array.from({ length: 34 }, (_, i) => ({
      x: Math.random() * (bgW || 1200),
      y: Math.random() * (bgH || 800),
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: 1.4 + (i % 3) * 0.9,
      hue: i % 2 === 0 ? '249, 115, 22' : '56, 189, 248',
    }));

    function drawBg() {
      bgCtx.clearRect(0, 0, bgW, bgH);
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0) n.x = bgW;
        if (n.x > bgW) n.x = 0;
        if (n.y < 0) n.y = bgH;
        if (n.y > bgH) n.y = 0;

        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j];
          const dist = Math.hypot(n.x - m.x, n.y - m.y);
          if (dist < 170) {
            const alpha = (1 - dist / 170) * 0.16;
            bgCtx.beginPath();
            bgCtx.moveTo(n.x, n.y);
            bgCtx.lineTo(m.x, m.y);
            bgCtx.strokeStyle = `rgba(${n.hue}, ${alpha})`;
            bgCtx.lineWidth = 0.8;
            bgCtx.stroke();
          }
        }

        bgCtx.beginPath();
        bgCtx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        bgCtx.fillStyle = `rgba(${n.hue}, 0.55)`;
        bgCtx.fill();
      }
      requestAnimationFrame(drawBg);
    }
    drawBg();
  }

  // Interactive 3D Viewport Canvas
  const canvas = document.getElementById('blenderHeroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const hudMeshName = document.getElementById('hudMeshName');
  const hudVerts = document.getElementById('hudVerts');
  const hudFaces = document.getElementById('hudFaces');
  const hudMode = document.getElementById('hudMode');

  let width = 0;
  let height = 0;
  let rotX = -0.52;
  let rotY = 0.65;
  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let autoRotate = true;
  let shadingMode = 'rendered'; // 'wireframe' | 'solid' | 'rendered'
  let currentMeshKey = 'donut';

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Helper to push a face with material properties (color, roughness/glossiness, ao)
  function addFace(faces, indices, color, spec = 0.25, ao = 1.0) {
    faces.push({ indices, color, spec, ao });
  }

  // Helper: Add a 3D Sphere (for sugar pearls / berries / droplets)
  function addSphere(verts, faces, cx, cy, cz, radius, latSegs, lonSegs, color, spec = 0.5) {
    const startIdx = verts.length;
    for (let i = 0; i <= latSegs; i++) {
      const theta = (i / latSegs) * Math.PI;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);
      for (let j = 0; j < lonSegs; j++) {
        const phi = (j / lonSegs) * Math.PI * 2;
        verts.push([
          cx + radius * sinT * Math.cos(phi),
          cy + radius * cosT,
          cz + radius * sinT * Math.sin(phi),
        ]);
      }
    }
    for (let i = 0; i < latSegs; i++) {
      for (let j = 0; j < lonSegs; j++) {
        const nj = (j + 1) % lonSegs;
        const a = startIdx + i * lonSegs + j;
        const b = startIdx + i * lonSegs + nj;
        const c = startIdx + (i + 1) * lonSegs + nj;
        const d = startIdx + (i + 1) * lonSegs + j;
        addFace(faces, [a, b, c, d], color, spec, 1.0);
      }
    }
  }

  // Helper: Add a 3D Capsule/Cylinder Sprinkle on top of a surface
  function addCylinderSprinkle(verts, faces, cx, cy, cz, angleY, tiltX, length, radius, color) {
    const sides = 6;
    const startIdx = verts.length;
    const dx = Math.cos(angleY) * (length * 0.5);
    const dz = Math.sin(angleY) * (length * 0.5);
    const dy = Math.sin(tiltX) * (length * 0.5);

    // Perp vectors
    const px = -Math.sin(angleY);
    const pz = Math.cos(angleY);

    for (let end = -1; end <= 1; end += 2) {
      const ex = cx + dx * end;
      const ey = cy + dy * end;
      const ez = cz + dz * end;
      for (let s = 0; s < sides; s++) {
        const a = (s / sides) * Math.PI * 2;
        const ca = Math.cos(a) * radius;
        const sa = Math.sin(a) * radius;
        verts.push([ex + px * ca, ey + sa, ez + pz * ca]);
      }
    }

    for (let s = 0; s < sides; s++) {
      const ns = (s + 1) % sides;
      addFace(
        faces,
        [startIdx + s, startIdx + ns, startIdx + sides + ns, startIdx + sides + s],
        color,
        0.65,
        1.0
      );
    }
    // End caps
    addFace(faces, [startIdx, startIdx + 1, startIdx + 2, startIdx + 3, startIdx + 4, startIdx + 5], color, 0.65, 1.0);
    addFace(
      faces,
      [startIdx + 6, startIdx + 11, startIdx + 10, startIdx + 9, startIdx + 8, startIdx + 7],
      color,
      0.65,
      1.0
    );
  }

  // ============================================================================
  // 1. HIGH-DETAIL DONUT & SAUCER ("The Diner's Blend" — Diner_Donut.001)
  // ============================================================================
  function createDonutSceneMesh() {
    const verts = [];
    const faces = [];

    // A. Multi-ring Glossy Ceramic Saucer Plate
    const plateSegs = 36;
    const plateProfile = [
      { r: 0.0,  y: -0.52, ao: 0.72 },
      { r: 0.55, y: -0.52, ao: 0.78 },
      { r: 0.92, y: -0.50, ao: 0.88 },
      { r: 1.32, y: -0.39, ao: 0.98 },
      { r: 1.54, y: -0.32, ao: 1.00 },
      { r: 1.58, y: -0.35, ao: 0.90 },
    ];
    const plateStart = verts.length;
    plateProfile.forEach((p) => {
      for (let i = 0; i < plateSegs; i++) {
        const a = (i / plateSegs) * Math.PI * 2;
        verts.push([Math.cos(a) * p.r, p.y, Math.sin(a) * p.r]);
      }
    });

    for (let rIdx = 0; rIdx < plateProfile.length - 1; rIdx++) {
      const ao = plateProfile[rIdx + 1].ao;
      for (let i = 0; i < plateSegs; i++) {
        const ni = (i + 1) % plateSegs;
        const a = plateStart + rIdx * plateSegs + i;
        const b = plateStart + rIdx * plateSegs + ni;
        const c = plateStart + (rIdx + 1) * plateSegs + ni;
        const d = plateStart + (rIdx + 1) * plateSegs + i;
        addFace(faces, [a, b, c, d], [238, 242, 248], 0.75, ao);
      }
    }

    // B. High-Subdivision Golden Baked Dough Torus (with lighter golden equator fry-band)
    const R = 0.80;
    const r = 0.38;
    const segU = 38;
    const segV = 20;
    const doughStart = verts.length;

    for (let i = 0; i < segU; i++) {
      const u = (i / segU) * Math.PI * 2;
      for (let j = 0; j < segV; j++) {
        const v = (j / segV) * Math.PI * 2;
        // Slight organic handmade asymmetry
        const wobble = 1 + 0.025 * Math.sin(u * 3) + 0.015 * Math.cos(u * 5);
        const rx = r * wobble * Math.cos(v);
        const ry = r * 0.92 * Math.sin(v);
        const x = (R + rx) * Math.cos(u);
        const y = -0.14 + ry;
        const z = (R + rx) * Math.sin(u);
        verts.push([x, y, z]);
      }
    }

    for (let i = 0; i < segU; i++) {
      const ni = (i + 1) % segU;
      for (let j = 0; j < segV; j++) {
        const nj = (j + 1) % segV;
        const vMid = ((j + 0.5) / segV) * Math.PI * 2;
        const sinV = Math.sin(vMid);
        const a = doughStart + i * segV + j;
        const b = doughStart + ni * segV + j;
        const c = doughStart + ni * segV + nj;
        const d = doughStart + i * segV + nj;

        // Lighter golden-tan fry line near equator (|sinV| < 0.25), warmer golden brown elsewhere
        const isFryLine = Math.abs(sinV) < 0.24;
        const col = isFryLine ? [232, 182, 118] : [206, 142, 78];
        const ao = sinV < -0.6 ? 0.68 : 0.96;
        addFace(faces, [a, b, c, d], col, 0.18, ao);
      }
    }

    // C. Separate Sculpted Glossy Pink Icing Cap Mesh with Organic Drips
    const iceU = 38;
    const iceV = 12; // Covers top arc from inner rim to outer dripping edge
    const iceStart = verts.length;

    for (let i = 0; i < iceU; i++) {
      const u = (i / iceU) * Math.PI * 2;
      // Organic drip wave around outer edge and inner hole
      const outerDrip =
        0.22 * Math.pow(Math.max(0, Math.sin(u * 4 + 0.3)), 2) +
        0.16 * Math.pow(Math.max(0, Math.cos(u * 7 - 0.8)), 2) +
        0.10 * Math.sin(u * 3);
      const innerDrip = 0.12 * Math.pow(Math.max(0, Math.sin(u * 5 + 1.1)), 2);

      for (let j = 0; j <= iceV; j++) {
        const t = j / iceV; // 0 = outer edge, 0.5 = top crest, 1 = inner edge
        const vStart = -0.10 - outerDrip;
        const vEnd = Math.PI + 0.08 + innerDrip;
        const v = vStart + t * (vEnd - vStart);

        // Bulge icing thickness slightly in the middle and at the rounded drip lip
        const lipBulge = Math.sin(t * Math.PI) * 0.032 + (t < 0.12 || t > 0.88 ? 0.018 : 0.025);
        const rad = r + lipBulge;
        const wobble = 1 + 0.025 * Math.sin(u * 3) + 0.015 * Math.cos(u * 5);
        const rx = rad * wobble * Math.cos(v);
        const ry = rad * 0.93 * Math.sin(v);

        const x = (R + rx) * Math.cos(u);
        const y = -0.14 + ry;
        const z = (R + rx) * Math.sin(u);
        verts.push([x, y, z]);
      }
    }

    for (let i = 0; i < iceU; i++) {
      const ni = (i + 1) % iceU;
      for (let j = 0; j < iceV; j++) {
        const a = iceStart + i * (iceV + 1) + j;
        const b = iceStart + ni * (iceV + 1) + j;
        const c = iceStart + ni * (iceV + 1) + (j + 1);
        const d = iceStart + i * (iceV + 1) + (j + 1);
        // Glossy strawberry-pink icing with strong specular highlight
        addFace(faces, [a, b, c, d], [234, 114, 202], 0.85, 1.0);
      }
    }

    // D. 36 Extruded 3D Pill Sprinkles + Sugar Pearls on Icing & Plate (matching video!)
    const sprinklePalette = [
      [253, 224, 71],  // Pastel Yellow
      [125, 211, 252], // Baby Blue
      [134, 239, 172], // Mint Green
      [250, 250, 255], // Sugar White
      [196, 181, 253], // Soft Lavender
    ];

    for (let s = 0; s < 34; s++) {
      const u = (s * 2.39996) % (Math.PI * 2); // Golden angle distribution
      const ringBias = ((s * 7) % 11) / 11; // 0..1 across top surface
      const v = 0.35 + ringBias * (Math.PI - 0.7);
      const rad = r + 0.048;
      const cx = (R + rad * Math.cos(v)) * Math.cos(u);
      const cy = -0.14 + rad * 0.93 * Math.sin(v);
      const cz = (R + rad * Math.cos(v)) * Math.sin(u);

      const col = sprinklePalette[s % sprinklePalette.length];
      if (s % 6 === 0) {
        // Round sugar pearl
        addSphere(verts, faces, cx, cy + 0.01, cz, 0.036, 4, 6, col, 0.75);
      } else {
        // 3D cylindrical sprinkle
        addCylinderSprinkle(
          verts,
          faces,
          cx,
          cy + 0.008,
          cz,
          s * 1.9,
          Math.cos(v) * 0.35,
          0.115,
          0.024,
          col
        );
      }
    }

    // E. Loose Candy Spheres & Sprinkles sitting on the front ceramic plate rim (just like Varad's render!)
    addSphere(verts, faces, 0.38, -0.44, 1.02, 0.068, 6, 8, [238, 130, 175], 0.7);
    addSphere(verts, faces, 0.54, -0.45, 0.96, 0.048, 5, 7, [253, 224, 71], 0.7);
    addCylinderSprinkle(verts, faces, -0.45, -0.46, 0.98, 0.8, 0.0, 0.12, 0.025, [134, 239, 172]);
    addCylinderSprinkle(verts, faces, 0.12, -0.47, 1.08, -0.5, 0.0, 0.12, 0.025, [253, 224, 71]);

    return { name: 'Diner_Donut.001', verts, faces };
  }

  // ============================================================================
  // 2. HIGH-DETAIL HANDCRAFTED COFFEE MUG ("The Diner's Blend" — Diner_Mug.002)
  // ============================================================================
  function createCoffeeMugMesh() {
    const verts = [];
    const faces = [];

    // A. Detailed Ceramic Saucer with Cup Indent & Glossy Rim
    const saucerSegs = 34;
    const saucerProfile = [
      { r: 0.0,  y: -0.82, ao: 0.68 },
      { r: 0.56, y: -0.82, ao: 0.72 },
      { r: 0.64, y: -0.78, ao: 0.82 },
      { r: 1.05, y: -0.72, ao: 0.95 },
      { r: 1.34, y: -0.63, ao: 1.00 },
      { r: 1.38, y: -0.66, ao: 0.88 },
    ];
    const saucerStart = verts.length;
    saucerProfile.forEach((p) => {
      for (let i = 0; i < saucerSegs; i++) {
        const a = (i / saucerSegs) * Math.PI * 2;
        verts.push([Math.cos(a) * p.r, p.y, Math.sin(a) * p.r]);
      }
    });

    for (let rIdx = 0; rIdx < saucerProfile.length - 1; rIdx++) {
      const ao = saucerProfile[rIdx + 1].ao;
      for (let i = 0; i < saucerSegs; i++) {
        const ni = (i + 1) % saucerSegs;
        const a = saucerStart + rIdx * saucerSegs + i;
        const b = saucerStart + rIdx * saucerSegs + ni;
        const c = saucerStart + (rIdx + 1) * saucerSegs + ni;
        const d = saucerStart + (rIdx + 1) * saucerSegs + i;
        addFace(faces, [a, b, c, d], [236, 240, 246], 0.75, ao);
      }
    }

    // B. High-Poly Two-Tone Barrel Mug (Outer Wall + Thick Rolled Lip + Inner Wall)
    const segU = 36;
    const mugRings = [
      // Outer lower dark-roasted espresso wood band
      { y: -0.78, r: 0.52, col: [48, 32, 22], spec: 0.35, ao: 0.68 },
      { y: -0.64, r: 0.66, col: [54, 36, 25], spec: 0.42, ao: 0.82 },
      { y: -0.45, r: 0.76, col: [60, 40, 28], spec: 0.48, ao: 0.92 },
      { y: -0.24, r: 0.81, col: [65, 44, 30], spec: 0.52, ao: 0.98 },
      // Subtle recessed lathe seam between dark base and warm wood upper body
      { y: -0.06, r: 0.79, col: [52, 34, 23], spec: 0.40, ao: 0.86 },
      // Warm walnut-brown upper body with subtle vertical grain variation
      { y: 0.14,  r: 0.77, col: [116, 78, 48], spec: 0.38, ao: 0.98 },
      { y: 0.36,  r: 0.73, col: [126, 85, 53], spec: 0.38, ao: 1.00 },
      { y: 0.56,  r: 0.69, col: [134, 92, 58], spec: 0.40, ao: 1.00 },
      { y: 0.74,  r: 0.65, col: [142, 98, 63], spec: 0.45, ao: 1.00 },
      // Rolled top rim
      { y: 0.80,  r: 0.62, col: [148, 104, 68], spec: 0.55, ao: 1.00 },
      { y: 0.77,  r: 0.58, col: [120, 82, 52],  spec: 0.45, ao: 0.92 },
      // Inner mug wall descending to coffee surface
      { y: 0.62,  r: 0.57, col: [88, 58, 36],   spec: 0.30, ao: 0.75 },
    ];

    const bodyStart = verts.length;
    mugRings.forEach((ring) => {
      for (let i = 0; i < segU; i++) {
        const a = (i / segU) * Math.PI * 2;
        verts.push([Math.cos(a) * ring.r, ring.y, Math.sin(a) * ring.r]);
      }
    });

    for (let rIdx = 0; rIdx < mugRings.length - 1; rIdx++) {
      const ring = mugRings[rIdx + 1];
      for (let i = 0; i < segU; i++) {
        const ni = (i + 1) % segU;
        const a = bodyStart + rIdx * segU + i;
        const b = bodyStart + rIdx * segU + ni;
        const c = bodyStart + (rIdx + 1) * segU + ni;
        const d = bodyStart + (rIdx + 1) * segU + i;
        // Subtle wood-grain tonal variation around circumference
        const grain = Math.round(Math.sin(i * 3) * 5);
        const col = [
          Math.max(0, Math.min(255, ring.col[0] + grain)),
          Math.max(0, Math.min(255, ring.col[1] + grain)),
          Math.max(0, Math.min(255, ring.col[2] + grain)),
        ];
        addFace(faces, [a, b, c, d], col, ring.spec, ring.ao);
      }
    }

    // C. Glossy Dark Coffee Surface + Golden Crema Foam Ring at the Edge
    const coffeeRings = [
      { r: 0.0,  y: 0.62, col: [26, 16, 11], spec: 0.90 },
      { r: 0.44, y: 0.62, col: [34, 21, 14], spec: 0.88 },
      { r: 0.57, y: 0.63, col: [158, 108, 64], spec: 0.65 }, // Crema foam meniscus
    ];
    const coffeeStart = verts.length;
    coffeeRings.forEach((cr) => {
      for (let i = 0; i < segU; i++) {
        const a = (i / segU) * Math.PI * 2;
        verts.push([Math.cos(a) * cr.r, cr.y, Math.sin(a) * cr.r]);
      }
    });
    for (let rIdx = 0; rIdx < coffeeRings.length - 1; rIdx++) {
      const cr = coffeeRings[rIdx + 1];
      for (let i = 0; i < segU; i++) {
        const ni = (i + 1) % segU;
        const a = coffeeStart + rIdx * segU + i;
        const b = coffeeStart + rIdx * segU + ni;
        const c = coffeeStart + (rIdx + 1) * segU + ni;
        const d = coffeeStart + (rIdx + 1) * segU + i;
        addFace(faces, [a, b, c, d], cr.col, cr.spec, 0.92);
      }
    }

    // D. Sculpted Ergonomic Ear Handle (Flared attachments + flattened oval grip)
    const handleSteps = 18;
    const tubeSides = 10;
    const handleStart = verts.length;
    for (let s = 0; s <= handleSteps; s++) {
      const u = s / handleSteps; // 0..1
      const t = u * Math.PI - Math.PI * 0.5;
      // Ear handle profile matching Varad's render on the left side
      const cx = -0.66 - Math.cos(t) * 0.48 - Math.sin(u * Math.PI) * 0.06;
      const cy = 0.02 + Math.sin(t) * 0.54;
      const tx = Math.sin(t);
      const ty = Math.cos(t);

      // Flare thickness where handle meets the mug body
      const endFlare = 1 + 0.38 * Math.pow(Math.cos(u * Math.PI), 4);
      const rInOut = 0.078 * endFlare;
      const rSide = 0.105 * endFlare;

      for (let k = 0; k < tubeSides; k++) {
        const phi = (k / tubeSides) * Math.PI * 2;
        const nx = -ty * Math.cos(phi) * rInOut;
        const ny = tx * Math.cos(phi) * rInOut;
        const nz = Math.sin(phi) * rSide;
        verts.push([cx + nx, cy + ny, nz]);
      }
    }

    for (let s = 0; s < handleSteps; s++) {
      const isLower = s < handleSteps * 0.38;
      const col = isLower ? [68, 45, 30] : [122, 82, 51];
      for (let k = 0; k < tubeSides; k++) {
        const nk = (k + 1) % tubeSides;
        const a = handleStart + s * tubeSides + k;
        const b = handleStart + s * tubeSides + nk;
        const c = handleStart + (s + 1) * tubeSides + nk;
        const d = handleStart + (s + 1) * tubeSides + k;
        addFace(faces, [a, b, c, d], col, 0.45, 0.95);
      }
    }

    return { name: 'Diner_Mug.002', verts, faces };
  }

  // ============================================================================
  // 3. HIGH-DETAIL POTTED SUCCULENT ("Golden Hour Window" — Table_Succulent.003)
  // ============================================================================
  function createSucculentPlanterMesh() {
    const verts = [];
    const faces = [];

    // A. Thick-Walled White Ceramic Planter Pot with Rolled Rim & Inner Wall
    const potSegs = 32;
    const potProfile = [
      { y: -0.95, r: 0.44, col: [215, 222, 232], spec: 0.45, ao: 0.72 },
      { y: -0.65, r: 0.53, col: [228, 234, 242], spec: 0.55, ao: 0.86 },
      { y: -0.30, r: 0.62, col: [238, 243, 249], spec: 0.62, ao: 0.95 },
      { y: 0.04,  r: 0.70, col: [245, 248, 253], spec: 0.68, ao: 1.00 },
      { y: 0.09,  r: 0.67, col: [248, 250, 255], spec: 0.72, ao: 1.00 }, // Top rim lip
      { y: 0.05,  r: 0.61, col: [222, 228, 236], spec: 0.50, ao: 0.85 }, // Inner rim wall
      { y: -0.06, r: 0.60, col: [185, 192, 202], spec: 0.30, ao: 0.70 }, // Soil contact depth
    ];

    const potStart = verts.length;
    potProfile.forEach((ring) => {
      for (let i = 0; i < potSegs; i++) {
        const a = (i / potSegs) * Math.PI * 2;
        verts.push([Math.cos(a) * ring.r, ring.y, Math.sin(a) * ring.r]);
      }
    });

    for (let rIdx = 0; rIdx < potProfile.length - 1; rIdx++) {
      const ring = potProfile[rIdx + 1];
      for (let i = 0; i < potSegs; i++) {
        const ni = (i + 1) % potSegs;
        const a = potStart + rIdx * potSegs + i;
        const b = potStart + rIdx * potSegs + ni;
        const c = potStart + (rIdx + 1) * potSegs + ni;
        const d = potStart + (rIdx + 1) * potSegs + i;
        addFace(faces, [a, b, c, d], ring.col, ring.spec, ring.ao);
      }
    }

    // B. Dark Potting Soil Bed inside Planter
    const soilCenter = verts.length;
    verts.push([0, -0.02, 0]);
    const soilRimStart = verts.length;
    for (let i = 0; i < potSegs; i++) {
      const a = (i / potSegs) * Math.PI * 2;
      verts.push([Math.cos(a) * 0.60, -0.04, Math.sin(a) * 0.60]);
    }
    for (let i = 0; i < potSegs; i++) {
      const ni = (i + 1) % potSegs;
      addFace(faces, [soilCenter, soilRimStart + i, soilRimStart + ni], [58, 42, 31], 0.1, 0.65);
    }

    // Helper: Build a sculpted, fleshy, curved 3D Echeveria Succulent Petal
    function addSucculentPetal(angle, length, maxWidth, thickness, yStart, pitchAngle, cupCurve, baseCol, tipCol) {
      const uSteps = 4; // Along petal length from stem to pointed tip
      const vSteps = 4; // Across petal cross-section (top left -> top center -> top right -> bottom keel)
      const pStart = verts.length;

      const ca = Math.cos(angle);
      const sa = Math.sin(angle);
      const px = -sa;
      const pz = ca;

      for (let i = 0; i <= uSteps; i++) {
        const t = i / uSteps; // 0 = stem base, 1 = sharp tip
        // Leaf width profile: narrow at stem, widest at 62% length, sharp point at t=1
        const wProfile = Math.sin(Math.pow(t, 0.75) * Math.PI);
        const w = maxWidth * wProfile;
        const thick = thickness * Math.sin(t * Math.PI) + 0.012;

        // Forward reach + upward curve
        const rDist = 0.05 + t * length * Math.cos(pitchAngle);
        const yLift = yStart + t * length * Math.sin(pitchAngle) + Math.pow(t, 2.2) * cupCurve;

        const cx = ca * rDist;
        const cz = sa * rDist;

        // 4-point diamond/fleshy cross-section per segment
        verts.push(
          [cx + px * w, yLift + thick * 0.25, cz + pz * w],       // 0: Left margin edge
          [cx,          yLift + thick * 0.45, cz],                // 1: Upper concave/flat face
          [cx - px * w, yLift + thick * 0.25, cz - pz * w],       // 2: Right margin edge
          [cx,          yLift - thick * 0.85, cz]                 // 3: Lower rounded keel
        );
      }

      for (let i = 0; i < uSteps; i++) {
        const isTip = i === uSteps - 1;
        const col = isTip ? tipCol : baseCol;
        const ao = 0.72 + (i / uSteps) * 0.28;
        for (let k = 0; k < vSteps; k++) {
          const nk = (k + 1) % vSteps;
          const a = pStart + i * vSteps + k;
          const b = pStart + i * vSteps + nk;
          const c = pStart + (i + 1) * vSteps + nk;
          const d = pStart + (i + 1) * vSteps + k;
          addFace(faces, [a, b, c, d], col, 0.35, ao);
        }
      }
    }

    // C. 5 Concentric Rosette Tiers (44 Fleshy 3D Leaves Total!)
    const rosetteTiers = [
      {
        count: 12,
        len: 0.78,
        w: 0.21,
        thick: 0.11,
        y: 0.00,
        pitch: 0.18,
        cup: 0.12,
        rot: 0.0,
        col: [44, 126, 78],
        tip: [62, 148, 92],
      },
      {
        count: 10,
        len: 0.66,
        w: 0.19,
        thick: 0.10,
        y: 0.06,
        pitch: 0.42,
        cup: 0.16,
        rot: 0.31,
        col: [58, 148, 94],
        tip: [84, 174, 114],
      },
      {
        count: 9,
        len: 0.52,
        w: 0.16,
        thick: 0.09,
        y: 0.12,
        pitch: 0.68,
        cup: 0.18,
        rot: 0.65,
        col: [76, 170, 110],
        tip: [110, 196, 134],
      },
      {
        count: 7,
        len: 0.38,
        w: 0.13,
        thick: 0.08,
        y: 0.18,
        pitch: 0.95,
        cup: 0.15,
        rot: 1.05,
        col: [96, 192, 128],
        tip: [134, 216, 156],
      },
      {
        count: 5,
        len: 0.24,
        w: 0.09,
        thick: 0.06,
        y: 0.22,
        pitch: 1.22,
        cup: 0.10,
        rot: 1.45,
        col: [122, 212, 148],
        tip: [158, 228, 174],
      },
    ];

    rosetteTiers.forEach((tier) => {
      for (let i = 0; i < tier.count; i++) {
        const a = (i / tier.count) * Math.PI * 2 + tier.rot;
        addSucculentPetal(
          a,
          tier.len,
          tier.w,
          tier.thick,
          tier.y,
          tier.pitch,
          tier.cup,
          tier.col,
          tier.tip
        );
      }
    });

    return { name: 'Table_Succulent.003', verts, faces };
  }

  const meshes = {
    donut: createDonutSceneMesh(),
    mug: createCoffeeMugMesh(),
    succulent: createSucculentPlanterMesh(),
  };

  function updateHUD() {
    const m = meshes[currentMeshKey];
    if (hudMeshName) hudMeshName.textContent = m.name;
    if (hudVerts) hudVerts.textContent = m.verts.length;
    if (hudFaces) hudFaces.textContent = m.faces.length;
    if (hudMode) hudMode.textContent = shadingMode.toUpperCase();
  }

  updateHUD();

  // 3D Math Helpers
  function rotatePoint(p, rx, ry) {
    let [x, y, z] = p;
    const cosY = Math.cos(ry);
    const sinY = Math.sin(ry);
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;

    const cosX = Math.cos(rx);
    const sinX = Math.sin(rx);
    const y2 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;

    return [x1, y2, z2];
  }

  function project(p) {
    const fov = 440;
    const viewerDist = 4.05;
    const z = p[2] + viewerDist;
    const scale = fov / Math.max(0.5, z);
    return [width / 2 + p[0] * scale, height / 2 - p[1] * scale, z];
  }

  function drawGridFloor() {
    const gridSize = 4;
    const step = 0.5;
    const floorY = -1.02;

    for (let i = -gridSize; i <= gridSize; i += step) {
      const p1 = project(rotatePoint([i, floorY, -gridSize], rotX, rotY));
      const p2 = project(rotatePoint([i, floorY, gridSize], rotX, rotY));
      ctx.beginPath();
      ctx.moveTo(p1[0], p1[1]);
      ctx.lineTo(p2[0], p2[1]);
      ctx.strokeStyle =
        Math.abs(i) < 0.001
          ? 'rgba(77, 255, 136, 0.45)'
          : 'rgba(148, 163, 184, 0.11)';
      ctx.lineWidth = Math.abs(i) < 0.001 ? 1.5 : 0.7;
      ctx.stroke();

      const p3 = project(rotatePoint([-gridSize, floorY, i], rotX, rotY));
      const p4 = project(rotatePoint([gridSize, floorY, i], rotX, rotY));
      ctx.beginPath();
      ctx.moveTo(p3[0], p3[1]);
      ctx.lineTo(p4[0], p4[1]);
      ctx.strokeStyle =
        Math.abs(i) < 0.001
          ? 'rgba(255, 77, 77, 0.45)'
          : 'rgba(148, 163, 184, 0.11)';
      ctx.lineWidth = Math.abs(i) < 0.001 ? 1.5 : 0.7;
      ctx.stroke();
    }
  }

  function normalize(v) {
    const len = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / len, v[1] / len, v[2] / len];
  }

  function computeNormal(v0, v1, v2) {
    const ux = v1[0] - v0[0];
    const uy = v1[1] - v0[1];
    const uz = v1[2] - v0[2];
    const vx = v2[0] - v0[0];
    const vy = v2[1] - v0[1];
    const vz = v2[2] - v0[2];
    return normalize([
      uy * vz - uz * vy,
      uz * vx - ux * vz,
      ux * vy - uy * vx,
    ]);
  }

  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  // Studio Three-Point Lighting Setup (Key + Warm Rim + Halfway Vector for Glossy Specular)
  const keyLight = normalize([0.58, 0.78, -0.55]);
  const rimLight = normalize([-0.75, 0.35, 0.55]);
  const halfVec = normalize([keyLight[0], keyLight[1], keyLight[2] - 1.0]);

  function renderLoop() {
    ctx.clearRect(0, 0, width, height);

    if (autoRotate && !isDragging) {
      rotY += 0.007;
    }

    drawGridFloor();

    const mesh = meshes[currentMeshKey];
    const rotatedVerts = mesh.verts.map((v) => rotatePoint(v, rotX, rotY));
    const projectedVerts = rotatedVerts.map((v) => project(v));

    const sortedFaces = mesh.faces
      .map((faceObj) => {
        const indices = faceObj.indices;
        let avgZ = 0;
        indices.forEach((idx) => {
          avgZ += rotatedVerts[idx][2];
        });
        avgZ /= indices.length;
        const normal = computeNormal(
          rotatedVerts[indices[0]],
          rotatedVerts[indices[1]],
          rotatedVerts[indices[2]]
        );
        return {
          indices,
          color: faceObj.color,
          spec: faceObj.spec,
          ao: faceObj.ao,
          avgZ,
          normal,
        };
      })
      .sort((a, b) => b.avgZ - a.avgZ);

    sortedFaces.forEach((face) => {
      const pts = face.indices.map((i) => projectedVerts[i]);

      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i][0], pts[i][1]);
      }
      ctx.closePath();

      if (shadingMode === 'wireframe') {
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.75)';
        ctx.lineWidth = 0.75;
        ctx.stroke();
      } else if (shadingMode === 'solid') {
        // Blender MatCap Clay Solid Shading
        const nDotL = Math.max(0.18, Math.abs(dot(face.normal, keyLight)));
        const specHit = Math.pow(Math.max(0, Math.abs(dot(face.normal, halfVec))), 16) * 35;
        const c = Math.min(245, Math.round((58 + nDotL * 145) * face.ao + specHit));
        ctx.fillStyle = `rgb(${c}, ${Math.min(255, c + 6)}, ${Math.min(255, c + 16)})`;
        ctx.fill();
        ctx.strokeStyle = `rgb(${c}, ${Math.min(255, c + 6)}, ${Math.min(255, c + 16)})`;
        ctx.lineWidth = 0.45;
        ctx.stroke();
      } else {
        // Rendered Mode: Smooth Phong Shading + Glossy Specular Highlights + Ambient Occlusion
        const baseCol = face.color || [180, 190, 210];
        const keyDiff = Math.max(0.24, Math.abs(dot(face.normal, keyLight)));
        const rimDiff = Math.max(0, dot(face.normal, rimLight));
        const specPower = Math.pow(Math.max(0, Math.abs(dot(face.normal, halfVec))), 22);
        const specBoost = specPower * (face.spec || 0.25) * 95;
        const ao = face.ao || 1.0;

        const r = Math.min(255, Math.round((baseCol[0] * (0.34 + keyDiff * 0.72) + rimDiff * 28) * ao + specBoost));
        const g = Math.min(255, Math.round((baseCol[1] * (0.34 + keyDiff * 0.72) + rimDiff * 18) * ao + specBoost));
        const b = Math.min(255, Math.round((baseCol[2] * (0.34 + keyDiff * 0.72) + rimDiff * 14) * ao + specBoost));

        const rgbStr = `rgb(${r}, ${g}, ${b})`;
        ctx.fillStyle = rgbStr;
        ctx.fill();
        // Seamless anti-aliased edge matching surface shade (like Blender "Shade Smooth")
        ctx.strokeStyle = rgbStr;
        ctx.lineWidth = 0.55;
        ctx.stroke();
      }
    });

    requestAnimationFrame(renderLoop);
  }

  renderLoop();

  // Pointer Controls for Orbiting 3D Viewport
  canvas.addEventListener('pointerdown', (e) => {
    isDragging = true;
    autoRotate = false;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    rotY += dx * 0.01;
    rotX = Math.max(-1.3, Math.min(1.3, rotX + dy * 0.01));
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });

  canvas.addEventListener('pointerup', () => {
    isDragging = false;
  });

  // Shading Mode Switchers
  document.querySelectorAll('.shade-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.shade-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      shadingMode = btn.getAttribute('data-shade') || 'rendered';
      updateHUD();
    });
  });

  // Mesh Selector Switchers
  document.querySelectorAll('.mesh-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.mesh-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      currentMeshKey = chip.getAttribute('data-mesh') || 'donut';
      autoRotate = true;
      updateHUD();
    });
  });

  // Video Project Controls (Mute/Unmute & Fullscreen)
  document.querySelectorAll('[data-video-mute]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const vidId = btn.getAttribute('data-video-mute');
      const vid = document.getElementById(vidId);
      if (!vid) return;
      vid.muted = !vid.muted;
      btn.textContent = vid.muted ? '🔇 Unmute Audio' : '🔊 Mute Audio';
    });
  });

  document.querySelectorAll('[data-video-fullscreen]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const vidId = btn.getAttribute('data-video-fullscreen');
      const vid = document.getElementById(vidId);
      if (!vid) return;
      if (vid.requestFullscreen) {
        vid.requestFullscreen();
      } else if (vid.webkitRequestFullscreen) {
        vid.webkitRequestFullscreen();
      }
    });
  });

  // Custom Local Render Uploader
  const renderInput = document.getElementById('renderUploadInput');
  const galleryGrid = document.getElementById('blenderGalleryGrid');

  if (renderInput && galleryGrid) {
    renderInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files || []);
      files.forEach((file) => {
        const url = URL.createObjectURL(file);
        const isVideo = file.type.startsWith('video/');
        const card = document.createElement('article');
        card.className = 'render-card';

        const mediaMarkup = isVideo
          ? `<video src="${url}" autoplay loop muted playsinline style="width:100%;height:100%;object-fit:cover;"></video>`
          : `<img src="${url}" alt="${file.name}" style="width:100%;height:100%;object-fit:cover;" />`;

        card.innerHTML = `
          <div class="render-preview">
            ${mediaMarkup}
            <span class="render-tag">${isVideo ? 'Animation (.MP4)' : 'Custom Render'}</span>
          </div>
          <div class="render-body">
            <h4>${file.name.replace(/\.[^/.]+$/, '')}</h4>
            <p>Custom Blender 3D render loaded directly from your local machine for portfolio showcase.</p>
            <div class="render-meta">
              <span>Blender 4.x</span>
              <span>${(file.size / 1024).toFixed(0)} KB</span>
            </div>
          </div>
        `;
        galleryGrid.prepend(card);
      });
    });
  }
})();
