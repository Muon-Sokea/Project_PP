// ─────────────────────────────────────────────────────────────────────────────
// src/utils/reportExport.js — PDF & CSV report generation for Super Admin
// ─────────────────────────────────────────────────────────────────────────────
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// ── Helpers ──────────────────────────────────────────────────────────────────

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCSV(val) {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

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

function buildRevenueChartConfig(monthlyRevenue) {
  return {
    type: 'bar',
    data: {
      labels: monthlyRevenue.map(m => m.month),
      datasets: [{
        label: 'Revenue ($)',
        data: monthlyRevenue.map(m => m.revenue),
        backgroundColor: 'rgba(74, 144, 217, 0.8)',
        borderColor: '#4A90D9',
        borderWidth: 1,
        borderRadius: 4,
      }],
    },
    options: {
      responsive: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Monthly Revenue', font: { size: 14, weight: 'bold' } },
      },
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => '$' + v.toLocaleString() } },
        x: { grid: { display: false } },
      },
    },
  };
}

function buildCategoryChartConfig(eventsByCategory) {
  return {
    type: 'doughnut',
    data: {
      labels: eventsByCategory.map(c => c.category),
      datasets: [{
        data: eventsByCategory.map(c => c.count),
        backgroundColor: [
          '#4A90D9', '#F5A623', '#7ED321', '#BD10E0', '#50E3C2',
          '#D0021B', '#9013FE', '#417505', '#F8E71C', '#4A4A4A',
        ],
      }],
    },
    options: {
      responsive: false,
      plugins: {
        title: { display: true, text: 'Events by Category', font: { size: 14, weight: 'bold' } },
        legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } },
      },
    },
  };
}

function buildUserRoleChartConfig(usersByRole) {
  return {
    type: 'pie',
    data: {
      labels: usersByRole.map(r => r.role),
      datasets: [{
        data: usersByRole.map(r => r.count),
        backgroundColor: ['#F5A623', '#4A90D9', '#BD10E0', '#7ED321'],
      }],
    },
    options: {
      responsive: false,
      plugins: {
        title: { display: true, text: 'Users by Role', font: { size: 14, weight: 'bold' } },
        legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } },
      },
    },
  };
}

function buildRegistrationsChartConfig(monthlyRevenue) {
  return {
    type: 'line',
    data: {
      labels: monthlyRevenue.map(m => m.month),
      datasets: [{
        label: 'Registrations',
        data: monthlyRevenue.map(m => m.registrations),
        borderColor: '#7ED321',
        backgroundColor: 'rgba(126, 211, 33, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#7ED321',
        pointRadius: 4,
      }],
    },
    options: {
      responsive: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Monthly Registrations', font: { size: 14, weight: 'bold' } },
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
        x: { grid: { display: false } },
      },
    },
  };
}

// ── PDF Generation ───────────────────────────────────────────────────────────

