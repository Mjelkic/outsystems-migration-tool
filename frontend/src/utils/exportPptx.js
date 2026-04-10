import PptxGenJS from 'pptxgenjs';
import logoRaw from '../assets/deloitte-logo.svg?raw';

// ── Colors (no # prefix) ──────────────────────────────────────
const G = {
  GREEN:      '86BC24',
  BLACK:      '000000',
  WHITE:      'FFFFFF',
  GRAY:       '666666',
  LIGHT:      'F7F7F7',
  BORDER:     'D9D9D9',
  RED:        'CC3333',
  ORANGE:     'F5A623',
};

// ── Slide dimensions: LAYOUT_WIDE = 13.33 × 7.5 in ───────────
const W = 13.33;
const H = 7.5;

// ── Logo base64 ───────────────────────────────────────────────
function getLogo() {
  try {
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(logoRaw)));
  } catch {
    return '';
  }
}

// ── Helpers ───────────────────────────────────────────────────
function trunc(str, len = 90) {
  if (!str) return '';
  const s = String(str);
  return s.length > len ? s.slice(0, len - 1) + '…' : s;
}

function headerRow(labels) {
  return labels.map(text => ({
    text,
    options: { bold: true, color: G.WHITE, fill: { color: G.BLACK }, fontSize: 9, fontFace: 'Calibri' },
  }));
}

function dataRow(cells, shaded = false) {
  return cells.map(val => ({
    text: trunc(String(val ?? ''), 120),
    options: { color: '111111', fill: { color: shaded ? G.LIGHT : G.WHITE }, fontSize: 9, fontFace: 'Calibri' },
  }));
}

function tableOpts(colW, extra = {}) {
  return {
    border: { type: 'solid', pt: 0.5, color: G.BORDER },
    rowH: 0.42,
    autoPage: true,
    autoPageRepeatHeader: true,
    colW,
    ...extra,
  };
}

// ── Slide factory: black header + green left accent ───────────
// subtitle: optional one-line summary shown below the title in the header
function contentSlide(pptx, title, subtitle = '') {
  const logo = getLogo();
  const slide = pptx.addSlide();

  // Green left accent
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 0.06, h: H,
    fill: { color: G.GREEN }, line: { type: 'none' },
  });
  // Black header bar
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: W, h: 1.0,
    fill: { color: G.BLACK }, line: { type: 'none' },
  });
  if (subtitle) {
    // Title + subtitle stacked
    slide.addText(title, {
      x: 0.35, y: 0.07, w: 10.9, h: 0.52,
      fontSize: 16, bold: true, color: G.WHITE,
      fontFace: 'Calibri', valign: 'bottom',
    });
    slide.addText(subtitle, {
      x: 0.35, y: 0.61, w: 10.9, h: 0.32,
      fontSize: 9, color: 'AAAAAA',
      fontFace: 'Calibri', valign: 'top',
    });
  } else {
    slide.addText(title, {
      x: 0.35, y: 0.12, w: 10.9, h: 0.76,
      fontSize: 18, bold: true, color: G.WHITE,
      fontFace: 'Calibri', valign: 'middle',
    });
  }
  // Logo (white background so dark logo is visible on black header)
  if (logo) {
    slide.addShape(pptx.ShapeType.rect, {
      x: 11.65, y: 0.08, w: 1.55, h: 0.83,
      fill: { color: G.WHITE }, line: { type: 'none' },
    });
    slide.addImage({ data: logo, x: 11.7, y: 0.13, w: 1.45, h: 0.72 });
  }
  return slide;
}

// ── Section divider: full black slide with green left bar ─────
function sectionDivider(pptx, title, subtitle = '') {
  const logo = getLogo();
  const slide = pptx.addSlide();
  slide.background = { color: G.BLACK };

  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 0.4, h: H,
    fill: { color: G.GREEN }, line: { type: 'none' },
  });
  slide.addText(title, {
    x: 1.0, y: 2.5, w: 11.5, h: 1.4,
    fontSize: 34, bold: true, color: G.WHITE, fontFace: 'Calibri',
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 1.0, y: 4.05, w: 11.5, h: 0.65,
      fontSize: 14, color: '999999', fontFace: 'Calibri',
    });
  }
  if (logo) {
    slide.addShape(pptx.ShapeType.rect, {
      x: 10.85, y: H - 0.9, w: 2.3, h: 0.65,
      fill: { color: G.WHITE }, line: { type: 'none' },
    });
    slide.addImage({ data: logo, x: 10.9, y: H - 0.85, w: 2.2, h: 0.55 });
  }
}

// ── Slide builders ────────────────────────────────────────────

