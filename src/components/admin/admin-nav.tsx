"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen, CalendarDays, Coins, ExternalLink, FolderTree, HandHeart, Home, Landmark, Image as ImageIcon, LayoutDashboard, LayoutTemplate,
  LogOut, Mail, Megaphone, Menu, ScrollText, Shield, Users, UsersRound, Video, X,
} from "lucide-react";

interface Props {
  isAdmin: boolean; canEditContent: boolean; canReadPrayer: boolean; canManageFinance: boolean;
  user: { name: string; email: string; roles: string[] };
  signOut: () => Promise<void>;
}

export function AdminNav({ isAdmin, canEditContent, canReadPrayer, canManageFinance, user, signOut }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const groups: { title: string; items: { href: string; label: string; icon: React.ElementType; show: boolean }[] }[] = [
    { title: "", items: [{ href: "/admin", label: "Overview", icon: LayoutDashboard, show: true }] },
    {
      title: "Content",
      items: [
        { href: "/admin/identity", label: "Church Identity", icon: Landmark, show: canEditContent },
        { href: "/admin/homepage", label: "Homepage", icon: LayoutTemplate, show: canEditContent },
        { href: "/admin/ministries", label: "Ministries", icon: HandHeart, show: true },
        { href: "/admin/sermons", label: "Sermons", icon: Video, show: canEditContent },
        { href: "/admin/events", label: "Events", icon: CalendarDays, show: true },
        { href: "/admin/announcements", label: "Announcements", icon: Megaphone, show: canEditContent },
        { href: "/admin/gallery", label: "Gallery", icon: ImageIcon, show: true },
        { href: "/admin/leadership", label: "Leadership", icon: UsersRound, show: canEditContent },
        { href: "/admin/media", label: "Media library", icon: FolderTree, show: true },
      ],
    },
    {
      title: "Finance",
      items: [{ href: "/admin/giving", label: "Giving", icon: Coins, show: canManageFinance }],
    },
    {
      title: "Inbox",
      items: [
        { href: "/admin/prayer", label: "Prayer requests", icon: BookOpen, show: canReadPrayer },
        { href: "/admin/messages", label: "Messages & visits", icon: Mail, show: canEditContent },
        { href: "/admin/subscribers", label: "Subscribers", icon: Users, show: canEditContent },
      ],
    },
    {
      title: "Settings",
      items: [
        { href: "/admin/sermon-categories", label: "Sermon categories", icon: FolderTree, show: canEditContent },
        { href: "/admin/gallery-categories", label: "Gallery albums", icon: FolderTree, show: canEditContent },
        { href: "/admin/users", label: "Users & roles", icon: Shield, show: isAdmin },
        { href: "/admin/audit", label: "Audit log", icon: ScrollText, show: isAdmin },
      ],
    },
  ];

  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/"));

  return (
    <>
      <div className="flex items-center justify-between border-b border-line bg-white px-4 py-3 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2"><Image src="/media/brand/nlc-logo-color.png" alt="New Life" width={300} height={101} className="h-7 w-auto" /><span className="text-xs font-bold tracking-[0.2em] text-blue-deep">ADMIN</span></Link>
        <button type="button" onClick={() => setOpen(true)} className="flex h-10 w-10 items-center justify-center" aria-label="Open admin menu" aria-expanded={open}><Menu className="h-5 w-5" /></button>
      </div>
      {open && <div className="fixed inset-0 z-40 bg-ink/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[16.5rem] flex-col border-r border-line bg-white transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/admin" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <Image src="/media/brand/nlc-logo-color.png" alt="New Life" width={300} height={101} className="h-8 w-auto" />
            <span className="border-l border-line pl-2 text-[0.6rem] font-bold tracking-[0.24em] text-blue-deep">ADMIN</span>
          </Link>
          <button type="button" onClick={() => setOpen(false)} className="lg:hidden" aria-label="Close admin menu"><X className="h-5 w-5" /></button>
        </div>
        <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 pb-4">
          {groups.map((g) => {
            const items = g.items.filter((i) => i.show);
            if (!items.length) return null;
            return (
              <div key={g.title || "main"} className="mb-4">
                {g.title && <p className="px-3 pb-1.5 pt-2 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-muted">{g.title}</p>}
                <ul className="grid gap-0.5">
                  {items.map((i) => (
                    <li key={i.href}>
                      <Link href={i.href} onClick={() => setOpen(false)} aria-current={active(i.href) ? "page" : undefined}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${active(i.href) ? "bg-blue-deep text-white" : "text-ink/80 hover:bg-mist hover:text-ink"}`}>
                        <i.icon className="h-4 w-4 shrink-0" aria-hidden />{i.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          <Link href="/" target="_blank" className="mt-2 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-ink/80 hover:bg-mist"><Home className="h-4 w-4" aria-hidden />View website<ExternalLink className="ml-auto h-3.5 w-3.5" aria-hidden /></Link>
        </nav>
        <div className="border-t border-line p-4">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
          <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-blue-deep">{user.roles.join(" · ")}</p>
          <form action={signOut} className="mt-3">
            <button type="submit" className="flex items-center gap-2 text-sm text-muted hover:text-ink"><LogOut className="h-4 w-4" aria-hidden />Sign out</button>
          </form>
        </div>
      </aside>
    </>
  );
}
