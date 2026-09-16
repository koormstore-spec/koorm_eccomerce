import { Link } from 'react-router-dom';

export default function About() {
  return (
    <section className="container-x section-space">
      <div className="mb-9 max-w-2xl"><p className="eyebrow mb-4">A little about us</p><h1 className="section-title">Good clothes.<br />For your kind of everyday.</h1></div>
      <div className="brand-story">
        <div className="brand-story-photo"><img src="/images/products/4/1.jpg" alt="Relaxed linen pieces from the Koorm collection" width="1000" height="1333" /></div>
        <div className="brand-story-copy"><p className="eyebrow mb-4">Who we are</p><h2 className="font-serif text-3xl leading-tight">A modern men&rsquo;s<br />shirt brand.</h2><p className="mt-5 text-sm leading-7 text-muted"><strong className="text-ink">Koorm</strong> is a modern men&rsquo;s shirt brand built on the belief that true style lies in simplicity, comfort, and confidence. Every Koorm shirt is crafted with attention to detail — premium fabrics, precise tailoring, and designs that blend timeless elegance with everyday practicality.</p><p className="mt-4 text-sm leading-7 text-muted">Whether for work, travel, or casual wear, Koorm delivers shirts that feel good, look sharp, and stand the test of time.</p><Link to="/shop" className="text-link mt-6">Explore the collection <span aria-hidden="true">↗</span></Link></div>
      </div>

      <div className="mt-16 max-w-2xl border-t border-sand pt-10">
        <p className="eyebrow mb-4">Aim</p>
        <span className="display-rule mb-5 block" aria-hidden="true" />
        <p className="font-serif text-2xl leading-snug">The aim of Koorm is to provide men with high-quality, well-fitted shirts that combine comfort, durability, and timeless style, making everyday dressing effortless and confident.</p>
      </div>

      <div className="mt-16 grid gap-8 border-t border-sand pt-10 md:grid-cols-[.85fr_1.15fr] md:gap-12">
        <div><p className="eyebrow mb-4">Where the name comes from</p><h2 className="font-serif text-3xl leading-tight">The Kurma avatar.</h2></div>
        <div className="space-y-4 text-sm leading-7 text-muted">
          <p><strong className="text-ink">Koorm</strong> takes its name from the revered <em className="italic text-ink">Kurma</em> (Koorm) avatar of Lord Vishnu, symbolizing stability, support, and strength. Just as the Kurma avatar upheld the world during the cosmic churning, <strong className="text-ink">Koorm aims to uphold timeless quality and enduring comfort in men&rsquo;s fashion</strong>.</p>
          <p>Rooted in this powerful inspiration, Koorm specializes in premium <strong className="text-ink">linen shirts</strong> — a fabric known for its natural elegance, breathability, and purity. Each shirt is thoughtfully crafted to reflect the values behind the name: reliability, calmness, and effortless style.</p>
          <p className="pt-2 font-serif text-lg italic text-ink">Koorm: Inspired by tradition, crafted for the modern man.</p>
        </div>
      </div>

      <div className="mt-16 grid gap-7 border-y border-sand py-8 sm:grid-cols-2"><div><p className="eyebrow mb-3">Find us</p><h2 className="font-serif text-2xl">Nikhil enterprise</h2><p className="mt-3 text-sm text-muted">Hosa road</p><Link to="/contact" className="text-link mt-3">Get in touch <span aria-hidden="true">↗</span></Link></div><div><p className="eyebrow mb-3">Shop at your pace</p><h2 className="font-serif text-2xl">A little room to decide.</h2><p className="mt-3 text-sm leading-7 text-muted">Our return period is 3 months. Contact us for help with your order or to arrange a return.</p><Link to="/contact#returns" className="text-link mt-3">Returns & exchanges <span aria-hidden="true">↗</span></Link></div></div>
    </section>
  );
}
