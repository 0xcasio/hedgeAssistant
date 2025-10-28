// pages/index.js

import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [marketURL, setMarketURL] = useState('');
  const [team, setTeam] = useState('');
  const [side, setSide] = useState('YES');
  const [shares, setShares] = useState(100);
  const [inputMode, setInputMode] = useState('contracts'); // 'contracts' or 'dollars'
  const [dollarAmount, setDollarAmount] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [currentPrices, setCurrentPrices] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);

  // Helper function to ensure percentages add up to 100%
  const normalizePercentages = (team1Chance, team2Chance) => {
    const total = team1Chance + team2Chance;
    if (total === 0) return { team1: 50, team2: 50 };
    
    const normalized1 = (team1Chance / total) * 100;
    const normalized2 = (team2Chance / total) * 100;
    
    // Round to ensure we don't get 101%
    const rounded1 = Math.round(normalized1);
    const rounded2 = 100 - rounded1; // Ensure they add up to exactly 100
    
    return { team1: rounded1, team2: rounded2 };
  };

  // Helper function to convert between dollars and contracts
  const convertDollarsToContracts = (dollars, price) => {
    if (!price || price <= 0) return 0;
    return Math.floor(dollars / price);
  };

  const convertContractsToDollars = (contracts, price) => {
    if (!price || price <= 0) return 0;
    return contracts * price;
  };

  // Function to handle input mode changes
  const handleInputModeChange = (newMode) => {
    setInputMode(newMode);
    
    // Convert between the two modes when switching
    if (newMode === 'dollars' && shares && buyPrice) {
      // Convert contracts to dollars
      const dollars = convertContractsToDollars(parseFloat(shares), parseFloat(buyPrice));
      setDollarAmount(dollars.toFixed(2));
    } else if (newMode === 'contracts' && dollarAmount && buyPrice) {
      // Convert dollars to contracts
      const contracts = convertDollarsToContracts(parseFloat(dollarAmount), parseFloat(buyPrice));
      setShares(contracts);
    }
  };

  // Function to get the current position value for calculations
  const getCurrentPosition = () => {
    if (inputMode === 'dollars') {
      const dollars = parseFloat(dollarAmount) || 0;
      const price = parseFloat(buyPrice) || 0;
      return {
        shares: convertDollarsToContracts(dollars, price),
        buyPrice: price,
        dollarAmount: dollars
      };
    } else {
      return {
        shares: parseFloat(shares) || 0,
        buyPrice: parseFloat(buyPrice) || 0,
        dollarAmount: convertContractsToDollars(parseFloat(shares) || 0, parseFloat(buyPrice) || 0)
      };
    }
  };

  useEffect(() => {
    // Load the hedging calculator script
    const script = document.createElement('script');
    script.src = '/hedging-calculator.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Fetch available teams and real-time prices when market URL changes
  useEffect(() => {
    const fetchMarketData = async () => {
      if (!marketURL || !scriptLoaded) return;
      
      try {
        // Parse the URL to get the event ticker
        const urlObj = new URL(marketURL);
        if (urlObj.hostname.includes('kalshi.com')) {
          const pathParts = urlObj.pathname.split('/');
          const ticker = pathParts[pathParts.length - 1];
          const eventTicker = ticker.toUpperCase();
          
          // Fetch all markets for this event
          const response = await fetch(`/api/kalshi?ticker=${eventTicker}`);
          if (response.ok) {
            const data = await response.json();
            const teams = [];
            let currentPrices = null;
            
            // Extract unique teams from all markets
            if (data.allMarkets) {
              data.allMarkets.forEach(market => {
                if (market.yes_sub_title && !teams.includes(market.yes_sub_title)) {
                  teams.push(market.yes_sub_title);
                }
                if (market.no_sub_title && !teams.includes(market.no_sub_title)) {
                  teams.push(market.no_sub_title);
                }
              });
            }
            
            // Get current market prices from the main market
            if (data.market) {
              const market = data.market;
              
              // Find both teams from the available teams list
              const availableTeams = [];
              if (data.allMarkets) {
                data.allMarkets.forEach(m => {
                  if (m.yes_sub_title && !availableTeams.includes(m.yes_sub_title)) {
                    availableTeams.push(m.yes_sub_title);
                  }
                  if (m.no_sub_title && !availableTeams.includes(m.no_sub_title)) {
                    availableTeams.push(m.no_sub_title);
                  }
                });
              }
              
              // Get the two main teams (first two unique teams)
              const team1 = availableTeams[0] || market.yes_sub_title || 'Team 1';
              const team2 = availableTeams[1] || market.no_sub_title || 'Team 2';
              
              // Calculate proper chances that add up to 100%
              const yesPrice = (market.yes_ask || market.yes_price || 0) / 100;
              const noPrice = (market.no_ask || market.no_price || 0) / 100;
              
              // Ensure chances add up to exactly 100%
              const totalChance = yesPrice + noPrice;
              const team1Chance = totalChance > 0 ? yesPrice / totalChance : 0.5;
              const team2Chance = totalChance > 0 ? noPrice / totalChance : 0.5;
              
              currentPrices = {
                yesAsk: yesPrice,
                yesBid: (market.yes_bid || 0) / 100,
                noAsk: noPrice,
                noBid: (market.no_bid || 0) / 100,
                yesSubTitle: market.yes_sub_title || 'YES',
                noSubTitle: market.no_sub_title || 'NO',
                // Add the actual team names for display
                team1: team1,
                team2: team2,
                team1Chance: team1Chance,
                team2Chance: team2Chance,
                // Add team-specific prices
                team1YesPrice: yesPrice,  // Team 1 YES price
                team1NoPrice: noPrice,   // Team 1 NO price
                team2YesPrice: noPrice,  // Team 2 YES price (opposite of team 1)
                team2NoPrice: yesPrice   // Team 2 NO price (opposite of team 1)
              };
              
              // Store current prices for display
              setCurrentPrices(currentPrices);
            }
            
            setAvailableTeams(teams);
            console.log('Available teams:', teams);
            console.log('Current prices:', currentPrices);
          }
        } else if (urlObj.hostname.includes('polymarket.com')) {
          // Handle Polymarket URLs
          let identifier, type;
          if (urlObj.pathname.includes('/event/')) {
            identifier = urlObj.pathname.split('/event/')[1].split('?')[0];
            type = 'slug';
          } else if (urlObj.searchParams.has('id')) {
            identifier = urlObj.searchParams.get('id');
            type = 'id';
          }
          
          if (identifier) {
            const response = await fetch(`/api/polymarket?identifier=${identifier}&type=${type}`);
            if (response.ok) {
              const data = await response.json();
              if (data && data.length > 0) {
                const market = data[0];
                const yesPrice = parseFloat(market.outcomePrices[0]);
                const noPrice = parseFloat(market.outcomePrices[1]);
                
                // Store current prices for display
                const polymarketPrices = {
                  yesAsk: yesPrice,
                  yesBid: yesPrice, // Polymarket doesn't separate bid/ask
                  noAsk: noPrice,
                  noBid: noPrice,
                  yesSubTitle: 'YES',
                  noSubTitle: 'NO'
                };
                setCurrentPrices(polymarketPrices);
                
                // Auto-populate the buy price with current YES price
                if (yesPrice > 0 && yesPrice < 1) {
                  setBuyPrice(yesPrice.toFixed(2));
                  console.log('Auto-populated buy price (Polymarket):', yesPrice);
                }
                
                console.log('Polymarket prices:', polymarketPrices);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching market data:', error);
        setAvailableTeams([]);
      }
    };

    fetchMarketData();
  }, [marketURL, scriptLoaded]);

  // Update buy price when team or side changes
  useEffect(() => {
    updateBuyPrice(team, side);
  }, [team, side, currentPrices]);

  // Sync dollar amount when shares or buy price changes (contracts mode)
  useEffect(() => {
    if (inputMode === 'contracts' && shares && buyPrice) {
      const dollars = convertContractsToDollars(parseFloat(shares), parseFloat(buyPrice));
      setDollarAmount(dollars.toFixed(2));
    }
  }, [shares, buyPrice, inputMode]);

  // Sync shares when dollar amount or buy price changes (dollars mode)
  useEffect(() => {
    if (inputMode === 'dollars' && dollarAmount && buyPrice) {
      const contracts = convertDollarsToContracts(parseFloat(dollarAmount), parseFloat(buyPrice));
      setShares(contracts);
    }
  }, [dollarAmount, buyPrice, inputMode]);

  // Function to update buy price when team/side is selected
  const updateBuyPrice = (selectedTeam, selectedSide) => {
    if (!currentPrices || !selectedTeam || !selectedSide) {
      setBuyPrice('');
      return;
    }

    // Determine which price to use based on the selected team and side
    let price = 0;
    
    // Check which team is selected and get the appropriate price
    if (selectedTeam === currentPrices.team1) {
      // Team 1 selected
      if (selectedSide === 'YES') {
        price = currentPrices.team1YesPrice;
      } else {
        price = currentPrices.team1NoPrice;
      }
    } else if (selectedTeam === currentPrices.team2) {
      // Team 2 selected
      if (selectedSide === 'YES') {
        price = currentPrices.team2YesPrice;
      } else {
        price = currentPrices.team2NoPrice;
      }
    } else {
      // Fallback to original logic if team doesn't match
      if (selectedSide === 'YES') {
        price = currentPrices.yesAsk;
      } else {
        price = currentPrices.noAsk;
      }
    }

    if (price > 0 && price < 1) {
      setBuyPrice(price.toFixed(2));
      console.log(`Updated buy price for ${selectedTeam} ${selectedSide}:`, price);
    } else {
      setBuyPrice('');
    }
  };

  // Function to refresh prices
  const refreshPrices = async () => {
    if (!marketURL || !scriptLoaded) return;
    
    setPriceLoading(true);
    try {
      const urlObj = new URL(marketURL);
      if (urlObj.hostname.includes('kalshi.com')) {
        const pathParts = urlObj.pathname.split('/');
        const ticker = pathParts[pathParts.length - 1];
        const eventTicker = ticker.toUpperCase();
        
        const response = await fetch(`/api/kalshi?ticker=${eventTicker}`);
        if (response.ok) {
          const data = await response.json();
          if (data.market) {
            const market = data.market;
            
            // Find both teams from the available teams list
            const availableTeams = [];
            if (data.allMarkets) {
              data.allMarkets.forEach(m => {
                if (m.yes_sub_title && !availableTeams.includes(m.yes_sub_title)) {
                  availableTeams.push(m.yes_sub_title);
                }
                if (m.no_sub_title && !availableTeams.includes(m.no_sub_title)) {
                  availableTeams.push(m.no_sub_title);
                }
              });
            }
            
            // Get the two main teams (first two unique teams)
            const team1 = availableTeams[0] || market.yes_sub_title || 'Team 1';
            const team2 = availableTeams[1] || market.no_sub_title || 'Team 2';
            
            // Calculate proper chances that add up to 100%
            const yesPrice = (market.yes_ask || market.yes_price || 0) / 100;
            const noPrice = (market.no_ask || market.no_price || 0) / 100;
            
            // Ensure chances add up to exactly 100%
            const totalChance = yesPrice + noPrice;
            const team1Chance = totalChance > 0 ? yesPrice / totalChance : 0.5;
            const team2Chance = totalChance > 0 ? noPrice / totalChance : 0.5;
            
            const newPrices = {
              yesAsk: yesPrice,
              yesBid: (market.yes_bid || 0) / 100,
              noAsk: noPrice,
              noBid: (market.no_bid || 0) / 100,
              yesSubTitle: market.yes_sub_title || 'YES',
              noSubTitle: market.no_sub_title || 'NO',
              // Add the actual team names for display
              team1: team1,
              team2: team2,
              team1Chance: team1Chance,
              team2Chance: team2Chance,
              // Add team-specific prices
              team1YesPrice: yesPrice,  // Team 1 YES price
              team1NoPrice: noPrice,   // Team 1 NO price
              team2YesPrice: noPrice,  // Team 2 YES price (opposite of team 1)
              team2NoPrice: yesPrice   // Team 2 NO price (opposite of team 1)
            };
            setCurrentPrices(newPrices);
            
            // Update buy price if it's close to the current price
            const currentBuyPrice = parseFloat(buyPrice);
            if (Math.abs(currentBuyPrice - newPrices.yesAsk) > 0.05) {
              setBuyPrice(newPrices.yesAsk.toFixed(2));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing prices:', error);
    } finally {
      setPriceLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!window.HedgingCalculator) {
      setError('Script not loaded yet. Please try again in a moment.');
      return;
    }
    
    // Show loading state
    setLoading(true);
    setError('');
    setResults(null);
    
    // Create position object using the current input mode
    const currentPosition = getCurrentPosition();
    const position = {
      side: side,
      shares: currentPosition.shares,
      buyPrice: currentPosition.buyPrice
    };
    
    try {
      // Call the calculator with team selection
      const result = await window.HedgingCalculator.calculate(marketURL, position, team);
      
      if (result.success) {
        console.log('Results received:', result.data);
        setResults(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper functions from the original test-calculator.html
  const formatPrice = (price) => {
    if (price === undefined || price === null || isNaN(price)) {
      return 'N/A';
    }
    return `$${price.toFixed(2)}`;
  };
  
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return 'N/A';
    }
    const sign = amount >= 0 ? '+' : '';
    return `${sign}$${Math.abs(amount).toFixed(2)}`;
  };
  
  const formatPercent = (percent) => {
    if (percent === undefined || percent === null || isNaN(percent)) {
      return 'N/A';
    }
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  };
  
  const createStrategyCard = (strategy, position, isBest) => {
    const profitClass = strategy.profit >= 0 || strategy.guaranteedProfit >= 0 ? 'positive' : 'negative';
    const mainProfit = strategy.guaranteedProfit !== undefined ? strategy.guaranteedProfit : strategy.profit;
    const mainProfitPercent = strategy.profitPercent;
    
    return (
      <div className={`strategy-card ${isBest ? 'best-choice' : ''}`} key={strategy.strategy}>
        <h3>{strategy.strategy}</h3>
        <div className="action">{strategy.action}</div>
        
        <div className="metrics">
          <div className="metric">
            <div className="label">Profit</div>
            <div className={`value ${profitClass}`}>{formatCurrency(mainProfit)}</div>
          </div>
          <div className="metric">
            <div className="label">Return</div>
            <div className={`value ${profitClass}`}>{formatPercent(mainProfitPercent)}</div>
          </div>
          {strategy.profitIfOriginalWins !== undefined && (
            <>
              <div className="metric">
                <div className="label">If {position.side} wins</div>
                <div className="value positive">{formatCurrency(strategy.profitIfOriginalWins)}</div>
              </div>
              <div className="metric">
                <div className="label">If {position.side === 'YES' ? 'NO' : 'YES'} wins</div>
                <div className={`value ${strategy.profitIfHedgeWins >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(strategy.profitIfHedgeWins)}
                </div>
              </div>
            </>
          )}
          {strategy.fees && (
            <div className="metric">
              <div className="label">Fees</div>
              <div className="value negative">{formatCurrency(strategy.fees.total)}</div>
            </div>
          )}
        </div>
        
        <div className="description">
          <strong>Risk:</strong> {strategy.risk}<br />
          {strategy.description}
        </div>
      </div>
    );
  };

  return (
    <div>
      <Head>
        <title>Hedging Calculator - Next.js Version</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <style jsx global>{`
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        
        h1 {
            color: #1a202c;
            margin-bottom: 10px;
            font-size: 32px;
        }
        
        .subtitle {
            color: #718096;
            margin-bottom: 30px;
            font-size: 16px;
        }
        
        .input-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            color: #2d3748;
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        input, select {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.2s;
        }
        
        input:focus, select:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        button {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 20px;
            transition: transform 0.2s;
        }
        
        button:hover {
            transform: translateY(-2px);
        }
        
        button:active {
            transform: translateY(0);
        }
        
        button:disabled {
            background: #cbd5e0;
            cursor: not-allowed;
            transform: none;
        }
        
        .loading {
            text-align: center;
            color: #718096;
            margin-top: 20px;
        }
        
        .error {
            background: #fed7d7;
            color: #c53030;
            padding: 16px;
            border-radius: 8px;
            margin-top: 20px;
        }
        
        .results {
            margin-top: 30px;
        }
        
        .market-info {
            background: #f7fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #667eea;
        }
        
        .market-info h2 {
            color: #2d3748;
            font-size: 20px;
            margin-bottom: 8px;
        }
        
        .market-info .platform {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 12px;
        }
        
        .market-info .prices {
            display: flex;
            gap: 20px;
            margin-top: 12px;
        }
        
        .price-item {
            flex: 1;
        }
        
        .price-item .label {
            font-size: 12px;
            color: #718096;
            text-transform: uppercase;
            font-weight: 600;
        }
        
        .price-item .value {
            font-size: 24px;
            color: #2d3748;
            font-weight: 700;
        }
        
        .price-item .chance {
            font-size: 14px;
            color: #718096;
            margin-top: 4px;
            font-weight: 500;
        }
        
        .strategy-card {
            background: white;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 20px;
            transition: all 0.2s;
        }
        
        .strategy-card:hover {
            border-color: #667eea;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
        }
        
        .strategy-card h3 {
            color: #2d3748;
            font-size: 20px;
            margin-bottom: 12px;
        }
        
        .strategy-card .action {
            background: #edf2f7;
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 16px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #2d3748;
        }
        
        .metrics {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            margin-bottom: 16px;
        }
        
        .metric {
            background: #f7fafc;
            padding: 12px;
            border-radius: 6px;
        }
        
        .metric .label {
            font-size: 12px;
            color: #718096;
            margin-bottom: 4px;
            text-transform: uppercase;
            font-weight: 600;
        }
        
        .metric .value {
            font-size: 20px;
            font-weight: 700;
        }
        
        .metric .value.positive {
            color: #38a169;
        }
        
        .metric .value.negative {
            color: #e53e3e;
        }
        
        .description {
            color: #4a5568;
            line-height: 1.6;
            font-size: 14px;
        }
        
        .best-choice {
            border: 3px solid #48bb78;
            position: relative;
        }
        
        .best-choice::before {
            content: "✓ RECOMMENDED";
            position: absolute;
            top: -12px;
            right: 20px;
            background: #48bb78;
            color: white;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
        }
        
        .current-prices {
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .prices-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        
        .prices-header h3 {
            color: #2d3748;
            font-size: 18px;
            margin: 0;
        }
        
        .refresh-button {
            background: #667eea;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .refresh-button:hover:not(:disabled) {
            background: #5a67d8;
        }
        
        .refresh-button:disabled {
            background: #cbd5e0;
            cursor: not-allowed;
        }
        
        .teams-comparison {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .teams-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 20px;
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .chance-label {
            font-size: 12px;
            color: #718096;
            font-weight: 500;
        }
        
        .sort-icon {
            font-size: 14px;
            color: #a0aec0;
            cursor: pointer;
        }
        
        .team-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
        }
        
        .team-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .team-avatar {
            font-size: 20px;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f7fafc;
            border-radius: 50%;
            border: 1px solid #e2e8f0;
        }
        
        .team-name {
            font-size: 16px;
            font-weight: 600;
            color: #2d3748;
        }
        
        .team-chance {
            font-size: 18px;
            font-weight: 700;
            color: #4a5568;
            background: #f7fafc;
            padding: 4px 8px;
            border-radius: 4px;
        }
        
        .contract-prices {
            display: flex;
            gap: 8px;
        }
        
        .contract-button {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 8px 12px;
            border-radius: 6px;
            min-width: 60px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .yes-contract {
            background: #3182ce;
            color: white;
        }
        
        .yes-contract:hover {
            background: #2c5aa0;
        }
        
        .no-contract {
            background: #805ad5;
            color: white;
        }
        
        .no-contract:hover {
            background: #6b46c1;
        }
        
        .contract-label {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 2px;
        }
        
        .contract-price {
            font-size: 14px;
            font-weight: 700;
        }
        
        .team-divider {
            height: 1px;
            background: #e2e8f0;
            margin: 0 20px;
        }
        
        .price-note {
            font-size: 13px;
            color: #4a5568;
            text-align: center;
            font-style: italic;
        }
        
        .auto-populated {
            font-size: 12px;
            color: #38a169;
            font-weight: 500;
            margin-left: 8px;
        }
        
        .price-warning {
            background: #fed7d7;
            color: #c53030;
            padding: 8px 12px;
            border-radius: 6px;
            margin-top: 8px;
            font-size: 13px;
            font-weight: 500;
        }
        
        .input-mode-container {
            display: flex;
            gap: 12px;
            align-items: center;
        }
        
        .input-mode-select {
            flex: 0 0 140px;
            padding: 12px 16px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 16px;
            background: white;
            cursor: pointer;
            transition: border-color 0.2s;
        }
        
        .input-mode-select:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .position-input {
            flex: 1;
            padding: 12px 16px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.2s;
        }
        
        .position-input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .conversion-info {
            margin-top: 8px;
            padding: 8px 12px;
            background: #f7fafc;
            border-radius: 6px;
            font-size: 13px;
            color: #4a5568;
            font-weight: 500;
        }
      `}</style>
      
      <div className="container">
        <h1>🎯 Hedging Calculator</h1>
        {/* <p className="subtitle">Next.js Version - No CORS Issues!</p> */}
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="market-url">Market URL</label>
            <input 
              type="text" 
              id="market-url" 
              placeholder="https://kalshi.com/markets/..." 
              value={marketURL}
              onChange={(e) => setMarketURL(e.target.value)}
            />
          </div>
          
          {/* Current Market Prices Display */}
          {currentPrices && (
            <div className="current-prices">
              <div className="prices-header">
                <h3>📊 Current Market Prices</h3>
                <button 
                  type="button" 
                  onClick={refreshPrices} 
                  disabled={priceLoading}
                  className="refresh-button"
                >
                  {priceLoading ? '⏳' : '🔄'} Refresh Prices
                </button>
              </div>
              
              {/* Kalshi-style team comparison */}
              <div className="teams-comparison">
                {/* Header row */}
                <div className="teams-header">
                  <div className="chance-label">Chance</div>
                  <div className="sort-icon">⇅</div>
                </div>
                
                <div className="team-row">
                  <div className="team-info">
                    <div className="team-avatar">🏒</div>
                    <div className="team-name">{currentPrices.team1 || currentPrices.yesSubTitle}</div>
                    <div className="team-chance">{normalizePercentages(currentPrices.team1Chance, currentPrices.team2Chance).team1}%</div>
                  </div>
                  <div className="contract-prices">
                    <div className="contract-button yes-contract">
                      <span className="contract-label">Yes</span>
                      <span className="contract-price">{(currentPrices.yesAsk * 100).toFixed(0)}¢</span>
                    </div>
                    <div className="contract-button no-contract">
                      <span className="contract-label">No</span>
                      <span className="contract-price">{(currentPrices.noAsk * 100).toFixed(0)}¢</span>
                    </div>
                  </div>
                </div>
                
                <div className="team-divider"></div>
                
                <div className="team-row">
                  <div className="team-info">
                    <div className="team-avatar">🏒</div>
                    <div className="team-name">{currentPrices.team2 || currentPrices.noSubTitle}</div>
                    <div className="team-chance">{normalizePercentages(currentPrices.team1Chance, currentPrices.team2Chance).team2}%</div>
                  </div>
                  <div className="contract-prices">
                    <div className="contract-button yes-contract">
                      <span className="contract-label">Yes</span>
                      <span className="contract-price">{(currentPrices.noAsk * 100).toFixed(0)}¢</span>
                    </div>
                    <div className="contract-button no-contract">
                      <span className="contract-label">No</span>
                      <span className="contract-price">{(currentPrices.yesAsk * 100).toFixed(0)}¢</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="price-note">
                💡 Buy price auto-populated from current market prices. Adjust if needed.
              </div>
            </div>
          )}
          
          <div className="row">
            <div className="input-group">
              <label htmlFor="team">Team/Side to Bet On</label>
              <select 
                id="team"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
              >
                <option value="">Select a team/side...</option>
                {availableTeams.map(teamName => (
                  <option key={teamName} value={teamName}>{teamName}</option>
                ))}
              </select>
            </div>
            
            <div className="input-group">
              <label htmlFor="side">Position Side</label>
              <select 
                id="side"
                value={side}
                onChange={(e) => setSide(e.target.value)}
                disabled={!team}
              >
                <option value="YES">YES (I bet this team will win)</option>
                <option value="NO">NO (I bet this team won't win)</option>
              </select>
            </div>
            
            <div className="input-group">
              <label htmlFor="input-mode">Position Size</label>
              <div className="input-mode-container">
                <select 
                  id="input-mode"
                  value={inputMode}
                  onChange={(e) => handleInputModeChange(e.target.value)}
                  className="input-mode-select"
                >
                  <option value="contracts">Contracts/Shares</option>
                  <option value="dollars">Dollar Amount</option>
                </select>
                
                {inputMode === 'contracts' ? (
                  <input 
                    type="number" 
                    id="shares" 
                    placeholder="100" 
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    min="1"
                    className="position-input"
                  />
                ) : (
                  <input 
                    type="number" 
                    id="dollar-amount" 
                    placeholder="50.00" 
                    value={dollarAmount}
                    onChange={(e) => setDollarAmount(e.target.value)}
                    min="0.01"
                    step="0.01"
                    className="position-input"
                  />
                )}
              </div>
              
              {/* Show conversion info */}
              {team && side && buyPrice && (
                <div className="conversion-info">
                  {inputMode === 'contracts' ? (
                    <span>
                      💰 Total value: ${convertContractsToDollars(parseFloat(shares) || 0, parseFloat(buyPrice) || 0).toFixed(2)}
                    </span>
                  ) : (
                    <span>
                      📊 Contracts: {convertDollarsToContracts(parseFloat(dollarAmount) || 0, parseFloat(buyPrice) || 0)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="input-group">
            <label htmlFor="buy-price">
              Buy Price (per share) 
              {team && side && currentPrices && (
                <span className="auto-populated"> 
                  🔄 Auto-populated from current market price for {team} {side}
                </span>
              )}
            </label>
            <input 
              type="number" 
              id="buy-price" 
              placeholder={team && side ? "Select team and side first" : "0.41"} 
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              step="0.01"
              min="0.01"
              max="0.99"
              disabled={!team || !side}
              style={{
                borderColor: currentPrices && Math.abs(parseFloat(buyPrice) - currentPrices.yesAsk) > 0.05 
                  ? '#e53e3e' 
                  : '#e2e8f0',
                opacity: (!team || !side) ? 0.6 : 1,
                cursor: (!team || !side) ? 'not-allowed' : 'text'
              }}
            />
            {currentPrices && team && side && (() => {
              let currentPrice = 0;
              if (team === currentPrices.team1) {
                currentPrice = side === 'YES' ? currentPrices.team1YesPrice : currentPrices.team1NoPrice;
              } else if (team === currentPrices.team2) {
                currentPrice = side === 'YES' ? currentPrices.team2YesPrice : currentPrices.team2NoPrice;
              } else {
                currentPrice = side === 'YES' ? currentPrices.yesAsk : currentPrices.noAsk;
              }
              return Math.abs(parseFloat(buyPrice) - currentPrice) > 0.05;
            })() && (
              <div className="price-warning">
                ⚠️ Your buy price differs significantly from current market price (${(() => {
                  let currentPrice = 0;
                  if (team === currentPrices.team1) {
                    currentPrice = side === 'YES' ? currentPrices.team1YesPrice : currentPrices.team1NoPrice;
                  } else if (team === currentPrices.team2) {
                    currentPrice = side === 'YES' ? currentPrices.team2YesPrice : currentPrices.team2NoPrice;
                  } else {
                    currentPrice = side === 'YES' ? currentPrices.yesAsk : currentPrices.noAsk;
                  }
                  return currentPrice.toFixed(2);
                })()})
              </div>
            )}
          </div>
          
          <button type="submit" disabled={!scriptLoaded || loading}>
            {scriptLoaded ? 'Calculate Hedging Strategies' : 'Loading script...'}
          </button>
        </form>
        
        {loading && (
          <div className="loading">
            <p>⏳ Fetching market data and calculating strategies...</p>
          </div>
        )}
        
        {error && (
          <div className="error">❌ {error}</div>
        )}
        
        {results && (
          <div className="results">
            <div className="market-info">
              <span className="platform">{results.marketInfo.platform}</span>
              <h2>{results.marketInfo.title}</h2>
              <div className="prices">
                <div className="price-item">
                  <div className="label">YES Price ({results.marketInfo.yesSubTitle || 'YES'})</div>
                  <div className="value">{formatPrice(results.marketInfo.currentYesPrice)}</div>
                  <div className="chance">{(results.marketInfo.currentYesPrice * 100).toFixed(0)}% chance</div>
                </div>
                <div className="price-item">
                  <div className="label">NO Price ({results.marketInfo.noSubTitle || 'NO'})</div>
                  <div className="value">{formatPrice(results.marketInfo.currentNoPrice)}</div>
                  <div className="chance">{(results.marketInfo.currentNoPrice * 100).toFixed(0)}% chance</div>
                </div>
              </div>
              <p style={{ marginTop: '12px', color: '#4a5568' }}>
                Your position: {results.position.shares} {results.position.side} shares at {formatPrice(results.position.buyPrice)}
              </p>
              
              {results.marketInfo.rulesPrimary && (
                <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f7fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#2d3748', marginBottom: '8px' }}>
                    Market Rules
                  </div>
                  <div style={{ fontSize: '13px', color: '#4a5568', lineHeight: '1.5' }}>
                    <strong>Primary:</strong> {results.marketInfo.rulesPrimary}
                  </div>
                  {results.marketInfo.rulesSecondary && (
                    <div style={{ fontSize: '13px', color: '#4a5568', lineHeight: '1.5', marginTop: '8px' }}>
                      <strong>Additional:</strong> {results.marketInfo.rulesSecondary}
                    </div>
                  )}
                </div>
              )}
              
              {results.marketInfo.fees && (
                <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fff5f5', borderRadius: '8px', border: '1px solid #fed7d7' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#2d3748', marginBottom: '8px' }}>
                    Trading Fees ({results.marketInfo.fees.source})
                  </div>
                  <div style={{ fontSize: '13px', color: '#4a5568', lineHeight: '1.5' }}>
                    <strong>Maker Fee:</strong> {(results.marketInfo.fees.makerFee * 100).toFixed(1)}% | 
                    <strong> Taker Fee:</strong> {(results.marketInfo.fees.takerFee * 100).toFixed(1)}% | 
                    <strong> Transaction Fee:</strong> {(results.marketInfo.fees.transactionFee * 100).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
                    {results.marketInfo.fees.note}
                  </div>
                </div>
              )}
            </div>
            
            {/* Add each strategy card */}
            {['exit', 'perfectHedge', 'conservative', 'moderate', 'minimal'].map(key => {
              const strategy = results.strategies[key];
              const isBest = key === (
                results.strategies.perfectHedge.guaranteedProfit > results.strategies.exit.profit 
                  ? 'perfectHedge' 
                  : 'exit'
              );
              
              return createStrategyCard(strategy, results.position, isBest);
            })}
          </div>
        )}
      </div>
    </div>
  );
}