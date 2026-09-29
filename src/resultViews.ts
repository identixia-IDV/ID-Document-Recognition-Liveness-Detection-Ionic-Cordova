/** UI-only helpers for the single-scroll Result screen. */

export type IdentityView = {
  title: string;
  status: string;
  counts: string;
  ok: boolean;
  type: string;
  country: string;
  score: string;
};
export type FieldView = { id: string; value: string; source: string };
export type CheckView = { id: string; kind: string; result: string };
export type OverallView = { kind: string; result: string };
export type FieldItemView = { id: string; value: string; score: string };
export type FieldGroupView = { source: string; items: FieldItemView[] };
export type CheckItemView = { id: string; result: string; extra: string };
export type CheckGroupView = { kind: string; items: CheckItemView[] };

const OVERALL_KINDS = ['validity', 'capture', 'authenticity'] as const;
const FIELD_SOURCE_ORDER = ['visual', 'zone', 'code'] as const;
const CHECK_RESULT_RANK: Record<string, number> = { fail: 0, pass: 1, hold: 2, skip: 2 };
const SOURCE_LABELS: Record<string, string> = { visual: 'VISUAL', zone: 'ZONE', code: 'CODE', chip: 'CHIP' };
const KIND_LABELS: Record<string, string> = {
  validity: 'Validity',
  capture: 'Capture',
  verify: 'Validity',
  quality: 'Capture',
  security: 'Liveness',
  authenticity: 'Liveness',
  liveness: 'Liveness',
};

const NAME_MAP: Record<string, string> = {
  surname: 'familyName',
  givenNames: 'firstNames',
  documentNumber: 'docNumber',
  hologramIntegrity: 'foilCheck',
  portrait: 'face',
};
const ORIGIN_MAP: Record<string, string> = { ocr: 'visual', mrz: 'zone', barcode: 'code', rfid: 'chip' };
const GROUP_MAP: Record<string, string> = {
  verify: 'validity',
  quality: 'capture',
  security: 'authenticity',
  liveness: 'authenticity',
};

export function sourceLabel(source: string): string {
  const key = String(source || '').trim().toLowerCase();
  if (SOURCE_LABELS[key]) return SOURCE_LABELS[key];
  return key ? key.toUpperCase() : 'FIELD';
}

export function kindLabel(kind: string): string {
  const key = String(kind || '').trim().toLowerCase();
  if (KIND_LABELS[key]) return KIND_LABELS[key];
  if (!key) return 'Check';
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function root(raw: string): Record<string, unknown> | null {
  try {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    return asRecord(JSON.parse(trimmed));
  } catch {
    return null;
  }
}

function firstString(row: Record<string, unknown>, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value) return value;
  }
  return fallback;
}

function documentOf(obj: Record<string, unknown>): Record<string, unknown> {
  return asRecord(obj.identity) ?? asRecord(obj.document) ?? {};
}

function readingsOf(obj: Record<string, unknown>): unknown[] {
  return Array.isArray(obj.readings) ? obj.readings : Array.isArray(obj.fields) ? obj.fields : [];
}

function testsOf(obj: Record<string, unknown>): unknown[] {
  return Array.isArray(obj.tests) ? obj.tests : Array.isArray(obj.checks) ? obj.checks : [];
}

function identClass(ident: Record<string, unknown>): string {
  return firstString(ident, ['class', 'type']);
}

function rowName(row: Record<string, unknown>): string {
  const raw = firstString(row, ['name', 'id']);
  return NAME_MAP[raw] ?? raw;
}

function rowOrigin(row: Record<string, unknown>): string {
  const raw = firstString(row, ['origin', 'source'], 'field');
  return ORIGIN_MAP[raw] ?? raw;
}

function rowGroup(row: Record<string, unknown>): string {
  const raw = firstString(row, ['group', 'kind'], 'check');
  return GROUP_MAP[raw] ?? raw;
}

function rowOutcome(row: Record<string, unknown>): string {
  const raw = firstString(row, ['outcome', 'result'], 'hold');
  return raw === 'skip' ? 'hold' : raw;
}

function rowNote(row: Record<string, unknown>): string {
  return firstString(row, ['note', 'reason']);
}

function processMeta(obj: Record<string, unknown>): { status: number | null; message: string } {
  const meta = asRecord(obj.session) ?? asRecord(obj.metadata) ?? {};
  const raw = meta.code ?? meta.status ?? obj.code;
  const status = typeof raw === 'number' ? raw : Number(raw);
  let message = firstString(meta, ['detail', 'message']);
  if (!message && typeof obj.message === 'string') message = obj.message;
  if (message === 'ok') message = 'ready';
  if (message === 'processing failed') message = 'failed';
  return { status: Number.isFinite(status) ? status : null, message };
}

function scoreText(value: unknown): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '';
  return n.toFixed(6);
}

function scoreShort(value: unknown): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(2);
}

