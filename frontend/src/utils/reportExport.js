// ─────────────────────────────────────────────────────────────────────────────
// src/utils/reportExport.js — PDF & Excel report generation for Super Admin
// ─────────────────────────────────────────────────────────────────────────────
import { jsPDF } from 'jspdf';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Chart Rendering Helpers ──────────────────────────────────────────────────

async function renderChartToCanvas(config, width = 500, height = 260) {
  const container = document.createElement('div');
  container.style.cssText = `position:fixed;left:-9999px;top:0;width:${width}px;height:${height}px;background:#fff;`;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  container.appendChild(canvas);
  document.body.appendChild(container);

  const { default: Chart } = await import('chart.js/auto');
  const chart = new Chart(canvas.getContext('2d'), config);

  // Wait for animation
  await new Promise(r => setTimeout(r, 800));

  const imgData = canvas.toDataURL('image/png', 1.0);
  chart.destroy();
  document.body.removeChild(container);
  return imgData;
}

function toArray(data) {
  return Array.isArray(data) ? data : [];
}

// ── Unicode font (Khmer OS, free/open license) ────────────────────────────────
// jsPDF's built-in "helvetica" only covers WinAnsi/Latin — any Khmer text (user
// names, event titles, etc.) renders as garbled glyphs without an embedded
// Unicode font. Khmer OS covers both Khmer script and basic Latin in one file.
let khmerFontBase64 = null;

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function registerUnicodeFont(doc) {
  if (khmerFontBase64 === null) {
    const res = await fetch('/fonts/KhmerOS.ttf');
    const buf = await res.arrayBuffer();
    khmerFontBase64 = arrayBufferToBase64(buf);
  }
  doc.addFileToVFS('KhmerOS.ttf', khmerFontBase64);
  doc.addFont('KhmerOS.ttf', 'KhmerOS', 'normal');
  // No separate bold face is bundled — register the same file under 'bold' so
  // setFont('KhmerOS', 'bold') doesn't fall back to helvetica and lose glyphs.
  doc.addFont('KhmerOS.ttf', 'KhmerOS', 'bold');
  doc.setFont('KhmerOS', 'normal');
}

// ── Brand chart palette ──────────────────────────────────────────────────────
// Categorical slots (identity) — fixed order, CVD-validated (see dataviz skill).
// Sequential (magnitude) charts use the single brand hue instead.
const CATEGORICAL = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];
const BRAND = '#F5A623';
const BRAND_SOFT = 'rgba(245, 166, 35, 0.15)';
const INK = '#4a4a68';

function buildRevenueChartConfig(monthlyRevenue) {
  const data = toArray(monthlyRevenue);
  return {
    type: 'bar',
    data: {
      labels: data.map(m => m.month),
      datasets: [{
        label: 'Revenue ($)',
        data: data.map(m => m.revenue),
        backgroundColor: BRAND,
        borderRadius: 4,
        maxBarThickness: 34,
      }],
    },
    options: {
      responsive: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Monthly Revenue', font: { size: 14, weight: 'bold' }, color: '#1a1a2e', padding: { bottom: 12 } },
      },
      scales: {
        y: { beginAtZero: true, ticks: { color: INK, callback: v => '$' + v.toLocaleString() }, grid: { color: '#eceef5' } },
        x: { ticks: { color: INK }, grid: { display: false } },
      },
    },
  };
}

function buildCategoryChartConfig(eventsByCategory) {
  const data = toArray(eventsByCategory);
  return {
    type: 'doughnut',
    data: {
      labels: data.map(c => c.category),
      datasets: [{
        data: data.map(c => c.count),
        backgroundColor: CATEGORICAL,
        borderColor: '#ffffff',
        borderWidth: 2,
      }],
    },
    options: {
      responsive: false,
      cutout: '62%',
      plugins: {
        title: { display: true, text: 'Events by Category', font: { size: 14, weight: 'bold' }, color: '#1a1a2e', padding: { bottom: 12 } },
        legend: { position: 'bottom', labels: { color: INK, font: { size: 11 }, padding: 12, boxWidth: 10, boxHeight: 10 } },
      },
    },
  };
}

function buildUserRoleChartConfig(usersByRole) {
  const data = toArray(usersByRole);
  return {
    type: 'pie',
    data: {
      labels: data.map(r => r.role),
      datasets: [{
        data: data.map(r => r.count),
        backgroundColor: CATEGORICAL,
        borderColor: '#ffffff',
        borderWidth: 2,
      }],
    },
    options: {
      responsive: false,
      plugins: {
        title: { display: true, text: 'Users by Role', font: { size: 14, weight: 'bold' }, color: '#1a1a2e', padding: { bottom: 12 } },
        legend: { position: 'bottom', labels: { color: INK, font: { size: 11 }, padding: 12, boxWidth: 10, boxHeight: 10 } },
      },
    },
  };
}

