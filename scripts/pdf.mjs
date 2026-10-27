// PDF-LIB is a build-only dependency. The browser receives an ordinary PDF file.
import { PDFDocument, StandardFonts, rgb, PDFString, PDFName } from 'pdf-lib';
const ink = rgb(.10, .20, .17), muted = rgb(.30, .35, .32), gold = rgb(.57, .42, .20);
const clean = s => String(s).replace(/[–—‑]/g, '-').replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
  .replace(/\*\*|\*|`/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\s+/g, ' ').trim();
export async function createLearnerPDF(data, siteURL) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`CORE Session ${String(data.number).padStart(2, '0')} - ${data.title}`);
  pdf.setAuthor('CORE - Mark Baldwin-Smith');
  pdf.setSubject('Printable Catholic catechesis learner sheet');
  pdf.setKeywords(['CORE', 'catechesis', 'learner sheet', data.title]);
  pdf.setCreationDate(new Date('2026-10-27T00:00:00Z'));
  pdf.setModificationDate(new Date('2026-10-27T00:00:00Z'));
  pdf.catalog.set(PDFName.of('Lang'), PDFString.of('en-GB'));
  const fonts = {
    body: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    title: await pdf.embedFont(StandardFonts.TimesRomanBold),
    quote: await pdf.embedFont(StandardFonts.TimesRomanItalic),
  };
  const W = 595.28, H = 841.89, M = 46, width = W - M * 2;
  let page, y;
  function lines(text, font, size, maxWidth = width) {
    const words = clean(text).split(' '), out = []; let line = '';
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) > maxWidth && line) { out.push(line); line = word; }
      else line = next;
    }
    if (line) out.push(line);
    return out;
  }
  function text(s, font = fonts.body, size = 12, colour = ink, leading = 18, maxWidth = width, x = M) {
    for (const line of lines(s, font, size, maxWidth)) {
      if (y < 66) throw new Error(`Learner PDF ${data.number} overflows: shorten learner text or adjust its layout`);
      page.drawText(line, { x, y, size, font, color: colour }); y -= leading;
    }
  }
  function heading(s) { y -= 10; text(s, fonts.bold, 10, gold, 15); y -= 2; }
  function start(number, subtitle) {
    page = pdf.addPage([W, H]); y = H - 46;
    text(`CORE  /  SESSION ${String(data.number).padStart(2, '0')}  /  ${subtitle}`, fonts.bold, 9, gold, 14);
    y -= 12;
    text(data.title, fonts.title, 23, ink, 26);
    y -= 10;
    page.drawLine({ start: { x: M, y: y + 3 }, end: { x: W - M, y: y + 3 }, color: gold, thickness: .7 });
    page.drawText('CORE - Catechesis for Open Reflection and Engagement', { x: M, y: 35, font: fonts.body, size: 8, color: muted });
    page.drawText(`${number} / 2`, { x: W - M - 20, y: 35, font: fonts.body, size: 8, color: muted });
    y -= 9;
  }
  start(1, 'EXPLORE');
  heading('THE QUESTION'); text(data.question, fonts.quote, 14, ink, 19);
  y -= 7; text(data.aim, fonts.body, 12, muted, 17);
  heading('THREE IDEAS TO TAKE WITH YOU');
  data.explore.forEach((p, i) => { text(`${i + 1}. ${p}`); y -= 7; });
  heading('READ AND DISCOVER'); text(data.reading, fonts.body, 11.5, muted, 16);
  heading('A VOICE FROM THE TRADITION');
  text(`"${data.quotation.text}"`, fonts.quote, 13, ink, 18);
  const shortAttribution = data.quotation.attribution.split(/, (?:translated|official|as quoted)/)[0];
  y -= 4; text(shortAttribution, fonts.body, 10.5, muted, 15);
  y -= 9; text(`Full session and sources: ${siteURL}sessions/${data.slug}/`, fonts.body, 9, muted, 12);
  if (y > 190) {
    heading('NOTICE AS YOU READ');
    text('What is new, surprising, or difficult? Bring one question to the conversation.', fonts.body, 12, ink, 17);
    y -= 12;
    for (let i = 0; i < 2; i++) {
      page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, color: rgb(.78, .80, .77), thickness: .4 }); y -= 23;
    }
  }
  start(2, 'REFLECT AND ENGAGE');
  for (const faq of data.faqs) {
    heading(faq.question.toUpperCase());
    text(faq.answer, fonts.body, 12, ink, 18); y -= 2;
  }
  heading('REFLECT AND PRACTISE');
  text(data.practice, fonts.body, 12, ink, 17);
  heading('ONE SMALL STEP'); text(data.week, fonts.body, 12, ink, 17);
  heading('A QUESTION OR REFLECTION TO KEEP');
  const remaining = Math.max(0, Math.floor((y - 80) / 21));
  for (let i = 0; i < Math.min(remaining, 8); i++) {
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, color: rgb(.78, .80, .77), thickness: .4 }); y -= 21;
  }
  return pdf.save();
}
