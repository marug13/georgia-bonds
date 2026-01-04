/**
 * Automated Market Maker (AMM) Logic for Bazari
 * Uses constant product formula (x * y = k) for liquidity pools
 *
 * Each market has two liquidity pools: YES and NO
 * Price is derived from the ratio of liquidity pools
 */

export interface MarketLiquidity {
  yesLiquidity: number;
  noLiquidity: number;
}

export interface TradeQuote {
  shares: number;
  pricePerShare: number;
  totalCost: number;
  newYesLiquidity: number;
  newNoLiquidity: number;
  newYesPrice: number;
  newNoPrice: number;
}

/**
 * Calculate current market prices based on liquidity pools
 */
export function calculatePrices(market: MarketLiquidity): {
  yesPrice: number;
  noPrice: number;
} {
  const total = market.yesLiquidity + market.noLiquidity;
  const yesPrice = market.noLiquidity / total;
  const noPrice = market.yesLiquidity / total;

  // Ensure prices stay within bounds [0.01, 0.99]
  return {
    yesPrice: Math.max(0.01, Math.min(0.99, yesPrice)),
    noPrice: Math.max(0.01, Math.min(0.99, noPrice)),
  };
}

/**
 * Get quote for buying shares (YES or NO)
 * Uses constant product formula to calculate price impact
 */
export function getBuyQuote(
  market: MarketLiquidity,
  isYes: boolean,
  sharesToBuy: number
): TradeQuote {
  const k = market.yesLiquidity * market.noLiquidity; // constant product

  let newYesLiquidity: number;
  let newNoLiquidity: number;
  let totalCost: number;

  if (isYes) {
    // Buying YES shares removes from YES pool, adds to NO pool
    newYesLiquidity = market.yesLiquidity - sharesToBuy;
    if (newYesLiquidity <= 0) {
      throw new Error('Insufficient liquidity');
    }
    newNoLiquidity = k / newYesLiquidity;
    totalCost = newNoLiquidity - market.noLiquidity;
  } else {
    // Buying NO shares removes from NO pool, adds to YES pool
    newNoLiquidity = market.noLiquidity - sharesToBuy;
    if (newNoLiquidity <= 0) {
      throw new Error('Insufficient liquidity');
    }
    newYesLiquidity = k / newNoLiquidity;
    totalCost = newYesLiquidity - market.yesLiquidity;
  }

  // Ensure liquidity doesn't go negative
  if (newYesLiquidity <= 0 || newNoLiquidity <= 0) {
    throw new Error('Trade would drain liquidity pool');
  }

  const pricePerShare = totalCost / sharesToBuy;
  const { yesPrice: newYesPrice, noPrice: newNoPrice } = calculatePrices({
    yesLiquidity: newYesLiquidity,
    noLiquidity: newNoLiquidity,
  });

  return {
    shares: sharesToBuy,
    pricePerShare,
    totalCost,
    newYesLiquidity,
    newNoLiquidity,
    newYesPrice,
    newNoPrice,
  };
}

/**
 * Get quote for selling shares (YES or NO)
 */
export function getSellQuote(
  market: MarketLiquidity,
  isYes: boolean,
  sharesToSell: number
): TradeQuote {
  const k = market.yesLiquidity * market.noLiquidity;

  let newYesLiquidity: number;
  let newNoLiquidity: number;
  let totalRevenue: number;

  if (isYes) {
    // Selling YES shares adds to YES pool, removes from NO pool
    newYesLiquidity = market.yesLiquidity + sharesToSell;
    newNoLiquidity = k / newYesLiquidity;
    totalRevenue = market.noLiquidity - newNoLiquidity;
  } else {
    // Selling NO shares adds to NO pool, removes from YES pool
    newNoLiquidity = market.noLiquidity + sharesToSell;
    newYesLiquidity = k / newNoLiquidity;
    totalRevenue = market.yesLiquidity - newYesLiquidity;
  }

  if (totalRevenue <= 0) {
    throw new Error('Invalid sell amount');
  }

  const pricePerShare = totalRevenue / sharesToSell;
  const { yesPrice: newYesPrice, noPrice: newNoPrice } = calculatePrices({
    yesLiquidity: newYesLiquidity,
    noLiquidity: newNoLiquidity,
  });

  return {
    shares: sharesToSell,
    pricePerShare,
    totalCost: -totalRevenue, // Negative because user receives money
    newYesLiquidity,
    newNoLiquidity,
    newYesPrice,
    newNoPrice,
  };
}

/**
 * Calculate maximum shares that can be bought with a given budget
 */
export function calculateMaxShares(
  market: MarketLiquidity,
  isYes: boolean,
  budget: number
): number {
  const k = market.yesLiquidity * market.noLiquidity;

  let maxShares: number;

  if (isYes) {
    // Solve for shares: budget = k / (yesLiq - shares) - noLiq
    // budget + noLiq = k / (yesLiq - shares)
    // yesLiq - shares = k / (budget + noLiq)
    // shares = yesLiq - k / (budget + noLiq)
    maxShares = market.yesLiquidity - k / (budget + market.noLiquidity);
  } else {
    maxShares = market.noLiquidity - k / (budget + market.yesLiquidity);
  }

  // Ensure we don't drain the pool
  const availableLiquidity = isYes ? market.yesLiquidity : market.noLiquidity;
  return Math.max(0, Math.min(maxShares * 0.99, availableLiquidity * 0.99)); // Keep 1% buffer
}