export async function generatePDFReport(reportData) {
  const { summary, monthlyRevenue, eventsByCategory, usersByRole,
          users, events, tickets, refunds, testimonials, generatedAt, dateRange } = reportData;

  // Render charts as images
  const [revenueImg, categoryImg, roleImg, regImg] = await Promise.all([
    renderChartToCanvas(buildRevenueChartConfig(monthlyRevenue)),
    renderChartToCanvas(buildCategoryChartConfig(eventsByCategory)),
    renderChartToCanvas(buildUserRoleChartConfig(usersByRole)),
    renderChartToCanvas(buildRegistrationsChartConfig(monthlyRevenue)),
  ]);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = margin;

  const NAVY = [40, 52, 71];
  const BLUE = [74, 144, 217];
  const LIGHT_BLUE = [235, 242, 250];
  const BORDER = [222, 228, 236];
  const TEXT = [45, 52, 62];
  const MUTED = [120, 128, 140];

  function ensureSpace(needed) {
    if (y + needed > pageH - margin - 10) {
      doc.addPage();
      y = margin;
    }
  }

  function sectionTitle(title, subtitle) {
    ensureSpace(16);
    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.8);
    doc.line(margin, y, margin, y + 6);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text(title, margin + 3, y + 4.5);
    y += 9;
    if (subtitle) {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...MUTED);
      doc.text(subtitle, margin + 3, y);
      y += 6;
    }
  }

  // ── Cover / Header ──────────────────────────────────────────────────────
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageW, 42, 'F');
  doc.setFillColor(...BLUE);
  doc.rect(0, 42, pageW, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('ERMS System Report', margin, 19);

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(210, 220, 235);
  doc.text('Event Registration & Management System', margin, 27);

  doc.setFontSize(8.5);
  const dateRangeLabel = dateRange?.isFiltered
    ? `Date Range: ${dateRange.startDate ? formatDate(dateRange.startDate) : 'Start'} — ${dateRange.endDate ? formatDate(dateRange.endDate) : 'Now'}`
    : 'Date Range: All Time';
  doc.text(`Generated ${formatDateTime(generatedAt)}   •   ${dateRangeLabel}`, margin, 35);

  y = 54;

  // ── Executive Summary (KPI cards) ───────────────────────────────────────
  sectionTitle('Executive Summary');

  const summaryItems = [
    ['Total Users', summary.totalUsers],
    ['Total Events', summary.totalEvents],
    ['Total Tickets Sold', summary.totalTickets],
    ['Confirmed Tickets', summary.confirmedTickets],
    ['Total Revenue', `$${summary.totalRevenue.toLocaleString()}`],
    ['Avg. Ticket Price', `$${summary.avgTicketPrice}`],
    ['Pending Refunds', summary.pendingRefunds],
    ['Approved Refunds', summary.approvedRefunds],
  ];

  const cardCols = 4;
  const cardGap = 4;
  const cardW = (contentW - cardGap * (cardCols - 1)) / cardCols;
  const cardH = 20;
  ensureSpace(cardH * 2 + cardGap);
  summaryItems.forEach(([label, value], i) => {
    const col = i % cardCols;
    const row = Math.floor(i / cardCols);
    const cx = margin + col * (cardW + cardGap);
    const cy = y + row * (cardH + cardGap);

    doc.setFillColor(...LIGHT_BLUE);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.2);
    doc.roundedRect(cx, cy, cardW, cardH, 1.5, 1.5, 'FD');

    doc.setFontSize(12.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text(String(value), cx + 4, cy + 9);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.text(label, cx + 4, cy + 15.5);
  });
  y += Math.ceil(summaryItems.length / cardCols) * (cardH + cardGap) + 6;

  // ── Charts (2 per row, in bordered cards) ───────────────────────────────
  doc.addPage();
  y = margin;
  sectionTitle('Analytics');

  const chartGap = 4;
  const chartW = (contentW - chartGap) / 2;
  const chartH = 62;
  const chartPad = 3;

  function chartCard(img, cx, cy) {
    doc.setDrawColor(...BORDER);
    doc.setFillColor(255, 255, 255);
    doc.setLineWidth(0.2);
    doc.roundedRect(cx, cy, chartW, chartH, 1.5, 1.5, 'FD');
    doc.addImage(img, 'PNG', cx + chartPad, cy + chartPad, chartW - chartPad * 2, chartH - chartPad * 2);
  }

  ensureSpace(chartH * 2 + chartGap);
  chartCard(revenueImg, margin, y);
  chartCard(categoryImg, margin + chartW + chartGap, y);
  y += chartH + chartGap;
  chartCard(roleImg, margin, y);
  chartCard(regImg, margin + chartW + chartGap, y);
  y += chartH + 10;

  // ── Helper: draw a table with weighted columns, wrapping & borders ─────
  function drawTable(headers, rows, colWeights, note) {
    const totalWeight = colWeights.reduce((a, b) => a + b, 0);
    const colWidths = colWeights.map(w => (w / totalWeight) * contentW);
    const colX = [];
    let acc = margin;
    colWidths.forEach(w => { colX.push(acc); acc += w; });

    const cellPad = 1.8;
    const lineH = 3.6;
    const headerH = 7;

    function drawHeader(localY) {
      doc.setFillColor(...NAVY);
      doc.rect(margin, localY, contentW, headerH, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7.8);
      doc.setFont('helvetica', 'bold');
      headers.forEach((h, i) => {
        doc.text(h, colX[i] + cellPad, localY + headerH / 2 + 1.3);
      });
      return localY + headerH;
    }

    if (note) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...MUTED);
      doc.text(note, margin, y);
      y += 5;
    }

    ensureSpace(headerH + lineH * 2);
    y = drawHeader(y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.3);

    rows.forEach((row, ri) => {
      const wrapped = row.map((cell, ci) =>
        doc.splitTextToSize(String(cell ?? '—'), colWidths[ci] - cellPad * 2));
      const rowLines = Math.max(...wrapped.map(w => w.length), 1);
      const rowH = rowLines * lineH + 2;

      if (y + rowH > pageH - margin - 10) {
        doc.addPage();
        y = margin;
        y = drawHeader(y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.3);
      }

      if (ri % 2 === 0) {
        doc.setFillColor(...LIGHT_BLUE);
        doc.rect(margin, y, contentW, rowH, 'F');
      }
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.15);
      doc.rect(margin, y, contentW, rowH);
      colX.slice(1).forEach(x => doc.line(x, y, x, y + rowH));

      doc.setTextColor(...TEXT);
      wrapped.forEach((lines, ci) => {
        lines.forEach((line, li) => {
          doc.text(line, colX[ci] + cellPad, y + lineH * (li + 1) - 0.5);
        });
      });
      y += rowH;
    });

    y += 8;
  }

  // ── Users ────────────────────────────────────────────────────────────────
  const USER_CAP = 25;
  const usersShown = [...users]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, USER_CAP);
  sectionTitle(`Users (${users.length})`);
  drawTable(
    ['Name', 'Email', 'Role', 'Status', 'Joined'],
    usersShown.map(u => [`${u.firstName} ${u.lastName}`, u.email, u.role, u.status, formatDate(u.createdAt)]),
    [2, 3, 1.4, 1.2, 1.4],
    users.length > USER_CAP
      ? `Showing ${USER_CAP} most recently joined of ${users.length} total — full list available in the CSV export.`
      : null,
  );

  // ── Events ───────────────────────────────────────────────────────────────
  const EVENT_CAP = 25;
  const eventsShown = [...events].sort((a, b) => b.revenue - a.revenue).slice(0, EVENT_CAP);
  sectionTitle(`Events (${events.length})`);
  drawTable(
    ['Title', 'Organizer', 'Category', 'Date', 'Tickets', 'Revenue'],
    eventsShown.map(e => [e.title, e.organizer, e.category, formatDate(e.date), e.ticketsSold, `$${e.revenue.toLocaleString()}`]),
    [2.4, 1.6, 1.2, 1.2, 0.9, 1.1],
    events.length > EVENT_CAP
      ? `Showing top ${EVENT_CAP} events by revenue of ${events.length} total — full list available in the CSV export.`
      : null,
  );

  // ── Tickets ──────────────────────────────────────────────────────────────
  const TICKET_CAP = 30;
  const ticketsShown = [...tickets]
    .sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt))
    .slice(0, TICKET_CAP);
  sectionTitle(`Tickets (${tickets.length})`);
  drawTable(
    ['Code', 'Buyer', 'Event', 'Qty', 'Price', 'Total', 'Status'],
    ticketsShown.map(t => [t.ticketCode.substring(0, 8), t.buyer, t.eventTitle, t.quantity, `$${t.price}`, `$${t.totalAmount}`, t.status]),
    [1.1, 1.6, 1.8, 0.6, 0.8, 0.9, 1],
    tickets.length > TICKET_CAP
      ? `Showing ${TICKET_CAP} most recent tickets of ${tickets.length} total — full list available in the CSV export.`
      : null,
  );

  // ── Refunds ──────────────────────────────────────────────────────────────
  if (refunds.length > 0) {
    const REFUND_CAP = 25;
    const refundsShown = [...refunds]
      .sort((a, b) => (a.status === 'pending' ? -1 : 1) - (b.status === 'pending' ? -1 : 1))
      .slice(0, REFUND_CAP);
    sectionTitle(`Refunds (${refunds.length})`);
    drawTable(
      ['User', 'Event', 'Reason', 'Status', 'Requested'],
      refundsShown.map(r => [r.user, r.eventName, r.reason, r.status, formatDate(r.requestedAt)]),
      [1.6, 1.8, 2, 1, 1.2],
      refunds.length > REFUND_CAP
        ? `Showing ${REFUND_CAP} of ${refunds.length} total (pending first) — full list available in the CSV export.`
        : null,
    );
  }

  // ── Testimonials ─────────────────────────────────────────────────────────
  if (testimonials.length > 0) {
    const TESTIMONIAL_CAP = 20;
    const testimonialsShown = [...testimonials].sort((a, b) => b.rating - a.rating).slice(0, TESTIMONIAL_CAP);
    sectionTitle(`Testimonials (${testimonials.length})`);
    drawTable(
      ['User', 'Event', 'Rating', 'Content', 'Date'],
      testimonialsShown.map(t => [t.user, t.eventTitle || '—', `${t.rating}/5`, t.content, formatDate(t.createdAt)]),
      [1.4, 1.6, 0.8, 3, 1.2],
      testimonials.length > TESTIMONIAL_CAP
        ? `Showing top ${TESTIMONIAL_CAP} rated of ${testimonials.length} total — full list available in the CSV export.`
        : null,
    );
  }

  // ── Footer on every page ────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `ERMS System Report — Page ${i} of ${totalPages} — Generated ${formatDateTime(generatedAt)}`,
      margin,
      doc.internal.pageSize.getHeight() - 8,
    );
  }

  // Download
  const dateSuffix = dateRange?.isFiltered ? '_Filtered' : '';
  const filename = `ERMS_Report${dateSuffix}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
  return filename;
}

// ── CSV Generation ───────────────────────────────────────────────────────────

export function generateCSVReport(reportData) {
  const { users, events, tickets, refunds, testimonials, summary, monthlyRevenue,
          eventsByCategory, usersByRole, generatedAt, dateRange } = reportData;

  const sheets = [];

  // Sheet 1: Summary
  sheets.push({
    name: 'Summary',
    headers: ['Metric', 'Value'],
    rows: [
      ['Generated At', formatDateTime(generatedAt)],
      ['Date Range', dateRange?.isFiltered ? `${dateRange.startDate ? formatDate(dateRange.startDate) : 'All'} to ${dateRange.endDate ? formatDate(dateRange.endDate) : 'Now'}` : 'All Time'],
      ['Total Users (filtered)', summary.totalUsers],
      ['Total Users (all time)', summary.totalUsersAll ?? summary.totalUsers],
      ['Total Events', summary.totalEvents],
      ['Total Tickets Sold', summary.totalTickets],
      ['Confirmed Tickets', summary.confirmedTickets],
      ['Total Revenue', `$${summary.totalRevenue.toLocaleString()}`],
      ['Average Ticket Price', `$${summary.avgTicketPrice}`],
      ['Pending Refunds', summary.pendingRefunds],
      ['Approved Refunds', summary.approvedRefunds],
    ],
  });

  // Sheet 2: Users
  sheets.push({
    name: 'Users',
    headers: ['ID', 'First Name', 'Last Name', 'Email', 'Role', 'Status', 'Phone', 'Address', 'Created At', 'Updated At'],
    rows: users.map(u => [
      u.id, u.firstName, u.lastName, u.email, u.role, u.status,
      u.phone || '', u.address || '',
      formatDateTime(u.createdAt), formatDateTime(u.updatedAt),
    ]),
  });

  // Sheet 3: Events
  sheets.push({
    name: 'Events',
    headers: ['ID', 'Title', 'Description', 'Date', 'Location', 'Capacity', 'Price', 'Category', 'Published', 'Organizer', 'Organizer Email', 'Tickets Sold', 'Revenue', 'Created At'],
    rows: events.map(e => [
      e.id, e.title, e.description?.substring(0, 100) || '',
      formatDate(e.date), e.location, e.capacity, `$${e.price}`,
      e.category, e.published ? 'Yes' : 'No',
      e.organizer, e.organizerEmail, e.ticketsSold,
      `$${e.revenue.toLocaleString()}`, formatDateTime(e.createdAt),
    ]),
  });

  // Sheet 4: Tickets
  sheets.push({
    name: 'Tickets',
    headers: ['ID', 'Ticket Code', 'Type', 'Quantity', 'Price', 'Total Amount', 'Status', 'Buyer Name', 'Buyer Email', 'Buyer Role', 'Event', 'Event Category', 'Registered At'],
    rows: tickets.map(t => [
      t.id, t.ticketCode, t.ticketType, t.quantity,
      `$${t.price}`, `$${t.totalAmount}`, t.status,
      t.buyer, t.buyerEmail, t.buyerRole,
      t.eventTitle, t.eventCategory,
      formatDateTime(t.registeredAt),
    ]),
  });

  // Sheet 5: Refunds
  sheets.push({
    name: 'Refunds',
    headers: ['ID', 'Ticket Code', 'Event Name', 'User', 'User Email', 'Reason', 'Details', 'Status', 'Requested At', 'Resolved At'],
    rows: refunds.map(r => [
      r.id, r.ticketCode, r.eventName, r.user, r.userEmail,
      r.reason, r.details || '', r.status,
      formatDateTime(r.requestedAt), formatDateTime(r.resolvedAt),
    ]),
  });

  // Sheet 6: Testimonials
  sheets.push({
    name: 'Testimonials',
    headers: ['ID', 'User', 'Event', 'Rating', 'Content', 'Created At'],
    rows: testimonials.map(t => [
      t.id, t.user, t.eventTitle || '', t.rating,
      t.content, formatDateTime(t.createdAt),
    ]),
  });

  // Sheet 7: Monthly Revenue
  sheets.push({
    name: 'Monthly Revenue',
    headers: ['Month', 'Revenue', 'Registrations'],
    rows: monthlyRevenue.map(m => [
      m.month, `$${m.revenue.toLocaleString()}`, m.registrations,
    ]),
  });

  // Sheet 8: Events by Category
  sheets.push({
    name: 'Events by Category',
    headers: ['Category', 'Count'],
    rows: eventsByCategory.map(c => [c.category, c.count]),
  });

  // Sheet 9: Users by Role
  sheets.push({
    name: 'Users by Role',
    headers: ['Role', 'Count'],
    rows: usersByRole.map(r => [r.role, r.count]),
  });

  // Build CSV content (multi-sheet as separate CSV sections with sheet headers)
  let csv = '';
  sheets.forEach((sheet, idx) => {
    if (idx > 0) csv += '\n\n';
    csv += `=== ${sheet.name} ===\n`;
    csv += sheet.headers.map(escapeCSV).join(',') + '\n';
    sheet.rows.forEach(row => {
      csv += row.map(escapeCSV).join(',') + '\n';
    });
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const dateSuffix = dateRange?.isFiltered ? '_Filtered' : '';
  const filename = `ERMS_Data${dateSuffix}_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadBlob(blob, filename);
  return filename;
}
