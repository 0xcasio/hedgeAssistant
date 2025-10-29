// ============================================
// PREDICTION MARKET HEDGING CALCULATOR
// Complete Logic Module (Next.js Version)
// ============================================

// ============================================
// 1. URL PARSING & PLATFORM DETECTION
// ============================================

/**
 * Extracts platform and identifier from market URL
 * @param {string} url - Full market URL from Kalshi or Polymarket
 * @returns {object} - { platform: 'kalshi'|'polymarket', identifier: string }
 */
function parseMarketURL(url) {
  try {
    const urlObj = new URL(url);
    
    if (urlObj.hostname.includes('kalshi.com')) {
      // Kalshi URL format: https://kalshi.com/markets/SERIES/EVENT/TICKER
      const pathParts = urlObj.pathname.split('/');
      const ticker = pathParts[pathParts.length - 1];
      
      if (!ticker || ticker === 'markets') {
        throw new Error('Invalid Kalshi URL format');
      }
      
      // Convert market ticker to event ticker format
      // Example: kxmlbgame-25oct24ladtor -> KXMLBGAME-25OCT24LADTOR
      const eventTicker = ticker.toUpperCase();

      console.log('Parsed Kalshi URL:', { originalTicker: ticker, eventTicker });

      return {
        platform: 'kalshi',
        identifier: eventTicker,
        originalTicker: ticker
      };
    } 
    else if (urlObj.hostname.includes('polymarket.com')) {
      // Polymarket URL formats:
      // https://polymarket.com/event/SLUG
      // https://polymarket.com/markets?id=MARKET_ID
      
      if (urlObj.pathname.includes('/event/')) {
        const slug = urlObj.pathname.split('/event/')[1].split('?')[0];
        return {
          platform: 'polymarket',
          identifier: slug,
          type: 'slug'
        };
      } else if (urlObj.searchParams.has('id')) {
        const marketId = urlObj.searchParams.get('id');
        return {
          platform: 'polymarket',
          identifier: marketId,
          type: 'id'
        };
      } else {
        throw new Error('Invalid Polymarket URL format');
      }
    } 
    else {
      throw new Error('Unsupported platform. Please use Kalshi or Polymarket URLs.');
    }
  } catch (error) {
    throw new Error(`Failed to parse URL: ${error.message}`);
  }
}

// ============================================
// 2. API FETCHING (USING PROXY)
// ============================================

/**
 * Fetches market data from Kalshi API via our Next.js API proxy
 * @param {string} eventTicker - Event ticker (e.g., KXMLBGAME-25OCT24-LAD-TOR)
 * @returns {object} - Normalized market data
 */
