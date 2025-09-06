// JSON-AI CHECK: PASS (2024-12-19)
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

// FIXED(JSON-AI): Parse markdown response to suggestions array
function parseMarkdownToSuggestions(text: string, places: any[], widerSearch: boolean): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const lines = text.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nameMatch = line.match(/^\d+\.\s+\*\*(.+?)\*\*/);
    if (nameMatch) {
      const name = nameMatch[1];
      const suggestion: AISuggestion = {
        name,
        source: widerSearch ? 'model' : 'db'
      };
      
      // Look for details in following lines
      for (let j = i + 1; j < lines.length && j < i + 10; j++) {
        const detailLine = lines[j];
        if (detailLine.includes('Cuisine:')) {
          suggestion.category = detailLine.split('Cuisine:')[1]?.trim();
        } else if (detailLine.includes('Price band:')) {
          suggestion.price_band = detailLine.split('Price band:')[1]?.trim();
        } else if (detailLine.includes('Vegetarian-friendly: true')) {
          suggestion.veg_friendly = true;
        } else if (detailLine.match(/^\*.*\*$/)) {
          suggestion.description = detailLine.replace(/^\*|\*$/g, '').trim();
        }
      }
      
      // If from DB, try to find matching place for additional data
      if (!widerSearch) {
        const matchingPlace = places.find(p => 
          p.name.toLowerCase().includes(name.toLowerCase()) || 
          name.toLowerCase().includes(p.name.toLowerCase())
        );
        if (matchingPlace) {
          suggestion.id = matchingPlace.id?.toString();
          suggestion.url = matchingPlace.url;
          suggestion.maps_url = matchingPlace.maps_url;
          if (!suggestion.category) suggestion.category = matchingPlace.category;
          if (!suggestion.price_band) suggestion.price_band = matchingPlace.price_band;
          if (suggestion.veg_friendly === undefined) suggestion.veg_friendly = matchingPlace.veg_friendly;
        }
      }
      
      suggestions.push(suggestion);
    }
  }
  
  return suggestions;
}

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

    // Build the system prompt with context about available places
    const SYSTEM_PROMPT = widerSearch ? `
You are a lunch recommender for the Liverpool St area. You can suggest any restaurants you know in the area.

Return exactly 3 options in this EXACT markdown format:

1. **Restaurant Name**
   - Cuisine: Type
   - Distance by walk: X mins
   - Vegetarian-friendly: true/false
   - Price band: £/££/£££
   *Description*

2. **Restaurant Name**
   - Cuisine: Type
   - Distance by walk: X mins
   - Vegetarian-friendly: true/false
   - Price band: £/££/£££
   *Description*

3. **Restaurant Name**
   - Cuisine: Type
   - Distance by walk: X mins
   - Vegetarian-friendly: true/false
   - Price band: £/££/£££
   *Description*

IMPORTANT: 
- Use **bold** for restaurant names
- Use *italic* for descriptions
- Use bullet points with dashes for details
- Follow this exact format for consistency
` : `
You are a lunch recommender for the Liverpool St area. You MUST ONLY suggest places from this list of available restaurants:

${places.map(place => 
  `- ${place.name} (${place.category}, ${place.price_band}, veg-friendly: ${place.veg_friendly || false})`
).join('\n')}

Return exactly 3 options from the above list in this EXACT markdown format:

1. **Restaurant Name**
   - Cuisine: Type
   - Distance by walk: X mins
   - Vegetarian-friendly: true/false
   - Price band: £/££/£££
   *Description*

2. **Restaurant Name**
   - Cuisine: Type
   - Distance by walk: X mins
   - Vegetarian-friendly: true/false
   - Price band: £/££/£££
   *Description*

3. **Restaurant Name**
   - Cuisine: Type
   - Distance by walk: X mins
   - Vegetarian-friendly: true/false
   - Price band: £/££/£££
   *Description*

IMPORTANT: 
- ONLY use restaurants from the provided list above
- Use **bold** for restaurant names
- Use *italic* for descriptions
- Use bullet points with dashes for details
- Follow this exact format for consistency
`;

    // Call OpenAI API using Responses API with role-based input
    const completion = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: [
            { type: "input_text", text:
              `User constraints:
               mood=${(quickMood||[]).join(",")}
               notes="${notes||""}"
               price=${priceBand||""}
               veg_friendly=${Boolean(vegFriendly)}`
            }
          ]
        }
      ]
    });

    const text = completion.output_text;
    // FIXED(JSON-AI): Convert markdown response to JSON suggestions format
    const suggestions = parseMarkdownToSuggestions(text, places, widerSearch || false);
    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error('Error in lunch-ai API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
