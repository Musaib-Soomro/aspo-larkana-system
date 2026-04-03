const puppeteer = require('puppeteer');
const { generateWeeklyDiary } = require('../services/pdf/weeklyDiary');
const { generateMonthlyStatement } = require('../services/pdf/monthlyStatement');
const { generateComplaintMemo } = require('../services/pdf/complaintMemo');

async function renderPdf(html, landscape = false) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const buffer = await page.pdf({
      format: 'A4',
      landscape,
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    });
    return buffer;
  } finally {
    await browser.close();
  }
}

async function weeklyDiary(req, res, next) {
  try {
    const html = await generateWeeklyDiary(req.body);
    const pdf = await renderPdf(html, false);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename="weekly-diary.pdf"' });
    return res.send(pdf);
  } catch (err) {
    next(err);
  }
}

async function monthlyStatement(req, res, next) {
  try {
    const html = await generateMonthlyStatement(req.body);
    const pdf = await renderPdf(html, true);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename="monthly-statement.pdf"' });
    return res.send(pdf);
  } catch (err) {
    next(err);
  }
}

async function complaintMemo(req, res, next) {
  try {
    const html = await generateComplaintMemo(req.body);
    const pdf = await renderPdf(html, false);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline; filename="complaint-memo.pdf"' });
    return res.send(pdf);
  } catch (err) {
    next(err);
  }
}

module.exports = { weeklyDiary, monthlyStatement, complaintMemo };
