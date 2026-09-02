import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldAlert, Lock } from 'lucide-react';

export const ContentProtection: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isWorkspace = /^\/(setter|reviewer|approver|admin2|investigator)/.test(location.pathname);

  useEffect(() => {
    if (!user || !isWorkspace) return;

    const showSecurityToast = (msg: string) => {
      setToastMessage(msg);
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3200);
      return () => clearTimeout(timer);
    };

    // Block copy events
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      showSecurityToast('🔒 Content Protection Active: Copying examination content is prohibited.');
    };

    // Block cut events
    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      showSecurityToast('🔒 Content Protection Active: Cutting examination content is prohibited.');
    };

    // Block right-click context menu in protected workspaces
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Allow right-click only inside form inputs if needed, otherwise block
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        showSecurityToast('🔒 Content Protection Active: Context menu is disabled in secure workspaces.');
      }
    };

    // Intercept keyboard shortcuts: Ctrl+C, Ctrl+X, Ctrl+U, PrintScreen
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // Block Ctrl+C or Cmd+C when selecting content
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
        if (!isInput) {
          e.preventDefault();
          showSecurityToast('🔒 Content Protection: Copying question data is strictly prohibited.');
        }
      }

      // Block Ctrl+X or Cmd+X outside inputs
      if ((e.ctrlKey || e.metaKey) && (e.key === 'x' || e.key === 'X')) {
        if (!isInput) {
          e.preventDefault();
          showSecurityToast('🔒 Content Protection: Cutting question data is strictly prohibited.');
        }
      }

      // Block PrintScreen notice
      if (e.key === 'PrintScreen') {
        showSecurityToast('⚠️ Screen Capture Alert: Visual telemetry is logged with dynamic forensic watermark.');
      }
    };

    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [user, isWorkspace]);

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="bg-slate-900/95 text-white border border-slate-700/80 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-mono backdrop-blur-md max-w-md">
        <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400 shrink-0 border border-red-500/30">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div className="flex-1 text-slate-200 font-sans text-xs leading-relaxed">
          {toastMessage}
        </div>
      </div>
    </div>
  );
};

export default ContentProtection;
