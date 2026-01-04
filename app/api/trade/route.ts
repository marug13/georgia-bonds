import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getBuyQuote } from '@/lib/amm';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { marketId, isYes, shares } = body;

    if (!marketId || typeof isYes !== 'boolean' || !shares || shares <= 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get market
    const market = await prisma.market.findUnique({
      where: { id: marketId },
    });

    if (!market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }

    if (market.status !== 'OPEN') {
      return NextResponse.json({ error: 'Market is closed' }, { status: 400 });
    }

    // Calculate trade quote
    const quote = getBuyQuote(
      { yesLiquidity: market.yesLiquidity, noLiquidity: market.noLiquidity },
      isYes,
      shares
    );

    // Check if user has enough balance
    if (quote.totalCost > user.balance) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // Execute trade in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user balance
      await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: quote.totalCost } },
      });

      // Update market liquidity and volume
      await tx.market.update({
        where: { id: marketId },
        data: {
          yesLiquidity: quote.newYesLiquidity,
          noLiquidity: quote.newNoLiquidity,
          totalVolume: { increment: quote.totalCost },
        },
      });

      // Create or update position
      const existingPosition = await tx.position.findUnique({
        where: {
          userId_marketId_isYes: {
            userId: user.id,
            marketId,
            isYes,
          },
        },
      });

      if (existingPosition) {
        // Update existing position
        const totalShares = existingPosition.shares + shares;
        const totalCost = existingPosition.avgPrice * existingPosition.shares + quote.totalCost;
        const newAvgPrice = totalCost / totalShares;

        await tx.position.update({
          where: { id: existingPosition.id },
          data: {
            shares: totalShares,
            avgPrice: newAvgPrice,
          },
        });
      } else {
        // Create new position
        await tx.position.create({
          data: {
            userId: user.id,
            marketId,
            isYes,
            shares,
            avgPrice: quote.pricePerShare,
          },
        });
      }

      // Record trade
      const trade = await tx.trade.create({
        data: {
          userId: user.id,
          marketId,
          isYes,
          isBuy: true,
          shares,
          price: quote.pricePerShare,
          total: quote.totalCost,
        },
      });

      return trade;
    });

    return NextResponse.json({
      success: true,
      trade: result,
      quote,
    });
  } catch (error: any) {
    console.error('Trade error:', error);
    return NextResponse.json(
      { error: error.message || 'Trade failed' },
      { status: 500 }
    );
  }
}
