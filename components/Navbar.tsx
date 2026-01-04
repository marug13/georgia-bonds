'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { formatLari } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function Navbar() {
  const { data: session, status } = useSession();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (session?.user) {
      // Fetch user balance
      fetch('/api/user/balance')
        .then((res) => res.json())
        .then((data) => setBalance(data.balance))
        .catch(() => {});
    }
  }, [session]);

  return (
    <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition">
            <div className="text-2xl font-bold georgian-text bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
              ბაზარი
            </div>
            <div className="text-sm text-gray-400 hidden sm:block">
              Bazari
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link
              href="/"
              className="text-gray-300 hover:text-white transition text-sm font-medium"
            >
              Markets
            </Link>
            {session && (
              <>
                <Link
                  href="/portfolio"
                  className="text-gray-300 hover:text-white transition text-sm font-medium"
                >
                  Portfolio
                </Link>
                <Link
                  href="/leaderboard"
                  className="text-gray-300 hover:text-white transition text-sm font-medium"
                >
                  Leaderboard
                </Link>
                {(session.user as any).isAdmin && (
                  <Link
                    href="/admin"
                    className="text-purple-400 hover:text-purple-300 transition text-sm font-medium"
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="text-gray-400 text-sm">Loading...</div>
            ) : session ? (
              <>
                {balance !== null && (
                  <div className="hidden sm:flex items-center space-x-2 bg-gray-900 px-4 py-2 rounded-lg border border-gray-800">
                    <span className="text-gray-400 text-sm">Balance:</span>
                    <span className="font-semibold text-green-400">
                      {formatLari(balance)}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <div className="text-sm">
                    <div className="text-white font-medium">
                      {(session.user as any).name || session.user?.email}
                    </div>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="text-gray-400 hover:text-white text-sm transition"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
