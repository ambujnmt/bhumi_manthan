import React from "react";

// Flat illustrations for the plan cards: house -> building -> skyline

const Tree = ({ x, y, r = 9 }) => (
    <g>
        <rect x={x - 1.5} y={y} width="3" height="10" fill="#7A5230" />
        <circle cx={x} cy={y - 2} r={r} fill="#4E9A3A" />
        <circle cx={x - r * 0.5} cy={y + 1} r={r * 0.7} fill="#3F8530" />
    </g>
);

const Windows = ({ x, y, cols, rows, w = 7, h = 8, gapX = 4, gapY = 5, fill = "#9CC7EC" }) => (
    <g>
        {Array.from({ length: rows }).map((_, r) =>
            Array.from({ length: cols }).map((__, c) => (
                <rect
                    key={`${r}-${c}`}
                    x={x + c * (w + gapX)}
                    y={y + r * (h + gapY)}
                    width={w}
                    height={h}
                    rx="1"
                    fill={fill}
                />
            ))
        )}
    </g>
);

export function HouseIllustration({ className = "" }) {
    return (
        <svg viewBox="0 0 160 120" className={className} aria-hidden="true">
            <ellipse cx="80" cy="112" rx="72" ry="6" fill="#DDEBD3" />
            <rect x="34" y="58" width="92" height="52" fill="#F4E7D3" />
            <polygon points="24,62 80,22 136,62" fill="#7B4A2A" />
            <polygon points="34,62 80,30 126,62" fill="#A8693F" />
            <rect x="108" y="30" width="10" height="20" fill="#6B3F22" />
            <rect x="70" y="80" width="20" height="30" rx="2" fill="#6B3F22" />
            <circle cx="86" cy="96" r="1.5" fill="#E8C27A" />
            <rect x="42" y="72" width="20" height="18" rx="1" fill="#9CC7EC" stroke="#FFFFFF" strokeWidth="2" />
            <rect x="98" y="72" width="20" height="18" rx="1" fill="#9CC7EC" stroke="#FFFFFF" strokeWidth="2" />
            <rect x="74" y="44" width="12" height="12" rx="6" fill="#9CC7EC" stroke="#FFFFFF" strokeWidth="2" />
            <Tree x={20} y={98} r={10} />
            <Tree x={142} y={98} r={11} />
            <ellipse cx="48" cy="108" rx="12" ry="5" fill="#5BAA45" />
            <ellipse cx="114" cy="108" rx="12" ry="5" fill="#5BAA45" />
        </svg>
    );
}

export function BuildingIllustration({ className = "" }) {
    return (
        <svg viewBox="0 0 160 130" className={className} aria-hidden="true">
            <ellipse cx="80" cy="123" rx="76" ry="6" fill="#DDEBD3" />
            <rect x="18" y="62" width="34" height="58" fill="#C9D6E3" />
            <Windows x={23} y={68} cols={2} rows={4} w={10} h={8} gapX={4} gapY={5} fill="#7FA9CF" />
            <rect x="50" y="18" width="64" height="102" fill="#E9DCC8" />
            <rect x="50" y="14" width="64" height="6" fill="#B89A74" />
            <Windows x={56} y={26} cols={4} rows={7} w={10} h={8} gapX={4.6} gapY={4.6} />
            <rect x="74" y="104" width="16" height="16" fill="#5A6E85" />
            <rect x="112" y="48" width="32" height="72" fill="#D3DFEA" />
            <Windows x={117} y={54} cols={2} rows={5} w={9} h={8} gapX={5} gapY={5} fill="#7FA9CF" />
            <Tree x={12} y={110} r={9} />
            <Tree x={148} y={110} r={9} />
            <Tree x={64} y={112} r={6} />
            <Tree x={100} y={112} r={6} />
        </svg>
    );
}

export function SkylineIllustration({ className = "" }) {
    return (
        <svg viewBox="0 0 160 140" className={className} aria-hidden="true">
            <ellipse cx="80" cy="133" rx="78" ry="6" fill="#DDEBD3" />
            <rect x="10" y="70" width="26" height="60" fill="#B7C9DB" />
            <Windows x={14} y={76} cols={2} rows={6} w={7} h={5} gapX={4} gapY={3.5} fill="#E8F1F9" />
            <rect x="38" y="30" width="30" height="100" fill="#3E6E9E" />
            <Windows x={42} y={36} cols={3} rows={12} w={5} h={4} gapX={3.5} gapY={3.8} fill="#A9CDEB" />
            <rect x="70" y="8" width="34" height="122" fill="#2B5A8A" />
            <rect x="84" y="0" width="6" height="10" fill="#2B5A8A" />
            <Windows x={74} y={14} cols={4} rows={15} w={5} h={4} gapX={2.8} gapY={3.5} fill="#9CC7EC" />
            <rect x="106" y="40" width="28" height="90" fill="#4A7BAA" />
            <Windows x={110} y={46} cols={3} rows={11} w={5} h={4} gapX={3} gapY={3.6} fill="#B7D6EF" />
            <rect x="136" y="78" width="18" height="52" fill="#B7C9DB" />
            <Tree x={30} y={122} r={7} />
            <Tree x={66} y={124} r={6} />
            <Tree x={104} y={124} r={6} />
            <Tree x={150} y={122} r={7} />
        </svg>
    );
}

// Faint city outline behind the hero (left + right edges)
export function HeroSkyline({ className = "", flip = false }) {
    const blocks = [
        [0, 70, 22], [24, 40, 26], [52, 90, 18], [72, 20, 30], [104, 60, 22], [128, 100, 20], [150, 80, 24],
    ];

    return (
        <svg
            viewBox="0 0 180 220"
            className={className}
            style={flip ? { transform: "scaleX(-1)" } : undefined}
            aria-hidden="true"
        >
            {blocks.map(([x, y, w]) => (
                <g key={x}>
                    <rect x={x} y={y} width={w} height={220 - y} fill="#C7D8EA" />
                    <Windows x={x + 4} y={y + 6} cols={2} rows={Math.floor((210 - y) / 12)} w={w / 2 - 6} h={5} gapX={4} gapY={7} fill="#E6EFF8" />
                </g>
            ))}
            <Tree x={20} y={206} r={10} />
            <Tree x={90} y={206} r={12} />
            <Tree x={160} y={206} r={10} />
        </svg>
    );
}

const ILLUSTRATIONS = [HouseIllustration, BuildingIllustration, SkylineIllustration];

// 1st plan house, 2nd building, 3rd+ skyline
export function PlanIllustration({ index, className }) {
    const Illustration = ILLUSTRATIONS[Math.min(index, ILLUSTRATIONS.length - 1)];

    return <Illustration className={className} />;
}
