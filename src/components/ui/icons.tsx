/**
 * Single consistent icon set for GenSan LifeMap: 20px outline SVGs,
 * uniform stroke treatment, currentColor. Use these instead of ad-hoc
 * inline SVGs, emoji, or external icon packs.
 */

function Svg({
  children,
  label,
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    >
      {children}
    </svg>
  );
}

const stroke = {
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function PinIcon() {
  return (
    <Svg>
      <path
        d="M10 17.5S4 11.8 4 7.5a6 6 0 1 1 12 0c0 4.3-6 10-6 10Z"
        {...stroke}
      />
      <circle cx="10" cy="7.5" r="2" {...stroke} />
    </Svg>
  );
}

export function ProjectIcon() {
  return (
    <Svg>
      <path d="M3 7.5 10 3l7 4.5v6L10 18l-7-4.5v-6Z" {...stroke} />
      <path d="M3 7.5l7 4 7-4M10 11.5V18" {...stroke} />
    </Svg>
  );
}

export function FacilityIcon() {
  return (
    <Svg>
      <path d="M4 17V7l6-4 6 4v10" {...stroke} />
      <path d="M2.5 17h15M8 17v-4h4v4" {...stroke} />
    </Svg>
  );
}

export function AnnounceIcon() {
  return (
    <Svg>
      <path
        d="M3 10v-2.5A1.5 1.5 0 0 1 4.5 6H6l5-3.5v15L6 14H4.5A1.5 1.5 0 0 1 3 12.5V10Z"
        {...stroke}
      />
      <path d="M14 7.5a3.5 3.5 0 0 1 0 5M16.5 5.5a6.5 6.5 0 0 1 0 9" {...stroke} />
    </Svg>
  );
}

export function DatabaseIcon() {
  return (
    <Svg>
      <ellipse cx="10" cy="5" rx="6.5" ry="2.5" {...stroke} />
      <path d="M3.5 5v10c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5V5" {...stroke} />
      <path d="M3.5 10c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5" {...stroke} />
    </Svg>
  );
}

export function MapIcon() {
  return (
    <Svg>
      <path
        d="M7 3.5 2.5 5v11.5L7 15l6 1.5 4.5-1.5V3.5L13 5 7 3.5ZM7 3.5V15m6-10v10"
        {...stroke}
      />
    </Svg>
  );
}

export function CloseIcon() {
  return (
    <Svg>
      <path d="M5 5l10 10M15 5L5 15" {...stroke} />
    </Svg>
  );
}

export function MenuIcon() {
  return (
    <Svg>
      <path d="M3 5.5h14M3 10h14M3 14.5h14" {...stroke} />
    </Svg>
  );
}

export function ArrowRightIcon() {
  return (
    <Svg>
      <path d="M3.5 10h13m-4.5-4.5L16.5 10 12 14.5" {...stroke} />
    </Svg>
  );
}

export function CheckIcon() {
  return (
    <Svg>
      <path d="M4 10.5l4 4 8-9" {...stroke} />
    </Svg>
  );
}

export function SearchIcon() {
  return (
    <Svg>
      <circle cx="9" cy="9" r="5.5" {...stroke} />
      <path d="M13.5 13.5 17 17" {...stroke} />
    </Svg>
  );
}

export function ChevronDownIcon() {
  return (
    <Svg>
      <path d="M5 7.5l5 5 5-5" {...stroke} />
    </Svg>
  );
}

export function CompassIcon() {
  return (
    <Svg>
      <circle cx="10" cy="10" r="7" {...stroke} />
      <path d="M12.5 7.5l-2 4.5-3 1 2-4.5 3-1Z" {...stroke} />
    </Svg>
  );
}

export function DocIcon() {
  return (
    <Svg>
      <path d="M5 2.5h6L15 6.5V17.5H5V2.5Z" {...stroke} />
      <path d="M11 2.5v4h4M7.5 10.5h5m-5 2.5h5" {...stroke} />
    </Svg>
  );
}
