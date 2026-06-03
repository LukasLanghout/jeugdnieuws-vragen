import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { title, content, summary } = await req.json()
  const text = [title, summary, content?.slice(0, 1200)].filter(Boolean).join('\n\n')

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `Je helpt ouders om moeilijke nieuwsonderwerpen bespreekbaar te maken aan het avondeten. Schrijf een korte, neutrale "rode draad" van maximaal 4 zinnen die: de kern van het onderwerp helder uitlegt zonder bias of oordeel, meerdere perspectieven noemt als die er zijn, en concrete gespreksopeners geeft voor ouders. Geschikt voor kinderen van 8-14 jaar. Schrijf in eenvoudig, warm Nederlands. Geen opsomming, gewoon lopende tekst.`,
        },
        { role: 'user', content: `Nieuwsartikel:\n${text}` },
      ],
      max_tokens: 250,
      temperature: 0.4,
    }),
  })

  if (!res.ok) return NextResponse.json({ error: 'AI niet beschikbaar' }, { status: 500 })
  const data = await res.json()
  return NextResponse.json({ explanation: data.choices?.[0]?.message?.content ?? '' })
}
