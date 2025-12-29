import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, field } = await req.json();

    if (!text || !field) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    const prompt = `Rewrite the following job ${field} to be more professional, engaging, and clear. Keep the tone suitable for a modern tech job listing.
    
    Original Text:
    ${text}
    
    Rewritten Version:`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo', // Or any other cheap/fast model available on OpenRouter
        messages: [
          {
            role: 'system',
            content: 'You are a professional HR copywriter. You rewrite job descriptions and requirements to be clear, inclusive, and exciting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to fetch from OpenRouter');
    }

    const data = await response.json();
    const rewrittenText = data.choices[0]?.message?.content?.trim();

    return NextResponse.json({ rewrittenText });
  } catch (error: any) {
    console.error('AI Rewrite Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
