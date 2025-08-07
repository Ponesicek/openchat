import { NextResponse } from "next/server";
import fs from 'fs';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    if (!location) {
        return NextResponse.json({ error: 'Location is required' }, { status: 400 });
    }
    const image = fs.readFileSync(location);
    if (!image) {
        return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }
    return new Response(image, { headers: { 'Content-Type': 'image/png' } });
}