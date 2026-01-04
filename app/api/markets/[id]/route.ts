import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculatePrices } from '@/lib/amm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const market = await prisma.market.findUnique({
      where: { id: params.id },
      include: {
        trades: {
          orderBy: { timestamp: 'desc' },
          take: 50,
          include: {
            user: {
              select: { username: true },
            },
          },
        },
      },
    });

    if (!market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }

    // Calculate price history from trades
    const priceHistory = [];
    let yesLiq = 5000; // Starting liquidity
    let noLiq = 5000;

    for (const trade of market.trades.reverse()) {
      const { yesPrice, noPrice } = calculatePrices({
        yesLiquidity: yesLiq,
        noLiquidity: noLiq,
      });

      priceHistory.push({
        timestamp: trade.timestamp,
        yesPrice,
        noPrice,
      });

      // Update liquidity based on trade (simplified)
      if (trade.isBuy) {
        if (trade.isYes) {
          yesLiq -= trade.shares;
          noLiq += trade.total;
        } else {
          noLiq -= trade.shares;
          yesLiq += trade.total;
        }
      }
    }

    return NextResponse.json({
      market,
      priceHistory,
    });
  } catch (error) {
    console.error('Market fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
