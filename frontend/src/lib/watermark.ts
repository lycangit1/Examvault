/**
 * Watermark utilities for generating dynamic, forensic watermark strings and SVG patterns.
 * Format: CONFIDENTIAL - <User Name> - <Session ID> - <Time>
 */

export function generateWatermarkText(userName: string, sessionId: string, timestamp?: string): string {
  const timeStr = timestamp 
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const cleanName = userName || 'Authorised Personnel';
  const cleanSession = sessionId || 'EV-2026-LIVE';

  return `CONFIDENTIAL  •  ${cleanName}  •  ${cleanSession}  •  ${timeStr}`;
}

export function generateWatermarkSvgDataUrl(text: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="200">
      <style>
        .wm {
          fill: rgba(148, 163, 184, 0.18);
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          font-size: 13.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
      </style>
      <text x="50%" y="50%" text-anchor="middle" transform="rotate(-26 200 100)" class="wm">
        ${text}
      </text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
