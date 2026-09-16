import { Link } from 'react-router-dom';
import { ChevronRightIcon } from './Icons';

const CODE = 'USEFIRST25';

// A split promo banner: copy on a solid ink panel; the shirt itself — full,
// never cropped — floats on its own textured panel to the right, with a
// sale-stamp badge and a soft accent glow behind it. No background photo
// sitting under the text.
export default function FirstOrderBanner() {
  return (
    <section className="container-x pb-4 pt-2 sm:pt-4">
      <Link
        to="/shop"
        aria-label="Shop now and use code USEFIRST25 for 25% off your first order"
        className="group grid grid-cols-1 overflow-hidden rounded-sm bg-ink md:grid-cols-[1.15fr_1fr]"
      >
        <div className="flex flex-col justify-center px-6 py-7 sm:px-9 sm:py-9 md:px-10 md:py-8">
          <p className="eyebrow text-clay">A little welcome gift</p>
          <h2 className="mt-2 max-w-sm font-serif text-2xl leading-[1.1] tracking-[-0.03em] text-cream sm:text-3xl md:text-4xl">First order? Take 25% off.</h2>
          <p className="mt-2.5 max-w-sm text-sm leading-6 text-cream/75">Use the code at checkout — the discount lands before you even see the total.</p>

          <div className="mt-5 flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 rounded-sm border border-dashed border-cream/50 bg-cream/10 px-3.5 py-2 sm:px-4 sm:py-2.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-cream/60">Code</span>
              <span className="font-serif text-base tracking-[0.16em] text-cream sm:text-lg">{CODE}</span>
            </div>
            <span className="btn-primary bg-cream text-ink transition-colors group-hover:bg-white">Shop now <ChevronRightIcon width={15} height={15} /></span>
          </div>
        </div>

        <div className="surface-grid relative flex h-52 items-center justify-center overflow-hidden bg-[#eef1e6] sm:h-64 md:h-auto">
          {/* Soft accent glow the shirt appears to float in front of. */}
          <div className="absolute h-36 w-36 rounded-full bg-clay/30 blur-2xl sm:h-48 sm:w-48" aria-hidden="true" />

          <img
            src="/images/products/1/1.jpg"
            alt="The Koorm linen shirt in rust red"
            width="1000"
            height="1333"
            className="relative z-[1] h-40 w-auto -rotate-3 object-contain drop-shadow-[0_20px_28px_rgba(26,26,26,0.28)] transition-transform duration-700 ease-out group-hover:-rotate-1 group-hover:scale-105 sm:h-52 md:h-[85%] md:max-h-64"
          />

          {/* Sale stamp, like a sticker pressed onto the photo. */}
          <div className="absolute right-4 top-4 z-[2] flex h-14 w-14 rotate-6 flex-col items-center justify-center rounded-full border-2 border-dashed border-ink/60 bg-cream text-center leading-none text-ink shadow-md sm:right-6 sm:top-6 sm:h-16 sm:w-16">
            <span className="text-sm font-bold sm:text-base">25%</span>
            <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide sm:text-[10px]">off</span>
          </div>
        </div>
      </Link>
    </section>
  );
}
