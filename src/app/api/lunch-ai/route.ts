// LINKS-GUARANTEE: website + maps for every suggestion (2024-12-19)
// WEBSITE-GATE: model websites omitted unless official (2024-12-19)
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabaseClient';

// Define the structure for the request body
interface AIRequest {
  quickMood?: string[];
  notes?: string;
  priceBand?: "£" | "££" | "£££";
  vegFriendly?: boolean;
  widerSearch?: boolean;
}

// Define suggestion structure
interface AISuggestion {
  id?: string;
  name: string;
  category?: string;
  price_band?: string;
  veg_friendly?: boolean;
  description?: string;
  url?: string;
  maps_url?: string;
  source: 'db' | 'model';
}

// WEBSITE-GATE: omit low-confidence website links (2024-12-19)
const DISALLOWED_HOSTS = [
  'deliveroo.co.uk','ubereats.com','just-eat.co.uk','doordash.com',
  'thefork.co.uk','opentable.co.uk','resy.com',
  'facebook.com','instagram.com','tiktok.com','linktr.ee','links.to',
  'yelp.com','tripadvisor.co.uk','timeout.com',
  'wixsite.com','square.site','sites.google.com','bit.ly','cutt.ly','tinyurl.com'
];
const BAD_PATH_SNIPPETS = ['utm_','gclid','fbclid','trk','campaign','ref=','?ref=','lander','landing'];
const STOPWORDS = new Set(['the','restaurant','cafe','bar','kitchen','co','ltd','limited','&','and']);

function tokensFromName(name: string): string[] {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g,' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOPWORDS.has(t));
}

function isOfficialWebsite(name: string, url: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase().replace(/^www\./,'');
    if (DISALLOWED_HOSTS.some(h => host.endsWith(h))) return false;
    const path = (u.pathname || '').toLowerCase();
    if (BAD_PATH_SNIPPETS.some(sn => path.includes(sn))) return false;
    // Heuristic: domain should contain at least one brand token
    const brand = tokensFromName(name);
    const hostNoDots = host.replace(/\./g,' ');
    const hit = brand.some(t => hostNoDots.includes(t));
    return hit;
  } catch {
    return false;
  }
}


// Helper function to generate deterministic Maps search URL
const mapsSearch = (name: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' near Liverpool Street London')}`;

// Normalize model response with safe fallbacks
const normaliseModel = (s: unknown): AISuggestion => {
  // Type guard to check if s is an object with expected properties
  const isObject = (obj: unknown): obj is Record<string, unknown> => 
    typeof obj === 'object' && obj !== null;
  
  const name = isObject(s) && typeof s.name === 'string' ? s.name.trim() : '';
  let url = isObject(s) && typeof s.url === 'string' ? s.url.trim() : '';
  let maps_url = isObject(s) && typeof s.maps_url === 'string' ? s.maps_url.trim() : '';

  // Always provide a Maps link; fallback to deterministic search
  if (!/^https:\/\/www\.google\.com\/maps\//.test(maps_url)) {
    maps_url = mapsSearch(name);
  }

  // Only keep url if confidently official
  if (!isOfficialWebsite(name, url)) {
    url = '';
  }

  return {
    name,
    category: isObject(s) && typeof s.category === 'string' ? s.category : undefined,
    price_band: isObject(s) && typeof s.price_band === 'string' ? s.price_band : undefined,
    veg_friendly: isObject(s) ? Boolean(s.veg_friendly) : false,
    description: isObject(s) && typeof s.description === 'string' ? s.description : undefined,
    url,
    maps_url,
    source: 'model'
  };
};


export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: AIRequest = await request.json();
    const { quickMood, notes, priceBand, vegFriendly, widerSearch } = body;

    // Build a compact instruction string for redundancy
    const uiSummary = [
      quickMood?.length ? `mood=${quickMood.join(",")}` : null,
      notes ? `notes="${notes}"` : null,
      priceBand ? `price=${priceBand}` : null,
      vegFriendly ? "veg_friendly=true" : null,
    ].filter(Boolean).join(" | ");

    // Validate that we have some input
    if (!uiSummary) {
      return NextResponse.json(
        { error: 'At least one preference or constraint is required' },
        { status: 400 }
      );
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Fetch all places from the database to provide context to the AI
    const { data: places, error: placesError } = await supabase
      .from('places')
      .select('*');

    if (placesError) {
      console.error('Error fetching places:', placesError);
      return NextResponse.json(
        { error: 'Failed to fetch places from database' },
        { status: 500 }
      );
    }

    if (!places || places.length === 0) {
      return NextResponse.json(
        { error: 'No places found in database' },
        { status: 404 }
      );
    }

    // Build DB context for model to reuse known links
    const dbContext = places.map(place => ({
      name: place.name,
      url: place.url ?? '',
      maps_url: place.maps_url ?? ''
    }));

    // System prompt for JSON schema compliance
    const SYSTEM_PROMPT = `You recommend lunch spots near Liverpool Street, London. Reply with JSON only matching the schema.

