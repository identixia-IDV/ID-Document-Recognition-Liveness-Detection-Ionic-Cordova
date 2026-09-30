/**
 * Demo FP1 licenses — same keys as native DocumentReader Android / iOS Apps.
 * Bound to applicationId / bundle id below. Request a new key if you change the id.
 *
 * iOS must run as com.identixia.documentreader.app (see config.xml ios-CFBundleIdentifier).
 * Android must run as com.identixia.documentreader.
 */
import { getCordovaPlatform } from 'document-reader-cordova';


/** Android demo applicationId (config.xml android-packageName / widget id) */
export const ANDROID_APPLICATION_ID = 'com.identixia.documentreader';


/** iOS demo bundle id (config.xml ios-CFBundleIdentifier) */
export const IOS_BUNDLE_ID = 'com.identixia.documentreader.app';


const ANDROID_LICENSE =
  'pyyR2AECrdslO86QjttubhRKYJPJkY2yUVyxB8Sl3FZPQWIAAACcXtjl3U11LDEkp9Euqau6IQSeG5leKWraCqutz0r/HIv3Gxc6Y6bU7ICiG67b8344qASs5PnTyPDtG9/6L5QDkychtASXMh2qTpQeOC/P6fhJpf9mCCaSTYh1NWrlgGCyCmcAMGUCMQCyTmnLzoQfqLTNXYbJRyi3AoommNS5g2BFtjQQmWnDvKIHnCQEI+nEt1T7zxDBdNMCMHUPQ8jdH9Tx29zlkve8nWPUG2/8k/4hQmpMTBsHLp0NejIUv+nwyj+L0G3Y7dFd7A==';


const IOS_LICENSE =
  'pyyR2AECGxM88KoV67kjyUExX1uq3nOlD0x6wYmAdcdxHmEAAABH0F0Fpfsrb2kutZhsGTkFIsIlA5yVxSr7oDJ8PdaqJwG8RmkUXj/Iy7rZGrmB76Rk4/wTXtU8RYM8BB7Hfth4YcoiSugRW4gnu9BUvSuXurTLj1d5vrux8px4Zywydd+KZwAwZQIwJKDo8577/v8VeG/+tdQTAMSPt4W/PEIOvFJJSXKaCOwO4wMhoxrtvVmfrlfLwjI1AjEA3rRazlaPTM4Oi21gKYpw6B0ll5MxEyrKdKO7QbUmxwL/if8DfL8ZwBwJI85ByH8X';


/** Resolve Cordova platform; fall back to UA when platformId is not ready yet. */
export function resolveNativePlatform(): 'ios' | 'android' | 'web' {
  const p = getCordovaPlatform();
  if (p === 'ios' || p === 'android') return p;
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
    if (/Android/i.test(ua)) return 'android';
  }
  return 'web';
}


export function demoLicense(): string {
  const platform = resolveNativePlatform();
  const license = platform === 'ios' ? IOS_LICENSE : ANDROID_LICENSE;
  console.log(
    `[DocumentReader] license platform=${platform} boundId=${
      platform === 'ios' ? IOS_BUNDLE_ID : ANDROID_APPLICATION_ID
    } keyPrefix=${license.slice(0, 24)}…`
  );
  return license;
}
