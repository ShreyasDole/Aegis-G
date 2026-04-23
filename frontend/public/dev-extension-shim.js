/* Dev only — loaded via next/script beforeInteractive.
   Wallets inject inpage.js and reject before React mounts; Next overlay then
   GETs __nextjs_original-stack-frame?file=chrome-extension://... → 400. */
(function () {
  if (typeof window === 'undefined') return;

  function msgOf(reason) {
    if (reason == null) return '';
    if (typeof reason === 'string') return reason;
    if (reason instanceof Error) return (reason.message || '') + '\n' + (reason.stack || '');
    try {
      if (typeof reason.message === 'string') return String(reason.message) + '\n' + String(reason.stack || '');
    } catch (e) {}
    try {
      return JSON.stringify(reason);
    } catch (e2) {
      return String(reason);
    }
  }

  function isNoise(text) {
    return /metamask|ethereum|inpage|extension not found|nkbihfbeogaeaoehlefnkodbefgpgknn|walletconnect|failed to connect|receiving end does not exist|runtime\.lasterror|phantom|brave|coinbase/i.test(
      text
    );
  }

  window.addEventListener(
    'unhandledrejection',
    function (e) {
      if (isNoise(msgOf(e.reason))) e.preventDefault();
    },
    true
  );

  window.addEventListener(
    'error',
    function (e) {
      var src = e.filename || '';
      if (/chrome-extension:|moz-extension:|safari-web-extension:/i.test(src)) e.preventDefault();
    },
    true
  );

  var nativeFetch = window.fetch;
  window.fetch = function (input, init) {
    var u = '';
    try {
      if (typeof input === 'string') u = input;
      else if (input && typeof input === 'object' && typeof input.url === 'string') u = input.url;
    } catch (err) {}
    if (/__nextjs_original-stack-frame/i.test(u) && /chrome-extension|moz-extension|safari-web-extension/i.test(u)) {
      return Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }
    return nativeFetch.call(window, input, init);
  };
})();
