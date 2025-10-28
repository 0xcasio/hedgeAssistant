// pages/index-new.js - New design with existing logic preserved

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { Target, TrendingUp, RefreshCw, DollarSign, Check, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/collapsible";

export default function Home() {
  // All existing state variables preserved
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

  // New UI state for collapsible sections
  const [isPayoutExpanded, setIsPayoutExpanded] = useState(false);
  const [isPerfectHedgeExpanded, setIsPerfectHedgeExpanded] = useState(true);
  const [isSimpleExitExpanded, setIsSimpleExitExpanded] = useState(false);

  // All existing helper functions preserved
  const normalizePercentages = (team1Chance, team2Chance) => {
    const total = team1Chance + team2Chance;
    if (total === 0) return { team1: 50, team2: 50 };
    
    const normalized1 = (team1Chance / total) * 100;
    const normalized2 = (team2Chance / total) * 100;
    
    const rounded1 = Math.round(normalized1);
    const rounded2 = 100 - rounded1;
    
    return { team1: rounded1, team2: rounded2 };
  };

  const convertDollarsToContracts = (dollars, price) => {
    if (!price || price <= 0) return 0;
    return Math.floor(dollars / price);
  };

  const convertContractsToDollars = (contracts, price) => {
    if (!price || price <= 0) return 0;
    return contracts * price;
  };

  const handleInputModeChange = (newMode) => {
    setInputMode(newMode);
    
    if (newMode === 'dollars' && shares && buyPrice) {
      const dollars = convertContractsToDollars(parseFloat(shares), parseFloat(buyPrice));
      setDollarAmount(dollars.toFixed(2));
    } else if (newMode === 'contracts' && dollarAmount && buyPrice) {
      const contracts = convertDollarsToContracts(parseFloat(dollarAmount), parseFloat(buyPrice));
      setShares(contracts);
    }
  };

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

  // All existing useEffect hooks preserved
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/hedging-calculator.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const fetchMarketData = async () => {
      if (!marketURL || !scriptLoaded) return;
      
      try {
        const urlObj = new URL(marketURL);
        if (urlObj.hostname.includes('kalshi.com')) {
          const pathParts = urlObj.pathname.split('/');
          const ticker = pathParts[pathParts.length - 1];
          const eventTicker = ticker.toUpperCase();
          
          const response = await fetch(`/api/kalshi?ticker=${eventTicker}`);
          if (response.ok) {
            const data = await response.json();
            const teams = [];
            let currentPrices = null;
            
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
            
            if (data.market) {
              const market = data.market;
              
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
              
              const team1 = availableTeams[0] || market.yes_sub_title || 'Team 1';
              const team2 = availableTeams[1] || market.no_sub_title || 'Team 2';
              
              const yesPrice = (market.yes_ask || market.yes_price || 0) / 100;
              const noPrice = (market.no_ask || market.no_price || 0) / 100;
              
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
                team1: team1,
                team2: team2,
                team1Chance: team1Chance,
                team2Chance: team2Chance,
                team1YesPrice: yesPrice,
                team1NoPrice: noPrice,
                team2YesPrice: noPrice,
                team2NoPrice: yesPrice
              };
              
              setCurrentPrices(currentPrices);
            }
            
            setAvailableTeams(teams);
            console.log('Available teams:', teams);
            console.log('Current prices:', currentPrices);
          }
        } else if (urlObj.hostname.includes('polymarket.com')) {
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
                
                const polymarketPrices = {
                  yesAsk: yesPrice,
                  yesBid: yesPrice,
                  noAsk: noPrice,
                  noBid: noPrice,
                  yesSubTitle: 'YES',
                  noSubTitle: 'NO'
                };
                setCurrentPrices(polymarketPrices);
                
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

  useEffect(() => {
    updateBuyPrice(team, side);
  }, [team, side, currentPrices]);

  useEffect(() => {
    if (inputMode === 'contracts' && shares && buyPrice) {
      const dollars = convertContractsToDollars(parseFloat(shares), parseFloat(buyPrice));
      setDollarAmount(dollars.toFixed(2));
    }
  }, [shares, buyPrice, inputMode]);

  useEffect(() => {
    if (inputMode === 'dollars' && dollarAmount && buyPrice) {
      const contracts = convertDollarsToContracts(parseFloat(dollarAmount), parseFloat(buyPrice));
      setShares(contracts);
    }
  }, [dollarAmount, buyPrice, inputMode]);

  const updateBuyPrice = (selectedTeam, selectedSide) => {
    if (!currentPrices || !selectedTeam || !selectedSide) {
      setBuyPrice('');
      return;
    }

    let price = 0;
    
    if (selectedTeam === currentPrices.team1) {
      if (selectedSide === 'YES') {
        price = currentPrices.team1YesPrice;
      } else {
        price = currentPrices.team1NoPrice;
      }
    } else if (selectedTeam === currentPrices.team2) {
      if (selectedSide === 'YES') {
        price = currentPrices.team2YesPrice;
      } else {
        price = currentPrices.team2NoPrice;
      }
    } else {
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
            
            const team1 = availableTeams[0] || market.yes_sub_title || 'Team 1';
            const team2 = availableTeams[1] || market.no_sub_title || 'Team 2';
            
            const yesPrice = (market.yes_ask || market.yes_price || 0) / 100;
            const noPrice = (market.no_ask || market.no_price || 0) / 100;
            
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
              team1: team1,
              team2: team2,
              team1Chance: team1Chance,
              team2Chance: team2Chance,
              team1YesPrice: yesPrice,
              team1NoPrice: noPrice,
              team2YesPrice: noPrice,
              team2NoPrice: yesPrice
            };
            setCurrentPrices(newPrices);
            
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
    
    setLoading(true);
    setError('');
    setResults(null);
    
    const currentPosition = getCurrentPosition();
    const position = {
      side: side,
      shares: currentPosition.shares,
      buyPrice: currentPosition.buyPrice
    };
    
    try {
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
  
  // All existing helper functions preserved
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
    const profitClass = strategy.profit >= 0 || strategy.guaranteedProfit >= 0 ? 'text-emerald-400' : 'text-red-400';
    const mainProfit = strategy.guaranteedProfit !== undefined ? strategy.guaranteedProfit : strategy.profit;
    const mainProfitPercent = strategy.profitPercent;
    
    return (
      <Collapsible key={strategy.strategy} open={strategy.strategy === 'Perfect Hedge' ? isPerfectHedgeExpanded : isSimpleExitExpanded} onOpenChange={strategy.strategy === 'Perfect Hedge' ? setIsPerfectHedgeExpanded : setIsSimpleExitExpanded}>
        <Card className={`bg-[#12141a] border-2 ${isBest ? 'border-emerald-500' : 'border-slate-800'} hover:border-emerald-400 transition-colors overflow-hidden`}>
          <CollapsibleTrigger className="w-full p-6 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ChevronRight className={`size-5 text-slate-400 transition-transform ${(strategy.strategy === 'Perfect Hedge' ? isPerfectHedgeExpanded : isSimpleExitExpanded) ? 'rotate-90' : ''}`} />
                <h3 className="text-white">{strategy.strategy}</h3>
              </div>
              {isBest && <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">✓ RECOMMENDED</Badge>}
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="px-6 pb-6 space-y-4">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-sm text-slate-300">{strategy.action}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-1">PROFIT</p>
                  <p className={`text-2xl ${profitClass}`}>{formatCurrency(mainProfit)}</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-1">RETURN</p>
                  <p className={`text-2xl ${profitClass}`}>{formatPercent(mainProfitPercent)}</p>
                </div>
              </div>

              {strategy.profitIfOriginalWins !== undefined && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                    <p className="text-xs text-slate-400 mb-1">IF {position.side} WINS</p>
                    <p className="text-xl text-emerald-400">{formatCurrency(strategy.profitIfOriginalWins)}</p>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                    <p className="text-xs text-slate-400 mb-1">IF {position.side === 'YES' ? 'NO' : 'YES'} WINS</p>
                    <p className={`text-xl ${strategy.profitIfHedgeWins >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(strategy.profitIfHedgeWins)}
                    </p>
                  </div>
                </div>
              )}

              {strategy.fees && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-1">FEES</p>
                  <p className="text-red-400">+{formatCurrency(strategy.fees.total)}</p>
                </div>
              )}

              <div className={`${isBest ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-blue-500/10 border border-blue-500/30'} rounded-lg p-4`}>
                <p className="text-sm text-slate-300 mb-1"><span className="text-white">Risk:</span> {strategy.risk}</p>
                <p className="text-sm text-slate-400">{strategy.description}</p>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  };

  // Calculate values for position size display
  const currentPosition = getCurrentPosition();
  const currentDollarAmount = currentPosition.dollarAmount;
  const contractCount = currentPosition.shares;
  const price = currentPosition.buyPrice;
  const estimatedCost = contractCount * price;
  const payout = contractCount * 1;
  const profit = payout - estimatedCost;
  const chance = side === 'YES' 
    ? (currentPrices?.team1Chance ? currentPrices.team1Chance * 100 : 0)
    : (currentPrices?.team2Chance ? currentPrices.team2Chance * 100 : 0);

  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white">
      <Head>
        <title>Hedging Calculator - Next.js Version</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      {/* Header */}
      <div className="border-b border-slate-800 bg-[#12141a]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-lg">
              <Target className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-white">Hedging Calculator</h1>
              <p className="text-slate-400 text-sm">Calculate optimal hedge strategies for your prediction market positions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Market URL Input */}
        <Card className="p-4 mb-6 bg-[#12141a] border-slate-800">
          <div className="space-y-2">
            <Label htmlFor="market-url" className="text-slate-300 text-sm">Market URL</Label>
            <Input
              id="market-url"
              value={marketURL}
              onChange={(e) => setMarketURL(e.target.value)}
              placeholder="Enter Kalshi market URL..."
              className="bg-[#1a1d24] border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500"
            />
          </div>
        </Card>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Market Prices */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info message */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">ℹ️</span>
              <p className="text-sm text-blue-200">Click on a team to select it for your hedge calculation</p>
            </div>
            
            {/* Current Market Prices */}
            {currentPrices && (
              <Card className="p-6 bg-[#12141a] border-slate-800">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="size-5 text-emerald-500" />
                    <h2 className="text-white">Current Market Prices</h2>
                  </div>
                  <Button variant="outline" size="sm" className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={refreshPrices} disabled={priceLoading}>
                    <RefreshCw className={`size-4 mr-2 ${priceLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>

                <div className="space-y-3">
                  {/* Market Rows */}
                  {[
                    { name: currentPrices.team1 || currentPrices.yesSubTitle, chance: normalizePercentages(currentPrices.team1Chance, currentPrices.team2Chance).team1, yesPrice: (currentPrices.yesAsk * 100).toFixed(0), noPrice: (currentPrices.noAsk * 100).toFixed(0), icon: "🏒" },
                    { name: currentPrices.team2 || currentPrices.noSubTitle, chance: normalizePercentages(currentPrices.team1Chance, currentPrices.team2Chance).team2, yesPrice: (currentPrices.noAsk * 100).toFixed(0), noPrice: (currentPrices.yesAsk * 100).toFixed(0), icon: "🏒" }
                  ].map((teamData, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTeam(teamData.name)}
                      className={`w-full grid grid-cols-12 gap-4 items-center p-4 rounded-lg transition-all ${
                        team === teamData.name
                          ? 'bg-emerald-500/20 border-2 border-emerald-500'
                          : 'bg-slate-900/30 border-2 border-transparent hover:bg-slate-900/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="col-span-5 flex items-center gap-3">
                        {team === teamData.name && (
                          <div className="flex-shrink-0 size-5 bg-emerald-500 rounded-full flex items-center justify-center">
                            <Check className="size-3 text-white" />
                          </div>
                        )}
                        <span className="text-2xl">{teamData.icon}</span>
                        <span className="text-white text-left">{teamData.name}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-300">{teamData.chance}%</span>
                      </div>
                      <div className="col-span-5 flex items-center justify-end gap-2">
                        <div className="px-5 py-1.5 bg-[#3b82f6] text-white rounded-md text-center min-w-[80px]">
                          <div className="text-xs opacity-80">YES</div>
                          <div className="text-sm">{teamData.yesPrice}¢</div>
                        </div>
                        <div className="px-5 py-1.5 bg-[#a855f7] text-white rounded-md text-center min-w-[80px]">
                          <div className="text-xs opacity-80">NO</div>
                          <div className="text-sm">{teamData.noPrice}¢</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* Results Section */}
            {results && (
              <div className="space-y-6">
                {/* Hedging Strategies */}
                <div className="space-y-4">
                  <h2 className="text-white">Hedging Strategies</h2>

                  {/* Strategy Cards */}
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

                {/* Market Info */}
                <Card className="p-6 bg-[#12141a] border-slate-800 border-l-4 border-l-emerald-500">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Badge className="mb-2 bg-emerald-600 text-white hover:bg-emerald-600">{results.marketInfo.platform}</Badge>
                      <h2 className="text-white">{results.marketInfo.title}</h2>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">YES PRICE ({results.marketInfo.yesSubTitle || 'YES'})</p>
                      <p className="text-white text-2xl">{formatPrice(results.marketInfo.currentYesPrice)}</p>
                      <p className="text-sm text-slate-400">
                        {(results.marketInfo.currentYesPrice * 100).toFixed(0)}% chance
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">NO PRICE ({results.marketInfo.noSubTitle || 'NO'})</p>
                      <p className="text-white text-2xl">{formatPrice(results.marketInfo.currentNoPrice)}</p>
                      <p className="text-sm text-slate-400">{(results.marketInfo.currentNoPrice * 100).toFixed(0)}% chance</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 mb-4">Your position: <span className="text-white">{results.position.shares} {results.position.side} shares at {formatPrice(results.position.buyPrice)}</span></p>

                  {results.marketInfo.fees && (
                    <div className="mt-4 bg-slate-900/50 rounded-lg p-4 space-y-2">
                      <p className="text-sm text-white">Trading Fees ({results.marketInfo.fees.source})</p>
                      <p className="text-sm text-slate-400">
                        <span className="text-slate-300">Maker Fee:</span> {(results.marketInfo.fees.makerFee * 100).toFixed(1)}% | 
                        <span className="text-slate-300"> Taker Fee:</span> {(results.marketInfo.fees.takerFee * 100).toFixed(1)}% | 
                        <span className="text-slate-300"> Transaction Fee:</span> {(results.marketInfo.fees.transactionFee * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-slate-500">{results.marketInfo.fees.note}</p>
                    </div>
                  )}

                  {results.marketInfo.rulesPrimary && (
                    <div className="mt-4 bg-slate-900/50 rounded-lg p-4 space-y-2">
                      <p className="text-sm text-white">Market Rules</p>
                      <p className="text-sm text-slate-400">
                        <span className="text-slate-300">Primary:</span> {results.marketInfo.rulesPrimary}
                      </p>
                      {results.marketInfo.rulesSecondary && (
                        <p className="text-sm text-slate-400">
                          <span className="text-slate-300">Additional:</span> {results.marketInfo.rulesSecondary}
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>

          {/* Right Column - Position Configuration (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Card className="p-6 bg-[#12141a] border-slate-800">
                <h2 className="text-white mb-6">Position Configuration</h2>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Selected Team Display */}
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">Selected Team</Label>
                    <div className={`p-3 rounded-lg border-2 ${
                      team 
                        ? 'bg-emerald-500/10 border-emerald-500/50' 
                        : 'bg-slate-900/50 border-slate-700 border-dashed'
                    }`}>
                      {team ? (
                        <div className="flex items-center gap-2">
                          <Check className="size-4 text-emerald-400" />
                          <span className="text-white">{team}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-sm">Click a team above to select</span>
                      )}
                    </div>
                  </div>

                  {/* Position Side - YES/NO Buttons */}
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">Position Side</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSide("YES")}
                        disabled={!team}
                        className={`p-3 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          side === "YES"
                            ? 'bg-[#3b82f6] border-[#3b82f6] text-white'
                            : 'bg-[#1e3a5f] border-[#2d4a6e] text-[#60a5fa] hover:bg-[#2d4a6e]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Yes</span>
                          <span>{currentPrices ? `${(currentPrices.yesAsk * 100).toFixed(0)}¢` : '--'}</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSide("NO")}
                        disabled={!team}
                        className={`p-3 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          side === "NO"
                            ? 'bg-[#a855f7] border-[#a855f7] text-white'
                            : 'bg-[#3d2456] border-[#4d3066] text-[#c084fc] hover:bg-[#4d3066]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm">No</span>
                          <span>{currentPrices ? `${(currentPrices.noAsk * 100).toFixed(0)}¢` : '--'}</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <Separator className="bg-slate-800" />

                  {/* Position Size */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300 text-sm">Position Size</Label>
                      <Select value={inputMode} onValueChange={handleInputModeChange}>
                        <SelectTrigger className="w-[110px] h-7 bg-[#1a1d24] border-slate-700 text-white text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1d24] border-slate-700">
                          <SelectItem value="dollars" className="text-white text-xs">Dollars</SelectItem>
                          <SelectItem value="contracts" className="text-white text-xs">Contracts</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Input with conditional prefix/suffix */}
                    <div className="relative">
                      {inputMode === "dollars" && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white text-lg">$</span>
                      )}
                      <Input
                        type="number"
                        value={inputMode === "dollars" ? dollarAmount : shares}
                        onChange={(e) => inputMode === "dollars" ? setDollarAmount(e.target.value) : setShares(e.target.value)}
                        className={`bg-[#1a1d24] border-slate-700 text-white text-right text-2xl h-14 ${
                          inputMode === "dollars" ? 'pl-8' : ''
                        }`}
                        placeholder="0.00"
                      />
                    </div>

                    {/* Conditional Display based on Dollars or Contracts */}
                    {inputMode === "dollars" ? (
                      /* Dollars Mode */
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Odds</span>
                          <span className="text-white">{chance.toFixed(0)}% chance</span>
                        </div>
                        
                        <Collapsible open={isPayoutExpanded} onOpenChange={setIsPayoutExpanded}>
                          <CollapsibleTrigger className="w-full flex items-center justify-between text-sm py-2 hover:bg-slate-900/30 rounded px-2 -mx-2">
                            <span className="text-slate-400">Payout if {side || "..."}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-400">${payout.toFixed(2)}</span>
                              <ChevronDown className={`size-4 text-slate-400 transition-transform ${
                                isPayoutExpanded ? 'rotate-180' : ''
                              }`} />
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="mt-2 p-3 bg-slate-900/50 rounded-lg text-xs text-slate-400">
                              You're buying {contractCount} contracts at {(price * 100).toFixed(0)}¢ each. This market will close when the event occurs. If you're right, payout is expected shortly after.
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    ) : (
                      /* Contracts Mode */
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Average price</span>
                          <span className="text-white">{(price * 100).toFixed(2)}¢</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Estimated cost</span>
                          <span className="text-white">${estimatedCost.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Payout if {side || "..."}</span>
                          <span className="text-white">
                            ${payout.toFixed(2)}
                            {profit > 0 && (
                              <span className="text-emerald-400 ml-1">(+${profit.toFixed(2)})</span>
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator className="bg-slate-800" />

                  {/* Calculate Button */}
                  <Button 
                    type="submit"
                    disabled={!scriptLoaded || loading || !team || !side}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                    size="lg"
                  >
                    <DollarSign className="size-5 mr-2" />
                    {scriptLoaded ? 'Calculate Strategies' : 'Loading script...'}
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="text-center text-slate-400 mt-6">
            <p>⏳ Fetching market data and calculating strategies...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-4 rounded-lg mt-6">
            ❌ {error}
          </div>
        )}
      </div>
    </div>
  );
}
