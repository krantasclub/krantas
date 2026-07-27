"use client";

import { useEffect, useRef, useState } from "react";

type FBGlobal = {
  init: (opts: { xfbml: boolean; version: string }) => void;
  XFBML: { parse: (el?: HTMLElement) => void };
};

declare global {
  interface Window {
    FB?: FBGlobal;
    fbAsyncInit?: () => void;
  }
}

let sdkPromise: Promise<void> | null = null;

// Loads connect.facebook.net's SDK exactly once per page, however many
// times this component mounts — later calls just await the same promise.
function loadFacebookSdk(): Promise<void> {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }
    if (window.FB) {
      resolve();
      return;
    }

    if (!document.getElementById("fb-root")) {
      const root = document.createElement("div");
      root.id = "fb-root";
      document.body.appendChild(root);
    }

    window.fbAsyncInit = () => {
      window.FB?.init({ xfbml: false, version: "v19.0" });
      resolve();
    };

    if (document.getElementById("facebook-jssdk")) return;

    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    document.body.appendChild(script);
  });

  return sdkPromise;
}

// Renders a public Facebook video/reel using Facebook's own `fb-video`
// XFBML widget — the method Facebook's own embed-code generator produces,
// and the most reliable way to get a Reel playing on another site. It
// still depends entirely on the post being public and the poster not
// having disabled embedding: Facebook does not expose a way to detect
// that failure from the outside (the widget just renders nothing), so
// ReelLightbox shows a permanent "Open on Facebook" link alongside this
// as a fallback rather than trying to guess when it didn't work.
export default function FacebookEmbed({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadFacebookSdk().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.FB?.XFBML.parse(containerRef.current ?? undefined);
  }, [ready, url]);

  return (
    <div ref={containerRef} className="absolute inset-0 flex items-center justify-center overflow-hidden">
      <div
        className="fb-video"
        data-href={url}
        data-width="380"
        data-show-text="false"
        data-autoplay="true"
        data-allowfullscreen="true"
      />
    </div>
  );
}
