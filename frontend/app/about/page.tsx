import React from "react";

export default function AboutPage() {
  return (
    <main className="p-6 md:p-12 max-w-4xl mx-auto min-h-screen bg-slate-950 text-slate-100">
      <h1 className="text-3xl font-extrabold mb-4">About</h1>

      <section className="prose prose-invert">
        <p>
          Hi, I'm Vishal Yadav — a full stack developer from India who crafts scalable web
          applications, SaaS products, and AI-powered tools with clean architecture and
          thoughtful design.
        </p>

        <p>
          I build software that solves real problems. My work spans full-stack web
          apps, AI integrations, and research projects. I focus on shipping dependable
          systems with good UX, performant frontend code, and maintainable backend
          services.
        </p>

        <h2>Experience & Highlights</h2>
        <ul>
          <li>Software Developer Intern — Dhakad Innovations Pvt. Ltd (Jul 2025 – Mar 2026)</li>
          <li>Built VocifyNextGen — a full hiring platform with role-based access and APIs</li>
          <li>Worked on performance optimizations, lazy loading, and code splitting</li>
          <li>Research: AI-Based Face Recognition Attendance system (published)</li>
        </ul>

        <h2>Contact</h2>
        <p>
          Email: <a href="mailto:vishalyadav936969@gmail.com">vishalyadav936969@gmail.com</a>
          <br />
          Mobile: <a href="tel:+919369692770">+91-9369692770</a>
        </p>
      </section>
    </main>
  );
}
