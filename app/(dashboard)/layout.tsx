"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Package, FileText, ImageUp } from "lucide-react";
import { ErrorBoundary } from "@/components/error-boundary";

const navItems = [
  { href: "/dashboard/productos", label: "Productos", icon: Package },
  { href: "/dashboard/pdf", label: "Generar PDF", icon: FileText },
  { href: "/dashboard/extraer-imagen", label: "Extraer de imagen", icon: ImageUp },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex" style={{ backgroundColor: "hsl(var(--background))" }}>
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 border-r bg-white" style={{ borderColor: "hsl(var(--border))" }}>
          <div className="flex flex-col h-full">
            <Link href="/dashboard/productos" className="flex items-center justify-center px-6 py-5 border-b" style={{ borderColor: "hsl(var(--border))" }}>
              <Image src="/img/logopng.png" alt="LicitIA" width={220} height={220} className="object-contain" />
            </Link>
            <nav className="flex-1 p-3 space-y-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}
