import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { generateWatermarkText, generateWatermarkSvgDataUrl } from '../../lib/watermark';

interface WatermarkOverlayProps {
  customUserName?: string;
  customSessionId?: string;
  customTimestamp?: string;
  className?: string;
}

export const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({
  customUserName,
  customSessionId,
  customTimestamp,
  className = '',
}) => {
  const { user, session } = useAuth();

  const userName = customUserName || user?.name || 'Authorised User';
  const sessionId = customSessionId || session?.id || 'EV-2026-LIVE';
  const text = generateWatermarkText(userName, sessionId, customTimestamp);
  const bgDataUrl = generateWatermarkSvgDataUrl(text);

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-20 overflow-hidden select-none opacity-80 ${className}`}
      style={{
        backgroundImage: `url("${bgDataUrl}")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '380px 180px',
      }}
      aria-hidden="true"
    />
  );
};
