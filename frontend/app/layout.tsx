import { AuthProvider } from "./context/AuthContext";
import "./globals.css";

export const metadata = {
  title: "NexusCrawler Console",
  description: "Automated Multitenant Job Tracking Workspace",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}