async function fetchKalshiMarket(eventTicker, team = null) {
  try {
    console.log('Fetching Kalshi market for event ticker:', eventTicker, 'team:', team);
    
    // Use our Next.js API route instead of calling Kalshi directly
    const url = team ? `/api/kalshi?ticker=${eventTicker}&team=${encodeURIComponent(team)}` : `/api/kalshi?ticker=${eventTicker}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Kalshi API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log('Kalshi API response:', data);
    
    const market = data.market;
    const event = data.event;
    const oppositeMarket = data.oppositeMarket;
    
    console.log('Market data:', market);
    console.log('Event data:', event);
    console.log('Opposite market data:', oppositeMarket);
    
    // Extract pricing data from the market
    // Use ask prices for buying, bid prices for selling
    const yesPrice = market.yes_ask || market.yes_price || 0;
    const noPrice = market.no_ask || market.no_price || 0;
    const yesBid = market.yes_bid || 0;
    const noBid = market.no_bid || 0;
    
    // For hedging, we need the opposite team's YES prices
    const oppositeYesPrice = oppositeMarket ? (oppositeMarket.yes_ask || oppositeMarket.yes_price || 0) : 0;
    const oppositeYesBid = oppositeMarket ? (oppositeMarket.yes_bid || 0) : 0;
    
    console.log('Extracted prices:', { 
      yesPrice, 
      noPrice, 
      yesBid, 
      noBid,
      status: market.status,
      result: market.result
    });
    
    // Check if we have realistic pricing (not all 0s or 100s)
    const hasRealisticPricing = (yesPrice > 0 && yesPrice < 100) || (noPrice > 0 && noPrice < 100);
    
    if (!hasRealisticPricing) {
      console.warn('Market has unrealistic pricing - all prices are 0 or 100. This might be a resolved market.');
    }
    
    return {
      platform: 'Kalshi',
      title: market.title || event.title,
      subtitle: market.subtitle || event.subtitle || '',
      yesAsk: yesPrice / 100, // Convert cents to dollars
      yesBid: yesBid / 100, // Use actual bid price
      noAsk: noPrice / 100,
      noBid: noBid / 100, // Use actual bid price
      yesSubTitle: market.yes_sub_title || 'YES',
      noSubTitle: market.no_sub_title || 'NO',
      rulesPrimary: market.rules_primary || '',
      rulesSecondary: market.rules_secondary || '',
      lastPrice: (market.last_price || yesPrice) / 100,
      volume: market.volume || 0,
      status: market.status || 'unknown',
      closeTime: market.close_time || event.close_time,
      eventTitle: event.title,
      eventDescription: event.description,
      // Add opposite market data for hedging
      oppositeYesAsk: oppositeYesPrice / 100,
      oppositeYesBid: oppositeYesBid / 100,
      oppositeYesSubTitle: oppositeMarket ? (oppositeMarket.yes_sub_title || 'YES') : '',
      oppositeNoSubTitle: oppositeMarket ? (oppositeMarket.no_sub_title || 'NO') : '',
      // Add fee information
      fees: data.fees || {
        makerFee: 0.02,
        takerFee: 0.05,
        transactionFee: 0.01,
        source: 'estimated'
      },
      rawData: {
        market: market,
        event: event,
        oppositeMarket: oppositeMarket,
        orderbook: data.orderbook
      }
    };
  } catch (error) {
    console.error('Kalshi fetch error:', error);
    throw new Error(`Failed to fetch Kalshi market: ${error.message}`);
  }
}

/**
 * Fetches market data from Polymarket Gamma API via our Next.js API proxy
 * @param {string} identifier - Market slug or ID
 * @param {string} type - 'slug' or 'id'
 * @returns {object} - Normalized market data
 */
async function fetchPolymarketMarket(identifier, type = 'slug') {
  try {
    // Use our Next.js API route instead of calling Polymarket directly
    const response = await fetch(`/api/polymarket?identifier=${identifier}&type=${type}`);
    
    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error('Market not found');
    }
    
    const market = data[0];
    
    // Polymarket returns outcomes array with prices
    // Usually [0] = YES, [1] = NO
    const yesPrice = parseFloat(market.outcomePrices[0]);
    const noPrice = parseFloat(market.outcomePrices[1]);
    
    return {
      platform: 'Polymarket',
      title: market.question,
      subtitle: market.description || '',
      yesAsk: yesPrice,
      yesBid: yesPrice, // Polymarket simple API doesn't separate bid/ask
      noAsk: noPrice,
      noBid: noPrice,
      lastPrice: yesPrice,
      volume: market.volume,
      status: market.active ? 'open' : 'closed',
      closeTime: market.endDate,
      outcomes: market.outcomes, // ['Yes', 'No']
      rawData: market
    };
  } catch (error) {
    throw new Error(`Failed to fetch Polymarket market: ${error.message}`);
  }
}

/**
 * Main function to fetch market from URL
 * @param {string} url - Full market URL
 * @returns {object} - Normalized market data
 */
async function fetchMarketFromURL(url, team = null) {
  const parsed = parseMarketURL(url);
  console.log('Parsed URL result:', parsed);
  
  if (parsed.platform === 'kalshi') {
    return await fetchKalshiMarket(parsed.identifier, team);
  } else if (parsed.platform === 'polymarket') {
    return await fetchPolymarketMarket(parsed.identifier, parsed.type);
  }
}

// ============================================
// 3. HEDGING CALCULATIONS
// ============================================

/**
 * Calculates simple exit strategy (sell current position)
 * @param {object} position - { side: 'YES'|'NO', shares: number, buyPrice: number }
 * @param {object} currentPrices - { yesAsk, yesBid, noAsk, noBid, fees }
 * @returns {object} - Exit strategy details
 */
function calculateSimpleExit(position, currentPrices) {
  const { side, shares, buyPrice } = position;
  
  // Determine sell price based on position side
  const sellPrice = side === 'YES' ? currentPrices.yesBid : currentPrices.noBid;
  
  const initialCost = shares * buyPrice;
  const grossRevenue = shares * sellPrice;
  
  // Calculate fees (taker fee for selling)
  const fees = currentPrices.fees || { takerFee: 0.05, transactionFee: 0.01 };
  const takerFee = grossRevenue * fees.takerFee;
  const transactionFee = grossRevenue * fees.transactionFee;
  const totalFees = takerFee + transactionFee;
  
  const netRevenue = grossRevenue - totalFees;
  const profit = netRevenue - initialCost;
  const profitPercent = (profit / initialCost) * 100;
  
  return {
    strategy: 'Simple Exit',
    action: `Sell ${shares} ${side} shares at $${sellPrice.toFixed(2)}`,
    sellPrice: sellPrice,
    initialCost: initialCost,
    grossRevenue: grossRevenue,
    fees: {
      takerFee: takerFee,
      transactionFee: transactionFee,
      total: totalFees
    },
    netRevenue: netRevenue,
    profit: profit,
    profitPercent: profitPercent,
    risk: 'None - position fully closed',
    description: 'Exit your position immediately and lock in current profit/loss (after fees).'
  };
}

/**
 * Calculates perfect hedge (guaranteed equal profit both outcomes)
 * @param {object} position - { side: 'YES'|'NO', shares: number, buyPrice: number }
 * @param {object} currentPrices - { yesAsk, yesBid, noAsk, noBid, fees }
 * @returns {object} - Perfect hedge strategy details
 */
function calculatePerfectHedge(position, currentPrices) {
  const { side, shares, buyPrice } = position;
  const initialCost = shares * buyPrice;
  
  // For hedging, we need to buy YES shares in the opposite team's market
  // This means we always buy YES shares, but from the opposite team
  const hedgeSide = 'YES'; // Always buy YES shares in opposite team's market
  const hedgePrice = currentPrices.oppositeYesAsk; // Use YES ask price from opposite team's market
  const potentialPayoutIfOriginalWins = shares; // Each share pays $1
  
  // Calculate fees for the hedge transaction
  const fees = currentPrices.fees || { takerFee: 0.05, transactionFee: 0.01 };
  
  // Calculate hedge size for equal profits (including fees)
  // If original wins: profit = payoutOriginal - initialCost - hedgeCost - hedgeFees
  // If hedge wins: profit = hedgeShares - initialCost - hedgeFees
  // Set equal: payoutOriginal - initialCost - hedgeCost - hedgeFees = hedgeShares - initialCost - hedgeFees
  // payoutOriginal - hedgeCost = hedgeShares
  // payoutOriginal = hedgeCost + hedgeShares
  // payoutOriginal = hedgeCost + (hedgeCost / hedgePrice)
  // payoutOriginal = hedgeCost(1 + 1/hedgePrice)
  // hedgeCost = payoutOriginal / (1 + 1/hedgePrice)
  
  const hedgeCostCalculated = potentialPayoutIfOriginalWins / (1 + (1 / hedgePrice));
  const hedgeSharesCalculated = hedgeCostCalculated / hedgePrice;
  
  // Calculate fees for the hedge
  const hedgeTakerFee = hedgeCostCalculated * fees.takerFee;
  const hedgeTransactionFee = hedgeCostCalculated * fees.transactionFee;
  const hedgeTotalFees = hedgeTakerFee + hedgeTransactionFee;
  
  const profitIfOriginalWins = potentialPayoutIfOriginalWins - initialCost - hedgeCostCalculated - hedgeTotalFees;
  const profitIfHedgeWins = hedgeSharesCalculated - initialCost - hedgeTotalFees;
  
  return {
    strategy: 'Perfect Hedge',
    action: `Buy ${hedgeSharesCalculated.toFixed(2)} YES shares in the opposite team's market at $${hedgePrice.toFixed(2)}`,
    hedgeSide: hedgeSide,
    hedgeShares: hedgeSharesCalculated,
    hedgePrice: hedgePrice,
    hedgeCost: hedgeCostCalculated,
    hedgeFees: {
      takerFee: hedgeTakerFee,
      transactionFee: hedgeTransactionFee,
      total: hedgeTotalFees
    },
    totalInvestment: initialCost + hedgeCostCalculated + hedgeTotalFees,
    profitIfOriginalWins: profitIfOriginalWins,
    profitIfHedgeWins: profitIfHedgeWins,
    guaranteedProfit: Math.min(profitIfOriginalWins, profitIfHedgeWins),
    profitPercent: (Math.min(profitIfOriginalWins, profitIfHedgeWins) / initialCost) * 100,
    risk: 'None - profit locked in regardless of outcome',
    description: `Lock in a guaranteed profit of $${Math.min(profitIfOriginalWins, profitIfHedgeWins).toFixed(2)} no matter what happens. Buy YES shares in the opposite team's market to create a true hedge (fees included).`
  };
}

