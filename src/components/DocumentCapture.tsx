import { useCallback, useEffect, useRef, useState } from 'react';
import { IonSpinner } from '@ionic/react';
import {
  LocateSession,
  recognize,
  startLivePreview,
  stopLivePreview,
  type Point,
} from 'document-reader-cordova';
import { ensureCameraPermission } from '../cameraPermission';
import { guideHolePath } from '../guideCrop';
import { displayUri } from '../pickImage';

export type DocumentCaptureProps = {
  onRecognized: (json: string) => void;
  onCancel?: () => void;
  authenticity?: boolean | string;
};

/** Live locate + Capture → recognize (native preview under transparent WebView). */
export default function DocumentCapture({
  onRecognized,
  onCancel,
  authenticity,
}: DocumentCaptureProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<LocateSession | null>(null);
  const latestUri = useRef<string | null>(null);
  const [scorePct, setScorePct] = useState(0);
  const [corners, setCorners] = useState<Point[] | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [size, setSize] = useState({ w: 0, h: 0 });
  // TEMPORARY CROP PREVIEW — start
  // Delete only this block when asked to "Delete temporary preview".
  const [cropPreviewUri, setCropPreviewUri] = useState<string | null>(null);
  // TEMPORARY CROP PREVIEW — end

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      setSize({ w, h });
      sessionRef.current?.updateViewSize(w, h);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        document.documentElement.classList.add('frs-live-camera');
        await ensureCameraPermission();
        await startLivePreview(false);
        if (cancelled) {
          await stopLivePreview().catch(() => undefined);
          return;
        }
        const session = new LocateSession({
          onFrame: (frame) => {
            setError('');
            setScorePct(frame.scorePct);
            setCorners(frame.corners);
            setEnabled(frame.scorePct >= 50);
            if (frame.scorePct >= 50) {
              latestUri.current = frame.path;
              // TEMPORARY CROP PREVIEW — start
              // Delete only this line when asked to "Delete temporary preview".
              setCropPreviewUri(displayUri(frame.path) ?? frame.path);
              // TEMPORARY CROP PREVIEW — end
            }
          },
          onError: (message) => {
            setEnabled(false);
            setError(message);
          },
        });
        const el = stageRef.current;
        const w = el?.clientWidth || 0;
        const h = el?.clientHeight || 0;
        session.updateViewSize(w, h);
        setSize({ w, h });
        sessionRef.current = session;
        session.start();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
      document.documentElement.classList.remove('frs-live-camera');
      sessionRef.current?.dispose();
      sessionRef.current = null;
      void stopLivePreview().catch(() => undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCapture = useCallback(async () => {
    if (busy || !latestUri.current) return;
    setBusy(true);
    setError('');
    try {
      sessionRef.current?.stop();
      await stopLivePreview().catch(() => undefined);
      const json = await recognize(
        latestUri.current,
        null,
        authenticity ?? true
      );
      onRecognized(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      try {
        await startLivePreview(false);
        sessionRef.current?.start();
      } catch {
        // ignore restart failures
      }
    } finally {
      setBusy(false);
    }
  }, [busy, authenticity, onRecognized]);

  const locked = scorePct >= 85 && corners != null && corners.length >= 4;
  const hole = guideHolePath(corners, size.w, size.h);
  const dim = size.w > 1 && size.h > 1 ? `M0,0 H${size.w} V${size.h} H0 Z ${hole}` : '';

  return (
    <div className="live-page doc-capture" ref={stageRef}>
      <div className="cam-top-bar">
        {onCancel ? (
          <button type="button" className="cam-close" onClick={onCancel} disabled={busy}>
            Close
          </button>
        ) : (
          <span />
        )}
      </div>

      {dim ? (
        <svg
          className="doc-overlay-svg"
          width={size.w}
          height={size.h}
          viewBox={`0 0 ${size.w} ${size.h}`}
          aria-hidden="true"
        >
          <path d={dim} fill="#CCE6E9EF" fillRule="evenodd" />
          <path
            d={hole}
            fill="none"
            stroke={locked ? '#0F766E' : '#5A6573'}
            strokeWidth={locked ? 8 : 5}
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
      <div className="cam-stage">
        <div className={`cam-score ${enabled ? 'ready' : ''}`}>
          {Math.round(scorePct)}%
        </div>
      </div>

      {/* TEMPORARY CROP PREVIEW — start
          Delete only this block when asked to "Delete temporary preview". */}
      {cropPreviewUri ? (
        <div className="tmp-crop-preview" aria-hidden="true">
          <span>Crop preview (temporary)</span>
          <img src={cropPreviewUri} alt="" />
        </div>
      ) : null}
      {/* TEMPORARY CROP PREVIEW — end */}
      <p className="cam-hint">Align the document inside the frame</p>
      {error && <p className="cam-error">{error}</p>}

      <button
        type="button"
        className="cam-capture-bar"
        disabled={!enabled || busy}
        onClick={() => void onCapture()}
      >
        {busy ? <IonSpinner name="crescent" /> : 'Capture'}
      </button>
    </div>
  );
}