function buildRegistrationsChartConfig(monthlyRevenue) {
  const data = toArray(monthlyRevenue);
  return {
    type: 'line',
    data: {
      labels: data.map(m => m.month),
      datasets: [{
        label: 'Registrations',
        data: data.map(m => m.registrations),
        borderColor: BRAND,
        backgroundColor: BRAND_SOFT,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: BRAND,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        pointRadius: 4,
      }],
    },
    options: {
      responsive: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Monthly Registrations', font: { size: 14, weight: 'bold' }, color: '#1a1a2e', padding: { bottom: 12 } },
      },
      scales: {
        y: { beginAtZero: true, ticks: { color: INK, stepSize: 1 }, grid: { color: '#eceef5' } },
        x: { ticks: { color: INK }, grid: { display: false } },
      },
    },
  };
}

// ── PDF Constants — matches the app's brand tokens (frontend/assets/css/1_global.css) ──

const PDF = {
  MARGIN: 18,
  ORANGE:      [245, 166, 35],   // --primary
  ORANGE_DARK: [224, 150, 16],   // --primary-dark
  DARK:        [26, 26, 46],     // --text-dark
  GRAY:        [74, 74, 104],    // --text-medium
  MUTED:       [136, 136, 160],  // --text-light
  BORDER:      [229, 231, 240],  // --border
  BG_LIGHT:    [247, 248, 252],  // --bg-light
  BG_STRIPE:   [250, 251, 253],
  WHITE:       [255, 255, 255],
  SUCCESS:     [40, 167, 69],
  DANGER:      [220, 53, 69],
};

function getPageWidth(doc) {
  return doc.internal.pageSize.getWidth();
}

function getPageHeight(doc) {
  return doc.internal.pageSize.getHeight();
}

// ── PDF: Draw a branded header bar at the top of the page ────────────────────

function drawPageHeader(doc, title, subtitle) {
  const w = getPageWidth(doc);
  // Accent line at top
  doc.setFillColor(...PDF.ORANGE);
  doc.rect(0, 0, w, 2.5, 'F');

  // Light background strip
  doc.setFillColor(...PDF.BG_LIGHT);
  doc.rect(0, 2.5, w, 34, 'F');

  // Wordmark
  doc.setTextColor(...PDF.ORANGE);
  doc.setFontSize(9.5);
  doc.setFont('KhmerOS', 'bold');
  doc.text('PLANNING CENTER', PDF.MARGIN, 14);

  // Title
  doc.setTextColor(...PDF.DARK);
  doc.setFontSize(15);
  doc.setFont('KhmerOS', 'bold');
  doc.text(title, PDF.MARGIN, 24);

  // Subtitle (right-aligned)
  doc.setFontSize(8.5);
  doc.setFont('KhmerOS', 'normal');
  doc.setTextColor(...PDF.GRAY);
  doc.text(subtitle, w - PDF.MARGIN, 24, { align: 'right' });

  // Thin separator line
  doc.setDrawColor(...PDF.BORDER);
  doc.setLineWidth(0.4);
  doc.line(PDF.MARGIN, 36.5, w - PDF.MARGIN, 36.5);

  return 46;
}

// ── PDF: Draw a section title ────────────────────────────────────────────────

function drawSectionTitle(doc, text, y) {
  // Accent tick
  doc.setFillColor(...PDF.ORANGE);
  doc.roundedRect(PDF.MARGIN, y - 4, 3, 9, 1, 1, 'F');

  doc.setTextColor(...PDF.DARK);
  doc.setFontSize(12.5);
  doc.setFont('KhmerOS', 'bold');
  doc.text(text, PDF.MARGIN + 6, y + 2);

  return y + 10;
}

// ── PDF: Draw a properly structured table ────────────────────────────────────

