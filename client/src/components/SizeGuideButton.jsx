import { useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from './Modal';
import SizeChartTable from './SizeChartTable';
import { RulerIcon } from './Icons';

// Drops into any product page: an icon + trigger that opens the size chart
// in place, without leaving the product.
export default function SizeGuideButton({ className = '' }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 text-xs text-muted link-underline hover:text-ink ${className}`}
      >
        <RulerIcon width={14} height={14} />
        Size guide
      </button>

      <Modal open={open} onClose={() => setOpen(false)} label="Size guide" id="size-guide-modal">
        <div className="p-5 pt-6 sm:p-7">
          <p className="page-kicker">Fit reference</p>
          <h2 className="font-serif text-2xl leading-tight">Find your size.</h2>
          <p className="mt-2 text-sm text-muted">All measurements are in centimetres and inches.</p>
          <div className="mt-6"><SizeChartTable /></div>
          <Link to="/size-guide" onClick={() => setOpen(false)} className="text-link mt-6">Open the full size guide <span aria-hidden="true">↗</span></Link>
        </div>
      </Modal>
    </>
  );
}
