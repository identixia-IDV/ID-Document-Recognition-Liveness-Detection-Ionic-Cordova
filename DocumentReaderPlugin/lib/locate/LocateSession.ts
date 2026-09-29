import { getCordovaPlatform } from '../cordovaExec';
import { cropToGuide, locateDocument, takeLiveSnapshot } from '../sdkApi';
import {
  documentCorners,
  documentPercent,
  locateImageSize,
  mapCropCornersToView,
  type Point,
} from '../resultParser';

export type LocateSettings = {
  showThreshold?: number;
  highThreshold?: number;
  keepCaptureMin?: number;
  pollMs?: number;
};

export type LocateFrame = {
  scorePct: number;
  corners: Point[] | null;
  path: string;
  high: boolean;
  show: boolean;
};

export type LocateSessionOptions = {
  settings?: LocateSettings;
  onFrame: (frame: LocateFrame) => void;
  onError?: (message: string) => void;
};

const HINT_AFTER_FAILURES = 3;

/**
 * Poll native live snapshots + locateDocument (Cordova live preview).
 * Same thresholds as DocumentReader React Native LocateSession.
 */
export class LocateSession {
  readonly settings: Required<LocateSettings>;
  readonly onFrame: (frame: LocateFrame) => void;
  readonly onError?: (message: string) => void;

  viewSize = { w: 0, h: 0 };
  previewSize = { w: 0, h: 0 };

  private timer: ReturnType<typeof setInterval> | null = null;
  private locating = false;
  private stopped = false;
  private failCount = 0;

  constructor(opts: LocateSessionOptions) {
    this.settings = {
      showThreshold: opts.settings?.showThreshold ?? 50,
      highThreshold: opts.settings?.highThreshold ?? 85,
      keepCaptureMin: opts.settings?.keepCaptureMin ?? 50,
      pollMs: opts.settings?.pollMs ?? 450,
    };
    this.onFrame = opts.onFrame;
    this.onError = opts.onError;
  }

  updateViewSize(w: number, h: number): void {
    this.viewSize = { w, h };
  }

  /** Displayed preview buffer size. Unused on Android (CameraX snapshot is already cover FOV). */
  updatePreviewSize(w: number, h: number): void {
    this.previewSize = { w, h };
  }

  start(): void {
    this.stopped = false;
    if (this.timer) return;
    this.timer = setInterval(() => {
      void this.tick();
    }, this.settings.pollMs);
  }

  stop(): void {
    this.stopped = true;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  dispose(): void {
    this.stop();
  }

  private async tick(): Promise<void> {
    if (this.stopped || this.locating) return;
    this.locating = true;
    try {
      if (this.viewSize.w <= 1 || this.viewSize.h <= 1) return;
      const snap = await takeLiveSnapshot();
      const uri = snap.uri.startsWith('file://')
        ? snap.uri
        : `file://${snap.path || snap.uri}`;
      // Android CameraX analysis is already the PreviewView cover FOV.
      // iOS live frames are video-pipeline buffers — map to displayed preview.
      const android = getCordovaPlatform() === 'android';
      const previewW = android
        ? 0
        : this.previewSize.w > 1
          ? this.previewSize.w
          : snap.width ?? 0;
      const previewH = android
        ? 0
        : this.previewSize.h > 1
          ? this.previewSize.h
          : snap.height ?? 0;
      const cropped = await cropToGuide(
        uri,
        this.viewSize.w,
        this.viewSize.h,
        previewW,
        previewH
      );

      const locateJson = await locateDocument(cropped);
      const pct = documentPercent(locateJson);
      const pts = documentCorners(locateJson);
      const show = pct >= this.settings.showThreshold && pts != null;
      const high = pct >= this.settings.highThreshold;

      const imageSize = locateImageSize(locateJson);

      const mapped =
        show && pts && imageSize
          ? mapCropCornersToView(
              pts,
              imageSize.width,
              imageSize.height,
              this.viewSize.w,
              this.viewSize.h
            )
          : show && pts
            ? pts
            : null;

      this.failCount = 0;
      this.onFrame({
        scorePct: pct,
        corners: mapped,
        path: cropped,
        high,
        show,
      });
    } catch (e) {
      this.failCount += 1;
      if (this.failCount >= HINT_AFTER_FAILURES) {
        const message =
          e instanceof Error && e.message ? e.message : String(e ?? 'Camera locate failed');
        this.onError?.(message);
      }
    } finally {
      this.locating = false;
    }
  }
}
