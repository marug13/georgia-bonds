'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { formatLari, getCategoryNameKa, getTimeRemaining } from '@/lib/utils';
import { format } from 'date-fns';

interface Market {
  id: string;
  titleKa: string;
  titleEn: string;
  category: string;
  status: string;
  resolutionDate: Date;
  totalVolume: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (session && !(session.user as any).isAdmin) {
      router.push('/');
      return;
    }

    if (session) {
      fetchMarkets();
    }
  }, [session, status, router]);

  const fetchMarkets = async () => {
    try {
      const response = await fetch('/api/markets');
      const data = await response.json();
      setMarkets(data.markets);
    } catch (error) {
      console.error('Failed to fetch markets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (marketId: string, outcome: boolean) => {
    if (!confirm(`Are you sure you want to resolve this market as ${outcome ? 'YES' : 'NO'}?`)) {
      return;
    }

    setResolving(marketId);

    try {
      const response = await fetch('/api/admin/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketId, outcome }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Resolution failed');
      }

      alert(data.message);
      fetchMarkets(); // Refresh the list
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setResolving(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const unresolvedMarkets = markets.filter((m) => m.status !== 'RESOLVED');
  const resolvedMarkets = markets.filter((m) => m.status === 'RESOLVED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
        <p className="text-gray-400">Manage and resolve markets</p>
      </div>

      {/* Unresolved Markets */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <span className="w-2 h-2 bg-yellow-400 rounded-full mr-3 animate-pulse"></span>
          Markets to Resolve ({unresolvedMarkets.length})
        </h2>
        {unresolvedMarkets.length > 0 ? (
          <div className="space-y-4">
            {unresolvedMarkets.map((market) => (
              <div
                key={market.id}
                className="bg-gray-900/50 border border-gray-800 rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/20">
                        {getCategoryNameKa(market.category)}
                      </span>
                      <span className={`text-xs font-semibold ${
                        market.status === 'OPEN' ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {market.status}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-1 georgian-text">
                      {market.titleKa}
                    </h3>
                    <p className="text-gray-400 mb-3">{market.titleEn}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        Resolution: {format(new Date(market.resolutionDate), 'MMM dd, yyyy HH:mm')}
                      </span>
                      <span>•</span>
                      <span>Volume: {formatLari(market.totalVolume)}</span>
                      <span>•</span>
                      <span>{getTimeRemaining(new Date(market.resolutionDate))}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleResolve(market.id, true)}
                    disabled={resolving === market.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resolving === market.id ? 'Resolving...' : 'Resolve as YES'}
                  </button>
                  <button
                    onClick={() => handleResolve(market.id, false)}
                    disabled={resolving === market.id}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resolving === market.id ? 'Resolving...' : 'Resolve as NO'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-12 text-center">
            <p className="text-gray-400">No markets to resolve.</p>
          </div>
        )}
      </div>

      {/* Resolved Markets */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <span className="w-2 h-2 bg-gray-400 rounded-full mr-3"></span>
          Resolved Markets ({resolvedMarkets.length})
        </h2>
        {resolvedMarkets.length > 0 ? (
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Market</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-400">Category</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-400">Volume</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-400">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {resolvedMarkets.map((market) => (
                    <tr key={market.id} className="hover:bg-gray-800/30 transition">
                      <td className="px-6 py-4">
                        <div className="font-medium georgian-text">{market.titleKa}</div>
                        <div className="text-sm text-gray-500">{market.titleEn}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-400">
                          {getCategoryNameKa(market.category)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold">
                        {formatLari(market.totalVolume)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-semibold text-blue-400">RESOLVED</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-12 text-center">
            <p className="text-gray-400">No resolved markets yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
