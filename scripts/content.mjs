import fs from 'node:fs/promises';
import path from 'node:path';
export const ROOT = path.resolve(import.meta.dirname, '..');
export const PARTS = [
  { number: 1, title: 'Foundations of faith', short: 'Foundations', subtitle: 'Meet Christ. Explore the faith we share.', range: '01–06' },
  { number: 2, title: 'Communion and prayer', short: 'Communion & prayer', subtitle: 'Discover a community. Find a rhythm of prayer.', range: '07–12' },
  { number: 3, title: 'The sacramental life', short: 'Sacramental life', subtitle: 'Encounter grace in the life of the Church.', range: '13–18' },
  { number: 4, title: 'Discipleship and hope', short: 'Discipleship & hope', subtitle: 'Carry faith into ordinary life.', range: '19–24' },
];
export const escapeHTML = s => String(s).replace(/[&<>"']/g, x => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x]));
export const slugify = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export function parseSource(raw) {
  const m = raw.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error('Expected JSON front matter between --- delimiters');
  return { ...JSON.parse(m[1]), markdown: m[2].trim() };
}
export async function readSources(folder) {
  const files = (await fs.readdir(path.join(ROOT, 'content', folder))).filter(f => f.endsWith('.md')).sort();
  return Promise.all(files.map(async file => ({ ...parseSource(await fs.readFile(path.join(ROOT, 'content', folder, file), 'utf8')), file })));
}
export function sectionBody(source, heading) {
  const chunks = source.markdown.split(/^## /m).slice(1);
  return chunks.find(c => c.split('\n')[0].trim() === heading)?.split('\n').slice(1).join('\n').trim() || '';
}
export function faqItems(source) {
  return [...sectionBody(source, 'Questions worth asking').matchAll(/^### (.+)\n+([\s\S]*?)(?=^### |$(?![\s\S]))/gm)]
    .map(m => ({ question: m[1].trim(), answer: m[2].trim() }));
}
export function learnerData(source, quotes) {
  const aim = sectionBody(source, 'Begin with a question').replace(/^.+?\?\s*/, '').replace(/^Participants can /, 'By the end, you should be able to ');
  const explore = sectionBody(source, 'Explore the faith').split(/\n\n+/).map(x => x.replace(/^\d\. /, ''));
  const reading = sectionBody(source, 'Read and discover').split(/; Q\d+/)[0];
  const practice = sectionBody(source, 'Reflect and practise');
  const week = sectionBody(source, 'Carry it into the week') || sectionBody(source, 'Continue the journey');
  return { ...source, aim, explore, reading, practice, week, faqs: faqItems(source), quotation: quotes[source.quotes[0]] };
}
