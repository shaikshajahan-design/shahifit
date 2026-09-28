import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useBackClose } from '../hooks/useBackClose';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  /** Sticky action area at the bottom of the sheet */
  footer?: ReactNode;
  /** Optional element shown in the header, left of the close button */
  headerAction?: ReactNode;
  size?: 'auto' | 'tall';
}

let openCount = 0;

/** Mobile bottom sheet; becomes a centred dialog on wide screens. Accessible (focus, Esc, back button). */
export function BottomSheet({ open, onClose, title, subtitle, children, footer, headerAction, size = 'auto' }: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useBackClose(open, onClose);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    openCount++;
    document.body.classList.add('no-scroll');
    // Focus the panel so screen readers announce the dialog; avoid popping the keyboard.
    requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }));
    return () => {
      openCount--;
      if (openCount === 0) document.body.classList.remove('no-scroll');
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    }
    if (e.key === 'Tab' && panelRef.current) {
      // basic focus trap
      const f = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (f.length === 0) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return createPortal(
    <div className="sheet-root" onKeyDown={onKeyDown}>
      <div className="sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className={`sheet ${size === 'tall' ? 'sheet-tall' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="sheet-grabber" aria-hidden="true" />
        <header className="sheet-header">
          <div className="sheet-titles">
            <h2 id={titleId} className="sheet-title">
              {title}
            </h2>
            {subtitle && <p className="sheet-subtitle">{subtitle}</p>}
          </div>
          {headerAction}
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
