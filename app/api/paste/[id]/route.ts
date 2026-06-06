import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Paste from '@/models/Paste';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const paste = await Paste.findOne({ pasteId: id });

    if (!paste) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (new Date() > paste.expiresAt) return NextResponse.json({ error: 'Expired' }, { status: 404 });

    const responseData = {
      encryptedContent: paste.encryptedContent,
      iv: paste.iv,
      salt: paste.salt,
      burnAfterReading: paste.burnAfterReading,
      isMarkdown: paste.isMarkdown,
    };

    if (paste.burnAfterReading) await Paste.deleteOne({ _id: paste._id });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
