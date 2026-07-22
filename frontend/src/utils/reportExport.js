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
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ── Cover / Header ──────────────────────────────────────────────────────
  doc.setFillColor(74, 144, 217);
  doc.rect(0, 0, pageW, 45, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('ERMS System Report', margin, 20);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Event Registration & Management System', margin, 28);

  doc.setFontSize(9);
  const dateRangeLabel = dateRange?.isFiltered
    ? `Date Range: ${dateRange.startDate ? formatDate(dateRange.startDate) : 'Start'} — ${dateRange.endDate ? formatDate(dateRange.endDate) : 'Now'}`
    : 'Date Range: All Time';
  doc.text(`Generated: ${formatDateTime(generatedAt)}  |  ${dateRangeLabel}`, margin, 36);

  y = 55;

  // ── Executive Summary ───────────────────────────────────────────────────
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

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

  // Draw summary table
  doc.setFillColor(240, 245, 250);
  const rowH = 7;
  summaryItems.forEach(([label, value], i) => {
    if (i % 2 === 0) {
      doc.setFillColor(240, 245, 250);
      doc.rect(margin, y - 4, contentW, rowH, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(label, margin + 2, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text(String(value), margin + contentW / 2, y);
    y += rowH;
  });

  y += 8;

  // ── Charts (2 per row) ──────────────────────────────────────────────────
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text('Analytics', margin, y);
  y += 6;

  const chartW = contentW / 2 - 2;
  const chartH = 65;

  // Check if charts fit on current page
  if (y + chartH * 2 + 10 > doc.internal.pageSize.getHeight()) {
    doc.addPage();
    y = margin;
  }

  doc.addImage(revenueImg, 'PNG', margin, y, chartW, chartH);
  doc.addImage(categoryImg, 'PNG', margin + chartW + 4, y, chartW, chartH);
  y += chartH + 4;
  doc.addImage(roleImg, 'PNG', margin, y, chartW, chartH);
  doc.addImage(regImg, 'PNG', margin + chartW + 4, y, chartW, chartH);
  y += chartH + 10;

  // ── Helper: draw a table ────────────────────────────────────────────────
  function drawTable(headers, rows, startY) {
    let localY = startY;
    const colW = contentW / headers.length;

    // Check page break
    const neededH = 10 + rows.length * 6;
    if (localY + neededH > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      localY = margin;
    }

    // Header row
    doc.setFillColor(74, 144, 217);
    doc.rect(margin, localY - 4, contentW, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    headers.forEach((h, i) => {
      doc.text(h, margin + i * colW + 2, localY + 1);
    });
    localY += 6;

    // Data rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    rows.forEach((row, ri) => {
      if (localY + 6 > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        localY = margin;
        // Re-draw header
        doc.setFillColor(74, 144, 217);
        doc.rect(margin, localY - 4, contentW, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        headers.forEach((h, i) => {
          doc.text(h, margin + i * colW + 2, localY + 1);
        });
        localY += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
      }

      if (ri % 2 === 0) {
        doc.setFillColor(245, 248, 252);
        doc.rect(margin, localY - 4, contentW, 5.5, 'F');
      }
      doc.setTextColor(60, 60, 60);
      row.forEach((cell, ci) => {
        const txt = String(cell ?? '—').substring(0, 40);
        doc.text(txt, margin + ci * colW + 2, localY);
      });
      localY += 5.5;
    });

    return localY + 6;
  }

  // ── Users Table ─────────────────────────────────────────────────────────
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(`Users (${users.length})`, margin, y);
  y += 6;

  y = drawTable(
    ['Name', 'Email', 'Role', 'Status', 'Joined'],
    users.map(u => [
      `${u.firstName} ${u.lastName}`,
      u.email,
      u.role,
      u.status,
      formatDate(u.createdAt),
    ]),
    y,
  );

  // ── Events Table ────────────────────────────────────────────────────────
  y += 4;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(`Events (${events.length})`, margin, y);
  y += 6;

  y = drawTable(
    ['Title', 'Organizer', 'Category', 'Date', 'Tickets', 'Revenue'],
    events.map(e => [
      e.title.substring(0, 30),
      e.organizer,
      e.category,
      formatDate(e.date),
      e.ticketsSold,
      `$${e.revenue.toLocaleString()}`,
    ]),
    y,
  );

  // ── Tickets Table ───────────────────────────────────────────────────────
  y += 4;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(`Tickets (${tickets.length})`, margin, y);
  y += 6;

  y = drawTable(
    ['Code', 'Buyer', 'Event', 'Qty', 'Price', 'Total', 'Status'],
    tickets.map(t => [
      t.ticketCode.substring(0, 8),
      t.buyer.substring(0, 20),
      t.eventTitle.substring(0, 20),
      t.quantity,
      `$${t.price}`,
      `$${t.totalAmount}`,
      t.status,
    ]),
    y,
  );

  // ── Refunds Table ───────────────────────────────────────────────────────
  if (refunds.length > 0) {
    y += 4;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text(`Refunds (${refunds.length})`, margin, y);
    y += 6;

    y = drawTable(
      ['User', 'Event', 'Reason', 'Status', 'Requested'],
      refunds.map(r => [
        r.user.substring(0, 20),
        r.eventName.substring(0, 20),
        r.reason.substring(0, 25),
        r.status,
        formatDate(r.requestedAt),
      ]),
      y,
    );
  }

  // ── Testimonials Table ──────────────────────────────────────────────────
  if (testimonials.length > 0) {
    y += 4;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text(`Testimonials (${testimonials.length})`, margin, y);
    y += 6;

    y = drawTable(
      ['User', 'Event', 'Rating', 'Content', 'Date'],
      testimonials.map(t => [
        t.user.substring(0, 20),
        (t.eventTitle || '—').substring(0, 20),
        `${t.rating}/5`,
        t.content.substring(0, 30),
        formatDate(t.createdAt),
      ]),
      y,
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
