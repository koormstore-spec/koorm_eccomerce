import { Link } from 'react-router-dom';
import SizeChartTable from '../components/SizeChartTable';
import { RulerIcon } from '../components/Icons';

export default function SizeGuide() {
  return (
    <section className="container-x section-space">
      <div className="mb-9 max-w-2xl">
        <p className="eyebrow mb-4"><RulerIcon width={14} height={14} className="inline -mt-0.5" /> Fit reference</p>
        <h1 className="section-title">Find your size.</h1>
        <p className="mt-4 text-sm leading-7 text-muted">Every Koorm shirt is cut from the same block, so one chart works across the whole collection. Measurements are taken flat, body measurements in a relaxed, arms-down stance.</p>
      </div>

      <div className="panel p-5 sm:p-8"><SizeChartTable /></div>

      <div className="mt-8 flex flex-col items-start gap-3 border-t border-sand pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-muted">Still unsure which size to pick? Compare against a shirt you already own and love, or reach out and we&rsquo;ll help.</p>
        <Link to="/contact" className="text-link shrink-0">Contact us <span aria-hidden="true">↗</span></Link>
      </div>
    </section>
  );
}
