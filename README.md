# ბაზარი (Bazari) - Georgian Prediction Markets

A Kalshi-style prediction market platform focused exclusively on Georgian events and topics. Built with Next.js 14, TypeScript, and PostgreSQL.

![Bazari](https://img.shields.io/badge/Status-MVP-green)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748)

## 🎯 Overview

Bazari is a prediction market where Georgian users can trade on the outcomes of local events - politics, sports (rugby, football), entertainment, economy, weather, and cultural events. Users buy and sell shares in outcomes, with prices reflecting crowd-predicted probabilities.

### Key Features

- **📊 Market Trading**: Buy and sell YES/NO shares on Georgian events
- **💰 Automated Market Maker (AMM)**: Constant product formula (x * y = k) for liquidity
- **📈 Real-time Pricing**: Dynamic prices based on liquidity pools
- **👤 User Portfolios**: Track positions, profit/loss, and trade history
- **🏆 Leaderboard**: Compete with other predictors
- **🔐 Authentication**: Email/password + Google OAuth support
- **🌙 Dark Mode**: Beautiful dark theme optimized for extended use
- **🇬🇪 Georgian Language**: Full support for ქართული with English translations

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- (Optional) Google OAuth credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd georgia-bonds
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env` and configure:

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/bazari?schema=public"

   # NextAuth
   NEXTAUTH_SECRET="your-secret-key-here"  # Generate with: openssl rand -base64 32
   NEXTAUTH_URL="http://localhost:3000"

   # Google OAuth (optional)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run migrations
   npx prisma migrate dev --name init

   # Seed the database with sample markets
   npx prisma db seed
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 📦 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Charts**: Recharts
- **Styling**: Tailwind CSS with custom Georgian font support

## 🗂️ Project Structure

```
bazari/
├── app/
│   ├── api/
│   │   ├── auth/[nextauth]/     # NextAuth configuration
│   │   ├── trade/               # Trading API
│   │   ├── markets/             # Markets API
│   │   ├── user/                # User data API
│   │   ├── leaderboard/         # Leaderboard API
│   │   └── admin/               # Admin API (market resolution)
│   ├── markets/[id]/            # Individual market page
│   ├── portfolio/               # User portfolio
│   ├── leaderboard/             # Leaderboard
│   ├── admin/                   # Admin panel
│   ├── auth/signin/             # Sign-in page
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── globals.css              # Global styles
├── components/
│   ├── Navbar.tsx               # Navigation bar
│   ├── MarketCard.tsx           # Market preview card
│   ├── TradePanel.tsx           # Trading interface
│   ├── PriceChart.tsx           # Price history chart
│   └── SessionProvider.tsx      # Auth session provider
├── lib/
│   ├── prisma.ts                # Prisma client
│   ├── auth.ts                  # NextAuth configuration
│   ├── amm.ts                   # Market maker logic
│   └── utils.ts                 # Utility functions
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── seed.ts                  # Seed data
└── public/                      # Static assets
```

## 💱 How the AMM Works

Bazari uses a constant product Automated Market Maker (AMM) for price discovery:

- Each market has two liquidity pools: YES and NO (starting at ₾5,000 each)
- Price formula: `YES_PRICE = NO_LIQUIDITY / (YES_LIQUIDITY + NO_LIQUIDITY)`
- Buying YES shares removes from YES pool, adds to NO pool (and vice versa)
- Prices automatically adjust based on supply and demand
- Users can buy shares at any time while market is open

### Example Trade

Initial state:
- YES liquidity: ₾5,000
- NO liquidity: ₾5,000
- YES price: 50% (₾0.50)

User buys 100 YES shares:
- Cost: ~₾51.28
- New YES liquidity: ₾4,900
- New NO liquidity: ₾5,051.28
- New YES price: 50.8%

## 🎮 Demo Accounts

The seed data includes these demo accounts:

**Admin Account:**
- Email: `admin@bazari.ge`
- Password: `admin123`
- Access: Full admin panel for market resolution

**Demo Users:**
- Email: `giorgi@example.com` / Password: `demo123`
- Email: `nino@example.com` / Password: `demo123`
- Email: `tamari@example.com` / Password: `demo123`

All users start with ₾10,000 virtual Lari.

## 📊 Database Schema

### User
- Virtual balance (₾10,000 starting)
- Username, email, password
- Admin flag
- Positions and trade history

### Market
- Bilingual titles (Georgian + English)
- Category (Politics, Sports, Economy, Culture, Weather, Entertainment)
- Resolution date and status
- Liquidity pools (YES/NO)
- Total volume traded

### Position
- User's shares in a market
- Average purchase price
- YES or NO side

### Trade
- Record of each buy/sell
- Timestamp, price, shares
- Total cost/revenue

### Resolution
- Final outcome (YES/NO won)
- Payout distribution to winners

## 🎯 Market Categories

- **პოლიტიკა (Politics)**: Elections, appointments, policy changes
- **სპორტი (Sports)**: Rugby, football, national team results
- **ეკონომიკა (Economy)**: Exchange rates, inflation, GDP
- **კულტურა (Culture)**: Films, awards, infrastructure
- **ამინდი (Weather)**: Temperature, snow, seasonal predictions
- **გართობა (Entertainment)**: Eurovision, events, media

## 🔒 Security Features

- Password hashing with bcrypt
- JWT-based session management
- Protected API routes with authentication
- Admin-only endpoints for market resolution
- SQL injection protection via Prisma
- XSS protection via React

## 🌐 Deployment

### Database Setup

1. Create a PostgreSQL database
2. Update `DATABASE_URL` in production environment
3. Run migrations: `npx prisma migrate deploy`
4. Seed data: `npx prisma db seed`

### Environment Variables

Set these in your production environment:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- (Optional) `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### Build and Deploy

```bash
npm run build
npm start
```

Recommended platforms:
- **Vercel**: Optimal for Next.js (automatic deployment)
- **Railway**: Good for full-stack with PostgreSQL
- **Render**: Alternative with database support

## 📝 Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npx prisma studio    # Open Prisma Studio (database GUI)
npx prisma migrate   # Create/run database migrations
```

## 🎨 Customization

### Adding New Markets

Use Prisma Studio or create via SQL:

```typescript
await prisma.market.create({
  data: {
    titleKa: "Georgian question?",
    titleEn: "English question?",
    description: "Description...",
    category: "POLITICS",
    resolutionDate: new Date("2025-12-31"),
    yesLiquidity: 5000,
    noLiquidity: 5000,
  },
});
```

### Modifying AMM Parameters

Edit `lib/amm.ts` to adjust:
- Initial liquidity amounts
- Minimum/maximum prices
- Liquidity pool ratios
- Trading fees (currently 0%)

## 🐛 Troubleshooting

**Database connection fails:**
- Check PostgreSQL is running
- Verify `DATABASE_URL` is correct
- Ensure database exists

**Prisma errors:**
```bash
npx prisma generate  # Regenerate client
npx prisma migrate reset  # Reset database (⚠️ deletes data)
```

**Authentication not working:**
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Clear browser cookies

## 📄 License

MIT License - feel free to use this project for learning or building your own prediction markets!

## 🤝 Contributing

This is an MVP project. Potential improvements:
- Real money integration (requires licensing)
- More complex order books
- Limit orders
- Market creation by users
- Mobile app
- Social features (comments, follows)
- Advanced analytics

## 📧 Contact

For questions or feedback about this project, please open an issue on GitHub.

---

**ბაზარი** - Where Georgian predictions meet reality! 🇬🇪
