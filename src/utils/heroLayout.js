
export const CONTENT_POSITIONS = [
  { value: "top-left", label: "Top left" },
  { value: "top-center", label: "Top center" },
  { value: "top-right", label: "Top right" },
  { value: "middle-left", label: "Middle left" },
  { value: "middle-center", label: "Center" },
  { value: "middle-right", label: "Middle right" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-center", label: "Bottom center" },
  { value: "bottom-right", label: "Bottom right" },
];

export const OVERLAY_OPTIONS = [
  { value: "none", label: "None" },
  { value: "soft", label: "Soft" },
  { value: "medium", label: "Medium" },
  { value: "strong", label: "Strong" },
];

/* Defaults keep today's look: text on the left, medium dark overlay. */
export const DEFAULT_CONTENT_POSITION = "middle-left";
export const DEFAULT_OVERLAY = "medium";

/* Full class strings so Tailwind can see them. */
const VERTICAL = {
  top: "justify-start",
  middle: "justify-center",
  bottom: "justify-end",
};

const HORIZONTAL = {
  left: { block: "items-start", text: "items-start text-left", actions: "justify-start" },
  center: { block: "items-center", text: "items-center text-center", actions: "justify-center" },
  right: { block: "items-end", text: "items-end text-right", actions: "justify-end" },
};

const GRADIENT_COLORS = {
  soft: "from-ink/55 via-ink/25 to-transparent",
  medium: "from-ink/80 via-ink/45 to-ink/5",
  strong: "from-ink/95 via-ink/70 to-ink/30",
};

const FLAT_COLORS = {
  soft: "bg-ink/35",
  medium: "bg-ink/55",
  strong: "bg-ink/75",
};

function getOverlayClass(vertical, horizontal, strength) {
  if (!GRADIENT_COLORS[strength]) return ""; // "none" or unknown

  if (horizontal === "left") {
    return `bg-gradient-to-r ${GRADIENT_COLORS[strength]}`;
  }
  if (horizontal === "right") {
    return `bg-gradient-to-l ${GRADIENT_COLORS[strength]}`;
  }
  if (vertical === "top") {
    return `bg-gradient-to-b ${GRADIENT_COLORS[strength]}`;
  }
  if (vertical === "bottom") {
    return `bg-gradient-to-t ${GRADIENT_COLORS[strength]}`;
  }
  return FLAT_COLORS[strength]; // dead center
}

/* Returns the classes for one hero slide's text block and overlay. */
export function getHeroLayout(position, strength) {
  const valid = CONTENT_POSITIONS.some((item) => item.value === position);
  const [vertical, horizontal] = (
    valid ? position : DEFAULT_CONTENT_POSITION
  ).split("-");

  return {
    wrapper: `${VERTICAL[vertical]} ${HORIZONTAL[horizontal].block}`,
    text: HORIZONTAL[horizontal].text,
    actions: HORIZONTAL[horizontal].actions,
    overlay: getOverlayClass(
      vertical,
      horizontal,
      strength || DEFAULT_OVERLAY,
    ),
  };
}