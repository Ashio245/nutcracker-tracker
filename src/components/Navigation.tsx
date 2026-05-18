"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/app/login/actions";

export default function Navigation({ userRole }: { userRole?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute("data-theme") as
      | "light"
      | "dark";
    setTheme(currentTheme || "light");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    setTheme(newTheme);
  };

  const navLinks = [
    { href: "/", label: "Home", role: "all" },
    { href: "/nutcracker", label: "Dashboard", role: "all" },
    { href: "/admin/scraper", label: "Scraper", role: "admin" },
    { href: "/admin/users", label: "Team", role: "admin" },
    { href: "/update-password", label: "Security", role: "all" },
  ].filter((link) => link.role === "all" || link.role === userRole);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass h-14 flex items-center justify-center px-6">
      <div className="max-w-7xl w-full flex items-center justify-between">
        <Link
          href="/"
          className="text-[16px] font-bold tracking-tight text-main"
        >
          Nutcracker <span className="text-muted font-normal">AI</span>
        </Link>

        <div className="flex items-center gap-8">
          <div className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                  pathname === link.href
                    ? "bg-[var(--hover-bg)] text-main"
                    : "text-muted hover:text-main"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors border border-transparent hover:bg-[var(--hover-bg)]"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? (
              <svg
                className="w-4 h-4 fill-current text-main"
                viewBox="0 0 20 20"
              >
                <path d="M10 15a5 5 0 100-10 5 5 0 000 10zM10 0a1 1 0 011 1v1a1 1 0 11-2 0V1a1 1 0 011-1zM4.22 4.22a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM0 10a1 1 0 011-1h1a1 1 0 110 2H1a1 1 0 01-1-1zM4.22 15.78a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zM10 18a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM15.78 15.78a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM20 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 01-1 1zM15.78 4.22a1 1 0 010-1.414l.707-.707a1 1 0 011.414 1.414l-.707.707a1 1 0 01-1.414 0z" />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 fill-current text-main"
                viewBox="0 0 20 20"
              >
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>

          {userRole && (
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-muted hover:text-red-500 transition-colors ml-2"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
