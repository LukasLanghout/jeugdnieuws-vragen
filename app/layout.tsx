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
      <body style={{ background: '#f8f7f4', minHeight: '100vh' }}>
        <header style={{ background: 'white', borderBottom: '1px solid #e8e4de', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #f97316, #fb923c)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                🗞️
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#1a1a1a', lineHeight: 1.1 }}>Tafelvragen</div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>Jeugdjournaal voor thuis</div>
              </div>
            </Link>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Link
                  href="/profiel"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', padding: '6px 12px', background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 10, transition: 'background 0.15s' }}
                >
                  <div style={{ width: 26, height: 26, background: 'linear-gradient(135deg, #f97316, #fb923c)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'white', fontWeight: 700, flexShrink: 0 }}>
                    {user.email?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#c2410c' }}>Mijn dagboek</span>
                </Link>
              </div>
            ) : (
              <Link href="/login" style={{ fontSize: 13, fontWeight: 600, color: '#f97316', textDecoration: 'none', padding: '7px 16px', background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 10 }}>
                Inloggen
              </Link>
            )}
          </div>
        </header>
        <main style={{ maxWidth: 720, margin: '0 auto', padding: '28px 20px 60px' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
