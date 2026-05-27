"use client";

import Link from "next/link";
import React from "react";

export function Header() {
  return (
    <header className="w-full bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-emerald-500 flex items-center justify-center text-slate-900 font-bold">JF</div>
          <div>
            <div className="text-sm font-semibold text-slate-100">Job Finder</div>
            <div className="text-[11px] text-slate-400">Pipeline Console</div>
          </div>
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/" className="text-sm text-slate-200 hover:text-emerald-300">Home</Link>
          <Link href="/ai-communication" className="text-sm text-slate-200 hover:text-emerald-300">AI Communication</Link>
          <Link href="/projects" className="text-sm text-slate-200 hover:text-emerald-300">Projects</Link>
          <Link href="/outreach" className="text-sm text-slate-200 hover:text-emerald-300">Outreach</Link>
          <Link href="/about" className="text-sm text-slate-200 hover:text-emerald-300">About</Link>
          <Link href="/contact" className="text-sm text-slate-200 hover:text-emerald-300">Contact</Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
