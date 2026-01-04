import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculatePrices } from '@/lib/amm';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: {
        positions: {
          where: {
            shares: { gt: 0 },
          },
          include: {
            market: true,
          },
        },
        trades: {
          orderBy: { timestamp: 'desc' },
          take: 20,
          include: {
            market: {
              select: {
                titleKa: true,
                titleEn: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate current value and P&L for each position
    const positionsWithValue = user.positions.map((position) => {
      const { yesPrice, noPrice } = calculatePrices({
        yesLiquidity: position.market.yesLiquidity,
        noLiquidity: position.market.noLiquidity,
      });

      const currentPrice = position.isYes ? yesPrice : noPrice;
      const currentValue = position.shares * currentPrice;
      const costBasis = position.shares * position.avgPrice;
      const profitLoss = currentValue - costBasis;
      const profitLossPercent = (profitLoss / costBasis) * 100;

      return {
        ...position,
        currentPrice,
        currentValue,
        costBasis,
        profitLoss,
        profitLossPercent,
      };
    });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        balance: user.balance,
      },
      positions: positionsWithValue,
      trades: user.trades,
    });
  } catch (error) {
    console.error('Portfolio fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
