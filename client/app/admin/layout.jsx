export const metadata = { robots: { index: false, follow: false } };

export default function AdminShellLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
