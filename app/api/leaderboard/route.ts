import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: {
        isAdmin: false,
      },
      select: {
        id: true,
        username: true,
        balance: true,
        createdAt: true,
        trades: {
          select: {
            total: true,
            isBuy: true,
          },
        },
        positions: {
          where: {
            shares: { gt: 0 },
          },
          include: {
            market: {
              select: {
                yesLiquidity: true,
                noLiquidity: true,
                status: true,
              },
            },
          },
        },
      },
    });

    // Calculate metrics for each user
    const leaderboard = users.map((user) => {
      // Calculate total volume traded
      const totalVolume = user.trades.reduce((sum, trade) => sum + trade.total, 0);

      // Calculate current portfolio value
      let portfolioValue = 0;
      for (const position of user.positions) {
        const total = position.market.yesLiquidity + position.market.noLiquidity;
        const price = position.isYes
          ? position.market.noLiquidity / total
          : position.market.yesLiquidity / total;
        portfolioValue += position.shares * price;
      }

      // Calculate total value (balance + portfolio)
      const totalValue = user.balance + portfolioValue;

      // Calculate profit/loss (started with 10000)
      const profitLoss = totalValue - 10000;

      // Calculate number of markets traded
      const marketsTraded = new Set(user.trades.map((t: any) => t.marketId)).size;

      return {
        username: user.username,
        balance: user.balance,
        portfolioValue,
        totalValue,
        profitLoss,
        profitLossPercent: (profitLoss / 10000) * 100,
        totalVolume,
        marketsTraded,
        tradesCount: user.trades.length,
      };
    });

    // Sort by total value (highest first)
    leaderboard.sort((a, b) => b.totalValue - a.totalValue);

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
