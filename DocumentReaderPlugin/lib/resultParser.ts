/** Maps customer process JSON into UI fields. */

import { normalizeResult } from './normalizeResult';

export type FieldRow = { key: string; value: string; source: string };

export type ResultImage = {
  category: string;
  source: string;
  uri: string;
};

export type SecurityRow = { page: string; check: string; status: string };

export type Point = { x: number; y: number };

const LONG_VALUE = 300;

function jsonObject(raw: string): Record<string, unknown> | null {
  try {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const normalized = normalizeResult(trimmed);
    return Object.keys(normalized).length ? normalized : null;
  } catch {
    return null;
  }
}

function summarizeLong(value: string): string {
  let type = 'string';
  if (value.startsWith('/9j/') || value.startsWith('data:image/jpeg'))
    type = 'jpeg';
  else if (value.startsWith('iVBOR') || value.startsWith('data:image/png'))
    type = 'png';
  else if (value.startsWith('R0lGOD') || value.startsWith('data:image/gif'))
    type = 'gif';
  else if (value.startsWith('Qk') && value.length > 100) type = 'bmp';
  else if (/^[A-Za-z0-9+/=]+$/.test(value)) type = 'base64';
  return `${type}, ${value.length} chars`;
}

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitize(v);
    }
    return out;
  }
  if (typeof value === 'string' && value.length > LONG_VALUE) {
    return summarizeLong(value);
  }
  return value;
}

export function pretty(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '(empty response)';
  try {
    return JSON.stringify(sanitize(normalizeResult(trimmed)), null, 2);
  } catch {
    return summarizeLong(trimmed);
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}


function processMeta(obj: Record<string, unknown>): { status: number | null; message: string } {
  const meta = asRecord(obj.session) ?? asRecord(obj.metadata) ?? {};
  const raw = meta.code ?? meta.status ?? obj.code;
  const status = typeof raw === 'number' ? raw : Number(raw);
  const message =
    typeof meta.detail === 'string' && meta.detail
      ? meta.detail
      : typeof meta.message === 'string' && meta.message
        ? meta.message
        : typeof obj.message === 'string'
          ? obj.message
          : '';
  return { status: Number.isFinite(status) ? status : null, message };
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
  if (typeof ident.class === 'string' && ident.class) return ident.class;
  if (typeof ident.type === 'string' && ident.type) return ident.type;
  return '';
}

function rowName(row: Record<string, unknown>): string {
  if (typeof row.name === 'string' && row.name) return row.name;
  return typeof row.id === 'string' ? row.id : '';
}

function rowOrigin(row: Record<string, unknown>): string {
  if (typeof row.origin === 'string' && row.origin) return row.origin;
  return typeof row.source === 'string' ? row.source : 'field';
}

function rowGroup(row: Record<string, unknown>): string {
  if (typeof row.group === 'string' && row.group) return row.group;
  return typeof row.kind === 'string' ? row.kind : 'check';
}

function rowOutcome(row: Record<string, unknown>): string {
  if (typeof row.outcome === 'string' && row.outcome) return row.outcome;
  return typeof row.result === 'string' ? row.result : 'hold';
}

function rowNote(row: Record<string, unknown>): string {
  if (typeof row.note === 'string') return row.note;
  return typeof row.reason === 'string' ? row.reason : '';
}

function rowImageName(row: Record<string, unknown>): string {
  if (typeof row.name === 'string' && row.name) return row.name;
  return typeof row.id === 'string' && row.id ? row.id : 'image';
}

function rowImageData(row: Record<string, unknown>): string {
  if (typeof row.data === 'string') return row.data;
  return typeof row.image === 'string' ? row.image : '';
}

function scoreText(value: unknown): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '';
  return n.toFixed(6);
}

function pageSide(value: unknown): string {
  const n = Number(value);
  const idx = Number.isFinite(n) ? n : 0;
  if (idx === 0) return 'Front';
  if (idx === 1) return 'Back';
  return `Page ${idx}`;
}

