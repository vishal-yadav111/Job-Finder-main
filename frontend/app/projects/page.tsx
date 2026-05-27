import React from "react";

export default function ProjectsPage() {
  return (
    <main className="p-6 md:p-12 max-w-4xl mx-auto min-h-screen bg-slate-950 text-slate-100">
      <h1 className="text-3xl font-extrabold mb-4">Selected Projects</h1>

      <section className="prose prose-invert">
        <p>Real challenges, real solutions — built with care and shipped with purpose.</p>

        <ul>
          <li>
            <strong>Quick AI</strong> — SaaS web application with AI integrations, auth,
            and subscription payments.
          </li>
          <li>
            <strong>iVocifyNextGen</strong> — Job application / hiring platform built
            with Next.js and TypeScript.
          </li>
          <li>
            <strong>Face Recognition Attendance</strong> — ML + hardware integration using
            OpenCV and Raspberry Pi; published research.
          </li>
        </ul>

        <p>
          For full project pages and links, see the portfolio: <a href="https://vishal-portfolio-gamma-six.vercel.app/projects" target="_blank" rel="noreferrer">View all projects</a>
        </p>
      </section>
    </main>
  );
}
