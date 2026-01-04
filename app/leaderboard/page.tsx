import { prisma } from '@/lib/prisma';
import { formatLari } from '@/lib/utils';
import { calculatePrices } from '@/lib/amm';

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
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
      const { yesPrice, noPrice } = calculatePrices({
        yesLiquidity: position.market.yesLiquidity,
        noLiquidity: position.market.noLiquidity,
      });
      const price = position.isYes ? yesPrice : noPrice;
      portfolioValue += position.shares * price;
    }

    // Calculate total value (balance + portfolio)
    const totalValue = user.balance + portfolioValue;

    // Calculate profit/loss (started with 10000)
    const profitLoss = totalValue - 10000;

    return {
      username: user.username,
      balance: user.balance,
      portfolioValue,
      totalValue,
      profitLoss,
      profitLossPercent: (profitLoss / 10000) * 100,
      totalVolume,
      tradesCount: user.trades.length,
      activePositions: user.positions.length,
    };
  });

  // Sort by total value (highest first)
  leaderboard.sort((a, b) => b.totalValue - a.totalValue);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Leaderboard</h1>
        <p className="text-gray-400 georgian-text">ლიდერბორდი • Top Predictors</p>
      </div>

      {/* Trophy Section */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* 2nd Place */}
          <div className="md:order-1 bg-gradient-to-br from-gray-500/10 to-gray-600/10 border border-gray-500/20 rounded-lg p-6 text-center">
            <div className="text-4xl mb-3">🥈</div>
            <div className="text-2xl font-bold mb-2">{leaderboard[1].username}</div>
            <div className="text-3xl font-bold text-gray-400 mb-2">
              {formatLari(leaderboard[1].totalValue)}
            </div>
            <div className={`text-lg ${
              leaderboard[1].profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {leaderboard[1].profitLoss >= 0 ? '+' : ''}{leaderboard[1].profitLossPercent.toFixed(1)}%
            </div>
          </div>

          {/* 1st Place */}
          <div className="md:order-0 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-2 border-yellow-500/30 rounded-lg p-8 text-center transform md:scale-105">
            <div className="text-6xl mb-3">🏆</div>
            <div className="text-3xl font-bold mb-2">{leaderboard[0].username}</div>
            <div className="text-4xl font-bold text-yellow-400 mb-2">
              {formatLari(leaderboard[0].totalValue)}
            </div>
            <div className={`text-xl ${
              leaderboard[0].profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {leaderboard[0].profitLoss >= 0 ? '+' : ''}{leaderboard[0].profitLossPercent.toFixed(1)}%
            </div>
          </div>

          {/* 3rd Place */}
          <div className="md:order-2 bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-lg p-6 text-center">
            <div className="text-4xl mb-3">🥉</div>
            <div className="text-2xl font-bold mb-2">{leaderboard[2].username}</div>
            <div className="text-3xl font-bold text-orange-400 mb-2">
              {formatLari(leaderboard[2].totalValue)}
            </div>
            <div className={`text-lg ${
              leaderboard[2].profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {leaderboard[2].profitLoss >= 0 ? '+' : ''}{leaderboard[2].profitLossPercent.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Rank</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Trader</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">Total Value</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">Balance</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">Portfolio</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">P&L</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">Volume</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">Trades</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {leaderboard.map((trader, index) => (
                <tr key={trader.username} className="hover:bg-gray-800/30 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">#{index + 1}</span>
                      {index === 0 && <span>🏆</span>}
                      {index === 1 && <span>🥈</span>}
                      {index === 2 && <span>🥉</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold">{trader.username}</div>
                    <div className="text-xs text-gray-500">
                      {trader.activePositions} active positions
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-bold text-lg">{formatLari(trader.totalValue)}</div>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-400">
                    {formatLari(trader.balance)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-400">
                    {formatLari(trader.portfolioValue)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className={`font-semibold ${
                      trader.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {trader.profitLoss >= 0 ? '+' : ''}{formatLari(trader.profitLoss)}
                    </div>
                    <div className={`text-xs ${
                      trader.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {trader.profitLoss >= 0 ? '+' : ''}{trader.profitLossPercent.toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-400">
                    {formatLari(trader.totalVolume)}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold">
                    {trader.tradesCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {leaderboard.length === 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-12 text-center">
          <p className="text-gray-400">No traders yet. Be the first to start trading!</p>
        </div>
      )}
    </div>
  );
}
