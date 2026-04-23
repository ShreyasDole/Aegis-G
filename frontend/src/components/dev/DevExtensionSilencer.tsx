'use client';

import { useEffect } from 'react';

function isExtensionNoise(msg: string, stack?: string): boolean {
  const blob = `${msg}\n${stack ?? ''}`;
  return (
    /metamask|ethereum|inpage\.js|failed to connect|extension not found|nkbihfbeogaeaoehlefnkodbefgpgknn|wallet|coinbase wallet|phantom|brave wallet|okx wallet|rainbow/i.test(
      blob
    ) ||
    /chrome-extension:|moz-extension:|safari-web-extension:/i.test(blob) ||
    /runtime\.lastError|receiving end does not exist/i.test(blob)
  );
}

/**
 * Dev-only: wallet / extension scripts inject into every page and throw
 * (MetaMask when missing, SES lockdown logs, etc.). That is not Aegis-G.
 * Swallow those rejections so Next dev overlay does not spam __nextjs_original-stack-frame 400s.
 */
export function DevExtensionSilencer() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const onUnhandledRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason;
      const msg = r instanceof Error ? r.message : String(r);
      const stack = r instanceof Error ? r.stack : undefined;
      if (isExtensionNoise(msg, stack)) {
        e.preventDefault();
      }
    };

    const onError = (e: ErrorEvent) => {
      const src = e.filename ?? '';
      if (/chrome-extension:|moz-extension:|safari-web-extension:/i.test(src)) {
        e.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', onUnhandledRejection);
    window.addEventListener('error', onError);
    return () => {
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
      window.removeEventListener('error', onError);
    };
  }, []);

  return null;
}
