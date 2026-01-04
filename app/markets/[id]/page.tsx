import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TradePanel } from '@/components/TradePanel';
import { PriceChart } from '@/components/PriceChart';
import { formatLari, formatPercent, getTimeRemaining, getCategoryNameKa, getCategoryColor } from '@/lib/utils';
import { calculatePrices } from '@/lib/amm';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

async function getMarketData(id: string) {
  const market = await prisma.market.findUnique({
    where: { id },
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
      resolution: true,
    },
  });

  if (!market) {
    return null;
  }

  // Calculate price history from trades
  const priceHistory = [];
  let yesLiq = 5000;
  let noLiq = 5000;

  const sortedTrades = [...market.trades].reverse();
  for (const trade of sortedTrades) {
    const { yesPrice, noPrice } = calculatePrices({
      yesLiquidity: yesLiq,
      noLiquidity: noLiq,
    });

    priceHistory.push({
      timestamp: trade.timestamp,
      yesPrice,
      noPrice,
    });

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

  return { market, priceHistory };
}

export default async function MarketPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const data = await getMarketData(params.id);

  if (!data) {
    notFound();
  }

  const { market, priceHistory } = data;

  let userBalance = 0;
  if (session?.user) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { balance: true },
    });
    userBalance = user?.balance || 0;
  }

  const { yesPrice, noPrice } = calculatePrices({
    yesLiquidity: market.yesLiquidity,
    noLiquidity: market.noLiquidity,
  });

  const timeRemaining = getTimeRemaining(market.resolutionDate);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className={`text-xs px-3 py-1 rounded-full border ${getCategoryColor(market.category)}`}>
            {getCategoryNameKa(market.category)}
          </span>
          <span className="text-sm text-gray-400">
            Closes: {format(market.resolutionDate, 'MMM dd, yyyy HH:mm')}
          </span>
          <span className={`text-sm font-semibold ${market.status === 'OPEN' ? 'text-green-400' : 'text-red-400'}`}>
            {timeRemaining}
          </span>
        </div>
        <h1 className="text-4xl font-bold mb-3 georgian-text">
          {market.titleKa}
        </h1>
        <p className="text-xl text-gray-400 mb-6">
          {market.titleEn}
        </p>
        <p className="text-gray-300 leading-relaxed max-w-3xl">
          {market.description}
        </p>
      </div>

      {/* Resolution Display */}
      {market.resolution && (
        <div className={`mb-8 p-6 rounded-lg border-2 ${
          market.resolution.outcome
            ? 'bg-green-500/10 border-green-500/50'
            : 'bg-red-500/10 border-red-500/50'
        }`}>
          <div className="text-2xl font-bold mb-2">
            Market Resolved: {market.resolution.outcome ? 'YES' : 'NO'} Won
          </div>
          <div className="text-gray-400">
            Resolved on {format(market.resolution.resolvedAt, 'MMM dd, yyyy HH:mm')}
          </div>
        </div>
      )}

      {/* Current Prices */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-green-500/10 border-2 border-green-500/30 rounded-lg p-8">
          <div className="text-sm text-green-400 mb-2 georgian-text">დიახ • YES</div>
          <div className="text-5xl font-bold text-green-400 mb-2">
            {formatPercent(yesPrice)}
          </div>
          <div className="text-gray-400">
            {formatLari(yesPrice)} per share
          </div>
        </div>
        <div className="bg-red-500/10 border-2 border-red-500/30 rounded-lg p-8">
          <div className="text-sm text-red-400 mb-2 georgian-text">არა • NO</div>
          <div className="text-5xl font-bold text-red-400 mb-2">
            {formatPercent(noPrice)}
          </div>
          <div className="text-gray-400">
            {formatLari(noPrice)} per share
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Chart and Trades */}
        <div className="lg:col-span-2 space-y-8">
          {/* Price Chart */}
          <PriceChart data={priceHistory} />

          {/* Recent Trades */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
            {market.trades.length > 0 ? (
              <div className="space-y-3">
                {market.trades.slice(0, 10).map((trade) => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between py-3 px-4 bg-gray-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        trade.isYes
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {trade.isYes ? 'YES' : 'NO'}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {trade.user.username}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">
                        {trade.shares.toFixed(2)} shares
                      </div>
                      <div className="text-gray-500 text-xs">
                        {format(trade.timestamp, 'MMM dd HH:mm')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No trades yet</p>
            )}
          </div>

          {/* Market Stats */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-6">Market Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-400 text-sm mb-1">Total Volume</div>
                <div className="text-2xl font-bold">{formatLari(market.totalVolume)}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Total Trades</div>
                <div className="text-2xl font-bold">{market.trades.length}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Liquidity Pool</div>
                <div className="text-lg font-semibold">
                  {formatLari(market.yesLiquidity + market.noLiquidity)}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Status</div>
                <div className={`text-lg font-semibold ${
                  market.status === 'OPEN' ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {market.status}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Trade Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <TradePanel
              market={market}
              userBalance={userBalance}
              onTradeComplete={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
