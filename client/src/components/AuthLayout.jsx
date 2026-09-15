export default function AuthLayout({ children }) {
  return <section className="auth-shell fade-in"><div className="auth-layout">
    <div className="auth-photo"><img src="/images/products/13/2.jpg" alt="The everyday Koorm shirt collection" width="1000" height="1333" /><div className="absolute inset-x-5 bottom-5 bg-cream/95 p-6"><p className="eyebrow mb-3">Welcome to Koorm</p><p className="font-serif text-3xl leading-tight">Good days start<br />with a great shirt.</p></div></div>
    <div className="auth-content"><p className="eyebrow mb-5">Your everyday, considered</p>{children}</div>
  </div></section>;
}