function drawDataTable(doc, headers, rows, startY, options = {}) {
  const {
    headerBg = PDF.DARK,
    headerTextColor = PDF.WHITE,
    stripeColor = PDF.BG_STRIPE,
    borderColor = PDF.BORDER,
    fontSize = 7.8,
    headerFontSize = 8,
    rowH = 6.2,
    headerH = 8,
    colWidths = null,
    alignments = null, // 'L' or 'R' per column
  } = options;

  const w = getPageWidth(doc);
  const h = getPageHeight(doc);
  const cw = w - PDF.MARGIN * 2;
  const colCount = headers.length;
  const colW = colWidths || Array(colCount).fill(cw / colCount);

  let localY = startY;

  // Ensure room for at least the header + one row before starting; otherwise
  // let the per-row loop below handle pagination naturally.
  if (localY + headerH + rowH + 10 > h - PDF.MARGIN) {
    doc.addPage();
    drawPageHeader(doc, 'ERMS System Report', 'Continued', null);
    localY = 46;
  }

  function drawHeaderRow(y) {
    doc.setFillColor(...headerBg);
    doc.roundedRect(PDF.MARGIN, y - headerH + 1, cw, headerH, 1.5, 1.5, 'F');
    doc.setTextColor(...headerTextColor);
    doc.setFontSize(headerFontSize);
    doc.setFont('KhmerOS', 'bold');
    let hx = PDF.MARGIN + 2;
    headers.forEach((hdr, i) => {
      const align = alignments?.[i] === 'R' ? 'right' : 'left';
      const xPos = align === 'right' ? hx + colW[i] - 2 : hx + 2;
      const textAlign = align === 'right' ? { align: 'right' } : {};
      doc.text(String(hdr), xPos, y - headerH + 5.3, textAlign);
      hx += colW[i];
    });
  }

  drawHeaderRow(localY);
  localY += 3.5;

  // ── Data rows ──
  doc.setFontSize(fontSize);
  doc.setFont('KhmerOS', 'normal');

  rows.forEach((row, ri) => {
    // Page break check
    if (localY + rowH + 5 > h - PDF.MARGIN) {
      doc.addPage();
      drawPageHeader(doc, 'ERMS System Report', 'Continued', null);
      localY = 46;
      drawHeaderRow(localY);
      localY += 3.5;
    }

    // Alternating row background
    if (ri % 2 === 1) {
      doc.setFillColor(...stripeColor);
      doc.rect(PDF.MARGIN, localY - rowH + 1, cw, rowH, 'F');
    }

    // Row border (bottom)
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.2);
    doc.line(PDF.MARGIN, localY + 1.8, PDF.MARGIN + cw, localY + 1.8);

    // Cell data
    doc.setTextColor(...PDF.GRAY);
    doc.setFont('KhmerOS', 'normal');
    let cx = PDF.MARGIN + 2;
    row.forEach((cell, ci) => {
      const align = alignments?.[ci] === 'R' ? 'right' : 'left';
      const xPos = align === 'right' ? cx + colW[ci] - 2 : cx + 2;
      const opts = align === 'right' ? { align: 'right' } : {};
      const txt = String(cell ?? '—') || '—';
      doc.text(txt.length > 35 ? txt.substring(0, 32) + '…' : txt, xPos, localY + 0.8, opts);
      cx += colW[ci];
    });

    localY += rowH;
  });

  return localY + 8;
}

// ── PDF: Summary card (KPI-like boxes) ───────────────────────────────────────

function drawSummaryCards(doc, items, startY) {
  const w = getPageWidth(doc);
  const cw = w - PDF.MARGIN * 2;
  const cols = 4;
  const gap = 4;
  const boxW = (cw - gap * (cols - 1)) / cols;
  const boxH = 24;
  let y = startY;

  // Check page break
  if (y + boxH + 10 > getPageHeight(doc) - PDF.MARGIN) {
    doc.addPage();
    drawPageHeader(doc, 'ERMS System Report', 'Continued', null);
    y = 46;
  }

  for (let i = 0; i < items.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = PDF.MARGIN + col * (boxW + gap);
    const by = y + row * (boxH + gap);

    if (row > 0 && by + boxH > getPageHeight(doc) - PDF.MARGIN) {
      doc.addPage();
      drawPageHeader(doc, 'ERMS System Report', 'Continued', null);
      // Draw remaining items on new page starting at y=46
      const remaining = items.slice(i);
      const totalRemainingRows = Math.ceil(remaining.length / cols);
      for (let ri = 0; ri < remaining.length; ri++) {
        const rcol = ri % cols;
        const rrow = Math.floor(ri / cols);
        const rx = PDF.MARGIN + rcol * (boxW + gap);
        const rby = 46 + rrow * (boxH + gap);
        drawSingleCard(doc, remaining[ri], rx, rby, boxW, boxH);
      }
      // Return Y position after all remaining items (on the last page)
      return 46 + totalRemainingRows * (boxH + gap) + 10;
    }

    drawSingleCard(doc, items[i], x, by, boxW, boxH);
  }

  const totalRows = Math.ceil(items.length / cols);
  return y + totalRows * (boxH + gap) + 8;
}

function drawSingleCard(doc, item, x, y, w, h) {
  // Card background
  doc.setFillColor(...PDF.WHITE);
  doc.setDrawColor(...PDF.BORDER);
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, w, h, 2.5, 2.5, 'FD');

  // Top accent bar
  doc.setFillColor(...PDF.ORANGE);
  doc.roundedRect(x, y, w, 2.2, 1, 1, 'F');
  doc.rect(x, y + 1.1, w, 1.1, 'F'); // square off the bottom of the accent

  // Label
  doc.setTextColor(...PDF.MUTED);
  doc.setFontSize(6.8);
  doc.setFont('KhmerOS', 'bold');
  doc.text(String(item.label).toUpperCase(), x + 6, y + 11);

  // Value
  doc.setTextColor(...PDF.DARK);
  doc.setFontSize(15);
  doc.setFont('KhmerOS', 'bold');
  doc.text(String(item.value), x + 6, y + 20);
}

// ── PDF: Draw a clean, professional cover page ────────────────────────────────

