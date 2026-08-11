import Link from "next/link";

const links = [
  { href: "/", label: "Catat Roti" },
  { href: "/daftar", label: "Daftar Harian" },
  { href: "/admin", label: "Admin" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white">
      <nav className="mx-auto flex max-w-3xl items-center gap-1 px-4 py-2">
        <span className="mr-2 font-semibold text-zinc-900">iSeya</span>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
