'use client';

import Link from 'next/link';
import { formatPercent, formatLari, getTimeRemaining, getCategoryNameKa, getCategoryColor } from '@/lib/utils';
import { calculatePrices } from '@/lib/amm';

interface MarketCardProps {
  market: {
    id: string;
    titleKa: string;
    titleEn: string;
    category: string;
    resolutionDate: Date;
    status: string;
    yesLiquidity: number;
    noLiquidity: number;
    totalVolume: number;
  };
}

export function MarketCard({ market }: MarketCardProps) {
  const { yesPrice, noPrice } = calculatePrices({
    yesLiquidity: market.yesLiquidity,
    noLiquidity: market.noLiquidity,
  });

  const timeRemaining = getTimeRemaining(new Date(market.resolutionDate));
  const isClosed = market.status !== 'OPEN';

  return (
    <Link href={`/markets/${market.id}`}>
      <div className="group bg-gray-900/50 border border-gray-800 rounded-lg p-6 hover:border-gray-700 hover:bg-gray-900/80 transition cursor-pointer">
        {/* Category Badge */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs px-3 py-1 rounded-full border ${getCategoryColor(market.category)}`}>
            {getCategoryNameKa(market.category)}
          </span>
          <span className={`text-xs ${isClosed ? 'text-red-400' : 'text-gray-400'}`}>
            {timeRemaining}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold mb-2 georgian-text line-clamp-2 group-hover:text-blue-400 transition">
          {market.titleKa}
        </h3>
        <p className="text-sm text-gray-400 mb-4 line-clamp-1">
          {market.titleEn}
        </p>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <div className="text-xs text-green-400 mb-1 georgian-text">დიახ</div>
            <div className="text-2xl font-bold text-green-400">
              {formatPercent(yesPrice)}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {formatLari(yesPrice)}
            </div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="text-xs text-red-400 mb-1 georgian-text">არა</div>
            <div className="text-2xl font-bold text-red-400">
              {formatPercent(noPrice)}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {formatLari(noPrice)}
            </div>
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Volume: {formatLari(market.totalVolume)}</span>
          <span className="text-blue-400 opacity-0 group-hover:opacity-100 transition">
            Trade →
          </span>
        </div>
      </div>
    </Link>
  );
}
