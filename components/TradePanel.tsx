'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { formatLari, formatPercent } from '@/lib/utils';
import { getBuyQuote } from '@/lib/amm';

interface TradePanelProps {
  market: {
    id: string;
    titleKa: string;
    yesLiquidity: number;
    noLiquidity: number;
    status: string;
  };
  userBalance: number;
  onTradeComplete: () => void;
}

export function TradePanel({ market, userBalance, onTradeComplete }: TradePanelProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [tradeType, setTradeType] = useState<'YES' | 'NO'>('YES');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [quote, setQuote] = useState<any>(null);

  const isClosed = market.status !== 'OPEN';

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setError('');

    const numAmount = parseFloat(value);
    if (isNaN(numAmount) || numAmount <= 0) {
      setQuote(null);
      return;
    }

    try {
      const tradeQuote = getBuyQuote(
        { yesLiquidity: market.yesLiquidity, noLiquidity: market.noLiquidity },
        tradeType === 'YES',
        numAmount
      );

      if (tradeQuote.totalCost > userBalance) {
        setError('Insufficient balance');
      }

      setQuote(tradeQuote);
    } catch (err: any) {
      setError(err.message);
      setQuote(null);
    }
  };

  const handleTrade = async () => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (!quote || isClosed) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId: market.id,
          isYes: tradeType === 'YES',
          shares: parseFloat(amount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Trade failed');
      }

      // Reset form
      setAmount('');
      setQuote(null);
      onTradeComplete();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-6">Trade</h3>

      {/* Trade Type Selection */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => {
            setTradeType('YES');
            handleAmountChange(amount);
          }}
          className={`p-4 rounded-lg border-2 transition ${
            tradeType === 'YES'
              ? 'border-green-500 bg-green-500/10 text-green-400'
              : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
          }`}
        >
          <div className="text-sm mb-1 georgian-text">დიახ</div>
          <div className="text-2xl font-bold">YES</div>
        </button>
        <button
          onClick={() => {
            setTradeType('NO');
            handleAmountChange(amount);
          }}
          className={`p-4 rounded-lg border-2 transition ${
            tradeType === 'NO'
              ? 'border-red-500 bg-red-500/10 text-red-400'
              : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
          }`}
        >
          <div className="text-sm mb-1 georgian-text">არა</div>
          <div className="text-2xl font-bold">NO</div>
        </button>
      </div>

      {/* Amount Input */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Shares to buy</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value)}
          placeholder="0"
          disabled={isClosed || !session}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          min="0"
          step="0.01"
        />
        <div className="mt-2 text-xs text-gray-500">
          Balance: {formatLari(userBalance)}
        </div>
      </div>

      {/* Quote Display */}
      {quote && (
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Average price:</span>
            <span className="font-semibold">{formatLari(quote.pricePerShare)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total cost:</span>
            <span className="font-semibold">{formatLari(quote.totalCost)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">New {tradeType} price:</span>
            <span className={tradeType === 'YES' ? 'text-green-400' : 'text-red-400'}>
              {formatPercent(tradeType === 'YES' ? quote.newYesPrice : quote.newNoPrice)}
            </span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Trade Button */}
      {!session ? (
        <button
          onClick={() => router.push('/auth/signin')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
        >
          Sign in to trade
        </button>
      ) : (
        <button
          onClick={handleTrade}
          disabled={!quote || isLoading || isClosed || !!error}
          className={`w-full font-semibold py-3 rounded-lg transition ${
            tradeType === 'YES'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? 'Processing...' : isClosed ? 'Market Closed' : `Buy ${tradeType}`}
        </button>
      )}
    </div>
  );
}
