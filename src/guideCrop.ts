/** Passport-ratio frame drawn on the camera overlay (125:88, 86% × 72%). */
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

export type GuidePoint = { x: number; y: number };

function roundedRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): string {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  return (
    `M${x + rr},${y} H${x + w - rr} A${rr},${rr} 0 0 1 ${x + w},${y + rr}` +
    ` V${y + h - rr} A${rr},${rr} 0 0 1 ${x + w - rr},${y + h}` +
    ` H${x + rr} A${rr},${rr} 0 0 1 ${x},${y + h - rr}` +
    ` V${y + rr} A${rr},${rr} 0 0 1 ${x + rr},${y} Z`
  );
}

/** Passport hole or locate quad, same canvas as crop. */
export function guideHolePath(
  corners: GuidePoint[] | null,
  viewW: number,
  viewH: number
): string {
  if (corners && corners.length >= 4) {
    const [a, b, c, d] = corners;
    return `M${a.x},${a.y} L${b.x},${b.y} L${c.x},${c.y} L${d.x},${d.y} Z`;
  }
  const g = passportGuideRect(viewW, viewH);
  return roundedRectPath(g.left, g.top, g.width, g.height, 16);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load capture'));
    img.src = src;
  });
}

function uprightCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  if (w > h) {
    canvas.width = h;
    canvas.height = w;
    ctx.translate(h, 0);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(img, 0, 0);
  } else {
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0);
  }
  return canvas;
}

/** Crop a live still to the on-screen guide. Returns a JPEG data URL. */
export async function cropFileToGuide(
  uri: string,
  viewW: number,
  viewH: number,
  displaySrc: (uri: string) => string | undefined
): Promise<string> {
  if (viewW <= 1 || viewH <= 1) return uri;
  try {
    const img = await loadImage(displaySrc(uri) ?? uri);
    const upright = uprightCanvas(img);
    if (upright.width < 8 || upright.height < 8) return uri;
    const guide = passportGuideRect(viewW, viewH);
    const scale = Math.max(viewW / upright.width, viewH / upright.height);
    const dx = (viewW - upright.width * scale) / 2;
    const dy = (viewH - upright.height * scale) / 2;
    let x = Math.round((guide.left - dx) / scale);
    let y = Math.round((guide.top - dy) / scale);
    let w = Math.round(guide.width / scale);
    let h = Math.round(guide.height / scale);
    x = Math.max(0, Math.min(x, upright.width - 1));
    y = Math.max(0, Math.min(y, upright.height - 1));
    w = Math.max(1, Math.min(w, upright.width - x));
    h = Math.max(1, Math.min(h, upright.height - y));
    if (w < 32 || h < 32) return uri;
    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    out.getContext('2d')?.drawImage(upright, x, y, w, h, 0, 0, w, h);
    return out.toDataURL('image/jpeg', 0.92);
  } catch {
    return uri;
  }
}
