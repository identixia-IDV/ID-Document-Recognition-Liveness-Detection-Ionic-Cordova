/**
 * Customer process JSON: identity, readings, tests, images, session.
 * Pass-through only — does not rebuild visual / authenticity maps.
 */

export const IMAGE_QA_ORDER = [
  'focus',
  'glares',
  'resolution',
  'colorness',
  'perspective',
  'bounds',
  'portrait',
  'handwritten',
  'brightness',
  'occlusion',
];

export type DocImage = {
  name: string;
  page?: number;
  data?: string;
  id?: string;
  image?: string;
};

export type DocField = {
  name: string;
  value: string;
  origin: string;
  score?: number;
  origins?: unknown[];
  id?: string;
  source?: string;
  sources?: unknown[];
};

export type DocCheck = {
  name: string;
  group: string;
  outcome: string;
  score?: number;
  page?: number;
  note?: string;
  id?: string;
  kind?: string;
  result?: string;
  reason?: string;
};

export type DocIdent = {
  class?: string;
  country?: string;
  score?: number;
  type?: string;
};

export type DocMeta = {
  jobId?: string;
  code?: number;
  detail?: string;
  at?: string;
  status?: number;
  transactionId?: string;
  message?: string;
  timestamp?: string;
};

export type DocResult = {
  session?: DocMeta;
  identity?: DocIdent;
  readings?: DocField[];
  tests?: DocCheck[];
  images?: DocImage[];
  metadata?: DocMeta;
  document?: DocIdent;
  fields?: DocField[];
  checks?: DocCheck[];
  code?: number;
  message?: string;
  [key: string]: unknown;
};

/** Soft compatibility alias — no longer a flattened verification map. */
export type DocVerification = Record<string, unknown>;

function asObject(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function firstString(row: Record<string, unknown>, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value) return value;
    if (value != null && typeof value !== 'string') return String(value);
  }
  return fallback;
}

export function remapName(value: string): string {
  return (
    {
      surname: 'familyName',
      givenNames: 'firstNames',
      documentNumber: 'docNumber',
      hologramIntegrity: 'foilCheck',
      portrait: 'face',
    } as Record<string, string>
  )[value] ?? value;
}

export function remapOrigin(value: string): string {
  return (
    {
      ocr: 'visual',
      mrz: 'zone',
      barcode: 'code',
      rfid: 'chip',
    } as Record<string, string>
  )[value.trim().toLowerCase()] ?? value;
}

export function remapGroup(value: string): string {
  return (
    {
      verify: 'validity',
      quality: 'capture',
      security: 'authenticity',
      liveness: 'authenticity',
    } as Record<string, string>
  )[value.trim().toLowerCase()] ?? value;
}

export function remapOutcome(value: string): string {
  return value.trim().toLowerCase() === 'skip' ? 'hold' : value;
}

export function remapDetail(value: string): string {
  if (value === 'ok') return 'ready';
  if (value === 'processing failed') return 'failed';
  return value;
}

export function statusCode(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asInt(value: unknown): number | undefined {
  const n = statusCode(value);
  return n == null ? undefined : Math.trunc(n);
}

function processMeta(root: Record<string, unknown>): DocMeta {
  const raw = asObject(root.session) ?? asObject(root.metadata) ?? {};
  const code = asInt(raw.code) ?? asInt(raw.status) ?? asInt(root.code);
  const detailRaw =
    typeof raw.detail === 'string'
      ? raw.detail
      : typeof raw.message === 'string'
        ? raw.message
        : typeof root.message === 'string'
          ? root.message
          : undefined;
  const jobId =
    typeof raw.jobId === 'string'
      ? raw.jobId
      : typeof raw.transactionId === 'string'
        ? raw.transactionId
        : undefined;
  const at =
    typeof raw.at === 'string'
      ? raw.at
      : typeof raw.timestamp === 'string'
        ? raw.timestamp
        : undefined;
  const detail = detailRaw == null ? undefined : remapDetail(detailRaw);
  return {
    jobId,
    code,
    detail,
    at,
    status: code,
    transactionId: jobId,
    message: detail,
    timestamp: at,
  };
}

/** Reads tests where group == capture. */
export function extractImageQualityChecks(value: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!Array.isArray(value)) return out;
  for (const item of value) {
    const row = asObject(item);
    if (!row) continue;
    const group = remapGroup(firstString(row, ['group', 'kind']));
    if (group !== 'capture') continue;
    const id = remapName(firstString(row, ['name', 'id']));
    if (id) out[id] = row.score ?? row.outcome ?? row.result;
  }
  return out;
}

function withFieldAliases(row: DocField): DocField {
  return { ...row, id: row.name, source: row.origin, sources: row.origins };
}

function withCheckAliases(row: DocCheck): DocCheck {
  return { ...row, id: row.name, kind: row.group, result: row.outcome, reason: row.note };
}

function withImageAliases(row: DocImage): DocImage {
  return { ...row, id: row.name, image: row.data };
}

function withIdentAliases(row: DocIdent): DocIdent {
  return { ...row, type: row.class };
}