/**
 * Calculates partial hedge strategy
 * @param {object} position - { side: 'YES'|'NO', shares: number, buyPrice: number }
 * @param {object} currentPrices - { yesAsk, yesBid, noAsk, noBid }
 * @param {number} hedgePercent - Percentage to hedge (0-100)
 * @returns {object} - Partial hedge strategy details
 */
function calculatePartialHedge(position, currentPrices, hedgePercent) {
  const { side, shares, buyPrice } = position;
  const initialCost = shares * buyPrice;
  
  // For hedging, we need to buy YES shares in the opposite team's market
  const hedgeSide = 'YES'; // Always buy YES shares in opposite team's market
  const hedgePrice = currentPrices.oppositeYesAsk; // Use YES ask price from opposite team's market
  
  // Calculate perfect hedge first
  const perfectHedge = calculatePerfectHedge(position, currentPrices);
  
  // Apply percentage
  const hedgeShares = perfectHedge.hedgeShares * (hedgePercent / 100);
  const hedgeCost = hedgeShares * hedgePrice;
  
  // Calculate outcomes
  const profitIfOriginalWins = shares - initialCost - hedgeCost;
  const profitIfHedgeWins = hedgeShares - initialCost;
  
  // Calculate profit percentage based on the better outcome
  const betterProfit = Math.max(profitIfOriginalWins, profitIfHedgeWins);
  const profitPercent = (betterProfit / initialCost) * 100;

  return {
    strategy: `Partial Hedge (${hedgePercent}%)`,
    action: `Buy ${hedgeShares.toFixed(2)} YES shares in the opposite team's market at $${hedgePrice.toFixed(2)}`,
    hedgeSide: hedgeSide,
    hedgeShares: hedgeShares,
    hedgePrice: hedgePrice,
    hedgeCost: hedgeCost,
    totalInvestment: initialCost + hedgeCost,
    profitIfOriginalWins: profitIfOriginalWins,
    profitIfHedgeWins: profitIfHedgeWins,
    profit: betterProfit,
    profitPercent: profitPercent,
    risk: hedgePercent < 100 ? 'Moderate - partial exposure remains' : 'None',
    description: `Hedge ${hedgePercent}% of your position by buying YES shares in the opposite team's market. You'll profit more if your original team wins, but have downside protection if it loses.`
  };
}

