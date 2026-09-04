/**
 * Respyr logo: a blue rounded square (15px radius) with a white glyph inside.
 * Brand rule — the mark is always blue, never dark.
 */
export function BrandMark({ size = 44 }: { size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center bg-blue"
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.34) }}
      aria-hidden
    >
      <svg
        width={Math.round(size * 0.55)}
        height={Math.round(size * 0.55)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Exhalation curve — the breath the device measures. */}
        <path d="M6 20c3 0 5.9-1.6 5.9-4s2.9-4 5.9-4" />
        <path d="M12 20v-7M5 20h14" />
        <circle cx="17.8" cy="6.2" r="2.2" />
      </svg>
    </div>
  );
}

/** Fallback avatar: coloured disc with the clinic's initial. */
const INITIAL_COLORS = [
  "#FF6B6B", "#6BCB77", "#4D96FF", "#FFB74D", "#9575CD", "#26A69A",
  "#FF7043", "#42A5F5", "#66BB6A", "#FFCA28", "#AB47BC", "#26C6DA",
  "#EC407A", "#8D6E63", "#5C6BC0", "#9CCC65", "#29B6F6", "#F06292",
  "#7986CB", "#D4E157", "#00ACC1", "#FF8A65", "#BA68C8", "#4DB6AC",
  "#FFD54F", "#90CAF9",
];

export function InitialAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const letter = (name || "U").charAt(0).toUpperCase();
  const index = letter.charCodeAt(0) - 65;
  const color = INITIAL_COLORS[index] ?? "#607D8B";
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: color, fontSize: Math.round(size * 0.44) }}
      aria-hidden
    >
      {letter}
    </div>
  );
}
