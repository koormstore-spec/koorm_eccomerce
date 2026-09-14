import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

const LINKS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/orders', label: 'Orders' },
];

export default function AdminLayout({ children }) {
  const { admin, adminLogout } = useAdminAuth();
  const navigate = useNavigate();

  return (
    <div className="container-x py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="section-title">Admin Panel</h1>
        {admin && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-ink/60">Signed in as {admin.name}</span>
            <button
              onClick={() => {
                adminLogout();
                navigate('/admin/login');
              }}
              className="btn-outline text-xs py-2 px-4"
            >
              Logout
            </button>
          </div>
        )}
      </div>
      <div className="flex gap-8">
        <aside className="w-48 shrink-0 space-y-1">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `block px-4 py-2 text-sm border ${
                  isActive ? 'bg-ink text-cream border-ink' : 'border-sand hover:border-ink'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </aside>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
