(function () {
  'use strict';

  const PLUGIN_ID = 'open-external-player-for-stash';

  // Defaults for your environment; can be overridden via plugin settings
  const DEFAULT_SERVER_PREFIX = "/video";
  const DEFAULT_CLIENT_PREFIX = "file:///Volumes/utatane/video";

  // --- Minimal utilities (no external lib) ---
  function getElementByXpath(xpath, contextNode) {
    return document.evaluate(xpath, contextNode || document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
  }
  function waitForElementByXpath(xpath, cb, time) {
    time = typeof time !== 'undefined' ? time : 150;
    const el = getElementByXpath(xpath);
    if (el) {
      cb(xpath, el);
    } else {
      setTimeout(() => waitForElementByXpath(xpath, cb, time), time);
    }
  }
  function onRouteChange(handler) {
    let last = location.href;
    setInterval(() => {
      const now = location.href;
      if (now !== last) {
        last = now;
        handler();
      }
    }, 200);
  }
  async function callGQL(reqData) {
    const res = await fetch('/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqData)
    });
    return res.json();
  }
  async function getPluginConfig(pluginId) {
    try {
      const reqData = {
        operationName: 'Configuration',
        variables: {},
        query: `query Configuration { configuration { plugins } }`
      };
      const data = await callGQL(reqData);
      return data?.data?.configuration?.plugins?.[pluginId] || {};
    } catch (_) {
      return {};
    }
  }

  // --- Path mapping and IINA open ---
  function normalizeServerPathFromHref(href) {
    try {
      // If it's a file:// URL, parse and decode
      if (href.startsWith('file:')) {
        const u = new URL(href);
        // If host present (e.g., file://server/path), pathname is "/path"
        return decodeURI(u.pathname);
      }
      // If it's already a plain path
      if (href.startsWith('/')) return href;
      // Fallback: decode any percent-encoding and return as-is
      return decodeURI(href);
    } catch (e) {
      // As a last resort, return original
      return href;
    }
  }

  function mapServerToClientPath(serverPath, serverPrefix, clientPrefix) {
    const sPref = (serverPrefix || '').replace(/\/$/, '');
    const cPref = (clientPrefix || '').replace(/\/$/, '');
    let mapped = serverPath;
    if (sPref && serverPath.startsWith(sPref)) {
      const rel = serverPath.substring(sPref.length).replace(/^\//, '');
      mapped = cPref ? (cPref + '/' + rel) : serverPath;
    }
    return mapped;
  }

  function openWithIINA(urlOrPath) {
    const iinaUrl = 'iina://open?url=' + encodeURIComponent(urlOrPath);
    // Try direct navigation first (more reliable on some browsers)
    const navTimer = setTimeout(() => {
      // Fallback via hidden iframe (in case navigation was blocked)
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = iinaUrl;
      document.body.appendChild(iframe);
      setTimeout(() => { try { document.body.removeChild(iframe); } catch (_) {} }, 1000);
    }, 100);
    try {
      window.location.href = iinaUrl;
    } catch (_) {
      // ignore, fallback above will attempt
    }
    // Clear timer if navigation succeeds (best-effort)
    setTimeout(() => clearTimeout(navTimer), 120);
  }

  async function handleOpenInIINA(rawHref) {
    const settings = await getPluginConfig(PLUGIN_ID);
    const serverPrefix = (settings?.pathPrefixServer || DEFAULT_SERVER_PREFIX).trim();
    const clientPrefix = (settings?.pathPrefixClient || DEFAULT_CLIENT_PREFIX).trim();

    const serverPath = normalizeServerPathFromHref(rawHref);
    const clientURL = mapServerToClientPath(serverPath, serverPrefix, clientPrefix);
    openWithIINA(clientURL);
  }

  function attachHandler() {
    waitForElementByXpath("//dt[text()='Path']/following-sibling::dd/a", function (_x, a) {
      if (a && !a.classList.contains('open-in-iina')) {
        a.classList.add('open-in-iina');
        a.addEventListener('click', async function (evt) {
          try { evt.preventDefault(); evt.stopPropagation(); } catch (_) {}
          await handleOpenInIINA(a.href);
        });
      }
    });
  }

  // Initial attach and on route changes
  attachHandler();
  onRouteChange(() => attachHandler());
})();
