import { NextRequest, NextResponse } from 'next/server';

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

export async function POST(req: NextRequest) {
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json(
      { success: false, error: 'APPS_SCRIPT_URL environment variable is not set. Add it to .env.local' },
      { status: 500 },
    );
  }

  try {
    const body = await req.json();

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      redirect: 'follow', // Apps Script redirects once to the actual response
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'Apps Script responded with status ' + response.status },
        { status: 502 },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    appsScriptConfigured: !!APPS_SCRIPT_URL,
  });
}