export function normalizeResult(raw: string): DocResult {
  const trimmed = raw.trim();
  if (!trimmed) return {};
  let obj: unknown;
  try {
    obj = JSON.parse(trimmed);
  } catch {
    return {};
  }
  const root = asObject(obj);
  if (!root) return {};

  const ident = asObject(root.identity) ?? asObject(root.document);
  const readings: DocField[] = [];
  const rawReadings = Array.isArray(root.readings) ? root.readings : root.fields;
  if (Array.isArray(rawReadings)) {
    for (const item of rawReadings) {
      const row = asObject(item);
      if (!row) continue;
      readings.push(
        withFieldAliases({
          name: remapName(firstString(row, ['name', 'id'])),
          value: row.value == null ? '' : String(row.value),
          origin: remapOrigin(firstString(row, ['origin', 'source'], 'field')),
          score: typeof row.score === 'number' ? row.score : undefined,
          origins: Array.isArray(row.origins)
            ? row.origins
            : Array.isArray(row.sources)
              ? row.sources
              : undefined,
        })
      );
    }
  }

  const tests: DocCheck[] = [];
  const rawTests = Array.isArray(root.tests) ? root.tests : root.checks;
  if (Array.isArray(rawTests)) {
    for (const item of rawTests) {
      const row = asObject(item);
      if (!row) continue;
      const note = firstString(row, ['note', 'reason']);
      tests.push(
        withCheckAliases({
          name: remapName(firstString(row, ['name', 'id'])),
          group: remapGroup(firstString(row, ['group', 'kind'], 'check')),
          outcome: remapOutcome(firstString(row, ['outcome', 'result'], 'hold')),
          score: typeof row.score === 'number' ? row.score : undefined,
          page: asInt(row.page),
          note: note || undefined,
        })
      );
    }
  }

  const images: DocImage[] = [];
  if (Array.isArray(root.images)) {
    for (const item of root.images) {
      const row = asObject(item);
      if (!row) continue;
      const data = typeof row.data === 'string' ? row.data : typeof row.image === 'string' ? row.image : undefined;
      images.push(
        withImageAliases({
          name: remapName(firstString(row, ['name', 'id'], 'image')),
          page: asInt(row.page),
          data,
        })
      );
    }
  }

  const known = new Set([
    'session',
    'identity',
    'readings',
    'tests',
    'images',
    'metadata',
    'code',
    'message',
    'document',
    'fields',
    'checks',
  ]);
  const extra: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(root)) {
    if (!known.has(key)) extra[key] = value;
  }

  const session = processMeta(root);
  const identity = ident
    ? withIdentAliases({
        class: typeof ident.class === 'string' ? ident.class : typeof ident.type === 'string' ? ident.type : undefined,
        country: typeof ident.country === 'string' ? ident.country : undefined,
        score: typeof ident.score === 'number' ? ident.score : undefined,
      })
    : undefined;
  return {
    session,
    identity,
    readings,
    tests,
    images,
    metadata: session,
    document: identity,
    fields: readings,
    checks: tests,
    code: session.code,
    message: session.detail,
    ...extra,
  };
}

export function normalizeResultJson(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return raw;
  try {
    JSON.parse(trimmed);
  } catch {
    return raw;
  }
  const out = normalizeResult(trimmed);
  const body: Record<string, unknown> = {};
  if (out.identity) {
    const ident: Record<string, unknown> = {};
    if (out.identity.class) ident.class = out.identity.class;
    if (out.identity.country) ident.country = out.identity.country;
    if (out.identity.score != null) ident.score = out.identity.score;
    body.identity = ident;
  }
  body.readings = (out.readings ?? []).map((row) => {
    const item: Record<string, unknown> = { name: row.name, value: row.value, origin: row.origin };
    if (row.score != null) item.score = row.score;
    if (row.origins) item.origins = row.origins;
    return item;
  });
  body.tests = (out.tests ?? []).map((row) => {
    const item: Record<string, unknown> = { name: row.name, group: row.group, outcome: row.outcome };
    if (row.score != null) item.score = row.score;
    if (row.page != null) item.page = row.page;
    if (row.note) item.note = row.note;
    return item;
  });
  body.images = (out.images ?? []).map((row) => {
    const item: Record<string, unknown> = { name: row.name };
    if (row.page != null) item.page = row.page;
    if (row.data) item.data = row.data;
    return item;
  });
  if (out.session) {
    const session: Record<string, unknown> = {};
    if (out.session.jobId) session.jobId = out.session.jobId;
    if (out.session.code != null) session.code = out.session.code;
    if (out.session.detail) session.detail = out.session.detail;
    if (out.session.at) session.at = out.session.at;
    body.session = session;
  }
  for (const [key, value] of Object.entries(out)) {
    if (
      [
        'session',
        'identity',
        'readings',
        'tests',
        'images',
        'metadata',
        'document',
        'fields',
        'checks',
        'code',
        'message',
      ].includes(key)
    ) {
      continue;
    }
    body[key] = value;
  }
  return JSON.stringify(body);
}