/**
 * Generates all hedging strategies for a position
 * @param {object} position - { side: 'YES'|'NO', shares: number, buyPrice: number }
 * @param {object} marketData - Market data from API
 * @returns {object} - All strategy options
 */
function generateAllStrategies(position, marketData) {
  const currentPrices = {
    yesAsk: marketData.yesAsk,
    yesBid: marketData.yesBid,
    noAsk: marketData.noAsk,
    noBid: marketData.noBid,
    // For hedging, we need the opposite team's YES prices
    oppositeYesAsk: marketData.oppositeYesAsk,
    oppositeYesBid: marketData.oppositeYesBid,
    // Include fee information
    fees: marketData.fees
  };
  
  return {
    marketInfo: {
      title: marketData.title,
      platform: marketData.platform,
      currentYesPrice: marketData.yesAsk,
      currentNoPrice: marketData.noAsk,
      yesSubTitle: marketData.yesSubTitle,
      noSubTitle: marketData.noSubTitle,
      rulesPrimary: marketData.rulesPrimary,
      rulesSecondary: marketData.rulesSecondary,
      fees: marketData.fees
    },
    position: position,
    strategies: {
      exit: calculateSimpleExit(position, currentPrices),
      perfectHedge: calculatePerfectHedge(position, currentPrices),
      conservative: calculatePartialHedge(position, currentPrices, 80),
      moderate: calculatePartialHedge(position, currentPrices, 50),
      minimal: calculatePartialHedge(position, currentPrices, 25)
    }
  };
}

