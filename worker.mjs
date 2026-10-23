import fs from 'node:fs/promises';
import Parser from 'rss-parser';

const parser = new Parser();
const config = JSON.parse(await fs.readFile(process.env.CONFIG_PATH || 'config/config.json', 'utf8'));
const statePath = process.env.STATE_PATH || 'data/seen.json';
const seen = JSON.parse(await fs.readFile(statePath, 'utf8').catch(() => '{}'));
const keywords = config.keywords.map(keyword => keyword.toLocaleLowerCase('fr-FR'));
const matches = [];

for (const feed of config.feeds) {
  try {
    const parsed = await parser.parseURL(feed.url);
    for (const item of (parsed.items || []).slice(0, 30)) {
      const text = `${item.title || ''} ${item.contentSnippet || item.content || ''}`.toLocaleLowerCase('fr-FR');
      const id = item.guid || item.link || `${feed.url}:${item.title}`;
      if (!seen[id] && keywords.some(keyword => text.includes(keyword))) matches.push({ ...item, source: feed.name, id });
    }
  } catch (error) { console.error(`Flux indisponible: ${feed.name}`, error.message); }
}

const message = matches.slice(0, 10).map(item => `• ${item.title}\n  ${item.link || ''}`).join('\n');
if (message && config.notifications.telegram && process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: `🔎 Veille\n\n${message}` }) });
}
if (message && config.notifications.discord && process.env.DISCORD_WEBHOOK_URL) {
  await fetch(process.env.DISCORD_WEBHOOK_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: `🔎 **Veille**\n\n${message}` }) });
}
for (const item of matches) seen[item.id] = new Date().toISOString();
await fs.mkdir('data', { recursive: true });
await fs.writeFile(statePath, JSON.stringify(seen, null, 2));
console.log(`${matches.length} nouvelle(s) alerte(s).`);