export function identityView(raw: string): IdentityView {
  const empty: IdentityView = {
    title: '— · — · —',
    status: 'failed · status=— · —',
    counts: '0 fields · 0 checks · 0 pass · 0 fail · 0 skip',
    ok: false,
    type: '—',
    country: '—',
    score: '—',
  };
  const obj = root(raw);
  if (!obj) return empty;
  const ident = documentOf(obj);
  const type =
    identClass(ident) ||
    (typeof obj.documentName === 'string' && obj.documentName) ||
    '—';
  const country =
    (typeof ident.country === 'string' && ident.country) ||
    (typeof obj.countryName === 'string' && obj.countryName) ||
    '—';
  const score = scoreShort(ident.score ?? obj.score);
  const meta = processMeta(obj);
  const code = meta.status;
  const ok = code === 0;
  const message = meta.message.trim() ? meta.message.trim() : '—';
  const fields = readingsOf(obj);
  const checks = testsOf(obj);
  let pass = 0;
  let fail = 0;
  for (const item of checks) {
    const row = asRecord(item);
    if (!row) continue;
    const result = rowOutcome(row);
    if (result === 'pass') pass += 1;
    else if (result === 'fail') fail += 1;
  }
  const skip = Math.max(0, checks.length - pass - fail);
  return {
    title: `${type} · ${country} · ${score}`,
    status: `${ok ? 'ok' : 'failed'} · status=${code == null ? '—' : code} · ${message}`,
    counts: `${fields.length} fields · ${checks.length} checks · ${pass} pass · ${fail} fail · ${skip} skip`,
    ok,
    type,
    country,
    score,
  };
}

export function fieldViews(raw: string): FieldView[] {
  const obj = root(raw);
  if (!obj) return [];
  const out: FieldView[] = [];
  for (const item of readingsOf(obj)) {
    const row = asRecord(item);
    if (!row) continue;
    const value = row.value == null ? '' : String(row.value);
    const extra = scoreText(row.score);
    out.push({
      id: rowName(row),
      value: extra ? `${value} · ${extra}` : value,
      source: rowOrigin(row),
    });
  }
  return out.filter((r) => r.value && r.value !== 'null');
}

export function fieldGroups(raw: string): FieldGroupView[] {
  const obj = root(raw);
  if (!obj) return [];
  const buckets = new Map<string, FieldItemView[]>();
  const extra: string[] = [];
  for (const item of readingsOf(obj)) {
    const row = asRecord(item);
    if (!row) continue;
    const value = row.value == null ? '' : String(row.value);
    if (!value || value === 'null') continue;
    const source = rowOrigin(row);
    if (!buckets.has(source)) {
      buckets.set(source, []);
      if (!(FIELD_SOURCE_ORDER as readonly string[]).includes(source)) extra.push(source);
    }
    buckets.get(source)!.push({
      id: rowName(row),
      value,
      score: scoreText(row.score),
    });
  }
  const out: FieldGroupView[] = [];
  for (const source of [...FIELD_SOURCE_ORDER, ...extra]) {
    const items = buckets.get(source);
    if (items?.length) out.push({ source, items });
  }
  return out;
}

export function checkViews(raw: string): CheckView[] {
  const obj = root(raw);
  if (!obj) return [];
  const out: CheckView[] = [];
  for (const item of testsOf(obj)) {
    const row = asRecord(item);
    if (!row) continue;
    let label = rowOutcome(row);
    const extra = scoreText(row.score);
    if (extra) label += ` · ${extra}`;
    const note = rowNote(row);
    if (note) label += ` — ${note}`;
    out.push({
      id: rowName(row),
      kind: rowGroup(row),
      result: label,
    });
  }
  return out;
}

export function checkGroups(raw: string): CheckGroupView[] {
  const obj = root(raw);
  const checks = obj ? testsOf(obj) : [];
  const buckets = new Map<string, CheckItemView[]>(OVERALL_KINDS.map((k) => [k, []]));
  const extra: string[] = [];
  for (const item of checks) {
    const row = asRecord(item);
    if (!row) continue;
    const kind = rowGroup(row);
    const extraBits: string[] = [];
    const note = rowNote(row);
    if (note) extraBits.push(note);
    const score = scoreText(row.score);
    if (score) extraBits.push(score);
    if (!buckets.has(kind)) {
      buckets.set(kind, []);
      extra.push(kind);
    }
    buckets.get(kind)!.push({
      id: rowName(row),
      result: rowOutcome(row),
      extra: extraBits.join(' · '),
    });
  }
  const out: CheckGroupView[] = [];
  for (const kind of [...OVERALL_KINDS, ...extra]) {
    const items = buckets.get(kind);
    if (!items?.length) continue;
    items.sort((a, b) => (CHECK_RESULT_RANK[a.result] ?? 9) - (CHECK_RESULT_RANK[b.result] ?? 9));
    out.push({ kind, items });
  }
  return out;
}

/** Kind-level roll-up: any fail → fail, else any pass → pass, else skip. */
export function overallViews(raw: string): OverallView[] {
  const obj = root(raw);
  const checks = obj ? testsOf(obj) : [];
  return OVERALL_KINDS.map((kind) => ({
    kind,
    result: overallResult(checks, kind),
  }));
}

function overallResult(checks: unknown[], kind: string): string {
  let anyPass = false;
  for (const item of checks) {
    const row = asRecord(item);
    if (!row || rowGroup(row) !== kind) continue;
    const result = rowOutcome(row);
    if (result === 'fail') return 'fail';
    if (result === 'pass') anyPass = true;
  }
  return anyPass ? 'pass' : 'skip';
}

export function resultStatusClass(result: string): string {
  const key = result.split(/[·—]/)[0].trim().toLowerCase();
  if (key === 'pass') return 'result-pass';
  if (key === 'fail') return 'result-fail';
  return 'result-skip';
}

export function basename(uri: string): string {
  const clean = uri.split('?')[0];
  const parts = clean.split(/[/\\]/);
  return parts[parts.length - 1] || uri;
}
