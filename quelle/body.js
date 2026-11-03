/* =====================================================================
   KAROSSERIE TRABANT 601 LIMOUSINE  (Loft aus Querschnitten)
   Nach Maßzeichnung: Länge 3510 mm (Rumpf), Breite 1510 mm, Höhe 1440 mm,
   Überhang vorn 615 mm, Radstand 2020 mm, Bodenfreiheit 155 mm.
   Koordinaten: Ursprung Mitte Vorderachse auf Fahrbahn, Fahrtrichtung -Z,
   rechts +X, oben +Y, Meter.

   Prinzip: Für jede Längsposition z wird ein Querschnitt (rechte Hälfte,
   gespiegelt) berechnet: Boden → Seitenwand → Schulter → oben entweder
   Haube/Kofferraum (gewölbt) oder Fahrgastzelle (eingezogene Seitenscheibe,
   runde Dachkante, Dach). Alle Querschnitte werden zu einer glatten Haut
   verbunden. Radläufe entstehen, indem Punkte außerhalb der Radhaus-Innen-
   kante auf den Radlaufbogen angehoben werden. Jede Dreiecksfläche wird
   anhand ihrer Lage der Lackhaut oder der Verglasung zugeordnet.
   ===================================================================== */
export function buildTrabantBody(THREE, M) {
  const out = { duro: new THREE.Group(), glass: new THREE.Group(), trim: new THREE.Group(), lines: [] };
  const Z0 = -0.655, Z1 = 2.885;                     // Front / Heck (Karosserie ohne Stoßstangen)
  const ARCH_R = 0.375, ARCH_Y = 0.30, WH_IN = 0.47;  // Radlauf: Radius, Mittelpunkthöhe, Radhaus-Innenkante
  const sm = (a, b, t) => { const x = Math.max(0, Math.min(1, (t - a) / (b - a))); return x * x * (3 - 2 * x); };
  const lerp = (a, b, t) => a + (b - a) * t;
  /** Stückweise lineare Interpolation über Stützstellen [[z, wert], …] mit weichen Übergängen */
  const curve = pts => z => {
    if (z <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (z <= pts[i][0]) {
      const [za, a] = pts[i - 1], [zb, b] = pts[i]; const t = (z - za) / (zb - za);
      return lerp(a, b, t * t * (3 - 2 * t) * .35 + t * .65);
    }
    return pts[pts.length - 1][1];
  };
  /* --- Längsverläufe (aus Seiten-, Vorder- und Rückansicht abgegriffen) --- */
  // Mittellinie oben: Haube vorn deutlich abgesenkt, Dach (ohne Wölbung) 1,40 m, Kofferraumdeckel tiefer als die Flossen
  const topC = curve([[-0.655, 0.72], [-0.62, 0.78], [-0.50, 0.84], [-0.30, 0.89], [0.0, 0.935], [0.33, 0.965], [0.45, 1.09], [0.58, 1.30], [0.70, 1.385],
    [0.85, 1.40], [1.60, 1.40], [1.98, 1.385], [2.06, 1.36], [2.12, 1.30], [2.30, 1.10], [2.43, 0.975], [2.55, 0.95], [2.70, 0.91], [2.80, 0.875], [2.885, 0.835]]);
  // Schulter: vorn zu den Radkästen hochgezogen (Kotflügel höher als Haubenmitte), hinten Flossen
  // Gürtellinie/Zierleiste: aus der Seitenansicht ausgemessen – höchster Punkt an der Tür, zum Heck deutlich abfallend
  const belt = curve([[-0.655, 0.78], [-0.60, 0.82], [-0.43, 0.865], [0.0, 0.945], [0.35, 0.985], [0.87, 1.0], [1.35, 0.992], [1.83, 0.965], [2.31, 0.928], [2.69, 0.892], [2.86, 0.865], [2.885, 0.845]]);
  const halfW = curve([[-0.655, 0.70], [-0.45, 0.725], [-0.15, 0.745], [0.3, 0.755], [2.3, 0.755], [2.885, 0.735]]);   // Draufsicht: Bug und Heck eingezogen
  const yBot = curve([[-0.655, 0.34], [-0.55, 0.30], [2.7, 0.30], [2.885, 0.33]]);
  const CAB0 = 0.33, CAB1 = 2.43;                                     // Bereich der Fahrgastzelle
  const GH_BELT = 0.685, GH_ROOF = 0.60, RR = 0.12;                  // Glashaus: halbe Breite unten/oben, Dachkantenradius
  const arch = z => { for (const zc of [0, 2.02]) { const d = z - zc; if (Math.abs(d) < ARCH_R) return ARCH_Y + Math.sqrt(ARCH_R * ARCH_R - d * d); } return -1; };

  /* --- Querschnitt (rechte Hälfte) für Position z: Liste [x, y, Zone] --- */
  const K = 26;                                                       // Punkte im oberen Bereich
  function section(z) {
    const W = halfW(z), yb = yBot(z), sh = belt(z), yt = topC(z), pts = [];
    const rb = 0.07, rs = 0.075;
    // Boden (mit Punkten an der Radhaus-Innenkante für eine saubere Kante)
    for (const x of [0, 0.25, WH_IN - .005, WH_IN + .005, W - rb]) pts.push([Math.min(x, W - rb), yb, 'low']);
    for (let k = 1; k <= 4; k++) { const a = -Math.PI / 2 + k / 4 * Math.PI / 2; pts.push([W - rb + Math.cos(a) * rb, yb + rb + Math.sin(a) * rb, 'low']); }
    // Seitenwand (leicht bauchig), Schulterrundung
    for (let k = 1; k <= 6; k++) { const t = k / 7, y = lerp(yb + rb, sh - rs, t); pts.push([W + .008 * Math.sin(Math.PI * t), y, 'low']); }
    for (let k = 0; k <= 5; k++) { const a = k / 5 * Math.PI / 2; pts.push([W - rs + Math.cos(a) * rs, sh - rs + Math.sin(a) * rs, 'low']); }
    // Oberer Bereich: Mischung aus Haube/Kofferraum und Fahrgastzelle
    const inCab = z > CAB0 && z < CAB1, h = inCab ? Math.max(0, yt - sh) : 0, c = sm(0.0, 0.12, h);
    const rr = Math.min(RR, Math.max(0.001, h * .4));
    const gz = 1 - .05 * sm(1.0, 0.45, z) - .06 * sm(1.75, 2.35, z);           // Dach/Glashaus zu den Enden schmaler (Draufsicht)
    const x0 = W - rs, sideTop = yt - rr, wr = lerp(GH_BELT, GH_ROOF, sm(0, 0.45, h)) * gz;
    for (let k = 1; k <= K; k++) {
      const u = k / K;
      // a) Haube / Kofferraumdeckel: gewölbt von der Schulter zur Mitte
      const hx = x0 * (1 - u);
      let hy = sh + (yt - sh) * (1 - (1 - u) * (1 - u));
      // vorn: Kotflügel zieht über dem Scheinwerfertopf als Kamm hoch, daneben Mulde zur Haube (Foto markiert)
      const rp = sm(0.25, -0.45, z);
      if (rp > 0) hy -= rp * .022 * Math.exp(-(((hx - .445) / .06) ** 2));   // Mulde neben dem Topf
      // b) Fahrgastzelle: Fensterbank → Seitenscheibe → Dachkante → Dach
      let cx, cy, zone;
      if (u <= .12) { const t = u / .12; cx = lerp(x0, GH_BELT * (1 - (1 - gz) * .5), t); cy = sh + .004 * t; zone = 'sill'; }
      else if (u <= .5) { const t = (u - .12) / .38; cx = lerp(GH_BELT * (1 - (1 - gz) * .5), wr, t); cy = lerp(sh + .004, sideTop, t); zone = 'side'; }
      else if (u <= .74) { const a = (u - .5) / .24 * Math.PI / 2; cx = wr - rr + Math.cos(a) * rr; cy = sideTop + Math.sin(a) * rr; zone = 'corner'; }
      else { const t = (u - .74) / .26; cx = lerp(wr - rr, 0, t); cy = yt + .04 * sm(0, .12, h) * Math.sin(t * Math.PI / 2) ** .8; zone = 'top'; }  // Dach oben durchgehend rund
      pts.push([lerp(hx, cx, c), lerp(hy, cy, c), c > .5 ? zone : 'hood']);
    }
    // Hinter den Scheinwerfern: Oberseite folgt dem Kreis des Topfes (Achse x = 583 mm, y = 748 mm) und läuft nach hinten aus
    const rp2 = sm(0.10, -0.50, z);
    if (rp2 > 0) for (const p of pts) { const dx = p[0] - .583; if (Math.abs(dx) < .117 && p[1] > .70) { const yc = .748 + Math.sqrt(.117 * .117 - dx * dx) * (.85 + .15 * rp2); p[1] = lerp(p[1], Math.max(p[1], yc), rp2); } }
    // Radläufe: Punkte außerhalb der Radhaus-Innenkante auf den Bogen anheben
    const ay = arch(z);
    if (ay > 0) for (const p of pts) if (p[0] > WH_IN && p[1] < ay) { p[1] = ay; if (p[2] === 'low') p[2] = 'arch'; }
    return pts;
  }

  /* --- Stationen: gleichmäßig, an den Enden dichter (gerundete Front/Heck) --- */
  const RN = 0.075, zs = [], LEAN = 0.09;
  const rearZ = y => Z1 - LEAN * Math.max(0, Math.min(1, (0.86 - y) / 0.5));   // Heckfläche in Höhe y
  for (let k = 0; k <= 6; k++) zs.push(Z0 + RN * (1 - Math.cos(k / 6 * Math.PI / 2)));
  for (let z = Z0 + RN + .02; z < Z1 - RN - .01; z += .02) zs.push(z);
  for (let k = 6; k >= 0; k--) zs.push(Z1 - RN * (1 - Math.cos(k / 6 * Math.PI / 2)));
  /** Abrundung an Front und Heck: Querschnitt zur Mitte hin einziehen */
  const inset = z => { const d = Math.min(z - Z0, Z1 - z); return d >= RN ? 0 : RN - Math.sqrt(Math.max(0, RN * RN - (RN - d) * (RN - d))); };

  const rings = zs.map(z => {
    const half = section(z), a = inset(z), yb = yBot(z), yc = (yb + Math.min(topC(z), belt(z))) / 2;
    const adj = half.map(([x, y, zone]) => [Math.max(0, x - a * (x > .01 ? 1 : 0)), y > yc ? Math.max(yc, y - a) : Math.min(yc, y + a), zone]);
    const full = adj.slice().reverse().map(([x, y, zn]) => [-x, y, zn]).concat(adj.slice(1, -1));  // links (Mitte unten → Mitte oben) + rechts zurück
    // Reihenfolge: rechte Hälfte von unten nach oben, dann linke Hälfte von oben nach unten → geschlossener Ring
    const ring = adj.map(([x, y, zn]) => [x, y, zn]).concat(adj.slice(1, -1).reverse().map(([x, y, zn]) => [-x, y, zn]));
    return ring.map(([x, y, zn]) => ({ p: new THREE.Vector3(x, y, z), zone: zn }));
  });
  for (const r of rings) for (const v of r) {
    const k = sm(-0.30, Z0, v.p.z);
    if (k > 0) v.p.z += k * (.035 * (Math.abs(v.p.x) / .72) ** 2 + .05 * sm(0.45, 0.76, Math.abs(v.p.x)));   // Front in der Draufsicht rund, Ecken stark gerundet
    const kr = sm(2.55, Z1, v.p.z);
    if (kr > 0) v.p.z -= .035 * kr * sm(0.45, 0.76, Math.abs(v.p.x)) + LEAN * kr * Math.max(0, Math.min(1, (0.86 - v.p.y) / 0.5));  // Heck schräg: unten weiter vorn
  }
  const N = rings[0].length, S = rings.length;

  /* --- Haut als indizierte Geometrie (für glatte Normalen) --- */
  const pos = new Float32Array(S * N * 3);
  rings.forEach((r, i) => r.forEach((v, j) => { pos.set([v.p.x, v.p.y, v.p.z], (i * N + j) * 3); }));
  const idx = [];
  for (let i = 0; i < S - 1; i++) for (let j = 0; j < N; j++) {
    const a = i * N + j, b = i * N + (j + 1) % N, c = (i + 1) * N + j, d = (i + 1) * N + (j + 1) % N;
    idx.push(a, b, c, b, d, c);                                     // Normalen nach außen
  }
  // Deckel vorn und hinten (Fächer zur Mitte)
  const capCenter = i => { const c = new THREE.Vector3(); rings[i].forEach(v => c.add(v.p)); return c.multiplyScalar(1 / N); };
  const base = S * N, P2 = Array.from(pos);
  const cf = capCenter(0), cr = capCenter(S - 1); P2.push(cf.x, cf.y, cf.z, cr.x, cr.y, cr.z);
  for (let j = 0; j < N; j++) { idx.push(base, (j + 1) % N, j); idx.push(base + 1, (S - 1) * N + j, (S - 1) * N + (j + 1) % N); }
  const skin = new THREE.BufferGeometry();
  skin.setAttribute('position', new THREE.Float32BufferAttribute(P2, 3)); skin.setIndex(idx); skin.computeVertexNormals();

  /* --- Flächen nach Lack / Glas trennen --- */
  const zoneOf = vi => vi >= base ? 'cap' : rings[Math.floor(vi / N)][vi % N].zone;
  /* --- Fenster: exakte Umrisse mit runden Ecken; die Haut bekommt darunter ein Loch --- */
  const upper = z => section(z).filter(p => p[2] !== 'low' && p[2] !== 'arch');
  /** x der Außenfläche (rechte Seite) in Höhe y */
  function xSide(z, y) { const u = upper(z); for (let i = 0; i < u.length - 1; i++) { const a = u[i], b = u[i + 1]; if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) return lerp(a[0], b[0], (y - a[1]) / (b[1] - a[1])); } return u[u.length - 1][0]; }
  /** y der Dachfläche bei Querlage x */
  function yTop(z, x) { x = Math.abs(x); const u = upper(z); for (let i = u.length - 1; i > 0; i--) { const a = u[i], b = u[i - 1]; if ((a[0] - x) * (b[0] - x) <= 0 && a[0] !== b[0]) return lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0])); } return u[0][1]; }
  /** Einheitsquadrat → Quadrat mit runden Ecken (Superellipse) */
  const squircle = (a, b, n = 5) => { const r = Math.max(Math.abs(a), Math.abs(b)); if (r < 1e-6) return [0, 0]; const da = a / r, db = b / r, k = Math.pow(Math.abs(da) ** n + Math.abs(db) ** n, -1 / n); return [da * k * r, db * k * r]; };
  const WS = { z0: 0.385, z1: 0.632, w0: 0.585, w1: 0.50 };          // Frontscheibe: unten/oben, halbe Breite
  const RW = { z0: 2.405, z1: 2.105, w0: 0.575, w1: 0.50 };          // Heckscheibe
  const DOORWIN = [[0.53, 1.025], [1.35, 1.025], [0.77, 1.305], [1.35, 1.305]];   // Türscheibe: vorn-unten, hinten-unten, vorn-oben, hinten-oben (z, y)
  const QWIN = [[1.425, 1.025], [2.25, 1.025], [1.425, 1.305], [2.03, 1.305]];    // hinteres Seitenfenster
  const wsAt = (W, v) => ({ z: lerp(W.z0, W.z1, v), w: lerp(W.w0, W.w1, v) });
  const quadAt = (Q, u, v) => [lerp(lerp(Q[0][0], Q[1][0], u), lerp(Q[2][0], Q[3][0], u), v), lerp(lerp(Q[0][1], Q[1][1], u), lerp(Q[2][1], Q[3][1], u), v)];
  const inQuad = (Q, z, y, m) => {                                    // Punkt im (verkleinerten) Viereck?
    if (y < Q[0][1] + m || y > Q[2][1] - m) return false; const v = (y - Q[0][1]) / (Q[2][1] - Q[0][1]);
    return z > lerp(Q[0][0], Q[2][0], v) + m && z < lerp(Q[1][0], Q[3][0], v) - m;
  };
  const isHole = (zone, x, y, z) => {
    if (zone === 'top' || zone === 'corner') for (const W of [WS, RW]) {
      const v = (z - W.z0) / (W.z1 - W.z0); if (v > .03 && v < .97 && Math.abs(x) < lerp(W.w0, W.w1, v) - .02) return true;
    }
    if (zone === 'side' || zone === 'corner') return inQuad(DOORWIN, z, y, .018) || inQuad(QWIN, z, y, .018);
    return false;
  };
  /* --- Einteilung der Haut in Bauteile nach Ersatzteilkatalog (Tafeln K 1, K 7, K 13, K 17) ---
     Die Teilegrenzen (Fugen) liegen dort, wo am Original die Duroplastteile bzw. das Stahlgerippe stoßen. */
  const HOOD_X = 0.56, HOOD_XF = 0.47, DOOR_Z0 = 0.47, DOOR_Z1 = 1.385;   // Haubenfuge liegt in der Mulde neben den Töpfen
  function classify(zone, x, y, z) {
    const ax = Math.abs(x), s = x < 0 ? 'l' : 'r', W = halfW(z);
    if (zone === 'cap') return z < 1 ? 'frontmaske' : 'heckblende';
    if (y < yBot(z) + .015 && ax < W - .06) return 'boden';                     // Bodengruppe (Stahl)
    if (zone === 'arch' && ax < W - .03) return 'radhaeuser';                      // Radhausschalen (Stahl)
    if (zone === 'top' || zone === 'corner') {
      if (z > 0.66 && z < 2.06) return 'dach';
      return z < 1 ? 'a_saeule_' + s : 'c_saeule_' + s;
    }
    if (zone === 'side') {
      if (z < 0.78) return 'a_saeule_' + s;
      if (Math.abs(z - DOOR_Z1) < .06) return 'b_saeule_' + s;
      if (z > 1.9) return 'c_saeule_' + s;
      return z < DOOR_Z1 ? 'tuer_' + s : 'seitenteil_' + s;
    }
    if (zone === 'sill') return z < DOOR_Z0 ? 'windlauf' : z < DOOR_Z1 ? 'tuer_' + s : 'seitenteil_' + s;
    if (zone === 'hood') {
      if (z < 0.36) return ax < HOOD_XF ? 'haube' : 'kotfluegel_' + s;
      if (z < 1) return 'windlauf';
      return ax < HOOD_X ? 'kofferraumdeckel' : 'seitenteil_' + s;
    }
    // Unterbau (Seitenwand, Schulter, Front- und Heckfläche)
    if (z < -0.56 && ax < 0.47) return y > 0.72 ? 'haube' : 'frontmaske';
    if (z > 2.70 && ax < 0.53) return y > 0.81 ? 'kofferraumdeckel' : 'heckblende';
    if (z < DOOR_Z0) return 'kotfluegel_' + s;
    if (y < 0.325 && z < DOOR_Z1 + .2) return 'schweller_' + s;
    return z < DOOR_Z1 ? 'tuer_' + s : 'seitenteil_' + s;
  }
  const posA = skin.attributes.position, nrmA = skin.attributes.normal;
  const QUADS = (S - 1) * N;                                          // Anzahl Vierecke der Haut (ohne Deckel)
  const buckets = new Map(), triPart = [];
  for (let t = 0; t < idx.length; t += 3) {
    const ia = idx[t], ib = idx[t + 1], ic = idx[t + 2];
    const zones = [zoneOf(ia), zoneOf(ib), zoneOf(ic)];
    // Zuordnung je Viereck (beide Dreiecke gleich), damit Teilegrenzen gerade statt zackig verlaufen
    let vs = [ia, ib, ic];
    if (t < QUADS * 6) { const q = Math.floor(t / 6) * 6; vs = [idx[q], idx[q + 1], idx[q + 2], idx[q + 4]]; }
    const avg = f => vs.reduce((a, v) => a + f(v), 0) / vs.length;
    const xm = avg(v => posA.getX(v)), ym = avg(v => posA.getY(v)), zm = avg(v => posA.getZ(v));
    if (vs.length === 4) { zones.length = 0; vs.forEach(v => zones.push(zoneOf(v))); }
    const zone = zones.includes('cap') ? 'cap' : zones.every(q => q === zones[0]) ? zones[0] : zones.includes('top') ? 'top' : zones.includes('corner') ? 'corner' : zones.includes('side') ? 'side' : zones.includes('arch') ? 'arch' : zones.includes('hood') ? 'hood' : zones[0];
    if (isHole(zone, xm, ym, zm)) { triPart.push('hole'); continue; }
    const id = classify(zone, xm, ym, zm); triPart.push(id);
    if (!buckets.has(id)) buckets.set(id, { P: [], N: [] });
    const B = buckets.get(id);
    for (const v of [ia, ib, ic]) { B.P.push(posA.getX(v), posA.getY(v), posA.getZ(v)); B.N.push(nrmA.getX(v), nrmA.getY(v), nrmA.getZ(v)); }
  }
  const mk = (P, Nn) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); return g; };
  /* Teile-Register: Name, Werkstoffgruppe, Explosionsrichtung, Katalogtafel */
  const L = (s, a, b) => s === 'l' ? a : b;
  const DEF = {
    haube: ['Motorhaube', 'duro', [0, .45, -.25], 'K 17'], frontmaske: ['Frontmaske (Bugteil)', 'duro', [0, -.05, -.45], 'K 17'],
    kofferraumdeckel: ['Kofferraumdeckel', 'duro', [0, .45, .3], 'K 13'], heckblende: ['Heckteil', 'duro', [0, -.05, .45], 'K 13'], dach: ['Dach', 'duro', [0, .6, 0], 'K 13'],
    windlauf: ['Windlauf / Stirnwand oben', 'steel', [0, .1, 0], 'K 1'], boden: ['Bodengruppe', 'steel', [0, -.25, 0], 'K 11'], radhaeuser: ['Radhausschalen', 'steel', [0, -.12, 0], 'K 1 / K 7'],
    frontscheibe: ['Frontscheibe', 'glass', [0, .3, -.2], 'K 22'], heckscheibe: ['Heckscheibe', 'glass', [0, .3, .2], 'K 22'],
  };
  for (const s of ['l', 'r']) {
    const sx = s === 'l' ? -1 : 1, side = L(s, 'links', 'rechts');
    Object.assign(DEF, {
      ['kotfluegel_' + s]: ['Kotflügel vorn ' + side, 'duro', [sx * .4, .05, -.2], 'K 17'],
      ['tuer_' + s]: ['Tür ' + side + ' (Außenhaut)', 'duro', [sx * .55, 0, 0], 'K 13'],
      ['seitenteil_' + s]: ['Seitenteil hinten ' + side, 'duro', [sx * .45, .05, .2], 'K 13'],
      ['a_saeule_' + s]: ['A-Säule ' + side, 'steel', [sx * .15, .2, 0], 'K 1'], ['b_saeule_' + s]: ['B-Säule ' + side, 'steel', [sx * .15, .2, 0], 'K 1'],
      ['c_saeule_' + s]: ['C-Säule ' + side, 'steel', [sx * .15, .2, 0], 'K 7'], ['schweller_' + s]: ['Schweller ' + side, 'steel', [sx * .2, -.1, 0], 'K 1'],
      ['tuerscheibe_' + s]: ['Türscheibe ' + side, 'glass', [sx * .75, .1, 0], 'K 22'], ['seitenfenster_' + s]: ['Seitenfenster hinten ' + side, 'glass', [sx * .65, .1, .15], 'K 22'],
    });
  }
  /* Scharniere: Tür vorn (senkrechte Achse), Haube hinten am Windlauf, Kofferraumdeckel vorn an der Heckscheibe */
  const HINGES = { tuer_l: { at: [-0.745, 0.6, 0.48], axis: 'y', open: -1.15 }, tuer_r: { at: [0.745, 0.6, 0.48], axis: 'y', open: 1.15 },
    haube: { at: [0, 0.925, 0.33], axis: 'x', open: 0.95 }, kofferraumdeckel: { at: [0, 1.0, 2.44], axis: 'x', open: -1.05 } };
  out.parts = [];
  out.partMap = {};
  const getPart = id => {
    if (!out.partMap[id]) {
      const d = DEF[id] || [id, 'trim', [0, 0, 0], ''], g = new THREE.Group(), part = { id, name: d[0], cat: d[1], explode: d[2], tafel: d[3], group: g, content: g };
      const h = HINGES[id];
      if (h) { const pivot = new THREE.Group(); pivot.position.set(...h.at); const c = new THREE.Group(); c.position.set(-h.at[0], -h.at[1], -h.at[2]); pivot.add(c); g.add(pivot); part.content = c; part.pivot = pivot; part.hinge = h; }
      out.partMap[id] = part; out.parts.push(part);
    }
    return out.partMap[id];
  };
  for (const [id, B] of buckets) {
    const pdef = getPart(id), mat = pdef.cat === 'glass' ? M.glass : pdef.cat === 'steel' ? M.steelBody : M.body;
    const g = mk(B.P, B.N), m = new THREE.Mesh(g, mat); m.renderOrder = 2; pdef.content.add(m);
    if (pdef.cat === 'duro') {                                         // Materialstärke: Innenschale nach innen versetzt
      const off = pdef.hinge ? .035 : .008, P = g.attributes.position.array.slice(), Nn = g.attributes.normal.array;
      for (let i = 0; i < P.length; i++) P[i] -= Nn[i] * off;
      const ig = mk(Array.from(P), Array.from(Nn)), im = new THREE.Mesh(ig, pdef.hinge ? M.inner : mat); pdef.content.add(im);
    }
  }
  /* Fugen: Kanten, an denen zwei verschiedene Bauteile aneinanderstoßen, als dunkle Linie leicht über der Haut */
  {
    const edgeOwner = new Map(), seamPts = [];
    for (let t = 0; t < idx.length; t += 3) {
      const tri = [idx[t], idx[t + 1], idx[t + 2]], id = triPart[t / 3];
      for (let e = 0; e < 3; e++) {
        const a = tri[e], b = tri[(e + 1) % 3], key = a < b ? a + '_' + b : b + '_' + a, prev = edgeOwner.get(key);
        if (prev === undefined) edgeOwner.set(key, id);
        else if (prev !== id && prev !== 'hole' && id !== 'hole') for (const v of [a, b]) seamPts.push(posA.getX(v) + nrmA.getX(v) * .002, posA.getY(v) + nrmA.getY(v) * .002, posA.getZ(v) + nrmA.getZ(v) * .002);
      }
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(seamPts, 3));
    out.seams = new THREE.LineSegments(sg, M.seam);
  }
  out.skin = skin;

  /* --- Konstruktionslinien: Gürtellinie, Dachkante, Profil (für die Durchsicht) --- */
  const lineAlong = (j) => { const pts = rings.map(r => r[j].p); out.lines.push(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), M.edge)); };
  const half = section(1).length;
  for (const j of [10, 15, 21, half - 1, N - 10, N - 15, N - 21]) lineAlong(j);
  for (const i of [0, S - 1]) out.lines.push(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(rings[i].map(v => v.p)), M.edge));
  const xAtY = (z, y) => { const r = rings[Math.max(0, zs.findIndex(q => q >= z))]; let best = r[0].p.x; for (const v of r) if (v.p.x > 0 && Math.abs(v.p.y - y) < .03) best = Math.max(best, v.p.x); return best; };

  /* =====================================================================
     ANBAUTEILE
     ===================================================================== */
  const FZ = Z0;                                     // Frontebene
  const TILT = Math.atan(LEAN / .5);                 // Neigung der Heckfläche
  const sd = s => s < 0 ? 'l' : 'r';
  const P_ = id => getPart(id).content;
  for (const s of ['l', 'r']) {
    const sx = s === 'l' ? -1 : 1, side = s === 'l' ? 'links' : 'rechts';
    Object.assign(DEF, {
      ['scheinwerfer_' + s]: ['Scheinwerfer ' + side, 'trim', [sx * .2, .1, -.55], 'E 13'], ['blinker_' + s]: ['Blinkleuchte vorn ' + side, 'trim', [sx * .25, -.05, -.45], 'E 13'],
      ['heckleuchte_' + s]: ['Heckleuchte ' + side, 'trim', [sx * .3, .05, .55], 'E 13'], ['spiegel_' + s]: ['Außenspiegel ' + side, 'trim', [sx * .6, .25, 0], 'K 53'],
    });
  }
  Object.assign(DEF, { grill: ['Kühlergrill', 'trim', [0, 0, -.65], 'K 17'], stossstange_v: ['Stoßstange vorn', 'trim', [0, -.1, -.75], 'K 43'], stossstange_h: ['Stoßstange hinten', 'trim', [0, -.1, .75], 'K 43'], wischer: ['Scheibenwischer', 'trim', [0, .3, -.1], 'E 9'] });
  /* Scheinwerfertöpfe: runde Kotflügelspitzen, die nach vorn herausstehen */
  for (const s of [-1, 1]) {
    const potG = new THREE.LatheGeometry([[0, -.30], [.06, -.29], [.095, -.24], [.11, -.16], [.115, -.06], [.117, 0], [.112, .012], [.098, .016]].map(a => new THREE.Vector2(a[0], a[1])), 48);
    potG.rotateX(-Math.PI / 2);                      // Topf läuft nach hinten in den Kotflügel aus
    const pot = new THREE.Mesh(potG, M.body); pot.position.set(s * .583, .748, FZ - .03); P_('kotfluegel_' + sd(s)).add(pot);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.094, .008, 12, 56), M.chrome); ring.position.set(s * .583, .748, FZ - .047); P_('scheinwerfer_' + sd(s)).add(ring);
    const lens = new THREE.Mesh(new THREE.SphereGeometry(.2, 48, 12, 0, Math.PI * 2, 0, .47).rotateX(-Math.PI / 2), M.lens);
    lens.position.set(s * .583, .748, FZ - .046 + .178); P_('scheinwerfer_' + sd(s)).add(lens);
    const refl = new THREE.Mesh(new THREE.CircleGeometry(.088, 40), M.chrome); refl.rotation.y = Math.PI; refl.position.set(s * .583, .748, FZ - .02); P_('scheinwerfer_' + sd(s)).add(refl);
    // Blinker: orange, unter dem Scheinwerfer an der Ecke, um die Ecke gezogen
    const bl = new THREE.Mesh(new THREE.BoxGeometry(.105, .045, .05), M.amber); bl.position.set(s * .6, .52, FZ + .02); bl.rotation.y = s * .35; P_('blinker_' + sd(s)).add(bl);
    const blf = new THREE.Mesh(new THREE.BoxGeometry(.112, .052, .046), M.chrome); blf.position.set(s * .6, .52, FZ + .023); blf.rotation.y = s * .35; P_('blinker_' + sd(s)).add(blf);
  }
  /* Kühlergrill: breites, unten leicht eingezogenes Trapez mit Chromrahmen, dichten Querstäben und Längsrippen */
  {
    const sh = new THREE.Shape(), wt = .365, wb = .405, ht = .695, hb = .485, r = .045;   // abgerundetes Trapez, unten breiter
    sh.moveTo(-wb + r, hb); sh.lineTo(wb - r, hb); sh.quadraticCurveTo(wb, hb, wb + .004, hb + r); sh.lineTo(wt, ht - r); sh.quadraticCurveTo(wt, ht, wt - r, ht);
    sh.lineTo(-wt + r, ht); sh.quadraticCurveTo(-wt, ht, -wt, ht - r); sh.lineTo(-wb - .004, hb + r); sh.quadraticCurveTo(-wb, hb, -wb + r, hb);
    const inner = new THREE.Path(sh.getPoints(8).map(p => new THREE.Vector2(p.x * .96, (p.y - .59) * .9 + .59)).reverse()); const frameS = sh.clone(); frameS.holes.push(inner);
    const frame = new THREE.Mesh(new THREE.ExtrudeGeometry(frameS, { depth: .02, bevelEnabled: true, bevelThickness: .005, bevelSize: .004, bevelSegments: 2 }), M.chrome);
    frame.position.z = FZ - .028; P_('grill').add(frame);
    const back = new THREE.Mesh(new THREE.ShapeGeometry(sh), M.grilleBack); back.position.z = FZ - .012; P_('grill').add(back);
    for (let k = 0; k < 11; k++) { const y = .50 + k * .0185, w = lerp(wb, wt, (y - hb) / (ht - hb)) * 2 - .05;
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, .0055, .012), M.chrome); b.position.set(0, y, FZ - .024); P_('grill').add(b); }
    for (let k = -12; k <= 12; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.004, .19, .008), M.chromeDim); b.position.set(k * .03, .59, FZ - .02); P_('grill').add(b); }
    // Markante Fuge um den abnehmbaren Grill (dunkle, vertiefte Kante in der Frontmaske)
    const gp = sh.getPoints(10).map(p => new THREE.Vector3(p.x * 1.07, (p.y - .59) * 1.13 + .59, FZ - .004));
    const groove = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(gp, true), 160, .009, 8, true), M.groove); P_('frontmaske').add(groove);
    // Zwei Halteschrauben oben am Grillrahmen
    for (const x of [-.25, .25]) { const sc = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .006, 16).rotateX(Math.PI / 2), M.chrome); sc.position.set(x, .684, FZ - .034); P_('grill').add(sc); }
  }
  /* Haubenfuge und Frontschürze als Linien */
  /* Stoßstangen: Stahlband mit Hörnern und Gummi-Ecken */
  for (const [z, dir] of [[Z0 - .045, -1], [rearZ(.345) + .045, 1]]) {
    const sh = new THREE.Shape(); sh.moveTo(-.02, -.045); sh.lineTo(.015, -.04); sh.quadraticCurveTo(.03, 0, .015, .04); sh.lineTo(-.02, .045); sh.closePath();
    const bar = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 1.36, bevelEnabled: false, curveSegments: 8 }).rotateY(Math.PI / 2).translate(-.68, 0, 0), M.bumper);
    bar.position.set(0, .345, z); if (dir > 0) bar.rotation.y = Math.PI; P_(dir < 0 ? 'stossstange_v' : 'stossstange_h').add(bar);
    for (const s of [-1, 1]) {
      const end = new THREE.Mesh(new THREE.CapsuleGeometry(.04, .07, 6, 12).rotateZ(Math.PI / 2), M.rubberTrim); end.scale.set(1, 1.1, 1.3); end.position.set(s * .695, .345, z - dir * .03); P_(dir < 0 ? 'stossstange_v' : 'stossstange_h').add(end);
      if (dir > 0) {   // hinten: seitliche Verlängerung bis vor den Radlauf
        const wrap = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(s * .68, .345, z), new THREE.Vector3(s * .745, .345, z - .06), new THREE.Vector3(s * .772, .345, z - .2), new THREE.Vector3(s * .772, .345, z - .34)]), 30, .038, 10), M.bumper);
        wrap.scale.set(1, 1.15, 1); wrap.position.y = .345 * -.15; P_('stossstange_h').add(wrap);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(.038, 12, 10), M.rubberTrim); cap.position.set(s * .772, .345, z - .34); P_('stossstange_h').add(cap);
      }
      const horn = new THREE.Mesh(new THREE.BoxGeometry(.045, .14, .055), M.rubberTrim); horn.position.set(s * .36, .37, z + dir * .02); P_(dir < 0 ? 'stossstange_v' : 'stossstange_h').add(horn);
    }
  }
  /* Heckleuchten: hoch, oben spitz zulaufend, seitlich nach außen gewölbt; dazwischen der Leuchtenträger (Zwischenteil) */
  const ogive = (w, h, tip) => { const sh = new THREE.Shape(); sh.moveTo(-w, 0); sh.lineTo(w, 0); sh.lineTo(w, h - tip); sh.quadraticCurveTo(w * .9, h - tip * .25, 0, h); sh.quadraticCurveTo(-w * .9, h - tip * .25, -w, h - tip); sh.closePath(); return sh; };
  const clipY = (shape, y0, y1) => { const pts = shape.getPoints(24).filter(p => p.y >= y0 - 1e-6 && p.y <= y1 + 1e-6); return pts; };
  for (const s of [-1, 1]) {
    const grp = new THREE.Group(); grp.position.set(s * .672, .555, rearZ(.70) - .035); grp.rotation.set(TILT, s * .62, 0); P_('heckleuchte_' + sd(s)).add(grp);
    // Leuchtenträger (dunkles Kunststoffteil zwischen Leuchte und Karosserie)
    const base = new THREE.Mesh(new THREE.ExtrudeGeometry(ogive(.066, .345, .12), { depth: .03, bevelEnabled: true, bevelThickness: .006, bevelSize: .006, bevelSegments: 2, curveSegments: 20 }), M.lampBase);
    base.position.set(0, -.03, -.018); grp.add(base);   // Leuchtenträger: heller Kunststoff, als Rand rund um die Leuchte sichtbar
    // Lichtscheibe in drei Kammern: oben Blinker (gelb), Mitte Schluss-/Bremslicht (rot), unten Rückfahrlicht (weiß)
    const W2 = .046, H2 = .29, TIP = .10, full = ogive(W2, H2, TIP);
    const bands = [[.165, H2, M.amber], [0, .16, M.red]];        // oben Blinker (gelb), unten Schluss-/Bremslicht (rot)
    for (const [y0, y1, mat] of bands) {
      const sh = new THREE.Shape(); const pts = full.getPoints(40);
      // Ausschnitt des Spitzbogens zwischen y0 und y1 als eigene Fläche
      const L = [], R = [];
      for (let k = 0; k <= 12; k++) { const y = lerp(y0, y1, k / 12); let xl = 0, xr = 0;
        for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; if ((a.y - y) * (b.y - y) <= 0 && a.y !== b.y) { const x = lerp(a.x, b.x, (y - a.y) / (b.y - a.y)); if (x > 0) xr = Math.max(xr, x); else xl = Math.min(xl, x); } }
        L.push([xl, y]); R.push([xr, y]); }
      sh.moveTo(L[0][0], L[0][1]); R.forEach(q => sh.lineTo(q[0], q[1])); L.slice().reverse().forEach(q => sh.lineTo(q[0], q[1])); sh.closePath();
      const lens = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: .018, bevelEnabled: true, bevelThickness: .016, bevelSize: .004, bevelSegments: 4, curveSegments: 8 }), mat);
      lens.position.z = .012; grp.add(lens);
    }
    const rim = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(full.getPoints(30).map(p => new THREE.Vector3(p.x * 1.08, p.y * 1.02 - .003, .03)), true), 90, .0035, 6, true), M.chrome);
    grp.add(rim);
  }
  /* Kennzeichenmulde, Kofferraumgriff */
  const plateTex = (() => { const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 220; const c = cv.getContext('2d');
    c.fillStyle = '#f4f4f0'; c.fillRect(0, 0, 1024, 220); c.strokeStyle = '#111'; c.lineWidth = 12; c.strokeRect(10, 10, 1004, 200);
    c.fillStyle = '#111'; c.font = '600 132px "Arial Narrow", "Barlow Condensed", Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('TRABANT 601', 512, 118);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; })();
  const plateMat = new THREE.MeshPhysicalMaterial({ map: plateTex, roughness: .35, clearcoat: .6 });
  const mkPlate = () => { const g = new THREE.BoxGeometry(.52, .112, .006); return new THREE.Mesh(g, [M.trimDark, M.trimDark, M.trimDark, M.trimDark, plateMat, plateMat]); };
  const pr = mkPlate(); pr.position.set(0, .545, rearZ(.545) + .008); pr.rotation.x = TILT; P_('heckblende').add(pr);
  // Rückstrahler: rote Rechtecke unten an den Heckecken
  for (const s of [-1, 1]) { const rf = new THREE.Mesh(new THREE.BoxGeometry(.075, .045, .012), M.red2); rf.position.set(s * .655, .465, rearZ(.465) + .006); rf.rotation.set(TILT, s * .3, 0); P_('heckleuchte_' + sd(s)).add(rf); }
  // Kante 1: Prägung auf dem Kofferraumdeckel in Schlosshöhe; Kante 3: Sicke im Heckteil zwischen den Leuchten
  for (const [y0, half, id] of [[.862, .50, 'kofferraumdeckel'], [.725, .57, 'heckblende']]) {
    const pts = []; for (let k = 0; k <= 30; k++) { const x = -half + k / 30 * 2 * half, y = y0 + .006 * (1 - (x / half) ** 2); pts.push(new THREE.Vector3(x, y, rearZ(y) + .004 - .03 * (x / half) ** 4 - (id === 'kofferraumdeckel' ? .045 : 0))); }
    P_(id).add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, .006, 8), M.body));
    const sh = pts.map(p => new THREE.Vector3(p.x, p.y - .009, p.z + .002));
    P_(id).add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sh), 60, .0025, 6), M.groove));
  }
  // Kante 2 – Abschlusskante des Kofferraumdeckels: gerundete, überstehende Lippe zwischen den Flossen
  { const pts = []; for (let k = 0; k <= 30; k++) { const x = -.52 + k / 30 * 1.04, y = .815 + .012 * (1 - (x / .52) ** 2); pts.push(new THREE.Vector3(x, y, rearZ(y) + .006 - .02 * (x / .52) ** 2)); }
    P_('kofferraumdeckel').add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, .016, 10), M.body)); }
  const pf = mkPlate(); pf.rotation.y = Math.PI; pf.position.set(0, .35, Z0 - .095); P_('stossstange_v').add(pf);
  const hd = new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, .015, 24).rotateX(Math.PI / 2), M.chrome); hd.position.set(0, .872, rearZ(.872) - .04); hd.rotation.x = -.5; P_('kofferraumdeckel').add(hd);
  /* Türfuge, Türgriff, Spiegel, Lüftungsgitter C-Säule, Scheibenwischer */
  for (const s of [-1, 1]) {
    const W = .755 + .004;
    const door = [[0.47, .31], [0.47, .98], [1.385, .99], [1.385, .31]].map(([z, y]) => new THREE.Vector3(s * W, y, z));
    const handle = new THREE.Mesh(new THREE.CapsuleGeometry(.008, .08, 4, 8).rotateX(Math.PI / 2), M.chrome); handle.position.set(s * (W + .004), .905, 1.27); P_('tuer_' + sd(s)).add(handle);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .1, 8), M.chrome); stem.rotation.z = s * -.9; stem.position.set(s * .745, 1.05, .52); P_('tuer_' + sd(s)).add(stem);
    const ms = new THREE.Shape(), q = [[-.075, -.032], [.085, -.04], [.07, .036], [-.055, .03]], rc = .014;
    for (let i = 0; i < 4; i++) { const a = q[(i + 3) % 4], b = q[i], c = q[(i + 1) % 4];
      const p1 = [b[0] + (a[0] - b[0]) * rc / Math.hypot(a[0] - b[0], a[1] - b[1]), b[1] + (a[1] - b[1]) * rc / Math.hypot(a[0] - b[0], a[1] - b[1])];
      const p2 = [b[0] + (c[0] - b[0]) * rc / Math.hypot(c[0] - b[0], c[1] - b[1]), b[1] + (c[1] - b[1]) * rc / Math.hypot(c[0] - b[0], c[1] - b[1])];
      if (i === 0) ms.moveTo(p1[0], p1[1]); else ms.lineTo(p1[0], p1[1]); ms.quadraticCurveTo(b[0], b[1], p2[0], p2[1]); }
    ms.closePath();
    const mir = new THREE.Mesh(new THREE.ExtrudeGeometry(ms, { depth: .02, bevelEnabled: true, bevelThickness: .008, bevelSize: .005, bevelSegments: 3 }), M.mirrorHousing);
    if (s < 0) mir.scale.x = -1;
    mir.position.set(s * .80, 1.10, .52);
    const glassM = new THREE.Mesh(new THREE.ShapeGeometry(ms), M.chrome); glassM.position.set(s * .80, 1.10, .553); if (s < 0) glassM.scale.x = -1; P_('tuer_' + sd(s)).add(glassM); P_('tuer_' + sd(s)).add(mir);
    for (let k = 0; k < 7; k++) {
      const y = 1.13 + k * .022, x = xAtY(2.18, y);
      const sl = new THREE.Mesh(new THREE.BoxGeometry(.004, .007, .06), M.trimDark); sl.position.set(s * (x + .003), y, 2.2 - k * .012); P_('c_saeule_' + sd(s)).add(sl);
    }
  }
  for (const x of [-.32, .12]) { const w = new THREE.Mesh(new THREE.BoxGeometry(.42, .008, .012), M.trimDark); w.position.set(x, 1.0, .40); w.rotation.z = .12; P_('wischer').add(w); }
  /* =====================================================================
     SCHEIBEN mit Gummidichtung, Alu-Dachkante über der Frontscheibe,
     Zierleiste (Aluprofil mit schwarzem Gummi) zwischen den Radläufen
     ===================================================================== */
  /** Fläche aus Rasterpunkten; f(U,V) liefert Weltpunkt für U,V ∈ [-1,1] (bereits abgerundet) */
  const patch = (f, nu = 28, nv = 18) => {
    const P = [], I = [];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const [a, b] = squircle(i / nu * 2 - 1, j / nv * 2 - 1); const v = f(a, b); P.push(v.x, v.y, v.z); }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; I.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals(); return g;
  };
  const rimPts = (f, n = 120) => { const pts = []; for (let k = 0; k < n; k++) { const t = k / n * 4; let a, b;
      if (t < 1) { a = -1 + 2 * t; b = -1; } else if (t < 2) { a = 1; b = -1 + 2 * (t - 1); } else if (t < 3) { a = 1 - 2 * (t - 2); b = 1; } else { a = -1; b = 1 - 2 * (t - 3); }
      const [u, v] = squircle(a, b); pts.push(f(u, v)); } return pts; };
  const addWindow = (id, f, out2 = .006) => {
    const glass = new THREE.Mesh(patch(f), M.glass); glass.renderOrder = 3; P_(id).add(glass);
    const seal = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rimPts(f), true), 200, .008, 6, true), M.rubberTrim); P_(id).add(seal);
  };
  const fWS = W => (U, V) => { const { z, w } = wsAt(W, (V + 1) / 2), x = U * w; return new THREE.Vector3(x, yTop(z, x) + .003, z); };
  addWindow('frontscheibe', fWS(WS)); addWindow('heckscheibe', fWS(RW));
  for (const s of [-1, 1]) {
    const fq = Q => (U, V) => { const [z, y] = quadAt(Q, (U + 1) / 2, (V + 1) / 2); return new THREE.Vector3(s * (xSide(z, y) + .003), y, z); };
    addWindow('tuerscheibe_' + sd(s), fq(DOORWIN)); addWindow('seitenfenster_' + sd(s), fq(QWIN));
    // Zierleiste: Aluprofil mit schwarzer Gummieinlage vom vorderen zum hinteren Radlauf
    const zA = 0.40, zB = 1.62, W = .757;
    const alu = new THREE.Mesh(new THREE.BoxGeometry(.008, .03, zB - zA), M.alu2); alu.position.set(s * W, .345, (zA + zB) / 2); P_('schweller_' + sd(s)).add(alu);
    const rub = new THREE.Mesh(new THREE.BoxGeometry(.01, .016, zB - zA - .01), M.rubberTrim); rub.position.set(s * (W + .004), .345, (zA + zB) / 2); P_('schweller_' + sd(s)).add(rub);
  }
  // Alu-Dachkante: Übergang vom runden Dach zur Frontscheibe (hinten ohne Kante)
  { const pts = []; for (let k = 0; k <= 40; k++) { const U = k / 40 * 2 - 1, w = WS.w1 + .03, x = U * w, z = WS.z1 + .028; pts.push(new THREE.Vector3(x, yTop(z, x) + .008, z)); }
    P_('dach').add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, .007, 8), M.alu2)); }
  for (const s of ['l', 'r']) P_('tuer_' + s).add(getPart('tuerscheibe_' + s).group);   // Scheibe schwenkt mit der Tür
  out.openers = out.parts.filter(p => p.hinge);
  return out;
}
