import { useState } from "react";
import { Target, TrendingUp, RefreshCw, DollarSign, Check, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Badge } from "./components/ui/badge";
import { Separator } from "./components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./components/ui/collapsible";

export default function App() {
  const [marketUrl, setMarketUrl] = useState("https://kalshi.com/markets/kxnhlgame/nhl-game/kxnhlgame-25oct26colnj");
  
  // Mock market data
  const marketData = {
    title: "Colorado vs New Jersey Winner?",
    teams: [
      { name: "NJ Devils", chance: 54, yesPrice: 55, noPrice: 46, icon: "🏒" },
      { name: "COL Avalanche", chance: 46, yesPrice: 46, noPrice: 55, icon: "🏒" }
    ]
  };

  // Find team with highest chance
  const defaultTeam = marketData.teams.reduce((prev, current) => 
    (prev.chance > current.chance) ? prev : current
  );

  const [selectedTeam, setSelectedTeam] = useState<string | null>(defaultTeam.name);
  const [positionSide, setPositionSide] = useState<"YES" | "NO" | null>(null);
  const [positionType, setPositionType] = useState("Dollars");
  const [positionValue, setPositionValue] = useState("10");
  const [buyPrice, setBuyPrice] = useState((defaultTeam.yesPrice / 100).toFixed(2));
  const [showResults, setShowResults] = useState(false);
  const [isPayoutExpanded, setIsPayoutExpanded] = useState(false);
  const [isPerfectHedgeExpanded, setIsPerfectHedgeExpanded] = useState(true);
  const [isSimpleExitExpanded, setIsSimpleExitExpanded] = useState(false);

  const calculateContracts = () => {
    if (positionType === "Dollars") {
      const value = parseFloat(positionValue);
      const price = parseFloat(buyPrice);
      if (isNaN(value) || isNaN(price) || price === 0) return 0;
      return Math.floor(value / price);
    }
    const value = parseInt(positionValue);
    return isNaN(value) ? 0 : value;
  };

  const handleCalculate = () => {
    setShowResults(true);
  };

  const handleTeamSelect = (teamName: string) => {
    setSelectedTeam(teamName);
    // Auto-update buy price when team changes
    const team = marketData.teams.find(t => t.name === teamName);
    if (team && positionSide) {
      const price = positionSide === "YES" ? team.yesPrice : team.noPrice;
      setBuyPrice((price / 100).toFixed(2));
    }
  };

  const handlePositionSideSelect = (side: "YES" | "NO") => {
    setPositionSide(side);
    // Auto-update buy price when position side changes
    if (selectedTeam) {
      const team = marketData.teams.find(t => t.name === selectedTeam);
      if (team) {
        const price = side === "YES" ? team.yesPrice : team.noPrice;
        setBuyPrice((price / 100).toFixed(2));
      }
    }
  };

  const contracts = calculateContracts();

  // Calculate hedge strategies
  const simpleExitPrice = 0.54;
  const simpleExitProfit = contracts * (simpleExitPrice - parseFloat(buyPrice));
  const simpleExitReturn = (simpleExitProfit / (contracts * parseFloat(buyPrice))) * 100;
  const simpleExitFees = 0.58;

  const perfectHedgeContracts = 12.24;
  const perfectHedgePrice = 0.47;
  const perfectHedgeProfit = 2.00;
  const perfectHedgeReturn = 20.2;

  // Get current team's prices for position side buttons
  const currentTeam = selectedTeam ? marketData.teams.find(t => t.name === selectedTeam) : null;

  // Calculate values for position size display
  const dollarAmount = parseFloat(positionValue) || 0;
  const contractCount = positionType === "Dollars" ? contracts : (parseInt(positionValue) || 0);
  const price = parseFloat(buyPrice) || 0;
  const estimatedCost = contractCount * price;
  const payout = contractCount * 1; // Each contract pays $1 if correct
  const profit = payout - estimatedCost;
  const chance = positionSide === "YES" 
    ? (currentTeam?.chance || 0)
    : (100 - (currentTeam?.chance || 0));
  
  return (
    <div className="min-h-screen bg-[#0a0b0d] text-white">
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
              value={marketUrl}
              onChange={(e) => setMarketUrl(e.target.value)}
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
            <Card className="p-6 bg-[#12141a] border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-5 text-emerald-500" />
                  <h2 className="text-white">Current Market Prices</h2>
                </div>
                <Button variant="outline" size="sm" className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                  <RefreshCw className="size-4 mr-2" />
                  Refresh
                </Button>
              </div>

              <div className="space-y-3">
                {/* Market Rows */}
                {marketData.teams.map((team, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTeamSelect(team.name)}
                    className={`w-full grid grid-cols-12 gap-4 items-center p-4 rounded-lg transition-all ${
                      selectedTeam === team.name
                        ? 'bg-emerald-500/20 border-2 border-emerald-500'
                        : 'bg-slate-900/30 border-2 border-transparent hover:bg-slate-900/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="col-span-5 flex items-center gap-3">
                      {selectedTeam === team.name && (
                        <div className="flex-shrink-0 size-5 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Check className="size-3 text-white" />
                        </div>
                      )}
                      <span className="text-2xl">{team.icon}</span>
                      <span className="text-white text-left">{team.name}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-300">{team.chance}%</span>
                    </div>
                    <div className="col-span-5 flex items-center justify-end gap-2">
                      <div className="px-5 py-1.5 bg-[#3b82f6] text-white rounded-md text-center min-w-[80px]">
                        <div className="text-xs opacity-80">YES</div>
                        <div className="text-sm">{team.yesPrice}¢</div>
                      </div>
                      <div className="px-5 py-1.5 bg-[#a855f7] text-white rounded-md text-center min-w-[80px]">
                        <div className="text-xs opacity-80">NO</div>
                        <div className="text-sm">{team.noPrice}¢</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Results Section */}
            {showResults && (
              <div className="space-y-6">
                {/* Hedging Strategies */}
                <div className="space-y-4">
                  <h2 className="text-white">Hedging Strategies</h2>

                  {/* Perfect Hedge - First and Expanded by Default */}
                  <Collapsible open={isPerfectHedgeExpanded} onOpenChange={setIsPerfectHedgeExpanded}>
                    <Card className="bg-[#12141a] border-2 border-emerald-500 relative hover:border-emerald-400 transition-colors overflow-hidden">
                      <CollapsibleTrigger className="w-full p-6 text-left">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <ChevronRight className={`size-5 text-slate-400 transition-transform ${isPerfectHedgeExpanded ? 'rotate-90' : ''}`} />
                            <h3 className="text-white">Perfect Hedge</h3>
                          </div>
                          <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">✓ RECOMMENDED</Badge>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="px-6 pb-6 space-y-4">
                          <div className="bg-slate-900/50 rounded-lg p-4">
                            <p className="text-sm text-slate-300">Buy {perfectHedgeContracts} YES shares in the opposite team's market at ${perfectHedgePrice}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                              <p className="text-xs text-slate-400 mb-1">PROFIT</p>
                              <p className="text-2xl text-emerald-400">+${perfectHedgeProfit.toFixed(2)}</p>
                            </div>
                            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                              <p className="text-xs text-slate-400 mb-1">RETURN</p>
                              <p className="text-2xl text-emerald-400">+{perfectHedgeReturn.toFixed(1)}%</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                              <p className="text-xs text-slate-400 mb-1">IF YES WINS</p>
                              <p className="text-xl text-emerald-400">+${perfectHedgeProfit.toFixed(2)}</p>
                            </div>
                            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                              <p className="text-xs text-slate-400 mb-1">IF NO WINS</p>
                              <p className="text-xl text-emerald-400">+${perfectHedgeProfit.toFixed(2)}</p>
                            </div>
                          </div>

                          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                            <p className="text-sm text-slate-300 mb-1"><span className="text-white">Risk:</span> None - profit locked in regardless of outcome</p>
                            <p className="text-sm text-slate-400">Lock in a guaranteed profit of ${perfectHedgeProfit.toFixed(2)} no matter what happens. Buy YES shares in the opposite team's market to create a true hedge (fees included).</p>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  {/* Simple Exit - Collapsed by Default */}
                  <Collapsible open={isSimpleExitExpanded} onOpenChange={setIsSimpleExitExpanded}>
                    <Card className="bg-[#12141a] border-slate-800 hover:border-slate-700 transition-colors overflow-hidden">
                      <CollapsibleTrigger className="w-full p-6 text-left">
                        <div className="flex items-center gap-3">
                          <ChevronRight className={`size-5 text-slate-400 transition-transform ${isSimpleExitExpanded ? 'rotate-90' : ''}`} />
                          <h3 className="text-white">Simple Exit</h3>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="px-6 pb-6 space-y-4">
                          <div className="bg-slate-900/50 rounded-lg p-4">
                            <p className="text-sm text-slate-300">Sell {contracts} {positionSide} shares at ${simpleExitPrice}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                              <p className="text-xs text-slate-400 mb-1">PROFIT</p>
                              <p className="text-2xl text-red-400">${simpleExitProfit.toFixed(2)}</p>
                            </div>
                            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                              <p className="text-xs text-slate-400 mb-1">RETURN</p>
                              <p className="text-2xl text-red-400">{simpleExitReturn.toFixed(1)}%</p>
                            </div>
                          </div>

                          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                            <p className="text-xs text-slate-400 mb-1">FEES</p>
                            <p className="text-red-400">+${simpleExitFees}</p>
                          </div>

                          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                            <p className="text-sm text-slate-300 mb-1"><span className="text-white">Risk:</span> None - position fully closed</p>
                            <p className="text-sm text-slate-400">Exit your position immediately and lock in current profit/loss (after fees).</p>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                </div>

                {/* Market Info - Moved to Bottom */}
                <Card className="p-6 bg-[#12141a] border-slate-800 border-l-4 border-l-emerald-500">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Badge className="mb-2 bg-emerald-600 text-white hover:bg-emerald-600">Kalshi</Badge>
                      <h2 className="text-white">{marketData.title}</h2>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">YES PRICE ({selectedTeam})</p>
                      <p className="text-white text-2xl">${buyPrice}</p>
                      <p className="text-sm text-slate-400">
                        {marketData.teams.find(t => t.name === selectedTeam)?.chance}% chance
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">NO PRICE ({selectedTeam})</p>
                      <p className="text-white text-2xl">$0.46</p>
                      <p className="text-sm text-slate-400">46% chance</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 mb-4">Your position: <span className="text-white">{contracts} {positionSide} shares at ${buyPrice}</span></p>

                  <div className="mt-4 bg-slate-900/50 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-white">Trading Fees (estimated)</p>
                    <p className="text-sm text-slate-400">
                      <span className="text-slate-300">Maker Fee:</span> 2.0% | <span className="text-slate-300">Taker Fee:</span> 5.0% | <span className="text-slate-300">Transaction Fee:</span> 1.0%
                    </p>
                    <p className="text-xs text-slate-500">Fees are estimates. Check Kalshi fee schedule for exact rates.</p>
                  </div>

                  <div className="mt-4 bg-slate-900/50 rounded-lg p-4 space-y-2">
                    <p className="text-sm text-white">Market Rules</p>
                    <p className="text-sm text-slate-400">
                      <span className="text-slate-300">Primary:</span> If NJ Devils wins the Colorado vs New Jersey professional hockey game scheduled for Oct 26, 2025, then the market resolves to Yes.
                    </p>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Right Column - Position Configuration (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Card className="p-6 bg-[#12141a] border-slate-800">
                <h2 className="text-white mb-6">Position Configuration</h2>
                
                <div className="space-y-5">
                  {/* Selected Team Display */}
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">Selected Team</Label>
                    <div className={`p-3 rounded-lg border-2 ${
                      selectedTeam 
                        ? 'bg-emerald-500/10 border-emerald-500/50' 
                        : 'bg-slate-900/50 border-slate-700 border-dashed'
                    }`}>
                      {selectedTeam ? (
                        <div className="flex items-center gap-2">
                          <Check className="size-4 text-emerald-400" />
                          <span className="text-white">{selectedTeam}</span>
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
                        onClick={() => handlePositionSideSelect("YES")}
                        disabled={!selectedTeam}
                        className={`p-3 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          positionSide === "YES"
                            ? 'bg-[#3b82f6] border-[#3b82f6] text-white'
                            : 'bg-[#1e3a5f] border-[#2d4a6e] text-[#60a5fa] hover:bg-[#2d4a6e]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Yes</span>
                          <span>{currentTeam ? `${currentTeam.yesPrice}¢` : '--'}</span>
                        </div>
                      </button>
                      <button
                        onClick={() => handlePositionSideSelect("NO")}
                        disabled={!selectedTeam}
                        className={`p-3 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          positionSide === "NO"
                            ? 'bg-[#a855f7] border-[#a855f7] text-white'
                            : 'bg-[#3d2456] border-[#4d3066] text-[#c084fc] hover:bg-[#4d3066]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm">No</span>
                          <span>{currentTeam ? `${currentTeam.noPrice}¢` : '--'}</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <Separator className="bg-slate-800" />

                  {/* Position Size */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300 text-sm">Position Size</Label>
                      <Select value={positionType} onValueChange={setPositionType}>
                        <SelectTrigger className="w-[110px] h-7 bg-[#1a1d24] border-slate-700 text-white text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1d24] border-slate-700">
                          <SelectItem value="Dollars" className="text-white text-xs">Dollars</SelectItem>
                          <SelectItem value="Contracts" className="text-white text-xs">Contracts</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Input with conditional prefix/suffix */}
                    <div className="relative">
                      {positionType === "Dollars" && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white text-lg">$</span>
                      )}
                      <Input
                        type="number"
                        value={positionValue}
                        onChange={(e) => setPositionValue(e.target.value)}
                        className={`bg-[#1a1d24] border-slate-700 text-white text-right text-2xl h-14 ${
                          positionType === "Dollars" ? 'pl-8' : ''
                        }`}
                        placeholder="0.00"
                      />
                    </div>

                    {/* Conditional Display based on Dollars or Contracts */}
                    {positionType === "Dollars" ? (
                      /* Dollars Mode */
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Odds</span>
                          <span className="text-white">{chance}% chance</span>
                        </div>
                        
                        <Collapsible open={isPayoutExpanded} onOpenChange={setIsPayoutExpanded}>
                          <CollapsibleTrigger className="w-full flex items-center justify-between text-sm py-2 hover:bg-slate-900/30 rounded px-2 -mx-2">
                            <span className="text-slate-400">Payout if {positionSide || "..."}</span>
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
                          <span className="text-slate-400">Payout if {positionSide || "..."}</span>
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
                    onClick={handleCalculate}
                    disabled={!selectedTeam || !positionSide}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                    size="lg"
                  >
                    <DollarSign className="size-5 mr-2" />
                    Calculate Strategies
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}