export function summary(raw: string): string {
  const obj = jsonObject(raw);
  if (!obj) return raw.slice(0, 200);
  if (typeof obj.msg === 'string') return obj.msg;
  const ident = documentOf(obj);
  const meta = processMeta(obj);
  const code = meta.status ?? 0;
  const message = meta.message;
  const score = scoreText(ident.score) || '—';
  return [
    `${code === 0 ? 'ok' : 'failed'} · status=${code}${message ? ` · ${message}` : ''}`,
    `${identClass(ident) || '—'} · ${typeof ident.country === 'string' && ident.country ? ident.country : '—'}`,
    `score: ${score}`,
  ].join('\n');
}

export type IdentityLine = {
  title: string;
  status: string;
  counts: string;
  ok: boolean;
};

export type OverallResult = { kind: string; result: string };

export type FieldItem = { id: string; value: string; score: string };
export type FieldGroup = { source: string; items: FieldItem[] };
export type CheckItem = { id: string; result: string; extra: string };
export type CheckGroup = { kind: string; items: CheckItem[] };

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

/** Same three-line card as the web `ix-ident` block. */
export function identityLine(raw: string): IdentityLine {
  const empty: IdentityLine = {
    title: '— · — · —',
    status: 'failed · status=— · —',
    counts: '0 fields · 0 checks · 0 pass · 0 fail · 0 skip',
    ok: false,
  };
  const obj = jsonObject(raw);
  if (!obj) return empty;
  const stats = identity(raw);
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
    title: `${stats.type} · ${stats.country} · ${stats.score}`,
    status: `${ok ? 'ok' : 'failed'} · status=${code == null ? '—' : code} · ${message}`,
    counts: `${fields.length} fields · ${checks.length} checks · ${pass} pass · ${fail} fail · ${skip} skip`,
    ok,
  };
}

