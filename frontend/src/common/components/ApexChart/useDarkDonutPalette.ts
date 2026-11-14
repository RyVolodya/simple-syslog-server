import { useEffect, useState } from "react";

// Follow the existing data-theme attribute without changing the application's theme.
export const useDarkDonutPalette = (): boolean => {
  const isDark = () => document.documentElement.getAttribute("data-theme") === "dark";
  const [dark, setDark] = useState(isDark);
  useEffect(() => {
    const observer = new MutationObserver(() => setDark(isDark()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  return dark;
};

// Paired by index: the same ranked device keeps its hue across themes.
// Index 0 is always the highest-message device (blue / light blue).
export const DARK_DONUT_COLORS = [
  "#1d4ed8", // 1 blue
  "#b91c1c", // 2 red
  "#15803d", // 3 green
  "#7e22ce", // 4 purple
  "#c2410c", // 5 orange
  "#be185d", // 6 pink
  "#0f766e", // 7 teal
  "#a16207", // 8 amber
  "#4338ca", // 9 indigo
  "#334155", // 10 slate
  "#64748b", // Other devices (neutral)
];

// Pastel colors for dark UI, paired with the darker light-theme palette.
// Keep the index order: highest message count first.
export const LIGHT_DONUT_COLORS = [
  "#66c7ff", // 1 sky blue
  "#ff8585", // 2 soft red
  "#b4ef64", // 3 lime green
  "#cba5ff", // 4 soft purple
  "#ffb36b", // 5 peach orange
  "#ff9dcc", // 6 soft pink
  "#6ce2d4", // 7 turquoise
  "#f6d66a", // 8 soft yellow
  "#a7b8ff", // 9 periwinkle
  "#b9c9dc", // 10 blue-gray
  "#d6dce5", // Other devices (neutral)
];
