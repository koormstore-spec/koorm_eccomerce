import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './Icons';

// A centered dialog for content that isn't tied to navigation (unlike
// Drawer, which is a mobile-only side panel). Same accessibility pattern:
// focus trap, Escape/backdrop dismissal, scroll lock, and inert-ing the app
// behind it, but works at every viewport width.
export default function Modal({ open, onClose, label, id, children }) {
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement;
    const root = document.getElementById('root');
    const wasInert = root?.inert;
    const scrollY = window.scrollY;
    const savedStyles = {};
    for (const property of ['overflow', 'position', 'top', 'width']) {
      savedStyles[property] = document.body.style[property];
    }
    Object.assign(document.body.style, { overflow: 'hidden', position: 'fixed', top: `-${scrollY}px`, width: '100%' });
    if (root) root.inert = true;

    const focusable = () => [...panelRef.current.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]')]
      .filter((element) => element.getClientRects().length > 0);
    (focusable()[0] || panelRef.current).focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeRef.current();
      if (event.key !== 'Tab') return;
      const elements = focusable();
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first) {
        event.preventDefault();
        panelRef.current.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (root) root.inert = wasInert;
      Object.assign(document.body.style, savedStyles);
      window.scrollTo({ top: scrollY, behavior: 'instant' });
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="modal-layer">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <section ref={panelRef} id={id} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} className="modal-panel">
        <button type="button" onClick={onClose} aria-label="Close" className="btn-icon absolute right-3 top-3 z-10 bg-white/80 hover:bg-sand">
          <CloseIcon width={16} height={16} />
        </button>
        {children}
      </section>
    </div>,
    document.body,
  );
}
