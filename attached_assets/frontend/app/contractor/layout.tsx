"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
function ContractorGuard({ children }: { children: React.ReactNode }){
  if (typeof window === 'undefined') return children as any;
  const role = (localStorage.getItem('role') || '').toLowerCase();
  if (role === 'contractor' || role === 'admin') return <>{children}</>;
  return (<main className="p-8 max-w-xl mx-auto space-y-3"><h1 className="text-xl font-semibold">Access restricted</h1><p className="text-sm text-gray-600">Only contractors (or admins) can view this page.</p></main>);
}
const links = [
  { href: "/contractor/jobs/A1", label: "Jobs" },
  { href: "/contractor/profile", label: "Profile (coming soon)" },
];
export default function ContractorLayout({ children }: { children: React.ReactNode }){
  const path = usePathname();
  return (<ContractorGuard><div className="min-h-screen grid grid-cols-1 md:grid-cols-[220px_1fr]">
    <aside className="border-r p-4 space-y-4">
      <div className="text-lg font-bold">Contractor</div>
      <nav className="space-y-1">
        {links.map(l => {
          const active = path?.startsWith(l.href);
          return (<Link key={l.href} href={l.href} className={`block px-3 py-2 rounded ${active ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>{l.label}</Link>);
        })}
      </nav>
    </aside>
    <section className="min-h-screen">{children}</section>
  </div></ContractorGuard>);
}
