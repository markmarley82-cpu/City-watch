// Shared, fail-closed selection for authored patrol conversations.
// Conditions describe scene facts; unknown conditions never unlock a line.
export function isEligible(entry, context) {
  if (!entry || !context || context.blocked || !context.sceneKey) return false;
  if (context.kind && entry.kind !== context.kind) return false;
  const present = new Set(context.present || []);
  if (!entry.cast?.length || !entry.cast.every(speaker => present.has(speaker))) return false;
  if (!entry.required_conditions?.every(condition => context.facts?.[condition] === true)) return false;
  if (entry.news_reference) {
    const reference = entry.news_reference;
    const publication = context.publications?.find(article =>
      article.paper === reference.paper && article.id === reference.article_id &&
      article.fingerprint === reference.headline_body_sha256 &&
      article.editionKey === context.editionKey && article.current === true);
    if (!publication || !entry.cast.every(speaker =>
      context.knowledge?.[speaker]?.includes(publication.key))) return false;
  }
  return true;
}

export function createConversationSelector(entries, { getMemory, now = Date.now, random = Math.random } = {}) {
  const bank = Array.isArray(entries) ? entries : [];
  let localMemory = {};
  function memory() {
    const value = getMemory?.() || localMemory;
    value.seen ||= {};
    value.speakerUntil ||= {};
    return value;
  }
  const key = (entry, context) => `${context.editionKey}|${context.sceneKey}|${entry.id}`;
  function available(entry, context) {
    if (!isEligible(entry, context)) return false;
    const m = memory(), time = now();
    // A conversation already heard this watch stays heard across street sections.
    if (Object.keys(m.seen).some(k => k.startsWith(`${context.editionKey}|`) && k.endsWith(`|${entry.id}`))) return false;
    if (context.ambient && (m.ambientUntil || 0) > time) return false;
    return entry.cast.every(speaker => (m.speakerUntil[speaker] || 0) <= time);
  }
  return {
    candidates(context) { return bank.filter(entry => available(entry, context)); },
    choose(context) {
      const candidates = bank.filter(entry => available(entry, context));
      // A current article gives a fresh topic when its entire contract is met.
      const news = candidates.filter(entry => entry.news_reference);
      const pool = news.length ? news : candidates;
      return pool.length ? pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))] : null;
    },
    commit(entry, context) {
      if (!available(entry, context)) return false;
      const m = memory(), time = now();
      m.seen[key(entry, context)] = time || 1;
      for (const speaker of entry.cast) m.speakerUntil[speaker] = time + (context.ambient ? 35000 : 12000);
      if (context.ambient) m.ambientUntil = time + 45000;
      // Keep only this watch-night; scene/id keys remain bounded by the bank.
      const prefix = `${context.editionKey}|`;
      for (const seenKey of Object.keys(m.seen)) if (!seenKey.startsWith(prefix)) delete m.seen[seenKey];
      return true;
    },
    isEligible
  };
}
