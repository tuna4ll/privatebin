import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import Paste from '@/models/Paste';
import { rateLimit } from '@/lib/rate-limit';

const MAX_SIZE = 1 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    if (!rateLimit(ip, 5, 60000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { encryptedContent, iv, salt, expiresIn, burnAfterReading, isMarkdown } = await req.json();

    if (!encryptedContent || !iv || !expiresIn) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (encryptedContent.length > MAX_SIZE) {
      return NextResponse.json({ error: 'Paste size exceeds 1MB limit' }, { status: 400 });
    }

    await dbConnect();

    const pasteId = crypto.randomBytes(4).toString('hex');
    const expirationDate = new Date();
    
    switch (expiresIn) {
      case '10m':
        expirationDate.setMinutes(expirationDate.getMinutes() + 10);
        break;
      case '1h':
        expirationDate.setHours(expirationDate.getHours() + 1);
        break;
      case '1d':
        expirationDate.setDate(expirationDate.getDate() + 1);
        break;
      default:
        return NextResponse.json({ error: 'Invalid expiration time' }, { status: 400 });
    }

    const paste = await Paste.create({
      pasteId,
      encryptedContent,
      iv,
      salt,
      isMarkdown,
      expiresAt: expirationDate,
      burnAfterReading,
    });

    return NextResponse.json({ pasteId: paste.pasteId });
  } catch (error) {
    console.error('Error creating paste:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