function buildTitleSlide(pptx, plan) {
  const logo = getLogo();
  const s = plan.projectSummary || {};
  const slide = pptx.addSlide();
  slide.background = { color: G.BLACK };

  // Green bottom bar
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: H - 0.55, w: W, h: 0.55,
    fill: { color: G.GREEN }, line: { type: 'none' },
  });
  // Logo top-left (white bg)
  if (logo) {
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.5, y: 0.32, w: 3.1, h: 0.68,
      fill: { color: G.WHITE }, line: { type: 'none' },
    });
    slide.addImage({ data: logo, x: 0.55, y: 0.37, w: 3.0, h: 0.58 });
  }
  // Project name
  slide.addText(s.name || 'Migration Plan', {
    x: 0.5, y: 1.7, w: 12.3, h: 1.9,
    fontSize: 42, bold: true, color: G.WHITE, fontFace: 'Calibri', wrap: true,
  });
  // Subtitle
  slide.addText('OutSystems Migration Plan', {
    x: 0.5, y: 3.7, w: 12.3, h: 0.7,
    fontSize: 20, color: G.GREEN, fontFace: 'Calibri',
  });
  // Meta
  const meta = [
    s.complexity && `Complexity: ${s.complexity}`,
    s.originalTechnology && `Source: ${s.originalTechnology}`,
    s.estimatedModules && `Modules: ${s.estimatedModules}`,
  ].filter(Boolean).join('   ·   ');
  if (meta) {
    slide.addText(meta, {
      x: 0.5, y: 4.55, w: 12.3, h: 0.5,
      fontSize: 12, color: '999999', fontFace: 'Calibri',
    });
  }
  slide.addText(
    `Generated on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    { x: 0.5, y: 5.75, w: 12.3, h: 0.35, fontSize: 10, color: '777777', fontFace: 'Calibri' },
  );
}

function buildSummarySlide(pptx, plan) {
  const s0 = plan.projectSummary || {};
  const summarySubtitle = [s0.complexity && `${s0.complexity} complexity`, s0.originalTechnology && `Source: ${s0.originalTechnology}`, s0.estimatedModules && `${s0.estimatedModules} modules`].filter(Boolean).join('  ·  ');
  const slide = contentSlide(pptx, 'Project Summary', summarySubtitle);
  const s = plan.projectSummary || {};

  // Stat boxes
  const stats = [
    ['Complexity',      s.complexity || '—'],
    ['Source Tech',     s.originalTechnology || '—'],
    ['Est. Modules',    String(s.estimatedModules ?? '—')],
    ['Entities',        String(plan.dataModel?.entities?.length ?? '—')],
    ['Screens',         String(plan.screens?.length ?? '—')],
    ['Roadmap Phases',  String(plan.roadmap?.phases?.length ?? '—')],
  ];
  const bW = (W - 0.5) / stats.length;
  stats.forEach(([label, value], i) => {
    const x = 0.25 + i * bW;
    slide.addShape(pptx.ShapeType.rect, {
      x, y: 1.1, w: bW - 0.08, h: 1.1,
      fill: { color: G.LIGHT }, line: { color: G.BORDER, pt: 1 },
    });
    slide.addShape(pptx.ShapeType.rect, {
      x, y: 1.1, w: 0.05, h: 1.1,
      fill: { color: G.GREEN }, line: { type: 'none' },
    });
    slide.addText(label.toUpperCase(), {
      x: x + 0.1, y: 1.17, w: bW - 0.22, h: 0.28,
      fontSize: 7, bold: true, color: G.GRAY, fontFace: 'Calibri',
    });
    slide.addText(value, {
      x: x + 0.1, y: 1.46, w: bW - 0.22, h: 0.6,
      fontSize: 14, bold: true, color: G.BLACK, fontFace: 'Calibri', wrap: true,
    });
  });

  // Description
  if (s.description) {
    slide.addText('DESCRIPTION', {
      x: 0.4, y: 2.38, w: 12.5, h: 0.28,
      fontSize: 8, bold: true, color: G.GRAY, fontFace: 'Calibri',
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.4, y: 2.68, w: 12.5, h: 0.05,
      fill: { color: G.GREEN }, line: { type: 'none' },
    });
    slide.addText(s.description, {
      x: 0.4, y: 2.78, w: 12.5, h: 1.1,
      fontSize: 11, color: '333333', fontFace: 'Calibri', wrap: true,
    });
  }

  // Recommendations
  const recs = plan.recommendations || [];
  if (recs.length) {
    slide.addText('KEY RECOMMENDATIONS', {
      x: 0.4, y: 4.05, w: 12.5, h: 0.28,
      fontSize: 8, bold: true, color: G.GRAY, fontFace: 'Calibri',
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.4, y: 4.35, w: 12.5, h: 0.05,
      fill: { color: G.GREEN }, line: { type: 'none' },
    });
    recs.slice(0, 5).forEach((rec, i) => {
      slide.addText(`• ${trunc(rec, 130)}`, {
        x: 0.5, y: 4.45 + i * 0.42, w: 12.3, h: 0.38,
        fontSize: 10, color: '333333', fontFace: 'Calibri', wrap: true,
      });
    });
  }
}

function buildDataModelSlides(pptx, plan, detailed) {
  const entities = plan.dataModel?.entities || [];
  if (!entities.length) return;
  sectionDivider(pptx, 'Data Model', `${entities.length} entities identified`);

  if (!detailed) {
    const totalAttrs = entities.reduce((n, e) => n + (e.attributes?.length || 0), 0);
    const slide = contentSlide(pptx, 'Data Model — Entities', `${entities.length} entities  ·  ${totalAttrs} attributes total`);
    const rows = [
      headerRow(['Entity', 'Description', 'Key Attributes', 'Relationships']),
      ...entities.map((e, i) => dataRow([
        e.name,
        e.description,
        (e.attributes || []).slice(0, 5).map(a => a.name).join(', ') + (e.attributes?.length > 5 ? '…' : ''),
        (e.relationships || []).slice(0, 3).map(r => `${r.entity} (${r.type})`).join(', '),
      ], i % 2 === 1)),
    ];
    slide.addTable(rows, { x: 0.4, y: 1.2, w: 12.5, ...tableOpts([2.2, 4.3, 3.5, 2.5]) });
  } else {
    entities.forEach(entity => {
      const attrCount = entity.attributes?.length || 0;
      const relCount = entity.relationships?.length || 0;
      const entitySubtitle = `${attrCount} attribute${attrCount !== 1 ? 's' : ''}${relCount ? `  ·  ${relCount} relationship${relCount !== 1 ? 's' : ''}` : ''}`;
      const slide = contentSlide(pptx, `Data Model — ${entity.name}`, entitySubtitle);
      if (entity.description) {
        slide.addText(entity.description, {
          x: 0.4, y: 1.08, w: 12.5, h: 0.45,
          fontSize: 11, color: G.GRAY, fontFace: 'Calibri', italic: true,
        });
      }
      const attrs = entity.attributes || [];
      if (attrs.length) {
        slide.addText('ATTRIBUTES', {
          x: 0.4, y: 1.6, w: 12.5, h: 0.28,
          fontSize: 8, bold: true, color: G.GRAY, fontFace: 'Calibri',
        });
        const rows = [
          headerRow(['Attribute', 'Data Type', 'PK', 'Required', 'Description']),
          ...attrs.map((a, i) => dataRow([a.name, a.dataType, a.isPrimaryKey ? '✓' : '', a.isMandatory ? '✓' : '', a.description], i % 2 === 1)),
        ];
        slide.addTable(rows, { x: 0.4, y: 1.92, w: 12.5, ...tableOpts([2.8, 2.0, 0.8, 1.1, 5.8]) });
      }
      const rels = entity.relationships || [];
      if (rels.length) {
        const relY = Math.min(1.92 + (attrs.length + 1) * 0.42 + 0.55, 5.4);
        slide.addText('RELATIONSHIPS', {
          x: 0.4, y: relY, w: 12.5, h: 0.28,
          fontSize: 8, bold: true, color: G.GRAY, fontFace: 'Calibri',
        });
        const rows = [
          headerRow(['Related Entity', 'Type', 'Description']),
          ...rels.map((r, i) => dataRow([r.entity, r.type, r.description], i % 2 === 1)),
        ];
        slide.addTable(rows, { x: 0.4, y: relY + 0.32, w: 12.5, ...tableOpts([3.0, 2.5, 7.0]) });
      }
    });
  }
}

function buildArchitectureSlides(pptx, plan, detailed) {
  const modules = plan.architecture?.modules || [];
  if (!modules.length) return;
  const usedLayers = ['End-User', 'Core', 'Foundation', 'Integration'].filter(l => modules.some(m => m.layer === l));
  sectionDivider(pptx, 'Architecture', `${modules.length} modules across ${usedLayers.length} layers`);

  if (!detailed) {
    const slide = contentSlide(pptx, 'Architecture — Module Overview', `${modules.length} modules across ${usedLayers.length} layers`);
    const rows = [
      headerRow(['Module', 'Layer', 'Type', 'Description', 'Key Functionalities']),
      ...modules.map((m, i) => dataRow([
        m.name, m.layer, m.type, m.description,
        (m.mainFunctionalities || []).slice(0, 3).join(', '),
      ], i % 2 === 1)),
    ];
    slide.addTable(rows, { x: 0.4, y: 1.2, w: 12.5, ...tableOpts([2.5, 1.8, 1.5, 4.2, 2.5]) });
  } else {
    usedLayers.forEach(layer => {
      const mods = modules.filter(m => m.layer === layer);
      const slide = contentSlide(pptx, `Architecture — ${layer} Layer`, `${mods.length} module${mods.length !== 1 ? 's' : ''}  ·  ${mods.map(m => m.type).join(', ')}`);
      const rows = [
        headerRow(['Module', 'Type', 'Description', 'Dependencies', 'Functionalities']),
        ...mods.map((m, i) => dataRow([
          m.name, m.type, m.description,
          (m.dependencies || []).join(', '),
          (m.mainFunctionalities || []).slice(0, 4).join(', '),
        ], i % 2 === 1)),
      ];
      slide.addTable(rows, { x: 0.4, y: 1.2, w: 12.5, ...tableOpts([2.5, 1.5, 3.8, 2.5, 2.2]) });
    });
  }
  if (plan.architecture?.layerDiagram) {
    const slide = contentSlide(pptx, 'Architecture — Layer Diagram', 'Module dependencies and layer structure');
    slide.addText(plan.architecture.layerDiagram, {
      x: 0.4, y: 1.2, w: 12.5, h: 5.8,
      fontSize: 10, color: '333333', fontFace: 'Courier New', wrap: true,
    });
  }
}

function buildScreensSlides(pptx, plan, detailed) {
  const screens = plan.screens || [];
  if (!screens.length) return;
  sectionDivider(pptx, 'Screens & UI', `${screens.length} screens identified`);

  if (!detailed) {
    const uniqueModules = [...new Set(screens.map(s => s.module).filter(Boolean))].length;
    const slide = contentSlide(pptx, 'Screens — Overview', `${screens.length} screens across ${uniqueModules} module${uniqueModules !== 1 ? 's' : ''}`);
    const rows = [
      headerRow(['Screen', 'Module', 'Type', 'Description', 'Roles']),
      ...screens.map((s, i) => dataRow([s.name, s.module, s.type, s.description, (s.roles || []).join(', ')], i % 2 === 1)),
    ];
    slide.addTable(rows, { x: 0.4, y: 1.2, w: 12.5, ...tableOpts([2.5, 2.5, 2.0, 3.5, 2.0]) });
  } else {
    screens.forEach(screen => {
      const screenSubtitle = [screen.module, screen.type, (screen.roles || []).length && `Roles: ${(screen.roles || []).join(', ')}`].filter(Boolean).join('  ·  ');
      const slide = contentSlide(pptx, `Screen — ${screen.name}`, screenSubtitle);
      [['Module', screen.module], ['Type', screen.type], ['Roles', (screen.roles || []).join(', ') || '—']].forEach(([lbl, val], i) => {
        slide.addText(`${lbl}:`, { x: 0.4 + i * 4.3, y: 1.1, w: 1.1, h: 0.35, fontSize: 9, bold: true, color: G.GRAY, fontFace: 'Calibri' });
        slide.addText(val || '—', { x: 1.5 + i * 4.3, y: 1.1, w: 3.0, h: 0.35, fontSize: 9, color: G.BLACK, fontFace: 'Calibri' });
      });
      if (screen.description) {
        slide.addText(screen.description, {
          x: 0.4, y: 1.55, w: 12.5, h: 0.6,
          fontSize: 11, color: '333333', fontFace: 'Calibri', italic: true, wrap: true,
        });
      }
      const uiItems = screen.uiComponents || [];
      const actionItems = screen.actions || [];
      if (uiItems.length) {
        slide.addText('UI COMPONENTS', { x: 0.4, y: 2.3, w: 6.0, h: 0.28, fontSize: 8, bold: true, color: G.GRAY, fontFace: 'Calibri' });
        uiItems.forEach((c, i) => slide.addText(`• ${c}`, { x: 0.5, y: 2.62 + i * 0.38, w: 6.0, h: 0.34, fontSize: 10, color: '333333', fontFace: 'Calibri' }));
      }
      if (actionItems.length) {
        slide.addText('ACTIONS', { x: 6.9, y: 2.3, w: 6.0, h: 0.28, fontSize: 8, bold: true, color: G.GRAY, fontFace: 'Calibri' });
        actionItems.forEach((a, i) => slide.addText(`• ${a}`, { x: 7.0, y: 2.62 + i * 0.38, w: 6.0, h: 0.34, fontSize: 10, color: '333333', fontFace: 'Calibri' }));
      }
    });
  }
}

function buildLogicSlides(pptx, plan, detailed) {
  const logic = plan.businessLogic || {};
  const sa = logic.serverActions || [];
  const ca = logic.clientActions || [];
  const ti = logic.timers || [];
  if (!sa.length && !ca.length && !ti.length) return;
  sectionDivider(pptx, 'Business Logic', `${sa.length} server actions · ${ca.length} client actions · ${ti.length} timers`);

  if (!detailed) {
    if (sa.length) {
      const slide = contentSlide(pptx, 'Business Logic — Server Actions', `${sa.length} server action${sa.length !== 1 ? 's' : ''}  ·  inputs, outputs and logic`);
      const rows = [
        headerRow(['Action', 'Module', 'Description', 'Inputs', 'Outputs']),
        ...sa.map((a, i) => dataRow([
          a.name, a.module, a.description,
          (a.inputs || []).map(p => `${p.name}: ${p.dataType}`).join(', '),
          (a.outputs || []).map(p => `${p.name}: ${p.dataType}`).join(', '),
        ], i % 2 === 1)),
      ];
      slide.addTable(rows, { x: 0.4, y: 1.2, w: 12.5, ...tableOpts([2.5, 2.0, 3.5, 2.3, 2.2]) });
    }
    if (ca.length || ti.length) {
      const caTimerSubtitle = [ca.length && `${ca.length} client action${ca.length !== 1 ? 's' : ''}`, ti.length && `${ti.length} timer${ti.length !== 1 ? 's' : ''}`].filter(Boolean).join('  ·  ');
      const slide = contentSlide(pptx, 'Business Logic — Client Actions & Timers', caTimerSubtitle);
      let y = 1.2;
      if (ca.length) {
        slide.addText('CLIENT ACTIONS', { x: 0.4, y, w: 12.5, h: 0.28, fontSize: 8, bold: true, color: G.GRAY, fontFace: 'Calibri' });
        const rows = [headerRow(['Action', 'Screen', 'Description']), ...ca.map((a, i) => dataRow([a.name, a.screen, a.description], i % 2 === 1))];
        slide.addTable(rows, { x: 0.4, y: y + 0.3, w: 12.5, ...tableOpts([3.0, 3.0, 6.5]) });
        y += (ca.length + 1) * 0.42 + 0.9;
      }
      if (ti.length && y < 6.0) {
        slide.addText('TIMERS', { x: 0.4, y, w: 12.5, h: 0.28, fontSize: 8, bold: true, color: G.GRAY, fontFace: 'Calibri' });
        const rows = [headerRow(['Timer', 'Schedule', 'Description']), ...ti.map((t, i) => dataRow([t.name, t.schedule, t.description], i % 2 === 1))];
        slide.addTable(rows, { x: 0.4, y: y + 0.3, w: 12.5, ...tableOpts([3.0, 2.5, 7.0]) });
      }
    }
  } else {
    sa.forEach(action => {
      const ioSubtitle = `Module: ${action.module || '—'}  ·  ${(action.inputs || []).length} input${(action.inputs || []).length !== 1 ? 's' : ''}  ·  ${(action.outputs || []).length} output${(action.outputs || []).length !== 1 ? 's' : ''}`;
      const slide = contentSlide(pptx, `Server Action — ${action.name}`, ioSubtitle);
      slide.addText(`Module: ${action.module || '—'}`, { x: 0.4, y: 1.08, w: 6.0, h: 0.35, fontSize: 10, color: G.GRAY, fontFace: 'Calibri' });
      if (action.description) {
        slide.addText(action.description, { x: 0.4, y: 1.5, w: 12.5, h: 0.6, fontSize: 11, color: '333333', fontFace: 'Calibri', italic: true, wrap: true });
      }
      const ioParams = [
        ...(action.inputs || []).map(p => ['Input', p.name, p.dataType]),
        ...(action.outputs || []).map(p => ['Output', p.name, p.dataType]),
      ];
      if (ioParams.length) {
        const rows = [headerRow(['Direction', 'Parameter', 'Data Type']), ...ioParams.map((p, i) => dataRow(p, i % 2 === 1))];
        slide.addTable(rows, { x: 0.4, y: 2.2, w: 7.5, ...tableOpts([2.0, 3.0, 2.5]) });
      }
      if (action.logic) {
        slide.addText('LOGIC', { x: 0.4, y: 4.4, w: 12.5, h: 0.28, fontSize: 8, bold: true, color: G.GRAY, fontFace: 'Calibri' });
        slide.addText(trunc(action.logic, 300), { x: 0.4, y: 4.72, w: 12.5, h: 1.6, fontSize: 10, color: '333333', fontFace: 'Calibri', wrap: true });
      }
    });
    if (ca.length || ti.length) {
      const caTimerSubtitle2 = [ca.length && `${ca.length} client action${ca.length !== 1 ? 's' : ''}`, ti.length && `${ti.length} timer${ti.length !== 1 ? 's' : ''}`].filter(Boolean).join('  ·  ');
      const slide = contentSlide(pptx, 'Business Logic — Client Actions & Timers', caTimerSubtitle2);
      let y = 1.2;
      if (ca.length) {
        const rows = [headerRow(['Action', 'Screen', 'Description']), ...ca.map((a, i) => dataRow([a.name, a.screen, a.description], i % 2 === 1))];
        slide.addTable(rows, { x: 0.4, y, w: 12.5, ...tableOpts([3.0, 3.0, 6.5]) });
        y += (ca.length + 1) * 0.42 + 0.8;
      }
      if (ti.length && y < 6.0) {
        slide.addText('TIMERS', { x: 0.4, y, w: 12.5, h: 0.28, fontSize: 8, bold: true, color: G.GRAY, fontFace: 'Calibri' });
        const rows = [headerRow(['Timer', 'Schedule', 'Description']), ...ti.map((t, i) => dataRow([t.name, t.schedule, t.description], i % 2 === 1))];
        slide.addTable(rows, { x: 0.4, y: y + 0.3, w: 12.5, ...tableOpts([3.0, 2.5, 7.0]) });
      }
    }
  }
}

function buildIntegrationsSlides(pptx, plan, detailed) {
  const ints = plan.integrations || [];
  if (!ints.length) return;
  sectionDivider(pptx, 'Integrations', `${ints.length} integrations identified`);

  if (!detailed) {
    const intTypes = [...new Set(ints.map(i => i.type).filter(Boolean))].join(', ');
    const slide = contentSlide(pptx, 'Integrations — Overview', `${ints.length} integration${ints.length !== 1 ? 's' : ''}  ·  ${intTypes}`);
    const rows = [
      headerRow(['Integration', 'Type', 'Direction', 'Description', 'Endpoints']),
      ...ints.map((it, i) => dataRow([it.name, it.type, it.direction, it.description, (it.endpoints || []).slice(0, 2).join(', ')], i % 2 === 1)),
    ];
    slide.addTable(rows, { x: 0.4, y: 1.2, w: 12.5, ...tableOpts([2.5, 1.8, 1.8, 4.0, 2.4]) });
  } else {
    ints.forEach(it => {
      const slide = contentSlide(pptx, `Integration — ${it.name}`, [it.type, it.direction, it.endpoints?.length && `${it.endpoints.length} endpoint${it.endpoints.length !== 1 ? 's' : ''}`].filter(Boolean).join('  ·  '));
      [[it.type, G.GREEN], [it.direction, G.BLACK]].filter(([t]) => t).forEach(([text, color], i) => {
        slide.addShape(pptx.ShapeType.rect, { x: 0.4 + i * 2.3, y: 1.08, w: 2.1, h: 0.4, fill: { color }, line: { type: 'none' } });
        slide.addText(text, { x: 0.4 + i * 2.3, y: 1.08, w: 2.1, h: 0.4, fontSize: 10, bold: true, color: G.WHITE, fontFace: 'Calibri', align: 'center', valign: 'middle' });
      });
      if (it.description) {
        slide.addText(it.description, { x: 0.4, y: 1.62, w: 12.5, h: 0.8, fontSize: 11, color: '333333', fontFace: 'Calibri', italic: true, wrap: true });
      }
      if (it.endpoints?.length) {
        slide.addText('ENDPOINTS', { x: 0.4, y: 2.55, w: 12.5, h: 0.28, fontSize: 8, bold: true, color: G.GRAY, fontFace: 'Calibri' });
        it.endpoints.forEach((ep, i) => {
          slide.addText(ep, { x: 0.5, y: 2.88 + i * 0.42, w: 12.3, h: 0.38, fontSize: 9, color: '333333', fontFace: 'Courier New', wrap: true });
        });
      }
    });
  }
}

function buildSecuritySlides(pptx, plan, detailed) {
  const sec = plan.security || {};
  const roles = sec.roles || [];
  sectionDivider(pptx, 'Security', `${roles.length} roles defined`);

  if (!detailed) {
    const secSubtitle = [roles.length && `${roles.length} role${roles.length !== 1 ? 's' : ''}`, sec.authenticationMethod && trunc(sec.authenticationMethod, 50)].filter(Boolean).join('  ·  ');
    const slide = contentSlide(pptx, 'Security — Overview', secSubtitle);
    let y = 1.1;
    if (sec.authenticationMethod) {
      slide.addText('AUTHENTICATION', { x: 0.4, y, w: 12.5, h: 0.28, fontSize: 8, bold: true, color: G.GRAY, fontFace: 'Calibri' });
      slide.addText(sec.authenticationMethod, { x: 0.4, y: y + 0.3, w: 12.5, h: 0.42, fontSize: 12, color: G.BLACK, fontFace: 'Calibri' });
      y += 0.9;
    }
    if (sec.sensitiveData?.length) {
      slide.addText('SENSITIVE DATA', { x: 0.4, y, w: 12.5, h: 0.28, fontSize: 8, bold: true, color: G.GRAY, fontFace: 'Calibri' });
      slide.addText(sec.sensitiveData.join('  ·  '), { x: 0.4, y: y + 0.3, w: 12.5, h: 0.42, fontSize: 10, color: '333333', fontFace: 'Calibri', wrap: true });
      y += 0.9;
    }
    if (roles.length) {
      slide.addText('ROLES & PERMISSIONS', { x: 0.4, y, w: 12.5, h: 0.28, fontSize: 8, bold: true, color: G.GRAY, fontFace: 'Calibri' });
      const rows = [
        headerRow(['Role', 'Description', 'Permissions']),
        ...roles.map((r, i) => dataRow([r.name, r.description, (r.permissions || []).join(', ')], i % 2 === 1)),
      ];
      slide.addTable(rows, { x: 0.4, y: y + 0.32, w: 12.5, ...tableOpts([2.5, 5.0, 5.0]) });
    }
  } else {
    const authSubtitle = [sec.authenticationMethod && trunc(sec.authenticationMethod, 55), sec.sensitiveData?.length && `${sec.sensitiveData.length} sensitive data categories`].filter(Boolean).join('  ·  ');
    const slide = contentSlide(pptx, 'Security — Authentication & Sensitive Data', authSubtitle);
    if (sec.authenticationMethod) {
      slide.addText('AUTHENTICATION METHOD', { x: 0.4, y: 1.1, w: 12.5, h: 0.28, fontSize: 8, bold: true, color: G.GRAY, fontFace: 'Calibri' });
      slide.addText(sec.authenticationMethod, { x: 0.4, y: 1.42, w: 12.5, h: 0.52, fontSize: 14, color: G.BLACK, fontFace: 'Calibri' });
    }
    if (sec.sensitiveData?.length) {
      slide.addText('SENSITIVE DATA CATEGORIES', { x: 0.4, y: 2.1, w: 12.5, h: 0.28, fontSize: 8, bold: true, color: G.GRAY, fontFace: 'Calibri' });
      sec.sensitiveData.forEach((d, i) => {
        slide.addShape(pptx.ShapeType.rect, { x: 0.4 + (i % 4) * 3.2, y: 2.45 + Math.floor(i / 4) * 0.58, w: 3.1, h: 0.44, fill: { color: 'FFF0F0' }, line: { color: 'FFCCCC', pt: 1 } });
        slide.addText(d, { x: 0.4 + (i % 4) * 3.2, y: 2.45 + Math.floor(i / 4) * 0.58, w: 3.1, h: 0.44, fontSize: 10, color: G.RED, fontFace: 'Calibri', align: 'center', valign: 'middle' });
      });
    }
    if (roles.length) {
      const rolesSlide = contentSlide(pptx, 'Security — Roles & Permissions', `${roles.length} role${roles.length !== 1 ? 's' : ''} with defined permissions`);
      const rows = [
        headerRow(['Role', 'Description', 'Permissions']),
        ...roles.map((r, i) => dataRow([r.name, r.description, (r.permissions || []).join(', ')], i % 2 === 1)),
      ];
      rolesSlide.addTable(rows, { x: 0.4, y: 1.2, w: 12.5, ...tableOpts([2.5, 5.0, 5.0]) });
    }
  }
}

function buildRoadmapSlides(pptx, plan, detailed) {
  const roadmap = plan.roadmap || {};
  const phases = roadmap.phases || [];
  const risks = roadmap.risks || [];
  if (!phases.length) return;
  sectionDivider(pptx, 'Roadmap', `${phases.length} phases · ${roadmap.totalEstimatedDuration || ''}`);

  const riskRows = risks.length ? [
    headerRow(['Risk', 'Impact', 'Mitigation']),
    ...risks.map((r, i) => [
      { text: trunc(r.risk, 120), options: { color: '111111', fill: { color: i % 2 === 1 ? G.LIGHT : G.WHITE }, fontSize: 9, fontFace: 'Calibri' } },
      { text: r.impact || '', options: { color: G.WHITE, bold: true, align: 'center', fontFace: 'Calibri', fontSize: 9, fill: { color: r.impact === 'High' ? G.RED : r.impact === 'Medium' ? G.ORANGE : G.GREEN } } },
      { text: trunc(r.mitigation, 120), options: { color: '111111', fill: { color: i % 2 === 1 ? G.LIGHT : G.WHITE }, fontSize: 9, fontFace: 'Calibri' } },
    ]),
  ] : null;

  if (!detailed) {
    const slide = contentSlide(pptx, 'Roadmap — Phases', `${phases.length} phases  ·  Total duration: ${roadmap.totalEstimatedDuration || '—'}`);
    if (roadmap.totalEstimatedDuration) {
      slide.addText(`Total Duration: ${roadmap.totalEstimatedDuration}`, {
        x: 0.4, y: 1.08, w: 12.5, h: 0.36, fontSize: 11, bold: true, color: G.GREEN, fontFace: 'Calibri',
      });
    }
    const rows = [
      headerRow(['#', 'Phase', 'Duration', 'Key Tasks', 'Deliverables']),
      ...phases.map((p, i) => dataRow([
        String(p.phase), p.name, p.duration,
        (p.tasks || []).slice(0, 3).join('; '),
        (p.deliverables || []).slice(0, 2).join('; '),
      ], i % 2 === 1)),
    ];
    slide.addTable(rows, { x: 0.4, y: 1.55, w: 12.5, ...tableOpts([0.7, 2.5, 1.6, 4.5, 3.2]) });
    if (riskRows) {
      const riskSlide = contentSlide(pptx, 'Roadmap — Risk Register', `${risks.length} identified risk${risks.length !== 1 ? 's' : ''}  ·  High / Medium / Low impact`);
      riskSlide.addTable(riskRows, { x: 0.4, y: 1.2, w: 12.5, ...tableOpts([5.5, 1.5, 5.5]) });
    }
  } else {
    phases.forEach(phase => {
      const phaseSubtitle = [phase.duration, (phase.tasks || []).length && `${phase.tasks.length} task${phase.tasks.length !== 1 ? 's' : ''}`, (phase.deliverables || []).length && `${phase.deliverables.length} deliverable${phase.deliverables.length !== 1 ? 's' : ''}`].filter(Boolean).join('  ·  ');
      const slide = contentSlide(pptx, `Phase ${phase.phase} — ${phase.name}`, phaseSubtitle);
      slide.addText(`Duration: ${phase.duration || '—'}`, {
        x: 0.4, y: 1.08, w: 5.0, h: 0.36, fontSize: 11, bold: true, color: G.GREEN, fontFace: 'Calibri',
      });
      const cols = [
        { label: 'TASKS', items: phase.tasks || [] },
        { label: 'DELIVERABLES', items: phase.deliverables || [] },
        { label: 'DEPENDENCIES', items: phase.dependencies || [] },
      ].filter(c => c.items.length);
      if (cols.length) {
        const cW = (W - 0.8) / cols.length;
        cols.forEach((col, ci) => {
          const x = 0.4 + ci * cW;
          slide.addText(col.label, { x, y: 1.6, w: cW - 0.1, h: 0.28, fontSize: 8, bold: true, color: G.GRAY, fontFace: 'Calibri' });
          slide.addShape(pptx.ShapeType.rect, { x, y: 1.9, w: cW - 0.1, h: 0.05, fill: { color: G.GREEN }, line: { type: 'none' } });
          col.items.forEach((item, ii) => {
            slide.addText(`• ${trunc(item, 80)}`, {
              x: x + 0.1, y: 1.98 + ii * 0.44, w: cW - 0.25, h: 0.4,
              fontSize: 10, color: '333333', fontFace: 'Calibri', wrap: true,
            });
          });
        });
      }
    });
    if (riskRows) {
      const riskSlide = contentSlide(pptx, 'Roadmap — Risk Register', `${risks.length} identified risk${risks.length !== 1 ? 's' : ''}  ·  High / Medium / Low impact`);
      riskSlide.addTable(riskRows, { x: 0.4, y: 1.2, w: 12.5, ...tableOpts([5.5, 1.5, 5.5]) });
    }
  }
}

// ── Main export function ──────────────────────────────────────
export async function exportPptx(plan, density = 'compact') {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'OutSystems Migration Tool';
  pptx.company = 'Deloitte';
  pptx.subject = 'OutSystems Migration Plan';
  pptx.title = plan.projectSummary?.name || 'Migration Plan';

  const detailed = density === 'detailed';

  buildTitleSlide(pptx, plan);
  buildSummarySlide(pptx, plan);
  buildDataModelSlides(pptx, plan, detailed);
  buildArchitectureSlides(pptx, plan, detailed);
  buildScreensSlides(pptx, plan, detailed);
  buildLogicSlides(pptx, plan, detailed);
  buildIntegrationsSlides(pptx, plan, detailed);
  buildSecuritySlides(pptx, plan, detailed);
  buildRoadmapSlides(pptx, plan, detailed);

  const filename = `${(plan.projectSummary?.name || 'migration').replace(/[^a-zA-Z0-9]/g, '-')}-outsystems-plan.pptx`;
  await pptx.writeFile({ fileName: filename });
}