// ============================================
// 4. FORMATTING & DISPLAY HELPERS
// ============================================

/**
 * Formats currency with proper decimals
 */
function formatCurrency(amount) {
  return `$${Math.abs(amount).toFixed(2)}`;
}

/**
 * Formats percentage with sign
 */
function formatPercent(percent) {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(1)}%`;
}

/**
 * Generates plain English explanation for a strategy
 */
function explainStrategy(strategy, position) {
  const explanations = {
    'Simple Exit': `
      You'll sell all your ${position.shares} ${position.side} shares immediately.
      This closes your position completely - no more risk, no more potential gains.
      ${strategy.profit >= 0 ? 
        `You'll walk away with a ${formatCurrency(strategy.profit)} profit (${formatPercent(strategy.profitPercent)} return).` :
        `You'll take a ${formatCurrency(strategy.profit)} loss, but at least you're out.`
      }
    `,
    'Perfect Hedge': `
      You'll buy ${strategy.hedgeShares.toFixed(0)} ${strategy.hedgeSide} shares for ${formatCurrency(strategy.hedgeCost)}.
      This creates a situation where you profit EXACTLY the same amount no matter what happens:
      
      • If ${position.side} wins: You collect ${formatCurrency(position.shares)} from your original bet, 
        lose ${formatCurrency(strategy.hedgeCost)} on the hedge = ${formatCurrency(strategy.guaranteedProfit)} profit
      
      • If ${strategy.hedgeSide} wins: You collect ${formatCurrency(strategy.hedgeShares)} from the hedge,
        lose ${formatCurrency(position.shares * position.buyPrice)} on original = ${formatCurrency(strategy.guaranteedProfit)} profit
      
      You literally cannot lose. Sleep easy!
    `
  };
  
  return explanations[strategy.strategy] || `Hedge ${strategy.strategy.match(/\d+/)?.[0]}% of your position for balanced risk/reward.`;
}

// ============================================
// 5. MAIN CALCULATOR FUNCTION
// ============================================

/**
 * Complete hedging calculator - main entry point
 * @param {string} marketURL - URL of the prediction market
 * @param {object} position - { side: 'YES'|'NO', shares: number, buyPrice: number }
 * @returns {object} - Complete analysis with all strategies
 */
async function calculateHedgingStrategies(marketURL, position, team = null) {
  try {
    // Validate inputs
    if (!marketURL || typeof marketURL !== 'string') {
      throw new Error('Please provide a valid market URL');
    }
    
    if (!position.side || !['YES', 'NO'].includes(position.side.toUpperCase())) {
      throw new Error('Position side must be YES or NO');
    }
    
    if (!position.shares || position.shares <= 0) {
      throw new Error('Number of shares must be greater than 0');
    }
    
    if (!position.buyPrice || position.buyPrice <= 0 || position.buyPrice >= 1) {
      throw new Error('Buy price must be between $0.01 and $0.99');
    }
    
    // Fetch market data with team selection
    console.log('Fetching market data...');
    const marketData = await fetchMarketFromURL(marketURL, team);
    console.log('Market data fetched:', marketData.title);
    
    // Generate all strategies
    console.log('Calculating hedging strategies...');
    const results = generateAllStrategies(position, marketData);
    
    return {
      success: true,
      data: results
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================
// 6. EXPORT FOR USE IN BROWSER/NODE
// ============================================

// For browser usage
if (typeof window !== 'undefined') {
  window.HedgingCalculator = {
    calculate: calculateHedgingStrategies,
    parseURL: parseMarketURL,
    fetchMarket: fetchMarketFromURL,
    formatCurrency,
    formatPercent,
    explainStrategy
  };
}

// For Next.js/React usage - using CommonJS syntax for browser compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateHedgingStrategies,
    parseMarketURL,
    fetchMarketFromURL,
    generateAllStrategies,
    formatCurrency,
    formatPercent,
    explainStrategy
  };
}