// Standalone adapter candidate. This module does not modify the live game.
const frozen = x => {
  if (x && typeof x === 'object') {
    Object.values(x).forEach(frozen);
    Object.freeze(x);
  }
  return x;
};
const strings = (x,name) => {
  if (!Array.isArray(x) || x.some(v => typeof v !== 'string'))
    throw new TypeError(`${name} must be a string array`);
  return new Set(x);
};

export function createNewspapers(input) {
  const data = structuredClone(input);
  if (data.version !== 1 || !Array.isArray(data.cases) || !Array.isArray(data.articles))
    throw new TypeError('Unsupported newspaper catalog');
  const cases = new Map(data.cases.map(c => [c.caseId,c]));
  if (cases.size !== data.cases.length) throw new TypeError('Duplicate case ID');
  const papers = new Set(data.papers.map(p => p.id));
  if (papers.size !== 2 || !papers.has('times') || !papers.has('inquirer'))
    throw new TypeError('Exactly the Times and Inquirer are supported');
  const articles = new Map();
  const slots = new Set();
  for (const a of data.articles) {
    const c = cases.get(a.caseId);
    const slot = [a.paper,a.caseId,a.phase].join(':');
    if (!c || !papers.has(a.paper) || !['lead','followup'].includes(a.phase) ||
        typeof a.id !== 'string' || articles.has(a.id) || slots.has(slot) ||
        typeof a.headline !== 'string' || typeof a.body !== 'string' || a.evidence !== false)
      throw new TypeError('Invalid or duplicate article');
    const suffix = a.phase === 'lead' ? ':tip' : ':public-summary';
    if (a.publicKey !== a.caseId + suffix) throw new TypeError('Invalid publication key');
    if (a.phase === 'lead' && (!a.lead || a.lead.contactId !== c.contactId ||
        a.lead.caseId !== c.caseId || a.lead.status !== 'unverified'))
      throw new TypeError('Invalid contact referral');
    if (a.phase === 'followup' && a.lead !== null)
      throw new TypeError('Follow-up cannot create a referral');
    slots.add(slot);
    articles.set(a.id,frozen(a));
  }
  for (const c of cases.values()) {
    if (c.predecessor !== null && !cases.has(c.predecessor))
      throw new TypeError('Unknown predecessor');
    const seen = new Set([c.caseId]);
    let next = c.predecessor;
    while (next !== null) {
      if (seen.has(next) || !cases.has(next)) throw new TypeError('Invalid predecessor chain');
      seen.add(next);
      next = cases.get(next).predecessor;
    }
    for (const p of papers) for (const phase of ['lead','followup'])
      if (!slots.has([p,c.caseId,phase].join(':'))) throw new TypeError('Missing edition slot');
  }
  function context(raw={}) {
    return {
      available:strings(raw.availableCases ?? [],'availableCases'),
      closed:strings(raw.closedCases ?? [],'closedCases'),
      tips:strings(raw.publicTips ?? [],'publicTips'),
      reports:strings(raw.publicReports ?? [],'publicReports')
    };
  }
  function visible(a,cx) {
    if (cx.closed.has(a.caseId))
      return a.phase === 'followup' && cx.reports.has(a.publicKey);
    const c = cases.get(a.caseId);
    return a.phase === 'lead' && cx.available.has(a.caseId) && cx.tips.has(a.publicKey)
      && (c.predecessor === null || cx.closed.has(c.predecessor));
  }
  function state(raw) {
    if (!raw || raw.version !== 1 || !Array.isArray(raw.clippings) ||
        raw.clippings.some(id => typeof id !== 'string' || !articles.has(id)) ||
        new Set(raw.clippings).size !== raw.clippings.length)
      throw new TypeError('Invalid clipping state; explicit migration required');
    return {version:1,clippings:[...raw.clippings]};
  }
  return frozen({
    emptyState:() => ({version:1,clippings:[]}),
    restore:raw => state(raw),
    issue(paper,raw={}) {
      if (!papers.has(paper)) throw new TypeError('Unknown newspaper');
      const cx=context(raw);
      return [...articles.values()].filter(a => a.paper === paper && visible(a,cx));
    },
    clip(raw,id,cx={}) {
      const result=state(raw);
      const article=articles.get(id);
      if (!article || !visible(article,context(cx)))
        throw new RangeError('Article is not currently published');
      if (!result.clippings.includes(id)) result.clippings.push(id);
      return result;
    },
    archive(raw) {
      return state(raw).clippings.map(id => ({article:articles.get(id),historical:true}));
    },
    referral(raw,id,cx={}) {
      const saved=state(raw);
      const a=articles.get(id);
      if (!saved.clippings.includes(id) || !a?.lead || !visible(a,context(cx))) return null;
      return frozen({sourceId:a.id,caseId:a.lead.caseId,contactId:a.lead.contactId,
        status:'unverified',kind:'public-contact-referral',evidence:false});
    }
  });
}