Linking policy: url = official website only; if not ≥95% certain, set "".
maps_url must always be a Google Maps link. Prefer the exact Place URL; otherwise return a deterministic search link:
https://www.google.com/maps/search/?api=1&query=<ENCODED_NAME>+near+Liverpool+Street+London.
If a candidate matches a DB entry by name (case-insensitive), copy url and maps_url exactly from DB context. Never invent links.`;

    // User message with constraints and DB context
    const userMessage = `User constraints:
mood=${(quickMood||[]).join(",")}
notes="${notes||""}"
price=${priceBand||""}
veg_friendly=${Boolean(vegFriendly)}

DB_CONTEXT:
${JSON.stringify(dbContext, null, 2)}`;

    // Call OpenAI API with JSON schema
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          strict: false,
          name: "LunchSuggestions",
          schema: {
            type: "object",
            required: ["suggestions"],
            properties: {
              suggestions: {
                type: "array",
                minItems: 3,
                maxItems: 3,
                items: {
                  type: "object",
                  required: ["name", "maps_url", "url"],
                  properties: {
                    name: { type: "string", minLength: 1 },
                    category: { type: "string" },
                    price_band: { type: "string", enum: ["£", "££", "£££", "££££"] },
                    veg_friendly: { type: "boolean" },
                    description: { type: "string" },
                    url: { type: "string" },
                    maps_url: { type: "string", pattern: "^https://www\\.google\\.com/maps/" }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Parse the JSON response
    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    const parsedResponse = JSON.parse(responseText);
    const modelSuggestions = parsedResponse.suggestions || [];

    // Normalize model suggestions
    const normalizedModelSuggestions = modelSuggestions.map(normaliseModel);

    // Create DB suggestions with exact links
    const dbSuggestions: AISuggestion[] = places.map(place => ({
      id: place.id?.toString(),
      name: place.name,
      category: place.category,
      price_band: place.price_band,
      veg_friendly: place.veg_friendly ?? false,
      description: place.notes,
      url: place.url ?? '',
      maps_url: place.maps_url ?? (place.lat && place.lon ? 
        `https://www.google.com/maps?q=${place.lat},${place.lon}` : 
        mapsSearch(place.name)
      ),
      source: 'db'
    }));


    // Clean and de-duplicate lists
    const cleanDbSuggestions: AISuggestion[] = [];
    const seenDb = new Set<string>();
    
    for (const suggestion of dbSuggestions) {
      const key = suggestion.maps_url?.toLowerCase() || suggestion.name.toLowerCase();
      if (!seenDb.has(key)) {
        seenDb.add(key);
        cleanDbSuggestions.push(suggestion);
      }
    }

    const cleanModelSuggestions: AISuggestion[] = [];
    const seenModel = new Set<string>();
    
    for (const suggestion of normalizedModelSuggestions) {
      const key = suggestion.maps_url?.toLowerCase() || suggestion.name.toLowerCase();
      // Skip if already in DB list (DB preferred)
      if (!seenDb.has(key) && !seenModel.has(key)) {
        seenModel.add(key);
        cleanModelSuggestions.push(suggestion);
      }
    }

    // Compose final suggestions based on widerSearch
    let allSuggestions: AISuggestion[] = [];

    if (widerSearch) {
      // 2:1 mix in order DB, MODEL, DB
      const dbCount = Math.min(2, cleanDbSuggestions.length);
      const modelCount = Math.min(1, cleanModelSuggestions.length);
      
      // Add DB suggestions first
      allSuggestions.push(...cleanDbSuggestions.slice(0, dbCount));
      
      // Add model suggestions
      allSuggestions.push(...cleanModelSuggestions.slice(0, modelCount));
      
      // Fill remaining slots from whichever side has more
      const remaining = 3 - allSuggestions.length;
      if (remaining > 0) {
        const moreDb = cleanDbSuggestions.slice(dbCount);
        const moreModel = cleanModelSuggestions.slice(modelCount);
        const combined = [...moreDb, ...moreModel];
        allSuggestions.push(...combined.slice(0, remaining));
      }
    } else {
      // DB only - top 3 most relevant
      allSuggestions = cleanDbSuggestions.slice(0, 3);
    }

    // Enforce exactly 3 items
    allSuggestions = allSuggestions.slice(0, 3);

    // Add trace for debugging
    const trace = `composition: ${widerSearch ? 'mixed' : 'db-only'}; db:${cleanDbSuggestions.length}; model:${cleanModelSuggestions.length}; final:${allSuggestions.length}${widerSearch ? ' website_gate:model' : ''}`;

    return NextResponse.json({ 
      suggestions: allSuggestions,
      trace 
    });

  } catch (error) {
    console.error('Error in lunch-ai API:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
