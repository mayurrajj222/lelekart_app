// Meta Pixel utility for safe usage in React
const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID;

export function injectMetaPixel() {
  if (typeof window === "undefined" || (window as any).fbq || !PIXEL_ID) return;

  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(
    window,
    document,
    "script",
    "https://connect.facebook.net/en_US/fbevents.js"
  );

  (window as any).fbq("init", PIXEL_ID);
  (window as any).fbq("track", "PageView");
}

export function fbq(...args: any[]) {
  if (typeof window !== "undefined" && (window as any).fbq) {
    (window as any).fbq(...args);
  }
}
