import { prisma } from '@/lib/prisma';
import { MarketCard } from '@/components/MarketCard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const markets = await prisma.market.findMany({
    where: {
      status: { in: ['OPEN', 'CLOSED'] },
    },
    orderBy: [
      { status: 'asc' },
      { resolutionDate: 'asc' },
    ],
  });

  const openMarkets = markets.filter((m) => m.status === 'OPEN');
  const closedMarkets = markets.filter((m) => m.status === 'CLOSED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-4 georgian-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-transparent bg-clip-text">
          ბაზარი
        </h1>
        <h2 className="text-3xl font-bold mb-4">
          Georgian Prediction Markets
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Trade on the outcomes of Georgian events - politics, sports, culture, and more.
          Put your predictions to the test and compete with other traders.
        </p>
        <p className="text-gray-500 mt-2 georgian-text">
          პროგნოზების ბაზარი საქართველოს მოვლენებზე
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg p-6">
          <div className="text-3xl font-bold text-blue-400">{openMarkets.length}</div>
          <div className="text-gray-400 mt-1">Active Markets</div>
          <div className="text-gray-500 text-sm georgian-text">აქტიური ბაზრები</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg p-6">
          <div className="text-3xl font-bold text-purple-400">₾{(markets.reduce((sum, m) => sum + m.totalVolume, 0)).toFixed(0)}</div>
          <div className="text-gray-400 mt-1">Total Volume</div>
          <div className="text-gray-500 text-sm georgian-text">სულ ვაჭრობა</div>
        </div>
        <div className="bg-gradient-to-br from-pink-500/10 to-pink-600/10 border border-pink-500/20 rounded-lg p-6">
          <div className="text-3xl font-bold text-pink-400">{markets.length}</div>
          <div className="text-gray-400 mt-1">Total Markets</div>
          <div className="text-gray-500 text-sm georgian-text">სულ ბაზრები</div>
        </div>
      </div>

      {/* Open Markets */}
      {openMarkets.length > 0 && (
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-6 flex items-center">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse"></span>
            Active Markets
            <span className="ml-3 georgian-text text-gray-500 text-lg">აქტიური ბაზრები</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {openMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        </div>
      )}

      {/* Closed Markets */}
      {closedMarkets.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold mb-6 flex items-center">
            <span className="w-2 h-2 bg-gray-400 rounded-full mr-3"></span>
            Closed Markets
            <span className="ml-3 georgian-text text-gray-500 text-lg">დახურული ბაზრები</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {closedMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        </div>
      )}

      {markets.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">No markets available yet.</p>
          <p className="text-gray-500 georgian-text mt-2">ბაზრები ჯერ არ არის ხელმისაწვდომი</p>
        </div>
      )}
    </div>
  );
}
