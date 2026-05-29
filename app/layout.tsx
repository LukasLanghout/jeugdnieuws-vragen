import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wat bespreken jullie aan tafel?",
  description: "Deel de vragen die jouw kind stelt over het nieuws",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body className="bg-orange-50 min-h-screen">
        <header className="bg-orange-500 text-white px-6 py-4 shadow">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <span className="text-2xl">📰</span>
            <div>
              <h1 className="font-bold text-lg leading-tight">Wat bespreken jullie aan tafel?</h1>
              <p className="text-orange-100 text-sm">Deel de vragen die jouw kind stelt over het nieuws</p>
            </div>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
