import { performance } from 'node:perf_hooks';
import { newCampaign } from '../src/campaign.js';
import { createPerson } from '../src/core.js';
import { createBattle, tickBattle } from '../src/battle.js';
const s = newCampaign('benchmark');
for (let i = 1; i < 1000; i++) s.party.push(createPerson(s, i % 4 ? 'spearman' : 'archer'));
const b = createBattle(s, { id: 'benchmark', count: 1000 });
b.phase = 'battle';
b.paused = false;
for (const f of Object.values(b.formations)) f.stance = 'charge';
const samples = [];
for (let i = 0; i < 450; i++) {
  const t = performance.now();
  tickBattle(b, 1 / 30);
  samples.push(performance.now() - t);
}
samples.sort((a, b) => a - b);
console.log(
  JSON.stringify(
    {
      soldiers: 2000,
      ticks: samples.length,
      simulatedSeconds: b.time,
      medianMs: +samples[Math.floor(samples.length * 0.5)].toFixed(2),
      p95Ms: +samples[Math.floor(samples.length * 0.95)].toFixed(2),
      maxMs: +samples.at(-1).toFixed(2),
      note: 'Node simulation benchmark only; not a browser frame-rate guarantee.',
    },
    null,
    2,
  ),
);
