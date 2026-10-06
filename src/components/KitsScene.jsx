/*
 * Kits Beach, looking north across English Bay: the North Shore mountains
 * (with the twin Lions peaks), Stanley Park, West End towers, freighters at
 * anchor, the driftwood logs, the long saltwater pool and the seawall path.
 * Hand-built SVG so it stays crisp, light and on-brand. Pins on top show real
 * people and plans from the community.
 */
import { memo } from 'react';

const TOWERS = [
  [872, 34, 46], [902, 22, 70], [926, 30, 58], [958, 20, 92], [980, 34, 64], [1016, 24, 104], [1042, 30, 78],
  [1074, 22, 118], [1098, 36, 72], [1136, 24, 96], [1162, 30, 60], [1194, 22, 84], [1218, 34, 52], [1254, 26, 70], [1282, 30, 44],
];

const LOGS = [
  [120, 676, 170], [300, 670, 150], [470, 680, 190], [690, 672, 150], [860, 684, 120],
  [60, 712, 150], [230, 718, 190], [440, 714, 140], [610, 722, 170],
];

function Freighter({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#2E4A51">
      <path d="M0 0 H92 L84 10 H6 Z" />
      <rect x="66" y="-12" width="16" height="12" />
      <rect x="70" y="-18" width="5" height="6" />
      <rect x="14" y="-6" width="44" height="6" fill="#5F7A80" />
    </g>
  );
}

function Sailboat({ x, y, className }) {
  return (
    <g className={className} transform={`translate(${x} ${y})`}>
      <path d="M14 -34 L14 0 L-6 0 Z" fill="#F7F5EE" />
      <path d="M17 -26 L17 0 L32 0 Z" fill="#E9E3D2" />
      <path d="M-10 2 H36 L30 9 H-4 Z" fill="#2E4A51" />
    </g>
  );
}

function Person({ x, y, color = '#17302A', pose = 'stand' }) {
  if (pose === 'run') {
    return (
      <g transform={`translate(${x} ${y})`} stroke={color} strokeWidth="3.4" strokeLinecap="round" fill="none">
        <circle cx="2" cy="-30" r="4.6" fill={color} stroke="none" />
        <path d="M0 -24 L-3 -10 M-3 -10 L-11 -2 M-3 -10 L5 -1 L4 6 M0 -21 L-8 -14 M0 -21 L8 -17" />
      </g>
    );
  }
  if (pose === 'sit') {
    return (
      <g transform={`translate(${x} ${y})`} stroke={color} strokeWidth="3.4" strokeLinecap="round" fill="none">
        <circle cx="0" cy="-26" r="4.6" fill={color} stroke="none" />
        <path d="M0 -20 L0 -6 L10 -6 L12 4" />
      </g>
    );
  }
  return (
    <g transform={`translate(${x} ${y})`} stroke={color} strokeWidth="3.4" strokeLinecap="round" fill="none">
      <circle cx="0" cy="-32" r="4.6" fill={color} stroke="none" />
      <path d="M0 -26 L0 -10 M0 -10 L-4 2 M0 -10 L4 2 M0 -22 L-6 -14 M0 -22 L6 -14" />
    </g>
  );
}

function Pin({ pin, index }) {
  const w = Math.max(200, Math.min(300, Math.max(pin.line1.length, pin.line2.length) * 7.4 + 70));
  const h = 56;
  const stem = 46;
  const left = pin.align === 'left';
  const cx = left ? -w + 22 : -22;
  const body = (
    <g className={`scene-pin ${index > 1 ? 'scene-pin-extra' : ''}`} style={{ '--i': index, transformOrigin: `${pin.x}px ${pin.y}px` }} transform={`translate(${pin.x} ${pin.y})`}>
      <circle r="13" className="scene-pin-pulse" />
      <circle r="6.5" fill="#F0B54A" stroke="#17302A" strokeWidth="2.5" />
      <line x1="0" y1="-7" x2="0" y2={-stem} stroke="#17302A" strokeWidth="2" />
      <g transform={`translate(${cx} ${-stem - h})`}>
        <rect width={w} height={h} rx="16" fill="#FAFBF7" stroke="#17302A" strokeOpacity=".14" filter="url(#chip-shadow)" />
        {pin.kind === 'activity' ? (
          <g transform="translate(28 28)">
            <circle r="16" fill="#E6EEE6" />
            <path d="M-6 4 L-1 -5 L3 1 L7 -4" stroke="#3D6B4B" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ) : (
          <g transform="translate(28 28)">
            <circle r="16" fill={`hsl(${pin.hue} 45% 78%)`} />
            <text className="scene-initial" textAnchor="middle" dy="5.5">{pin.initial}</text>
          </g>
        )}
        <text className="scene-line1" x="54" y="24">{pin.line1}</text>
        <text className="scene-line2" x="54" y="42">{pin.line2}</text>
      </g>
    </g>
  );
  return pin.href ? <a href={pin.href} aria-label={`${pin.line1}. ${pin.line2}`}>{body}</a> : body;
}

