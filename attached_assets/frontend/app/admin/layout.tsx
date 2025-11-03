"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminGuard from "@/components/AdminGuard";
const links = [
  { href: "/admin/legal/zipmap", label: "ZIP → State Map" },
  { href: "/admin/legal/welcome", label: "Welcome Templates" },
  { href: "/admin/jobs/fill-states", label: "Bulk Fill States" },
  { href: "/admin/smtp", label: "SMTP Settings" },
];
export default function AdminLayout({ children }: { children: React.ReactNode }){
  const path = usePathname();
  return (<AdminGuard><div className="min-h-screen grid grid-cols-1 md:grid-cols-[240px_1fr]">
    <aside className="border-r p-4 space-y-4">
      <div className="text-lg font-bold">Admin</div>
      <nav className="space-y-1">
        {links.map(l => {
          const active = path?.startsWith(l.href);
          return (<Link key={l.href} href={l.href} className={`block px-3 py-2 rounded ${active ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>{l.label}</Link>);
        })}
      </nav>
      <div className="pt-4 border-t text-xs text-gray-500">
        <div>Role is read from <code>localStorage.role</code>.</div>
      </div>
    </aside>
    <section className="min-h-screen">{children}</section>
  </div></AdminGuard>);
}
