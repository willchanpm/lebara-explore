import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createSupabaseServer } from '@/lib/supabase/server';

// Define the structure for the request body
interface AIRequest {
  quickMood?: string[];
  notes?: string;
  priceBand?: "£" | "££" | "£££";
  vegFriendly?: boolean;
  widerSearch?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: AIRequest = await request.json();
    const { quickMood, notes, priceBand, vegFriendly, widerSearch } = body;

    // Create a Supabase server client for database operations
    const supabase = await createSupabaseServer();

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
    return NextResponse.json({ result: text });

  } catch (error) {
    console.error('Error in lunch-ai API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
