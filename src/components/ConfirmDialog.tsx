import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useBackClose } from '../hooks/useBackClose';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel, destructive, onConfirm, onCancel }: Props) {
  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  useBackClose(open, onCancel);

  useEffect(() => {
    if (open) requestAnimationFrame(() => cancelRef.current?.focus());
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="dialog-root" onKeyDown={(e) => e.key === 'Escape' && onCancel()}>
      <div className="sheet-backdrop" onClick={onCancel} aria-hidden="true" />
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descId}>
        <h2 id={titleId} className="dialog-title">
          {title}
        </h2>
        <p id={descId} className="dialog-message">
          {message}
        </p>
        <div className="dialog-actions">
          <button ref={cancelRef} type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={`btn ${destructive ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
