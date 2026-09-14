import { Link } from 'react-router-dom';

export default function About() {
  return (
    <section className="container-x py-14 md:py-24">
      <div className="max-w-2xl">
        <p className="eyebrow mb-4">About Koorm</p>
        <h1 className="section-title">Made for the everyday.</h1>
        <p className="mt-6 text-base leading-relaxed text-muted">
          Thoughtfully designed clothing for everyday living. Explore the Koorm collection for quality fabrics and honest pricing.
        </p>
        <div className="mt-8 border-y border-sand py-6">
          <h2 className="font-serif text-2xl">Nikhil enterprise</h2>
          <p className="mt-2 text-sm text-muted">Find us at Hosa road.</p>
          <p className="mt-2 text-sm text-muted">Our return policy is 3 months. Contact us for help with your order or a return.</p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/shop" className="btn-primary">Shop the collection</Link>
          <Link to="/contact" className="btn-outline">Contact Us</Link>
        </div>
      </div>
    </section>
  );
}