function drawCoverPage(doc, reportData) {
  const { summary, generatedAt, dateRange, users, events, tickets } = reportData;
  const w = getPageWidth(doc);
  const h = getPageHeight(doc);
  const midX = w / 2;

  const dateRangeLabel = dateRange?.isFiltered
    ? `${dateRange.startDate ? formatDate(dateRange.startDate) : 'Start'} — ${dateRange.endDate ? formatDate(dateRange.endDate) : 'Now'}`
    : 'All Time';

  // ── Background ──
  doc.setFillColor(...PDF.WHITE);
  doc.rect(0, 0, w, h, 'F');

  // ── Top accent bar ──
  doc.setFillColor(...PDF.ORANGE);
  doc.rect(0, 0, w, 4, 'F');

  // ── Bottom accent bar (mirrors the top for a bookended frame) ──
  doc.setFillColor(...PDF.BG_LIGHT);
  doc.rect(0, h - 26, w, 26, 'F');
  doc.setFillColor(...PDF.ORANGE);
  doc.rect(0, h - 26, w, 1.2, 'F');

  // ── Logo lockup ──
  const logoY = 56;
  doc.setFillColor(...PDF.ORANGE);
  doc.roundedRect(midX - 16, logoY, 32, 32, 7, 7, 'F');
  doc.setTextColor(...PDF.WHITE);
  doc.setFontSize(17);
  doc.setFont('KhmerOS', 'bold');
  doc.text('PC', midX, logoY + 20, { align: 'center' });

  // ── Wordmark ──
  doc.setTextColor(...PDF.ORANGE);
  doc.setFontSize(11);
  doc.setFont('KhmerOS', 'bold');
  doc.text('PLANNING CENTER', midX, logoY + 44, { align: 'center' });

  // ── Main title ──
  doc.setTextColor(...PDF.DARK);
  doc.setFontSize(27);
  doc.setFont('KhmerOS', 'bold');
  doc.text('System Report', midX, logoY + 62, { align: 'center' });

  // ── Subtitle ──
  doc.setTextColor(...PDF.GRAY);
  doc.setFontSize(11.5);
  doc.setFont('KhmerOS', 'normal');
  doc.text('Event Registration & Management System', midX, logoY + 71, { align: 'center' });

  // ── Report info card ──
  const cardY = logoY + 86;
  const cardW = 148;
  const cardH = 34;
  const cardX = midX - cardW / 2;

  doc.setFillColor(...PDF.BG_LIGHT);
  doc.setDrawColor(...PDF.BORDER);
  doc.setLineWidth(0.4);
  doc.roundedRect(cardX, cardY, cardW, cardH, 4, 4, 'FD');

  // Vertical divider between the two info columns
  doc.setDrawColor(...PDF.BORDER);
  doc.line(midX, cardY + 7, midX, cardY + cardH - 7);

  const colGenX = cardX + cardW * 0.25;
  const colRangeX = cardX + cardW * 0.75;

  doc.setTextColor(...PDF.MUTED);
  doc.setFontSize(7.5);
  doc.setFont('KhmerOS', 'bold');
  doc.text('GENERATED', colGenX, cardY + 12, { align: 'center' });
  doc.text('DATE RANGE', colRangeX, cardY + 12, { align: 'center' });

  doc.setTextColor(...PDF.DARK);
  doc.setFontSize(9.5);
  doc.setFont('KhmerOS', 'normal');
  doc.text(formatDateTime(generatedAt), colGenX, cardY + 22, { align: 'center' });
  doc.text(dateRangeLabel, colRangeX, cardY + 22, { align: 'center' });

  // ── Quick stats row ──
  const statItems = [
    { label: 'Users',    value: (summary?.totalUsers || 0).toLocaleString() },
    { label: 'Events',   value: (summary?.totalEvents || 0).toLocaleString() },
    { label: 'Tickets',  value: (summary?.totalTickets || 0).toLocaleString() },
    { label: 'Revenue',  value: `$${(summary?.totalRevenue || 0).toLocaleString()}` },
  ];

  const statsY = cardY + cardH + 14;
  const statsW = 148;
  const statCellW = statsW / statItems.length;
  const statsX0 = midX - statsW / 2;

  statItems.forEach(({ label, value }, i) => {
    const cx = statsX0 + statCellW * i + statCellW / 2;
    if (i > 0) {
      doc.setDrawColor(...PDF.BORDER);
      doc.line(statsX0 + statCellW * i, statsY - 6, statsX0 + statCellW * i, statsY + 8);
    }
    doc.setTextColor(...PDF.DARK);
    doc.setFontSize(13);
    doc.setFont('KhmerOS', 'bold');
    doc.text(value, cx, statsY, { align: 'center' });

    doc.setTextColor(...PDF.MUTED);
    doc.setFontSize(7);
    doc.setFont('KhmerOS', 'normal');
    doc.text(label.toUpperCase(), cx, statsY + 6, { align: 'center' });
  });

  // ── Report contents ──
  const tocY = statsY + 24;
  doc.setTextColor(...PDF.MUTED);
  doc.setFontSize(7.5);
  doc.setFont('KhmerOS', 'bold');
  doc.text('THIS REPORT INCLUDES', midX, tocY, { align: 'center' });

  const tocItems = [`${users?.length || 0} Users`, `${events?.length || 0} Events`, `${tickets?.length || 0} Tickets`];
  if (reportData.refunds?.length) tocItems.push(`${reportData.refunds.length} Refunds`);
  if (reportData.testimonials?.length) tocItems.push(`${reportData.testimonials.length} Testimonials`);

  const chipGap = 4;
  doc.setFontSize(8.5);
  doc.setFont('KhmerOS', 'normal');
  const chipWidths = tocItems.map(t => doc.getTextWidth(t) + 14);
  const totalChipW = chipWidths.reduce((a, b) => a + b, 0) + chipGap * (tocItems.length - 1);
  let chipX = midX - totalChipW / 2;
  tocItems.forEach((item, i) => {
    const cw2 = chipWidths[i];
    doc.setFillColor(...PDF.BG_LIGHT);
    doc.setDrawColor(...PDF.BORDER);
    doc.setLineWidth(0.3);
    doc.roundedRect(chipX, tocY + 6, cw2, 10, 5, 5, 'FD');
    doc.setTextColor(...PDF.GRAY);
    doc.text(item, chipX + cw2 / 2, tocY + 12.5, { align: 'center' });
    chipX += cw2 + chipGap;
  });

  // ── Footer (inside the bottom accent band) ──
  doc.setTextColor(...PDF.GRAY);
  doc.setFontSize(8);
  doc.setFont('KhmerOS', 'normal');
  doc.text('ERMS System Report  •  Planning Center', midX, h - 12, { align: 'center' });
}

