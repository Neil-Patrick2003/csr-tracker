import Svg, {
  Path,
  Circle,
  Line,
  Polyline,
  Rect,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";

const STROKE = 2;

function Base({ size = 20, color = "#fff", children, viewBox = "0 0 24 24" }) {
  return (
    <Svg width={size} height={size} viewBox={viewBox} fill="none">
      {children({ color, stroke: STROKE })}
    </Svg>
  );
}

const ICONS = {
  power: ({ color, stroke }) => (
    <>
      <Path
        d="M18.36 6.64a9 9 0 1 1-12.73 0"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="12"
        y1="2"
        x2="12"
        y2="12"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
    </>
  ),
  refresh: ({ color, stroke }) => (
    <>
      <Polyline
        points="23 4 23 10 17 10"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points="1 20 1 14 7 14"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  sun: ({ color, stroke }) => (
    <>
      <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth={stroke} />
      <Line x1="12" y1="2" x2="12" y2="5" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      <Line x1="12" y1="19" x2="12" y2="22" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      <Line x1="2" y1="12" x2="5" y2="12" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      <Line x1="19" y1="12" x2="22" y2="12" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      <Line x1="4.93" y1="4.93" x2="6.76" y2="6.76" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      <Line x1="17.24" y1="17.24" x2="19.07" y2="19.07" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      <Line x1="4.93" y1="19.07" x2="6.76" y2="17.24" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      <Line x1="17.24" y1="6.76" x2="19.07" y2="4.93" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
    </>
  ),
  moon: ({ color, stroke }) => (
    <Path
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  search: ({ color, stroke }) => (
    <>
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth={stroke} />
      <Line x1="21" y1="21" x2="16.65" y2="16.65" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
    </>
  ),
  x: ({ color, stroke }) => (
    <>
      <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
    </>
  ),
  check: ({ color, stroke }) => (
    <Polyline
      points="20 6 9 17 4 12"
      stroke={color}
      strokeWidth={stroke + 0.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  "chevron-right": ({ color, stroke }) => (
    <Polyline
      points="9 18 15 12 9 6"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  "arrow-left": ({ color, stroke }) => (
    <>
      <Line x1="20" y1="12" x2="4" y2="12" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      <Polyline
        points="10 18 4 12 10 6"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  "help-circle": ({ color, stroke }) => (
    <>
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={stroke} />
      <Path
        d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="12"
        y1="17"
        x2="12.01"
        y2="17"
        stroke={color}
        strokeWidth={stroke + 0.5}
        strokeLinecap="round"
      />
    </>
  ),
  settings: ({ color, stroke }) => (
    <>
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={stroke} />
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  "log-out": ({ color, stroke }) => (
    <>
      <Path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points="16 17 21 12 16 7"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="21" y1="12" x2="9" y2="12" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
    </>
  ),
  mail: ({ color, stroke }) => (
    <>
      <Path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points="22,6 12,13 2,6"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  shield: ({ color, stroke }) => (
    <Path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  user: ({ color, stroke }) => (
    <>
      <Path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth={stroke} />
    </>
  ),
  phone: ({ color, stroke }) => (
    <Path
      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  "phone-in": ({ color, stroke }) => (
    <>
      <Polyline
        points="16 2 16 8 22 8"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="22" y1="2" x2="16" y2="8" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      <Path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  "phone-out": ({ color, stroke }) => (
    <>
      <Polyline
        points="23 7 23 1 17 1"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="16" y1="8" x2="23" y2="1" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      <Path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  "phone-missed": ({ color, stroke }) => (
    <>
      <Line x1="23" y1="1" x2="17" y2="7" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      <Line x1="17" y1="1" x2="23" y2="7" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      <Path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
};

export default function Icon({ name, size = 20, color = "#fff" }) {
  const draw = ICONS[name];
  if (!draw) return null;
  return <Base size={size} color={color}>{draw}</Base>;
}
