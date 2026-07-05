// Some environments (CI containers, corporate networks) only allow outbound
// HTTPS through a proxy. Node's built-in fetch ignores HTTPS_PROXY, which
// breaks Pyodide's package downloads during `npm test`. When a proxy is
// configured, route fetch through it via undici; otherwise do nothing.
import { readFileSync } from 'node:fs';

const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;

if (proxy) {
  const { ProxyAgent, fetch: undiciFetch } = await import('undici');
  let tls;
  if (process.env.NODE_EXTRA_CA_CERTS) {
    try {
      tls = { ca: readFileSync(process.env.NODE_EXTRA_CA_CERTS, 'utf8') };
    } catch {
      // fall through with default trust store
    }
  }
  const dispatcher = new ProxyAgent({ uri: proxy, proxyTls: tls, requestTls: tls });
  globalThis.fetch = (input, init = {}) => undiciFetch(input, { dispatcher, ...init });
}