/** Kind-level roll-up: any fail → fail, else any pass → pass, else skip. */
export function overallResults(raw: string): OverallResult[] {
  const obj = jsonObject(raw);
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

export function identity(raw: string): { type: string; country: string; score: string } {
  const obj = jsonObject(raw);
  if (!obj) return { type: '—', country: '—', score: '—' };
  const ident = documentOf(obj);
  const n = typeof ident.score === 'number' ? ident.score : Number(ident.score);
  return {
    type: identClass(ident) || '—',
    country: typeof ident.country === 'string' && ident.country ? ident.country : '—',
    score: Number.isFinite(n) ? n.toFixed(2) : '—',
  };
}

export function fieldGroups(raw: string): FieldGroup[] {
  const obj = jsonObject(raw);
  if (!obj) return [];
  const buckets = new Map<string, FieldItem[]>();
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
  const out: FieldGroup[] = [];
  for (const source of [...FIELD_SOURCE_ORDER, ...extra]) {
    const items = buckets.get(source);
    if (items?.length) out.push({ source, items });
  }
  return out;
}

export function checkGroups(raw: string): CheckGroup[] {
  const obj = jsonObject(raw);
  const checks = obj ? testsOf(obj) : [];
  const buckets = new Map<string, CheckItem[]>(OVERALL_KINDS.map((k) => [k, []]));
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
  const out: CheckGroup[] = [];
  for (const kind of [...OVERALL_KINDS, ...extra]) {
    const items = buckets.get(kind);
    if (!items?.length) continue;
    items.sort((a, b) => (CHECK_RESULT_RANK[a.result] ?? 9) - (CHECK_RESULT_RANK[b.result] ?? 9));
    out.push({ kind, items });
  }
  return out;
}

export function fieldRows(raw: string): FieldRow[] {
  const obj = jsonObject(raw);
  if (!obj) return [];
  const out: FieldRow[] = [];
  for (const item of readingsOf(obj)) {
    const row = asRecord(item);
    if (!row) continue;
    const value = row.value == null ? '' : String(row.value);
    const extra = scoreText(row.score);
    out.push({
      key: rowName(row),
      value: extra ? `${value} · ${extra}` : value,
      source: rowOrigin(row),
    });
  }
  return out.filter((r) => r.value && r.value !== 'null');
}

export function checkRows(raw: string): SecurityRow[] {
  const obj = jsonObject(raw);
  if (!obj) return [];
  const out: SecurityRow[] = [];
  for (const item of testsOf(obj)) {
    const row = asRecord(item);
    if (!row) continue;
    let label = rowOutcome(row);
    const extra = scoreText(row.score);
    if (extra) label += ` · ${extra}`;
    const note = rowNote(row);
    if (note) label += ` — ${note}`;
    out.push({
      page: rowGroup(row),
      check: rowName(row),
      status: label,
    });
  }
  return out;
}

export function rows(raw: string): FieldRow[] {
  const obj = jsonObject(raw);
  if (!obj) return [];
  const ident = documentOf(obj);
  const out: FieldRow[] = [];
  if (identClass(ident)) {
    out.push({ key: 'class', value: identClass(ident), source: 'identity' });
  }
  if (typeof ident.country === 'string' && ident.country) {
    out.push({ key: 'country', value: ident.country, source: 'identity' });
  }
  const score = scoreText(ident.score);
  if (score) out.push({ key: 'score', value: score, source: 'identity' });
  for (const item of readingsOf(obj)) {
    const row = asRecord(item);
    if (!row) continue;
    const value = row.value == null ? '' : String(row.value);
    const extra = scoreText(row.score);
    out.push({
      key: rowName(row),
      value: extra ? `${value} · ${extra}` : value,
      source: rowOrigin(row),
    });
  }
  for (const item of testsOf(obj)) {
    const row = asRecord(item);
    if (!row || rowGroup(row) === 'authenticity') continue;
    let label = rowOutcome(row);
    const extra = scoreText(row.score);
    if (extra) label += ` · ${extra}`;
    const note = rowNote(row);
    if (note) label += ` — ${note}`;
    out.push({
      key: rowName(row),
      value: label,
      source: rowGroup(row),
    });
  }
  return out.filter((r) => r.value && r.value !== 'null');
}

export function images(raw: string): ResultImage[] {
  const obj = jsonObject(raw);
  if (!obj || !Array.isArray(obj.images)) return [];
  const out: ResultImage[] = [];
  const seen = new Set<string>();
  for (const item of obj.images) {
    const d = asRecord(item);
    if (!d) continue;
    const b64 = rowImageData(d);
    if (b64.length < 32) continue;
    const id = rowImageName(d);
    const key = `${id}|${b64.length}:${b64.slice(0, 48)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const payload = b64.includes('base64,')
      ? b64.slice(b64.indexOf('base64,') + 7)
      : b64;
    const mime = b64.startsWith('iVBOR') ? 'image/png' : 'image/jpeg';
    const page = d.page != null ? ` (page ${d.page})` : '';
    out.push({
      category: `${id}${page}`,
      source: '',
      uri: `data:${mime};base64,${payload}`,
    });
  }
  return out;
}

export function documentPercent(raw: string): number {
  const obj = jsonObject(raw);
  if (!obj) return 0;
  const ident = documentOf(obj);
  const rawScore = ident.score ?? obj.score;
  if (rawScore == null) return 0;
  const s = Number(rawScore);
  if (!Number.isFinite(s)) return 0;
  const pct = s <= 1.0 ? s * 100.0 : s;
  return Math.max(0, Math.min(100, Math.trunc(pct)));
}

export function uprightSnapshotSize(
  width: number,
  height: number,
  orientation?: string
): { width: number; height: number } {
  if (width > height) {
    return { width: height, height: width };
  }
  const o = orientation ?? 'portrait';
  if (o === 'landscape-left' || o === 'landscape-right') {
    return { width: height, height: width };
  }
  return { width, height };
}

export function mappingImageSize(
  imageW: number,
  imageH: number,
  preview?: { width: number; height: number } | null
): { width: number; height: number } {
  if (!preview || preview.width <= 1 || preview.height <= 1) {
    return { width: imageW, height: imageH };
  }
  const displayed =
    preview.width > preview.height
      ? { width: preview.height, height: preview.width }
      : preview;
  const displayAspect = displayed.width / displayed.height;
  const imageAspect = imageW / imageH;
  if (Math.abs(displayAspect - imageAspect) < 0.01) {
    return { width: imageW, height: imageH };
  }
  if (displayAspect > imageAspect) {
    return { width: imageW, height: imageW / displayAspect };
  }
  return { width: imageH * displayAspect, height: imageH };
}

/** Guide crop in still pixels: preview-FOV slice, then overlay fraction of cover-visible. */
export function cropRectForGuide(
  viewW: number,
  viewH: number,
  imageW: number,
  imageH: number,
  preview?: { width: number; height: number } | null
) {
  if (viewW <= 1 || viewH <= 1 || imageW < 8 || imageH < 8) {
    return { left: 0, top: 0, width: 0, height: 0 };
  }
  const map = mappingImageSize(imageW, imageH, preview);
  const mapW = Math.max(1, Math.min(imageW, Math.round(map.width)));
  const mapH = Math.max(1, Math.min(imageH, Math.round(map.height)));
  const ox = (imageW - mapW) / 2;
  const oy = (imageH - mapH) / 2;
  const guide = passportGuideRect(viewW, viewH);
  const visible = mapViewRectToImage(
    { left: 0, top: 0, width: viewW, height: viewH },
    viewW,
    viewH,
    mapW,
    mapH
  );
  const left = visible.left + visible.width * (guide.left / viewW);
  const top = visible.top + visible.height * (guide.top / viewH);
  const right = left + visible.width * (guide.width / viewW);
  const bottom = top + visible.height * (guide.height / viewH);
  const x0 = Math.max(0, Math.min(left + ox, imageW - 1));
  const y0 = Math.max(0, Math.min(top + oy, imageH - 1));
  const x1 = Math.max(x0 + 1, Math.min(right + ox, imageW));
  const y1 = Math.max(y0 + 1, Math.min(bottom + oy, imageH));
  return { left: x0, top: y0, width: x1 - x0, height: y1 - y0 };
}

export function locateImageSize(
  raw: string
): { width: number; height: number } | null {
  const obj = jsonObject(raw);
  if (!obj) return null;
  const w = Number(obj._locateImageWidth);
  const h = Number(obj._locateImageHeight);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    return null;
  }
  return { width: w, height: h };
}

export function passportGuideRect(viewW: number, viewH: number) {
  if (viewW <= 0 || viewH <= 0) {
    return { left: 0, top: 0, width: 0, height: 0 };
  }
  const ratio = 125 / 88;
  let fw = viewW * 0.86;
  let fh = fw / ratio;
  if (fh > viewH * 0.72) {
    fh = viewH * 0.72;
    fw = fh * ratio;
  }
  return {
    left: (viewW - fw) / 2,
    top: (viewH - fh) / 2,
    width: fw,
    height: fh,
  };
}

/** Map locate corners from a guide-cropped still onto the on-screen rectangle. */
export function mapCropCornersToView(
  corners: Point[],
  imageW: number,
  imageH: number,
  viewW: number,
  viewH: number
): Point[] | null {
  const guide = passportGuideRect(viewW, viewH);
  if (
    corners.length < 4 ||
    imageW <= 1 ||
    imageH <= 1 ||
    guide.width <= 1 ||
    guide.height <= 1
  ) {
    return null;
  }
  return corners.map((c) => ({
    x: guide.left + (c.x * guide.width) / imageW,
    y: guide.top + ((imageH - c.y) * guide.height) / imageH,
  }));
}

export function mapViewRectToImage(
  rect: { left: number; top: number; width: number; height: number },
  viewW: number,
  viewH: number,
  imageW: number,
  imageH: number
) {
  const scale = Math.max(viewW / imageW, viewH / imageH);
  const dx = (viewW - imageW * scale) / 2;
  const dy = (viewH - imageH * scale) / 2;
  const left = Math.max(0, Math.min(Math.round((rect.left - dx) / scale), imageW - 1));
  const top = Math.max(0, Math.min(Math.round((rect.top - dy) / scale), imageH - 1));
  const right = Math.max(left + 1, Math.min(Math.round((rect.left + rect.width - dx) / scale), imageW));
  const bottom = Math.max(top + 1, Math.min(Math.round((rect.top + rect.height - dy) / scale), imageH));
  return { left, top, width: right - left, height: bottom - top };
}

export function mapUprightCornersToView(
  corners: Point[],
  imageW: number,
  imageH: number,
  viewW: number,
  viewH: number
): Point[] | null {
  if (
    corners.length < 4 ||
    imageW <= 1 ||
    imageH <= 1 ||
    viewW <= 1 ||
    viewH <= 1
  ) {
    return null;
  }
  const scale = Math.max(viewW / imageW, viewH / imageH);
  const dx = (viewW - imageW * scale) / 2;
  const dy = (viewH - imageH * scale) / 2;
  return corners.map((c) => ({
    x: c.x * scale + dx,
    y: (imageH - c.y) * scale + dy,
  }));
}

export function documentCorners(raw: string): Point[] | null {
  const obj = jsonObject(raw);
  if (!obj || !obj.position || typeof obj.position !== 'object') return null;
  const pos = obj.position as Record<string, unknown>;
  if (Array.isArray(pos.corners) && pos.corners.length >= 4) {
    const out: Point[] = [];
    for (let i = 0; i < 4; i++) {
      const p = pos.corners[i] as Record<string, unknown>;
      const x = Number(p?.x);
      const y = Number(p?.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
      out.push({ x, y });
    }
    return out;
  }
  const l = Number(pos.left);
  const t = Number(pos.top);
  const r = Number(pos.right);
  const b = Number(pos.bottom);
  if (![l, t, r, b].every(Number.isFinite) || r <= l || b <= t) return null;
  return [
    { x: l, y: t },
    { x: r, y: t },
    { x: r, y: b },
    { x: l, y: b },
  ];
}

export function securitySummary(raw: string): string {
  const obj = jsonObject(raw);
  if (!obj) {
    return 'No liveness checks in this response. If you expected checks, this license may not include liveness.';
  }
  let pass = 0;
  let fail = 0;
  let skip = 0;
  let any = false;
  for (const item of testsOf(obj)) {
    const row = asRecord(item);
    if (!row || rowGroup(row) !== 'authenticity') continue;
    any = true;
    const result = rowOutcome(row);
    if (result === 'pass') pass += 1;
    else if (result === 'fail') fail += 1;
    else skip += 1;
  }
  if (!any) {
    return 'No liveness checks in this response. If you expected checks, this license may not include liveness.';
  }
  const ident = documentOf(obj);
  const title = identClass(ident) || 'Document';
  return `${title}\n${pass} pass · ${fail} fail · ${skip} skip`;
}

export function securityRows(raw: string): SecurityRow[] {
  const obj = jsonObject(raw);
  if (!obj) return [];
  const out: SecurityRow[] = [];
  for (const item of testsOf(obj)) {
    const row = asRecord(item);
    if (!row || rowGroup(row) !== 'authenticity') continue;
    let label = rowOutcome(row);
    const extra = scoreText(row.score);
    if (extra) label += ` · ${extra}`;
    out.push({
      page: pageSide(row.page ?? 0),
      check: rowName(row),
      status: label,
    });
  }
  return out;
}
