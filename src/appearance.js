export const APPEARANCE_OPTIONS = {
  head: ['Angular', 'Broad', 'Oval', 'Round'],
  body: ['Lean', 'Broad', 'Slender', 'Sturdy'],
  eyes: ['Deep-set blue', 'Almond green', 'Hooded brown', 'Wide hazel'],
  nose: ['Straight', 'Broad', 'Aquiline', 'Rounded'],
  mouth: ['Narrow', 'Broad', 'Soft smile', 'Full'],
  hair: ['None', 'Tousled', 'Wavy', 'Braided', 'Swept back'],
  beard: ['None', 'Short', 'Forked', 'Goatee', 'Full'],
  outfit: ['Linen base', 'Belted tunic', 'Traveller', 'Mail', 'Doublet'],
  skin: ['Fair', 'Warm', 'Olive', 'Deep'],
};
export function initialAppearance(p) {
  let n = 2166136261;
  for (const c of String(p.id || p.name || 'hero')) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  const pick = (max) => {
    n = Math.imul(n ^ (n >>> 13), 1597334677);
    return (n >>> 0) % max;
  };
  const female = p.sex === 'female';
  return {
    version: 1,
    head: (female ? 2 : 0) + pick(2),
    body: (female ? 2 : 0) + pick(2),
    eyes: pick(4),
    nose: pick(4),
    mouth: pick(4),
    hair: 1 + pick(4),
    beard: female ? 0 : pick(5),
    outfit: pick(5),
    skin: pick(4),
  };
}
export function appearanceOf(p) {
  const fallback = initialAppearance(p),
    a = { ...fallback, ...p.appearance };
  for (const [key, values] of Object.entries(APPEARANCE_OPTIONS))
    if (!Number.isInteger(a[key]) || a[key] < 0 || a[key] >= values.length) a[key] = fallback[key];
  a.version = 1;
  return a;
}
export function ensureAppearance(p) {
  p.appearance = appearanceOf(p);
  return p;
}
export function setAppearancePart(p, key, value) {
  if (
    !APPEARANCE_OPTIONS[key] ||
    !Number.isInteger(value) ||
    value < 0 ||
    value >= APPEARANCE_OPTIONS[key].length
  )
    return false;
  p.appearance = { ...appearanceOf(p), [key]: value };
  return true;
}
