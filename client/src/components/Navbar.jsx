import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import AnnouncementBar from './AnnouncementBar';
import { SearchIcon, HeartIcon, BagIcon, UserIcon, MenuIcon, CloseIcon, ChevronRightIcon } from './Icons';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop' },
  { label: 'About', to: '/about' },
  { label: 'Contact Us', to: '/contact' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount, wishlist } = useCart();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const submitSearch = (event) => {
    event.preventDefault();
    if (!query.trim()) return;
    navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
    setMenuOpen(false);
    setSearchOpen(false);
  };

  const closeUserMenu = () => setUserMenuOpen(false);

  return (
    <header className={`sticky top-0 z-50 border-b border-sand/80 bg-[#fbfaf8]/90 backdrop-blur-xl transition-shadow ${scrolled ? 'shadow-[0_4px_18px_rgba(26,26,26,0.06)]' : ''}`}>
      <AnnouncementBar />

      <div className="container-x grid h-[4.65rem] grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex min-w-0 items-center">
          <button className="text-ink lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <MenuIcon />
          </button>
          <nav className="hidden items-center gap-5 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link key={link.label} to={link.to} className="relative whitespace-nowrap text-[12px] font-bold uppercase tracking-[0.14em] text-muted transition-colors hover:text-accent link-underline">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <Link to="/" className="group flex items-center gap-2 font-serif text-[1.65rem] font-bold tracking-[-0.08em] text-ink sm:text-3xl" aria-label="Koorm home">
          <span className="inline-block h-2 w-2 rounded-full bg-clay transition-transform duration-300 group-hover:scale-125" />
          KOORM
        </Link>

        <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
          <form onSubmit={submitSearch} className="hidden h-10 w-36 items-center rounded-full border border-sand bg-white/70 px-3 transition-all focus-within:border-ink xl:flex xl:w-52">
            <SearchIcon width={15} height={15} className="shrink-0 text-muted" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the collection" className="min-w-0 w-full bg-transparent px-2 text-xs outline-none placeholder:text-muted" />
          </form>

          <div className="relative hidden md:block xl:hidden">
            {searchOpen ? (
              <form onSubmit={submitSearch} className="absolute right-0 top-0 flex h-10 w-56 items-center rounded-full border border-ink bg-white px-3 shadow-lg fade-in">
                <SearchIcon width={15} height={15} className="shrink-0 text-muted" />
                <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} onBlur={() => !query && setSearchOpen(false)} placeholder="Search" className="w-full bg-transparent px-2 text-xs outline-none" />
              </form>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="btn-icon" aria-label="Search"><SearchIcon width={18} height={18} /></button>
            )}
          </div>

          <Link to="/wishlist" className="btn-icon relative hidden sm:flex" aria-label="Wishlist">
            <HeartIcon width={18} height={18} />
            {wishlist?.length > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-clay px-1 text-[9px] font-bold text-white">{wishlist.length}</span>}
          </Link>

          <Link to="/cart" className="btn-icon relative" aria-label="Cart">
            <BagIcon width={18} height={18} />
            {cartCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-clay px-1 text-[9px] font-bold text-white">{cartCount}</span>}
          </Link>

          <div className="relative">
            <button onClick={() => setUserMenuOpen((open) => !open)} className="btn-icon" aria-label="Account"><UserIcon width={18} height={18} /></button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-3 w-56 overflow-hidden rounded-sm border border-sand bg-white text-sm shadow-xl fade-in-up z-10" onMouseLeave={closeUserMenu}>
                {user ? (
                  <>
                    <p className="border-b border-sand px-4 py-3 text-xs text-muted">Welcome back, <span className="font-semibold text-ink">{user.name.split(' ')[0]}</span></p>
                    <Link to="/profile" onClick={closeUserMenu} className="block px-4 py-3 transition-colors hover:bg-cream">My orders</Link>
                    <button onClick={() => { logout(); closeUserMenu(); navigate('/'); }} className="w-full border-t border-sand px-4 py-3 text-left transition-colors hover:bg-cream">Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={closeUserMenu} className="block px-4 py-3 transition-colors hover:bg-cream">Login</Link>
                    <Link to="/register" onClick={closeUserMenu} className="block border-t border-sand px-4 py-3 transition-colors hover:bg-cream">Create account</Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={submitSearch} className="container-x flex h-11 items-center rounded-none border-x border-t border-sand bg-white px-3 md:hidden">
        <SearchIcon width={16} height={16} className="shrink-0 text-muted" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search shirts, colours and more" className="w-full bg-transparent px-2 text-sm outline-none placeholder:text-muted" />
      </form>

      <div className={`fixed inset-0 z-[60] transition-opacity duration-300 lg:hidden ${menuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
        <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
        <div className={`absolute left-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-[#fbfaf8] shadow-2xl transition-transform duration-300 ease-out ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex h-20 items-center justify-between border-b border-sand px-6">
            <span className="flex items-center gap-2 font-serif text-2xl font-bold tracking-[-0.07em]"><span className="h-2 w-2 rounded-full bg-clay" />KOORM</span>
            <button onClick={() => setMenuOpen(false)} aria-label="Close menu" className="btn-icon h-9 w-9"><CloseIcon width={18} height={18} /></button>
          </div>
          <p className="px-6 pt-7 text-[12px] font-bold uppercase tracking-[0.18em] text-accent">Browse the collection</p>
          <nav className="px-6 pt-3">
            {NAV_LINKS.map((link) => (
              <Link key={link.label} to={link.to} onClick={() => setMenuOpen(false)} className="flex items-center justify-between border-b border-sand/70 py-4 text-sm font-medium">
                {link.label}<ChevronRightIcon width={16} height={16} className="text-muted" />
              </Link>
            ))}
            <Link to="/wishlist" onClick={() => setMenuOpen(false)} className="mt-2 flex items-center gap-2 py-4 text-sm"><HeartIcon width={16} height={16} /> Wishlist</Link>
            {!user && <div className="mt-4 flex gap-3"><Link to="/login" onClick={() => setMenuOpen(false)} className="btn-outline flex-1 px-3 py-2.5 text-[12px]">Login</Link><Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary flex-1 px-3 py-2.5 text-[12px]">Join Koorm</Link></div>}
          </nav>
          <div className="mt-auto bg-sand/35 p-6"><p className="font-serif text-lg">Made for the everyday.</p><p className="mt-1 text-xs leading-relaxed text-muted">Thoughtful pieces, easy returns, and delivery across India.</p></div>
        </div>
      </div>
    </header>
  );
}