function KitsScene({ pins = [] }) {
  return (
    <svg className="kits-scene" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMax slice" role="img"
      aria-label="Illustration of Kits Beach looking across English Bay to the North Shore mountains, with neighbours on the beach and the seawall">
      <defs>
        <linearGradient id="sky" gradientUnits="userSpaceOnUse" x1="0" y1="250" x2="0" y2="490">
          <stop offset="0" stopColor="#DCE7E6" />
          <stop offset=".5" stopColor="#E9E7D6" />
          <stop offset="1" stopColor="#F4DCB2" />
        </linearGradient>
        <linearGradient id="bay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7DA3AA" />
          <stop offset="1" stopColor="#467886" />
        </linearGradient>
        <radialGradient id="halo">
          <stop offset="0" stopColor="#F6D58E" stopOpacity=".75" />
          <stop offset="1" stopColor="#F6D58E" stopOpacity="0" />
        </radialGradient>
        <filter id="chip-shadow" x="-10%" y="-20%" width="120%" height="160%">
          <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#17302A" floodOpacity=".16" />
        </filter>
      </defs>

      <rect width="1440" height="900" fill="url(#sky)" />
      <circle cx="330" cy="372" r="150" fill="url(#halo)" />
      <circle cx="330" cy="372" r="50" fill="#F4C76E" />

      {/* North Shore: far range with the Lions */}
      <path fill="#B7C8CB" d="M0 432 L70 404 L150 410 L226 366 L300 378 L380 338 L452 352 L503 302 Q514 289 525 302 L548 333 L573 298 Q585 285 597 298 L644 350 L722 334 L802 356 L882 320 L962 338 L1040 304 L1122 334 L1202 314 L1290 344 L1362 326 L1440 348 V490 H0 Z" />
      <path fill="#F3F1EA" d="M503 302 Q514 289 525 302 L519 311 L513 304 L507 312 Z M573 298 Q585 285 597 298 L591 308 L585 300 L578 309 Z M1040 304 L1052 311 L1046 316 L1038 311 L1030 316 Z" />
      <path fill="#94ACB1" d="M0 452 C120 422 210 444 300 418 C420 392 520 432 640 412 C760 394 860 428 980 402 C1100 380 1200 422 1300 406 C1360 398 1400 410 1440 404 V490 H0 Z" />
      <path fill="#728F94" d="M0 474 C200 458 400 468 600 455 C800 442 1000 466 1200 452 C1300 446 1380 456 1440 452 V492 H0 Z" />

      {/* Stanley Park */}
      <path fill="#3F5F55" d="M352 490 C364 476 384 470 404 472 C418 462 440 462 454 468 C470 458 494 460 508 466 C526 456 552 458 566 466 C588 458 612 462 626 470 C648 462 676 466 690 474 C716 468 744 474 760 482 C790 478 816 482 836 490 Z" />

      {/* West End */}
      {TOWERS.map(([x, w, h], i) => (
        <g key={x}>
          <rect x={x} y={490 - h} width={w} height={h} fill={i % 3 === 0 ? '#8AA2A7' : i % 3 === 1 ? '#A3B5B8' : '#96ABAF'} />
          <rect x={x + w - 6} y={490 - h} width="6" height={h} fill="#7A9399" />
        </g>
      ))}

      {/* Burrard Bridge, simplified */}
      <g fill="#6F888D">
        <rect x="1312" y="474" width="128" height="6" />
        <rect x="1352" y="452" width="10" height="38" />
        <rect x="1392" y="452" width="10" height="38" />
        <rect x="1348" y="448" width="58" height="6" />
      </g>

      {/* English Bay */}
      <rect y="488" width="1440" height="140" fill="url(#bay)" />
      <g stroke="#F7E4B8" strokeLinecap="round" opacity=".75">
        <line x1="296" y1="500" x2="364" y2="500" strokeWidth="3" />
        <line x1="306" y1="514" x2="356" y2="514" strokeWidth="2.5" />
        <line x1="290" y1="530" x2="372" y2="530" strokeWidth="2" />
        <line x1="314" y1="548" x2="350" y2="548" strokeWidth="2" />
        <line x1="300" y1="568" x2="362" y2="568" strokeWidth="1.5" />
      </g>
      <Freighter x={120} y={506} s={0.9} />
      <Freighter x={600} y={500} s={0.7} />
      <Freighter x={1020} y={512} s={1} />
      <Sailboat x={760} y={560} className="scene-drift" />
      <Sailboat x={1210} y={548} />

      {/* Beach */}
      <path fill="#E9D8B3" d="M0 620 C300 598 600 614 900 604 C1150 596 1300 612 1440 604 V900 H0 Z" />
      <path fill="none" stroke="#D3BD92" strokeWidth="5" d="M0 622 C300 600 600 616 900 606 C1150 598 1300 614 1440 606" />

      {/* Saltwater pool */}
      <g>
        <rect x="1036" y="636" width="380" height="58" rx="12" fill="#F7F4EC" />
        <rect x="1044" y="643" width="364" height="44" rx="8" fill="#84C6C1" />
        <g stroke="#F7F4EC" strokeWidth="2" opacity=".8">
          <line x1="1050" y1="657" x2="1402" y2="657" />
          <line x1="1050" y1="672" x2="1402" y2="672" />
        </g>
      </g>

      {/* Lifeguard chair */}
      <g transform="translate(962 600)">
        <path d="M4 82 L14 18 M38 82 L28 18 M8 56 H34" stroke="#F7F4EC" strokeWidth="4" strokeLinecap="round" />
        <rect x="8" y="8" width="26" height="14" rx="3" fill="#F0B54A" />
        <path d="M2 4 Q21 -14 40 4 Z" fill="#C9553E" />
      </g>

      {/* Driftwood logs */}
      {LOGS.map(([x, y, w]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width={w} height="15" rx="7.5" fill="#A68360" />
          <rect x={x + 8} y={y + 3} width={w - 30} height="2" rx="1" fill="#8E6E4E" opacity=".6" />
          <ellipse cx={x + w - 4} cy={y + 7.5} rx="5" ry="7.5" fill="#CDAE86" />
        </g>
      ))}
      <Person x={500} y={682} color="#2C6577" pose="sit" />
      <Person x={530} y={682} color="#17302A" pose="sit" />
      <Person x={1110} y={638} color="#17302A" />

      {/* Grass, seawall path, trees */}
      <path fill="#7E9C66" d="M0 756 C300 736 700 768 1000 748 C1200 736 1350 750 1440 744 V900 H0 Z" />
      <path fill="#6A8A55" d="M0 842 C320 828 720 852 1040 836 C1220 828 1360 836 1440 832 V900 H0 Z" />
      <path fill="none" stroke="#EFE7D3" strokeWidth="26" strokeLinecap="round" d="M-20 806 C300 784 700 816 1000 794 C1200 780 1350 792 1460 788" />
      <Person x={830} y={800} color="#17302A" pose="run" />
      <Person x={1250} y={800} color="#2C6577" />
      <g transform="translate(1262 800)" fill="#5B4636">
        <ellipse cx="12" cy="-8" rx="10" ry="5" />
        <circle cx="22" cy="-13" r="4" />
        <rect x="4" y="-6" width="2.5" height="7" />
        <rect x="16" y="-6" width="2.5" height="7" />
      </g>

      <g>
        <rect x="70" y="640" width="18" height="150" fill="#5B4636" />
        <circle cx="50" cy="610" r="70" fill="#2F5241" />
        <circle cx="120" cy="580" r="64" fill="#3B6450" />
        <circle cx="70" cy="540" r="56" fill="#35594A" />
        <circle cx="140" cy="640" r="46" fill="#2F5241" />
      </g>
      <g>
        <rect x="1376" y="660" width="16" height="130" fill="#5B4636" />
        <circle cx="1400" cy="620" r="66" fill="#3B6450" />
        <circle cx="1350" cy="650" r="48" fill="#2F5241" />
        <circle cx="1420" cy="570" r="50" fill="#35594A" />
      </g>

      {pins.map((p, i) => <Pin key={p.key} pin={p} index={i} />)}
    </svg>
  );
}

export default memo(KitsScene);

/** Where pins sit in the scene. The first two stay visible on narrow screens. */
export const PIN_SPOTS = [
  { x: 560, y: 676, align: 'right' },
  { x: 846, y: 786, align: 'left' },
  { x: 1180, y: 642, align: 'left' },
  { x: 262, y: 770, align: 'right' },
];
