import type { Metadata } from 'next';
import { SessionProvider } from '@/components/SessionProvider';
import { Navbar } from '@/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bazari - Georgian Prediction Markets',
  description: 'Trade on Georgian events - politics, sports, culture, and more',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ka" className="dark">
      <body className="min-h-screen bg-black text-white">
        <SessionProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
            <footer className="border-t border-gray-800 py-8 mt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center text-gray-400 text-sm">
                  <p className="georgian-text">© 2025 ბაზარი (Bazari) - საქართველოს პროგნოზირების ბაზარი</p>
                  <p className="mt-2">Georgian Prediction Markets Platform</p>
                </div>
              </div>
            </footer>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
