// pages/api/kalshi.js

export default async function handler(req, res) {
  const { ticker, team } = req.query;
  
  if (!ticker) {
    return res.status(400).json({ success: false, error: 'Event ticker is required' });
  }
  
  try {
    console.log('Fetching Kalshi data for event ticker:', ticker);
    console.log('Full event URL:', `https://api.elections.kalshi.com/trade-api/v2/events/${ticker}`);
    
    // Step 1: Get event data
    const eventResponse = await fetch(`https://api.elections.kalshi.com/trade-api/v2/events/${ticker}`);
    
    if (!eventResponse.ok) {
      console.error('Event API error:', eventResponse.status, eventResponse.statusText);
      return res.status(eventResponse.status).json({ 
        success: false, 
        error: `Kalshi Event API error: ${eventResponse.status}` 
      });
    }
    
    const eventData = await eventResponse.json();
    console.log('Event data received:', eventData);
    
    // Step 2: Get all markets for this event
    const marketsResponse = await fetch(`https://api.elections.kalshi.com/trade-api/v2/markets?event_ticker=${ticker}`);
    
    if (!marketsResponse.ok) {
      console.error('Markets API error:', marketsResponse.status, marketsResponse.statusText);
      return res.status(marketsResponse.status).json({ 
        success: false, 
        error: `Kalshi Markets API error: ${marketsResponse.status}` 
      });
    }
    
    const marketsData = await marketsResponse.json();
    console.log('Markets data received:', marketsData);
    
    // Find the specific market we want (usually the first one or the one matching the original ticker)
    const markets = marketsData.markets || [];
    if (markets.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'No markets found for this event' 
      });
    }
    
    // Find the target market based on team selection
    let targetMarket = null;
    
    if (team) {
      // Look for a market that matches the selected team
      for (const m of markets) {
        if (m.yes_sub_title === team || m.no_sub_title === team) {
          targetMarket = m;
          console.log(`Found market for team: ${team}`, m.ticker);
          break;
        }
      }
    }
    
    // If no team-specific market found, or no team specified, find one with realistic pricing
    if (!targetMarket) {
      for (const m of markets) {
        const hasRealisticPricing = (m.yes_ask > 0 && m.yes_ask < 100) || (m.no_ask > 0 && m.no_ask < 100);
        if (hasRealisticPricing) {
          targetMarket = m;
          break;
        }
      }
    }
    
    // If still no market found, use the first one
    if (!targetMarket) {
      targetMarket = markets[0];
      console.warn('No suitable market found, using first available market');
    }
    
    console.log('Using market:', targetMarket.ticker, targetMarket.title);
    
    // Step 3: Get orderbook for the specific market
    const orderbookResponse = await fetch(`https://api.elections.kalshi.com/trade-api/v2/markets/${targetMarket.ticker}/orderbook`);
    
    if (!orderbookResponse.ok) {
      console.error('Orderbook API error:', orderbookResponse.status, orderbookResponse.statusText);
      // Continue without orderbook data
    }
    
    const orderbookData = orderbookResponse.ok ? await orderbookResponse.json() : null;
    
    // Find the opposite team's market for hedging calculations
    let oppositeMarket = null;
    if (targetMarket && markets.length > 1) {
      // Find a market that's different from the target market
      oppositeMarket = markets.find(m => m.ticker !== targetMarket.ticker);
    }
    
    // Step 4: Get fee information (if available)
    // Note: Kalshi API doesn't provide fees directly, but we can add fee estimates
    const feeInfo = {
      makerFee: 0.02, // 2% maker fee (estimate - would need to parse from fee schedule)
      takerFee: 0.05, // 5% taker fee (estimate - would need to parse from fee schedule)
      transactionFee: 0.01, // 1% transaction fee (estimate)
      source: 'estimated', // Indicates this is estimated, not from API
      note: 'Fees are estimates. Check Kalshi fee schedule for exact rates.'
    };

    // Combine all data
    const combinedData = {
      event: eventData.event,
      market: targetMarket,
      oppositeMarket: oppositeMarket,
      orderbook: orderbookData?.orderbook,
      allMarkets: markets,
      fees: feeInfo
    };
    
    console.log('Combined Kalshi data:', combinedData);
    res.status(200).json(combinedData);
    
  } catch (error) {
    console.error('Kalshi proxy error:', error);
    res.status(500).json({ 
      success: false, 
      error: `Failed to fetch Kalshi data: ${error.message}` 
    });
  }
}