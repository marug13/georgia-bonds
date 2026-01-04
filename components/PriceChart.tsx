'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatPercent } from '@/lib/utils';
import { format } from 'date-fns';

interface PriceChartProps {
  data: {
    timestamp: Date;
    yesPrice: number;
    noPrice: number;
  }[];
}

export function PriceChart({ data }: PriceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 h-80 flex items-center justify-center">
        <p className="text-gray-500">No price history available</p>
      </div>
    );
  }

  const chartData = data.map((point) => ({
    timestamp: format(new Date(point.timestamp), 'MMM dd HH:mm'),
    yes: point.yesPrice * 100,
    no: point.noPrice * 100,
  }));

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-6">Price History</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="timestamp"
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: number) => `${value.toFixed(1)}%`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="yes"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="YES"
          />
          <Line
            type="monotone"
            dataKey="no"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            name="NO"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
