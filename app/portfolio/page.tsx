import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatLari, formatPercent, getCategoryNameKa } from '@/lib/utils';
import { calculatePrices } from '@/lib/amm';
import { format } from 'date-fns';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PortfolioPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
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
        orderBy: {
          updatedAt: 'desc',
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
    redirect('/auth/signin');
  }

  // Calculate portfolio metrics
  let totalValue = user.balance;
  let totalCost = 0;
  const positionsWithMetrics = user.positions.map((position) => {
    const { yesPrice, noPrice } = calculatePrices({
      yesLiquidity: position.market.yesLiquidity,
      noLiquidity: position.market.noLiquidity,
    });

    const currentPrice = position.isYes ? yesPrice : noPrice;
    const currentValue = position.shares * currentPrice;
    const costBasis = position.shares * position.avgPrice;
    const profitLoss = currentValue - costBasis;
    const profitLossPercent = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;

    totalValue += currentValue;
    totalCost += costBasis;

    return {
      ...position,
      currentPrice,
      currentValue,
      costBasis,
      profitLoss,
      profitLossPercent,
    };
  });

  const totalProfitLoss = totalValue - 10000; // Started with 10000
  const totalProfitLossPercent = (totalProfitLoss / 10000) * 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Portfolio</h1>
        <p className="text-gray-400 georgian-text">პორტფოლიო</p>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg p-6">
          <div className="text-gray-400 text-sm mb-1">Total Value</div>
          <div className="text-3xl font-bold text-blue-400">
            {formatLari(totalValue)}
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-6">
          <div className="text-gray-400 text-sm mb-1">Cash Balance</div>
          <div className="text-3xl font-bold text-green-400">
            {formatLari(user.balance)}
          </div>
        </div>
        <div className={`bg-gradient-to-br ${
          totalProfitLoss >= 0
            ? 'from-green-500/10 to-green-600/10 border-green-500/20'
            : 'from-red-500/10 to-red-600/10 border-red-500/20'
        } border rounded-lg p-6`}>
          <div className="text-gray-400 text-sm mb-1">Profit/Loss</div>
          <div className={`text-3xl font-bold ${
            totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {totalProfitLoss >= 0 ? '+' : ''}{formatLari(totalProfitLoss)}
          </div>
          <div className={`text-sm ${
            totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {totalProfitLossPercent >= 0 ? '+' : ''}{totalProfitLossPercent.toFixed(2)}%
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg p-6">
          <div className="text-gray-400 text-sm mb-1">Active Positions</div>
          <div className="text-3xl font-bold text-purple-400">
            {user.positions.length}
          </div>
        </div>
      </div>

      {/* Positions */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Your Positions</h2>
        {positionsWithMetrics.length > 0 ? (
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Market</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Side</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">Shares</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">Avg Price</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">Current</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">Value</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {positionsWithMetrics.map((position) => (
                    <tr key={position.id} className="hover:bg-gray-800/30 transition">
                      <td className="px-6 py-4">
                        <Link href={`/markets/${position.market.id}`} className="hover:text-blue-400 transition">
                          <div className="font-medium georgian-text">{position.market.titleKa}</div>
                          <div className="text-sm text-gray-500">{getCategoryNameKa(position.market.category)}</div>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          position.isYes
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {position.isYes ? 'YES' : 'NO'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold">
                        {position.shares.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-400">
                        {formatLari(position.avgPrice)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold">
                        {formatLari(position.currentPrice)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold">
                        {formatLari(position.currentValue)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`font-semibold ${
                          position.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {position.profitLoss >= 0 ? '+' : ''}{formatLari(position.profitLoss)}
                        </div>
                        <div className={`text-xs ${
                          position.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {position.profitLossPercent >= 0 ? '+' : ''}{position.profitLossPercent.toFixed(1)}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-12 text-center">
            <p className="text-gray-400 mb-4">You don't have any positions yet.</p>
            <Link
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
            >
              Browse Markets
            </Link>
          </div>
        )}
      </div>

      {/* Recent Trades */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Recent Trades</h2>
        {user.trades.length > 0 ? (
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg divide-y divide-gray-800">
            {user.trades.map((trade) => (
              <div key={trade.id} className="p-4 hover:bg-gray-800/30 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      trade.isYes
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {trade.isBuy ? 'BUY' : 'SELL'} {trade.isYes ? 'YES' : 'NO'}
                    </span>
                    <div>
                      <Link href={`/markets/${trade.marketId}`} className="font-medium georgian-text hover:text-blue-400">
                        {trade.market.titleKa}
                      </Link>
                      <div className="text-sm text-gray-500">
                        {trade.shares.toFixed(2)} shares @ {formatLari(trade.price)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatLari(trade.total)}</div>
                    <div className="text-xs text-gray-500">
                      {format(trade.timestamp, 'MMM dd, HH:mm')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-12 text-center">
            <p className="text-gray-400">No trades yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
