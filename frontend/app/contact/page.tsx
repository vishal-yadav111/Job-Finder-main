import React from "react";

export default function ContactPage() {
  return (
    <main className="p-6 md:p-12 max-w-4xl mx-auto min-h-screen bg-slate-950 text-slate-100">
      <h1 className="text-3xl font-extrabold mb-4">Contact</h1>

      <section className="prose prose-invert">
        <p>If you'd like to get in touch, here are the best ways to reach me:</p>

        <ul>
          <li>Email: <a href="mailto:vishalyadav936969@gmail.com">vishalyadav936969@gmail.com</a></li>
          <li>Phone / WhatsApp: <a href="tel:+919369692770">+91-9369692770</a></li>
          <li>GitHub: <a href="https://github.com/vishal-yadav111" target="_blank" rel="noreferrer">github.com/vishal-yadav111</a></li>
          <li>LinkedIn: <a href="https://www.linkedin.com/in/vishalyadav" target="_blank" rel="noreferrer">linkedin.com/in/vishalyadav</a></li>
        </ul>
      </section>
    </main>
  );
}
