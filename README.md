# Wat bespreken jullie aan tafel?

Een webapp voor ouders van kinderen in groep 3-8 om vragen te delen die hun kind stelt over het nieuws.

## Setup

### 1. Installeer dependencies
```
npm install
```

### 2. Environment variables
Maak een `.env.local` aan (staat er al in voor development) of voeg toe aan Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://gdfstllxseogzaxycunt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=<haal op uit Supabase dashboard > Settings > API>
SCRAPE_SECRET=<verzin een geheim wachtwoord voor de scraper>
```

### 3. Deploy naar Vercel
```
npx vercel deploy --prod
```
Of verbind je GitHub repo met Vercel.

### 4. Stel Supabase auth in
Ga naar Supabase dashboard > Authentication > URL Configuration:
- Site URL: `https://jouw-app.vercel.app`
- Redirect URLs: `https://jouw-app.vercel.app/auth/callback`

## Jeugdjournaal scraper activeren

Roep de scraper aan met:
```
curl -X POST https://jouw-app.vercel.app/api/scrape \
  -H "Authorization: Bearer <SCRAPE_SECRET>"
```

Je kunt dit automatiseren met een cronjob (bijv. via Vercel Cron of een externe service).

## Handmatig artikel toevoegen

Via Supabase Studio (Table Editor > articles):
- title, summary, image_url, source_url, published_at
