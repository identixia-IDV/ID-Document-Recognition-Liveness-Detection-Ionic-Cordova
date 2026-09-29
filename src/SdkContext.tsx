import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getMachineCode,
  getLicenseStatus,
  init,
  lastLicenseError,
  readyStatusMessage,
  setActivation,
  writeStatus,
  SDK_SUCCESS,
} from 'document-reader-cordova';
import { demoLicense } from './license';
import { whenDeviceReady } from './deviceReady';

export type SdkState = {
  status: string;
  ready: boolean;
  machine: string;
  refresh: () => void;
};

const SdkContext = createContext<SdkState | null>(null);

function statusLabel(code: number): string {
  switch (code) {
    case 0:
      return 'Ready';
    case 1:
      return 'Invalid license';
    case 2:
      return 'License expired';
    case 3:
      return 'License not activated';
    case 4:
      return 'Engine failed to start';
    default:
      return `Failed (${code})`;
  }
}

export function SdkProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState('Starting SDK…');
  const [ready, setReady] = useState(false);
  const [machine, setMachine] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setStatus('Starting SDK…');
        setReady(false);
        await whenDeviceReady();
        if (cancelled) return;
        const mc = await getMachineCode();
        console.log('[DocumentReader] machine=', mc);
        if (!cancelled) setMachine(mc);
        const license = demoLicense();
        if (!license.trim()) {
          if (!cancelled) {
            setStatus('Android demo license is empty — add the key in license.ts');
            setReady(false);
          }
          return;
        }
        const act = await setActivation(license);
        console.log('[DocumentReader] setActivation=', act);
        if (act !== SDK_SUCCESS) {
          const detail = await lastLicenseError();
          console.log('[DocumentReader] license error=', detail);
          if (!cancelled) {
            setStatus(`${statusLabel(act)}${detail ? `: ${detail}` : ''}`);
            setReady(false);
          }
          return;
        }
        const code = await init();
        console.log('[DocumentReader] init=', code);
        if (!cancelled) {
          let message = statusLabel(code);
          if (code === SDK_SUCCESS) {
            try {
              const license = await getLicenseStatus();
              message = readyStatusMessage(license.label);
            } catch {
              // keep Ready
            }
          }
          setStatus(message);
          setReady(code === SDK_SUCCESS);
          try {
            await writeStatus({
              step: 'js',
              status: message,
              ready: code === SDK_SUCCESS,
              machine: mc,
              code,
            });
          } catch {
            // ignore debug write failures
          }
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.log('[DocumentReader] init exception=', msg);
        if (!cancelled) {
          setStatus(`Init error: ${msg}`);
          setReady(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const value = useMemo(
    () => ({ status, ready, machine, refresh }),
    [status, ready, machine, refresh]
  );

  return <SdkContext.Provider value={value}>{children}</SdkContext.Provider>;
}

export function useSdk(): SdkState {
  const ctx = useContext(SdkContext);
  if (!ctx) throw new Error('useSdk must be used within SdkProvider');
  return ctx;
}
