import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { marketId, outcome } = body;

    if (!marketId || typeof outcome !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Get market
    const market = await prisma.market.findUnique({
      where: { id: marketId },
      include: {
        positions: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }

    if (market.status === 'RESOLVED') {
      return NextResponse.json({ error: 'Market already resolved' }, { status: 400 });
    }

    // Resolve market in a transaction
    await prisma.$transaction(async (tx) => {
      // Pay out winning positions
      for (const position of market.positions) {
        if (position.isYes === outcome && position.shares > 0) {
          // Winning shares pay out 1.00 each
          const payout = position.shares * 1.0;
          await tx.user.update({
            where: { id: position.userId },
            data: {
              balance: { increment: payout },
            },
          });
        }
        // Losing shares are worth 0, no payout needed
      }

      // Update market status
      await tx.market.update({
        where: { id: marketId },
        data: {
          status: 'RESOLVED',
        },
      });

      // Create resolution record
      await tx.resolution.create({
        data: {
          marketId,
          outcome,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Market resolved. ${outcome ? 'YES' : 'NO'} won.`,
    });
  } catch (error: any) {
    console.error('Resolution error:', error);
    return NextResponse.json(
      { error: error.message || 'Resolution failed' },
      { status: 500 }
    );
  }
}
