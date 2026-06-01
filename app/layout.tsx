import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Tafelvragen",
  description: "Nieuwsberichten van het Jeugdjournaal — deel de vragen die jouw kind stelt",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="nl">
      <body>
        <header style={{
          background: 'white',
          borderBottom: '2px solid #ede8e0',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 20px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
              <div style={{
                width: 40, height: 40,
                background: '#f97316',
                borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
                boxShadow: '0 3px 0 0 rgba(0,0,0,0.18)',
                flexShrink: 0,
              }}>🗞️</div>
              <div>
                <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 700, fontSize: 20, color: '#1a1209', lineHeight: 1, letterSpacing: '-0.3px' }}>
                  Tafelvragen
                </div>
                <div style={{ fontSize: 10.5, color: '#9c8b78', fontWeight: 500, marginTop: 2, letterSpacing: '0.03em' }}>
                  JEUGDJOURNAAL VOOR THUIS
                </div>
              </div>
            </Link>

            {user ? (
              <Link href="/profiel" style={{
                display: 'flex', alignItems: 'center', gap: 8,
                textDecoration: 'none',
                padding: '7px 14px',
                background: '#f97316',
                borderRadius: 12,
                boxShadow: '0 3px 0 0 rgba(0,0,0,0.18)',
                transition: 'transform 0.1s, box-shadow 0.1s',
              }}>
                <div style={{
                  width: 24, height: 24,
                  background: 'rgba(255,255,255,0.25)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, color: 'white', fontWeight: 800,
                }}>
                  {user.email?.[0]?.toUpperCase() ?? '?'}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>Mijn dagboek</span>
              </Link>
            ) : (
              <Link href="/login" style={{
                fontSize: 13, fontWeight: 700, color: '#f97316',
                textDecoration: 'none',
                padding: '7px 16px',
                background: 'white',
                border: '2px solid #f97316',
                borderRadius: 12,
                boxShadow: '0 3px 0 0 #fed7aa',
              }}>
                Inloggen
              </Link>
            )}
          </div>
        </header>

        <main style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px 80px' }}>
          {children}
        </main>

        <footer style={{ borderTop: '2px solid #ede8e0', background: 'white', padding: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#b0a090', margin: 0 }}>
            Tafelvragen · Nieuws van{' '}
            <a href="https://jeugdjournaal.nl" target="_blank" style={{ color: '#f97316', textDecoration: 'none', fontWeight: 600 }}>
              Jeugdjournaal.nl
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
