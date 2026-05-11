import { useEffect } from "react";

// Bumps the document root font-size while mounted, so the big-screen view
// (which sizes everything in rem) reads larger on TV-class displays.
// Stepped: ≥1900px → 1.20×, ≥2540px → 1.25×. Restores on unmount.
// Thresholds sit slightly below 1920/2560 because browser chrome shaves
// innerWidth on real monitors (a 1920px screen often reports ~1903).
export function useBigScreenZoom() {
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.fontSize;
    const update = () => {
      const w = window.innerWidth;
      if (w >= 2540) html.style.fontSize = "20px";
      else if (w >= 1900) html.style.fontSize = "19.2px";
      else html.style.fontSize = "";
    };
    update();
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      html.style.fontSize = prev;
    };
  }, []);
}
