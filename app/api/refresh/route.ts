import { NextResponse } from 'next/server'

export async function POST() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://jeugdnieuws-vragen.vercel.app'
  const res = await fetch(`${baseUrl}/api/scrape`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.SCRAPE_SECRET}` },
  })
  const data = await res.json()
  return NextResponse.json(data)
}
