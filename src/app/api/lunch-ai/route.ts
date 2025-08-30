import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabaseClient';

// Define the structure for the request body
interface AIRequest {
  prompt: string;
  filters: {
    priceRanges?: string[];
    vegFriendly?: boolean;
  };
}

// Define the structure for the AI response
interface AIResponse {
  slug: string;
  reason: string;
}

// Define the structure for a place from the database
interface Place {
  id: number;
  slug: string;
  name: string;
  category: string;
  price_band: string;
  url: string;
  maps_url?: string;
  notes?: string;
  lat?: number;
  lon?: number;
  veg_friendly?: boolean;
}

// Define the structure for the final response
interface LunchAIResponse {
  places: Place[];
  explanations: string[];
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: AIRequest = await request.json();
    const { prompt, filters } = body;

    // Validate the request
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
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
    const placesContext = places.map(place => ({
      slug: place.slug,
      name: place.name,
      category: place.category,
      price_band: place.price_band,
      veg_friendly: place.veg_friendly || false,
      notes: place.notes || ''
    }));

    // Create the system message for the AI
    const systemMessage = `You are a lunch picker. Suggest 3 good places from this JSON dataset.

Available places:
${JSON.stringify(placesContext, null, 2)}

User request: ${prompt}
Additional filters: ${JSON.stringify(filters)}

Return ONLY valid JSON in this exact format:
[
  {
    "slug": "place-slug-here",
    "reason": "Why this place matches the user's request"
  }
]

The slug must match an existing place slug from the dataset. Choose places that best match the user's mood and constraints.`;

    // Call OpenAI API to get suggestions
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemMessage
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    // Extract the AI response
    const aiResponseText = completion.choices[0]?.message?.content;
    
    if (!aiResponseText) {
      throw new Error('No response from OpenAI');
    }

    // Try to parse the JSON response from the AI
    let aiResponse: AIResponse[];
    try {
      aiResponse = JSON.parse(aiResponseText);
    } catch {
      console.error('Failed to parse AI response:', aiResponseText);
      throw new Error('Invalid response format from AI');
    }

    // Validate the AI response structure
    if (!Array.isArray(aiResponse) || aiResponse.length === 0) {
      throw new Error('AI response is not a valid array');
    }

    // Ensure each item has the required fields
    aiResponse = aiResponse.filter(item => 
      item && typeof item === 'object' && 
      typeof item.slug === 'string' && 
      typeof item.reason === 'string'
    );

    if (aiResponse.length === 0) {
      throw new Error('No valid suggestions from AI');
    }

    // Filter places based on the AI suggestions
    const suggestedSlugs = aiResponse.map(item => item.slug);
    const suggestedPlaces = places.filter(place => 
      suggestedSlugs.includes(place.slug)
    );

    // Apply additional filters if specified
    let filteredPlaces = suggestedPlaces;
    
    if (filters.priceRanges && filters.priceRanges.length > 0) {
      filteredPlaces = filteredPlaces.filter(place => 
        filters.priceRanges!.includes(place.price_band)
      );
    }
    
    if (filters.vegFriendly) {
      filteredPlaces = filteredPlaces.filter(place => 
        place.veg_friendly === true
      );
    }

    // If filtering resulted in no results, fall back to the original suggestions
    if (filteredPlaces.length === 0) {
      filteredPlaces = suggestedPlaces;
    }

    // Get the explanations for the filtered places
    const explanations = filteredPlaces.map(place => {
      const aiItem = aiResponse.find(item => item.slug === place.slug);
      return aiItem?.reason || `Great choice: ${place.name}`;
    });

    // Prepare the response
    const response: LunchAIResponse = {
      places: filteredPlaces,
      explanations: explanations
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in lunch-ai API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
