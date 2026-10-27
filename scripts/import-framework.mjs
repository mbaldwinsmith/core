// One-time import. The separate Markdown files are the source of truth after import.
import fs from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const source = await fs.readFile(path.join(root, 'content/framework.md'), 'utf8');
const sections = [...source.matchAll(/^## (.+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)];
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const quotesSection = sections.find(x => x[1].startsWith('G4 '))[2];
const quotes = {};
for (const line of quotesSection.split('\n').filter(x => /^\| Q\d+ /.test(x))) {
  const [, id, quote, attribution] = line.split('|').map(x => x.trim());
  const url = attribution.match(/\[Source\]\((.+?)\)/)?.[1];
  quotes[id] = { id, text: quote.replace(/^“|”$/g, ''), attribution: attribution.replace(/\s*\[Source\].*$/, ''), url };
}
await fs.mkdir(path.join(root, 'content/sessions'), { recursive: true });
await fs.mkdir(path.join(root, 'content/guidance'), { recursive: true });
await fs.writeFile(path.join(root, 'content/quotes.json'), JSON.stringify(quotes, null, 2) + '\n');
const labels = {
  'Question and outcome': 'Begin with a question',
  'Essential teaching': 'Explore the faith',
  'Texts and voice': 'Read and discover',
  'Celebration and preparation': 'Signs celebration and preparation',
  'Practice and check': 'Reflect and practise',
  'During the week': 'Carry it into the week',
  'During the following month': 'Continue the journey',
};
const guideSlugs = ['purpose', 'facilitating', 'accessibility', 'sources', 'open-publishing', 'production', 'review'];
for (const section of sections) {
  if (/^G[1-7] /.test(section[1])) {
    const index = Number(section[1][1]) - 1;
    const meta = { title: section[1].slice(3), slug: guideSlugs[index], order: index + 1 };
    await fs.writeFile(path.join(root, `content/guidance/${meta.slug}.md`), `---\n${JSON.stringify(meta, null, 2)}\n---\n\n# ${meta.title}\n\n${section[2].trim()}\n`);
    continue;
  }
  const m = section[1].match(/^Session (\d+) (.+)/);
  if (!m) continue;
  const number = Number(m[1]);
  const paragraphs = section[2].trim().split(/\n\n+/);
  const fields = paragraphs.map(p => {
    const hit = p.match(/^\*\*(.+?)\.\*\*\s*([\s\S]*)/);
    return hit ? [hit[1], hit[2]] : ['', p];
  });
  const question = fields.find(x => x[0] === 'Question and outcome')[1].split('?')[0] + '?';
  const voice = fields.find(x => x[0] === 'Texts and voice')[1];
  const ids = [...new Set(voice.match(/Q\d+/g))];
  const meta = { number, title: m[2], slug: `${m[1]}-${slug(m[2])}`, part: Math.ceil(number / 6), minutes: 90, question, quotes: ids };
  let body = `# ${meta.title}\n\n`;
  for (const [label, text] of fields) {
    if (!label) { body += text + '\n\n'; continue; }
    if (label === 'FAQs') {
      body += '## Questions worth asking\n\n';
      // Split at sentence-ending answer boundaries, keeping a question and its full answer together.
      const items = text.match(/[^?]+\?[\s\S]*?(?=(?: [A-Z][^.?!]*\?)|$)/g);
      if (!items || items.length !== 3) throw new Error(`Session ${number}: expected three FAQs`);
      for (const item of items) {
        const q = item.indexOf('?');
        body += `### ${item.slice(0, q + 1).trim()}\n\n${item.slice(q + 1).trim()}\n\n`;
      }
    } else {
      body += `## ${labels[label] || label}\n\n`;
      body += label === 'Essential teaching' ? text.replace(/ ([23])\. /g, '\n\n$1. ') : text;
      body += '\n\n';
    }
  }
  const target = path.join(root, `content/sessions/${meta.slug}.md`);
  if (!process.argv.includes('--force')) {
    try { await fs.access(target); throw new Error(`Refusing to overwrite ${target}; edit Markdown directly or use --force`); }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  await fs.writeFile(target, `---\n${JSON.stringify(meta, null, 2)}\n---\n\n${body.trim()}\n`);
}
console.log('Imported 24 session sources, seven guidance pages and the quotation bank.');
