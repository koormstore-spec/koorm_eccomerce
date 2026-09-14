import { useState } from 'react';
import { Link } from 'react-router-dom';

const SocialIcon = ({ label, path }) => (
  <button
    type="button"
    aria-label={label}
    className="h-9 w-9 flex items-center justify-center rounded-full border border-cream/20 text-cream/80 hover:text-ink hover:bg-cream transition-all duration-200"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d={path} /></svg>
  </button>
);

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer className="bg-ink text-cream mt-20">
      {/* Newsletter */}
      <div className="border-b border-cream/10">
        <div className="container-x py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="font-serif text-xl mb-1">Join the Koorm List</h3>
            <p className="text-cream/80 text-sm">Get early access to new arrivals and seasonal sales.</p>
          </div>
          {subscribed ? (
            <p className="text-clay text-sm font-medium">Thanks for subscribing! 🎉</p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex w-full max-w-sm">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="flex-1 bg-transparent border border-cream/30 px-4 py-2.5 text-sm outline-none focus:border-cream placeholder:text-cream/80"
              />
              <button type="submit" className="bg-clay text-white px-5 text-sm uppercase tracking-wide hover:bg-cream hover:text-ink transition-colors">
                Join
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="container-x py-14 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2 md:col-span-2">
          <h3 className="font-serif text-2xl mb-3">KOORM</h3>
          <p className="text-cream/80 text-sm leading-relaxed max-w-xs">
            Thoughtfully designed clothing for everyday living. Quality fabrics, honest pricing.
          </p>
          <div className="flex gap-3 mt-5">
            <SocialIcon label="Instagram" path="M12 2c2.7 0 3.06.01 4.12.06 1.06.05 1.79.22 2.43.47.66.26 1.22.6 1.77 1.16.55.55.9 1.11 1.16 1.77.25.64.42 1.37.47 2.43.05 1.06.06 1.42.06 4.12s-.01 3.06-.06 4.12c-.05 1.06-.22 1.79-.47 2.43a4.9 4.9 0 0 1-1.16 1.77 4.9 4.9 0 0 1-1.77 1.16c-.64.25-1.37.42-2.43.47-1.06.05-1.42.06-4.12.06s-3.06-.01-4.12-.06c-1.06-.05-1.79-.22-2.43-.47a4.9 4.9 0 0 1-1.77-1.16 4.9 4.9 0 0 1-1.16-1.77c-.25-.64-.42-1.37-.47-2.43C2.01 15.06 2 14.7 2 12s.01-3.06.06-4.12c.05-1.06.22-1.79.47-2.43.26-.66.6-1.22 1.16-1.77A4.9 4.9 0 0 1 5.46.52C6.1.27 6.83.1 7.89.05 8.94.01 9.3 0 12 0Zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Zm5.2-8.4a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z" />
            <SocialIcon label="Facebook" path="M13.5 21v-7.5h2.5l.4-3h-2.9V8.4c0-.87.24-1.46 1.5-1.46h1.6V4.3c-.28-.04-1.23-.12-2.34-.12-2.32 0-3.9 1.42-3.9 4V10.5H8v3h2.5V21h3Z" />
            <SocialIcon label="Twitter" path="M22 5.9c-.7.3-1.5.5-2.3.6a4 4 0 0 0 1.75-2.2c-.77.46-1.63.8-2.55.98a4 4 0 0 0-6.9 3.66A11.4 11.4 0 0 1 3.6 4.9a4 4 0 0 0 1.25 5.4c-.65 0-1.26-.2-1.8-.5v.05a4 4 0 0 0 3.2 3.95c-.6.16-1.24.18-1.86.07a4 4 0 0 0 3.75 2.8A8.1 8.1 0 0 1 2 18.4a11.4 11.4 0 0 0 6.2 1.8c7.4 0 11.5-6.2 11.5-11.5v-.53c.8-.56 1.47-1.26 2.3-2.27Z" />
          </div>
        </div>
        <div>
          <h4 className="text-sm uppercase tracking-wide mb-4 text-clay">Shop</h4>
          <ul className="space-y-2.5 text-sm text-cream/80">
            <li><Link to="/shop" className="hover:text-white transition-colors">All Products</Link></li>
            <li><Link to="/shop?category=men" className="hover:text-white transition-colors">Men</Link></li>
            <li><Link to="/shop?sort=newest" className="hover:text-white transition-colors">New Arrivals</Link></li>
            <li><Link to="/shop?sort=rating" className="hover:text-white transition-colors">Best Sellers</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm uppercase tracking-wide mb-4 text-clay">Help</h4>
          <ul className="space-y-2.5 text-sm text-cream/80">
            <li><Link to="/contact#returns" className="hover:text-white transition-colors">Returns: 3 months</Link></li>
            <li>Track Order</li>
            <li>Size Guide</li>
            <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            <li>Nikhil enterprise</li>
            <li><a href="tel:+917892766354" className="hover:text-white transition-colors">7892766354</a></li>
            <li>Hosa road</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm uppercase tracking-wide mb-4 text-clay">Company</h4>
          <ul className="space-y-2.5 text-sm text-cream/80">
            <li><Link to="/about" className="hover:text-white transition-colors">About Koorm</Link></li>
            <li>Careers</li>
            <li>Privacy Policy</li>
            <li>Terms of Service</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/10 py-5 text-center text-xs text-cream/80">
        © {new Date().getFullYear()} Koorm. All rights reserved. Payments accepted: Cash on Delivery.
        {' · '}
        <Link to="/admin/login" className="hover:text-white transition-colors">Admin Login</Link>
      </div>
    </footer>
  );
}
