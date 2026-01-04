import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const markets = await prisma.market.findMany({
      orderBy: [
        { status: 'asc' },
        { resolutionDate: 'asc' },
      ],
    });

    return NextResponse.json({ markets });
  } catch (error) {
    console.error('Markets fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