// ── PDF: Page footer ─────────────────────────────────────────────────────────

function drawPageFooter(doc, generatedAt, totalPages) {
  // Skip page 1 (cover page) — it has its own footer
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    const h = getPageHeight(doc);
    const w = getPageWidth(doc);

    // Footer line
    doc.setDrawColor(...PDF.BORDER);
    doc.setLineWidth(0.4);
    doc.line(PDF.MARGIN, h - PDF.MARGIN + 2, w - PDF.MARGIN, h - PDF.MARGIN + 2);

    doc.setFontSize(7.5);
    doc.setTextColor(...PDF.MUTED);
    doc.setFont('KhmerOS', 'normal');
    doc.text('ERMS System Report  •  Planning Center', PDF.MARGIN, h - PDF.MARGIN + 8);
    doc.text(
      `Page ${i} of ${totalPages}  •  Generated ${formatDateTime(generatedAt)}`,
      w - PDF.MARGIN,
      h - PDF.MARGIN + 8,
      { align: 'right' },
    );
  }
}

// ── PDF Generation ───────────────────────────────────────────────────────────

export async function generatePDFReport(reportData) {
  // Validate reportData has the required fields
  if (!reportData || typeof reportData !== 'object') {
    throw new Error('Invalid report data: expected an object');
  }

  const safe = (val, fallback) => (val !== null && val !== undefined ? val : fallback);
  const safeArr = (val) => (Array.isArray(val) ? val : []);

  const summary = safe(reportData.summary, {});
  const monthlyRevenue = safeArr(reportData.monthlyRevenue);
  const eventsByCategory = safeArr(reportData.eventsByCategory);
  const usersByRole = safeArr(reportData.usersByRole);
  const users = safeArr(reportData.users);
  const events = safeArr(reportData.events);
  const tickets = safeArr(reportData.tickets);
  const refunds = safeArr(reportData.refunds);
  const testimonials = safeArr(reportData.testimonials);
  const generatedAt = safe(reportData.generatedAt, new Date().toISOString());
  const dateRange = safe(reportData.dateRange, {});

  // Ensure summary has all required fields
  summary.totalUsers = safe(summary.totalUsers, 0);
  summary.totalEvents = safe(summary.totalEvents, 0);
  summary.totalTickets = safe(summary.totalTickets, 0);
  summary.confirmedTickets = safe(summary.confirmedTickets, 0);
  summary.totalRevenue = safe(summary.totalRevenue, 0);
  summary.avgTicketPrice = safe(summary.avgTicketPrice, '0');
  summary.pendingRefunds = safe(summary.pendingRefunds, 0);
  summary.approvedRefunds = safe(summary.approvedRefunds, 0);

  // Render charts as images (with graceful fallback if chart rendering fails)
  let revenueImg, categoryImg, roleImg, regImg;
  const results = await Promise.allSettled([
    renderChartToCanvas(buildRevenueChartConfig(monthlyRevenue)),
    renderChartToCanvas(buildCategoryChartConfig(eventsByCategory)),
    renderChartToCanvas(buildUserRoleChartConfig(usersByRole)),
    renderChartToCanvas(buildRegistrationsChartConfig(monthlyRevenue)),
  ]);
  revenueImg = results[0].status === 'fulfilled' ? results[0].value : null;
  categoryImg = results[1].status === 'fulfilled' ? results[1].value : null;
  roleImg = results[2].status === 'fulfilled' ? results[2].value : null;
  regImg = results[3].status === 'fulfilled' ? results[3].value : null;

  let doc;
  try {
    doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    await registerUnicodeFont(doc);
  } catch (e) {
    throw new Error('Failed to initialize PDF: ' + e.message);
  }
  const w = getPageWidth(doc);
  const cw = w - PDF.MARGIN * 2;

  // Build safe reportData object for downstream functions
  const safeReportData = { summary, monthlyRevenue, eventsByCategory, usersByRole,
    users, events, tickets, refunds, testimonials, generatedAt, dateRange };

  // ══════════════════════════════════════════════════════════════════════
  // COVER PAGE (page 1)
  // ══════════════════════════════════════════════════════════════════════
  try {
    drawCoverPage(doc, safeReportData);
  } catch (e) {
    console.error('Error drawing cover page:', e);
    // Continue with a minimal page instead of failing entirely
    doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    await registerUnicodeFont(doc);
    doc.setFontSize(24);
    doc.text('ERMS System Report', 105, 100, { align: 'center' });
  }

  // ══════════════════════════════════════════════════════════════════════
  // PAGE 2+: HEADER + EXECUTIVE SUMMARY + CHARTS + DATA TABLES
  // ══════════════════════════════════════════════════════════════════════
  doc.addPage();
  let y = PDF.MARGIN;

  const dateRangeLabel = dateRange?.isFiltered
    ? `${dateRange.startDate ? formatDate(dateRange.startDate) : 'Start'} — ${dateRange.endDate ? formatDate(dateRange.endDate) : 'Now'}`
    : 'All Time';
  const subtitle = `${formatDateTime(generatedAt)}  |  ${dateRangeLabel}`;

  y = drawPageHeader(doc, 'ERMS System Report', subtitle);

  // ── Executive Summary (KPI Cards) ────────────────────────────────────
  y = drawSectionTitle(doc, 'Executive Summary', y);
  y = drawSummaryCards(doc, [
    { label: 'Total Users',    value: summary.totalUsers.toLocaleString() },
    { label: 'Total Events',   value: summary.totalEvents.toLocaleString() },
    { label: 'Total Tickets',  value: summary.totalTickets.toLocaleString() },
    { label: 'Confirmed',      value: summary.confirmedTickets.toLocaleString() },
    { label: 'Total Revenue',  value: `$${summary.totalRevenue.toLocaleString()}` },
    { label: 'Avg. Price',     value: `$${summary.avgTicketPrice}` },
    { label: 'Pending Refunds',value: String(summary.pendingRefunds) },
    { label: 'Approved Rfnds', value: String(summary.approvedRefunds) },
  ], y);

  // ── Analytics Charts ─────────────────────────────────────────────────
  y += 2;
  y = drawSectionTitle(doc, 'Analytics', y);

  const chartW = cw / 2 - 3;
  const chartH = 62;

  // Check if charts need a new page
  if (y + chartH * 2 + 8 > getPageHeight(doc) - PDF.MARGIN) {
    doc.addPage();
    drawPageHeader(doc, 'ERMS System Report', 'Continued', null);
    y = 46;
  }

  const drawChartCard = (img, x, cy) => {
    doc.setFillColor(...PDF.WHITE);
    doc.setDrawColor(...PDF.BORDER);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, cy, chartW, chartH, 2.5, 2.5, 'FD');
    if (img) doc.addImage(img, 'PNG', x + 2, cy + 2, chartW - 4, chartH - 4);
  };

  // Row 1: Revenue + Category
  drawChartCard(revenueImg, PDF.MARGIN, y);
  drawChartCard(categoryImg, PDF.MARGIN + chartW + 6, y);
  y += chartH + 4;

  // Row 2: User Roles + Registrations
  drawChartCard(roleImg, PDF.MARGIN, y);
  drawChartCard(regImg, PDF.MARGIN + chartW + 6, y);
  y += chartH + 10;

  // ══════════════════════════════════════════════════════════════════════
  // USERS TABLE
  // ══════════════════════════════════════════════════════════════════════
  y = drawSectionTitle(doc, `Users  (${users.length})`, y);

  y = drawDataTable(doc,
    ['Name', 'Email', 'Role', 'Status', 'Joined'],
    users.map(u => [
      `${u.firstName} ${u.lastName}`.substring(0, 22),
      u.email.substring(0, 26),
      u.role,
      u.deletedAt ? 'Deleted' : (u.status === 'active' || u.status === 'Active' ? 'Active' : 'Suspended'),
      formatDate(u.createdAt),
    ]),
    y,
    {
      colWidths: [cw * 0.24, cw * 0.28, cw * 0.16, cw * 0.14, cw * 0.18],
      alignments: ['L', 'L', 'L', 'L', 'L'],
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // EVENTS TABLE
  // ══════════════════════════════════════════════════════════════════════
  y = drawSectionTitle(doc, `Events  (${events.length})`, y);

  y = drawDataTable(doc,
    ['Title', 'Organizer', 'Category', 'Date', 'Tickets', 'Revenue'],
    events.map(e => [
      e.title.substring(0, 28),
      e.organizer.substring(0, 18),
      e.category.substring(0, 14),
      formatDate(e.date),
      String(e.ticketsSold),
      `$${e.revenue.toLocaleString()}`,
    ]),
    y,
    {
      colWidths: [cw * 0.28, cw * 0.18, cw * 0.14, cw * 0.14, cw * 0.12, cw * 0.14],
      alignments: ['L', 'L', 'L', 'L', 'R', 'R'],
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // TICKETS TABLE
  // ══════════════════════════════════════════════════════════════════════
  y = drawSectionTitle(doc, `Tickets  (${tickets.length})`, y);

  y = drawDataTable(doc,
    ['Code', 'Buyer', 'Event', 'Qty', 'Price', 'Total', 'Status'],
    tickets.map(t => [
      t.ticketCode.substring(0, 8),
      t.buyer.substring(0, 18),
      t.eventTitle.substring(0, 18),
      String(t.quantity),
      `$${Number(t.price).toFixed(2)}`,
      `$${t.totalAmount.toLocaleString()}`,
      t.status.charAt(0).toUpperCase() + t.status.slice(1),
    ]),
    y,
    {
      colWidths: [cw * 0.12, cw * 0.18, cw * 0.2, cw * 0.08, cw * 0.12, cw * 0.14, cw * 0.16],
      alignments: ['L', 'L', 'L', 'R', 'R', 'R', 'L'],
    },
  );

  // ══════════════════════════════════════════════════════════════════════
  // REFUNDS TABLE
  // ══════════════════════════════════════════════════════════════════════
  if (refunds.length > 0) {
    y = drawSectionTitle(doc, `Refunds  (${refunds.length})`, y);

    y = drawDataTable(doc,
      ['User', 'Event', 'Reason', 'Status', 'Requested'],
      refunds.map(r => [
        r.user.substring(0, 20),
        r.eventName.substring(0, 22),
        r.reason.substring(0, 24),
        r.status.charAt(0).toUpperCase() + r.status.slice(1),
        formatDate(r.requestedAt),
      ]),
      y,
      {
        colWidths: [cw * 0.2, cw * 0.22, cw * 0.26, cw * 0.14, cw * 0.18],
        alignments: ['L', 'L', 'L', 'L', 'L'],
      },
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // TESTIMONIALS TABLE
  // ══════════════════════════════════════════════════════════════════════
  if (testimonials.length > 0) {
    y = drawSectionTitle(doc, `Testimonials  (${testimonials.length})`, y);

    y = drawDataTable(doc,
      ['User', 'Event', 'Rating', 'Review', 'Date'],
      testimonials.map(t => [
        t.user.substring(0, 18),
        (t.eventTitle || '—').substring(0, 22),
        `${t.rating} / 5`,
        t.content.substring(0, 30),
        formatDate(t.createdAt),
      ]),
      y,
      {
        colWidths: [cw * 0.18, cw * 0.22, cw * 0.1, cw * 0.32, cw * 0.18],
        alignments: ['L', 'L', 'R', 'L', 'L'],
      },
    );
  }

  // ── Footer ──────────────────────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  drawPageFooter(doc, generatedAt, totalPages);

  // Download
  const dateSuffix = dateRange?.isFiltered ? '_Filtered' : '';
  const filename = `ERMS_Report${dateSuffix}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
  return filename;
}

// ── Excel (.xlsx) Generation ─────────────────────────────────────────────────
// A single flat CSV can't hold 9 differently-shaped tables cleanly — different
// column counts per section means nothing lines up when opened in a
// spreadsheet. A real workbook gives each dataset its own sheet tab instead.

function autoColWidths(headers, rows) {
  return headers.map((h, i) => {
    const longest = rows.reduce((max, row) => {
      const len = String(row[i] ?? '').length;
      return len > max ? len : max;
    }, String(h).length);
    return { wch: Math.min(Math.max(longest + 2, 10), 50) };
  });
}

function addSheet(wb, XLSX, name, headers, rows) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = autoColWidths(headers, rows);
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }) };
  // Excel sheet names: max 31 chars, no []:*?/\
  const safeName = name.replace(/[[\]:*?/\\]/g, '').slice(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, safeName);
}

export async function generateExcelReport(reportData) {
  const { users, events, tickets, refunds, testimonials, summary, monthlyRevenue,
          eventsByCategory, usersByRole, generatedAt, dateRange } = reportData;

  const XLSX = await import('xlsx');

  const dateRangeLabel = dateRange?.isFiltered
    ? `${dateRange.startDate ? formatDate(dateRange.startDate) : 'All'} to ${dateRange.endDate ? formatDate(dateRange.endDate) : 'Now'}`
    : 'All Time';

  const wb = XLSX.utils.book_new();

  // ── Sheet: Overview ──────────────────────────────────────────────────────
  addSheet(wb, XLSX, 'Overview', ['Metric', 'Value'], [
    ['Report', 'ERMS System Report — Event Registration & Management'],
    ['Generated At', formatDateTime(generatedAt)],
    ['Date Range', dateRangeLabel],
    ['Total Users (Filtered)', summary.totalUsers],
    ['Total Users (All Time)', summary.totalUsersAll ?? summary.totalUsers],
    ['Total Events', summary.totalEvents],
    ['Total Tickets Sold', summary.totalTickets],
    ['Confirmed Tickets', summary.confirmedTickets],
    ['Total Revenue ($)', summary.totalRevenue],
    ['Average Ticket Price ($)', Number(summary.avgTicketPrice)],
    ['Pending Refunds', summary.pendingRefunds],
    ['Approved Refunds', summary.approvedRefunds],
  ]);

  // ── Sheet: Users ─────────────────────────────────────────────────────────
  addSheet(wb, XLSX, 'Users',
    ['ID', 'First Name', 'Last Name', 'Email', 'Role', 'Status', 'Phone', 'Address', 'Created At', 'Updated At', 'Deleted At'],
    users.map(u => [
      u.id, u.firstName, u.lastName, u.email, u.role, u.deletedAt ? 'Deleted' : u.status,
      u.phone || '', u.address || '',
      formatDateTime(u.createdAt), formatDateTime(u.updatedAt),
      u.deletedAt ? formatDateTime(u.deletedAt) : '',
    ]),
  );

  // ── Sheet: Events ────────────────────────────────────────────────────────
  addSheet(wb, XLSX, 'Events',
    ['ID', 'Title', 'Description', 'Date', 'Location', 'Capacity', 'Price ($)', 'Category', 'Published', 'Organizer', 'Organizer Email', 'Tickets Sold', 'Testimonials', 'Revenue ($)', 'Created At'],
    events.map(e => [
      e.id, e.title, (e.description || '').substring(0, 150),
      formatDate(e.date), e.location, e.capacity, e.price,
      e.category, e.published ? 'Yes' : 'No',
      e.organizer, e.organizerEmail, e.ticketsSold,
      e.testimonials ?? '', e.revenue,
      formatDateTime(e.createdAt),
    ]),
  );

  // ── Sheet: Tickets ───────────────────────────────────────────────────────
  addSheet(wb, XLSX, 'Tickets',
    ['ID', 'Ticket Code', 'Type', 'Quantity', 'Price ($)', 'Total Amount ($)', 'Status', 'Buyer Name', 'Buyer Email', 'Buyer Role', 'Event Title', 'Event Category', 'Registered At'],
    tickets.map(t => [
      t.id, t.ticketCode, t.ticketType || '', t.quantity,
      Number(t.price), t.totalAmount, t.status,
      t.buyer, t.buyerEmail, t.buyerRole,
      t.eventTitle, t.eventCategory,
      formatDateTime(t.registeredAt),
    ]),
  );

  // ── Sheet: Refunds ───────────────────────────────────────────────────────
  if (refunds.length > 0) {
    addSheet(wb, XLSX, 'Refunds',
      ['ID', 'Ticket Code', 'Event Name', 'User', 'User Email', 'Reason', 'Details', 'Status', 'Requested At', 'Resolved At'],
      refunds.map(r => [
        r.id, r.ticketCode, r.eventName, r.user, r.userEmail,
        r.reason, (r.details || ''), r.status,
        formatDateTime(r.requestedAt), r.resolvedAt ? formatDateTime(r.resolvedAt) : '',
      ]),
    );
  }

  // ── Sheet: Testimonials ──────────────────────────────────────────────────
  if (testimonials.length > 0) {
    addSheet(wb, XLSX, 'Testimonials',
      ['ID', 'User', 'Event', 'Rating', 'Content', 'Created At'],
      testimonials.map(t => [
        t.id, t.user, t.eventTitle || '', t.rating,
        t.content, formatDateTime(t.createdAt),
      ]),
    );
  }

  // ── Sheet: Monthly Revenue ───────────────────────────────────────────────
  addSheet(wb, XLSX, 'Monthly Revenue',
    ['Month', 'Revenue ($)', 'Registrations'],
    monthlyRevenue.map(m => [m.month, m.revenue, m.registrations]),
  );

  // ── Sheet: Events by Category ────────────────────────────────────────────
  addSheet(wb, XLSX, 'Events by Category', ['Category', 'Count'],
    eventsByCategory.map(c => [c.category, c.count]));

  // ── Sheet: Users by Role ─────────────────────────────────────────────────
  addSheet(wb, XLSX, 'Users by Role', ['Role', 'Count'],
    usersByRole.map(r => [r.role, r.count]));

  const dateSuffix = dateRange?.isFiltered ? '_Filtered' : '';
  const filename = `ERMS_Data${dateSuffix}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}
