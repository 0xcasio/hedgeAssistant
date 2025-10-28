# 🎯 Hedging Strategies Overview

This document provides a high-level overview of each hedging strategy available in our Prediction Market Hedging Calculator.

## 📊 Strategy Summary Table

| Strategy | Risk Level | Profit Potential | Best For |
|----------|------------|------------------|----------|
| **Simple Exit** | None | Current market value | Quick exit, lock in current P&L |
| **Perfect Hedge** | None | Guaranteed equal profit | Risk-averse users, guaranteed returns |
| **Conservative (80%)** | Low | High if original wins, protected if loses | Balanced risk/reward |
| **Moderate (50%)** | Medium | Higher if original wins, some protection | Moderate risk tolerance |
| **Minimal (25%)** | High | Highest if original wins, minimal protection | High risk tolerance |

---

## 🚪 **1. Simple Exit Strategy**

### **What It Does**
Sells your entire position immediately at current market prices.

### **How It Works**
- **Action**: Sell all your shares at the current bid price
- **Risk**: None - position is completely closed
- **Profit**: Current market value minus your initial cost

### **Example**
- You bought 100 YES shares at $0.41 each ($41 total cost)
- Current YES bid price is $0.65
- **Result**: Sell 100 shares for $65 → **$24 profit**

### **When to Use**
- ✅ You want to lock in current profits
- ✅ You need to exit quickly
- ✅ Market conditions have changed significantly
- ✅ You're satisfied with current returns

### **Pros & Cons**
| ✅ Pros | ❌ Cons |
|---------|---------|
| No risk | No upside potential |
| Immediate liquidity | Miss future gains |
| Simple execution | |

---

## 🛡️ **2. Perfect Hedge Strategy**

### **What It Does**
Creates a guaranteed profit regardless of which team wins by buying the opposite team's shares.

### **How It Works**
- **Action**: Buy YES shares in the opposite team's market
- **Risk**: None - profit is locked in
- **Profit**: Guaranteed equal amount whether your original team wins or loses

### **Example**
- You have 100 YES shares for Team A at $0.41
- Team B's YES shares cost $0.60
- **Perfect hedge calculation**: Buy ~67 Team B YES shares for $40
- **Result**: Guaranteed $24 profit whether Team A or Team B wins

### **When to Use**
- ✅ You want guaranteed profit
- ✅ You're risk-averse
- ✅ Market prices are favorable for hedging
- ✅ You want to "lock in" your position

### **Pros & Cons**
| ✅ Pros | ❌ Cons |
|---------|---------|
| Zero risk | Lower profit than other strategies |
| Guaranteed profit | Requires more capital |
| Sleep easy | |

---

## 🎯 **3. Conservative Hedge (80%)**

### **What It Does**
Hedges 80% of your position, leaving 20% exposed to your original bet.

### **How It Works**
- **Action**: Buy 80% of the perfect hedge amount in opposite team's shares
- **Risk**: Low - most of your position is protected
- **Profit**: Higher if your original team wins, protected if it loses

### **Example**
- Perfect hedge would be 67 shares of Team B
- Conservative hedge: Buy 54 shares of Team B (80% of 67)
- **If Team A wins**: Higher profit than perfect hedge
- **If Team B wins**: Still profitable, but less than perfect hedge

### **When to Use**
- ✅ You want most protection but some upside
- ✅ You're slightly confident in your original pick
- ✅ You want balanced risk/reward
- ✅ You have moderate risk tolerance

### **Pros & Cons**
| ✅ Pros | ❌ Cons |
|---------|---------|
| Good protection | Some risk remains |
| Higher upside potential | More complex |
| Balanced approach | |

---

## ⚖️ **4. Moderate Hedge (50%)**

### **What It Does**
Hedges 50% of your position, leaving 50% exposed to your original bet.

### **How It Works**
- **Action**: Buy 50% of the perfect hedge amount in opposite team's shares
- **Risk**: Medium - half your position is protected
- **Profit**: Significantly higher if your original team wins, moderate protection if it loses

### **Example**
- Perfect hedge would be 67 shares of Team B
- Moderate hedge: Buy 34 shares of Team B (50% of 67)
- **If Team A wins**: Much higher profit than conservative hedge
- **If Team B wins**: Still profitable, but less protection

### **When to Use**
- ✅ You're confident in your original pick
- ✅ You want significant upside potential
- ✅ You can handle moderate risk
- ✅ You believe your analysis is correct

### **Pros & Cons**
| ✅ Pros | ❌ Cons |
|---------|---------|
| High upside potential | Moderate risk |
| Good balance | Less protection |
| Capital efficient | |

---

## 🎲 **5. Minimal Hedge (25%)**

### **What It Does**
Hedges only 25% of your position, leaving 75% exposed to your original bet.

### **How It Works**
- **Action**: Buy 25% of the perfect hedge amount in opposite team's shares
- **Risk**: High - most of your position is unprotected
- **Profit**: Highest if your original team wins, minimal protection if it loses

### **Example**
- Perfect hedge would be 67 shares of Team B
- Minimal hedge: Buy 17 shares of Team B (25% of 67)
- **If Team A wins**: Maximum profit potential
- **If Team B wins**: Minimal protection, could still lose money

### **When to Use**
- ✅ You're very confident in your original pick
- ✅ You want maximum upside potential
- ✅ You can handle high risk
- ✅ You have strong conviction

### **Pros & Cons**
| ✅ Pros | ❌ Cons |
|---------|---------|
| Maximum upside | High risk |
| Capital efficient | Minimal protection |
| High conviction play | Could lose money |

---

## 🧮 **Strategy Selection Guide**

### **Risk Tolerance Matrix**

| Your Risk Level | Recommended Strategy | Why |
|-----------------|---------------------|-----|
| **Very Low** | Simple Exit | Lock in current value |
| **Low** | Perfect Hedge | Guaranteed profit |
| **Medium-Low** | Conservative (80%) | Good protection + upside |
| **Medium** | Moderate (50%) | Balanced approach |
| **High** | Minimal (25%) | Maximum upside |

### **Market Condition Guide**

| Market Situation | Best Strategy | Reasoning |
|------------------|---------------|-----------|
| **Prices moved in your favor** | Simple Exit | Lock in profits |
| **Uncertain outcome** | Perfect Hedge | Guaranteed profit |
| **Confident in original pick** | Conservative/Moderate | Balance protection + upside |
| **Very confident** | Minimal | Maximum upside |
| **Need liquidity** | Simple Exit | Immediate cash |

---

## 🔍 **Technical Implementation Notes**

### **Key Calculations**
- **Exit Strategy**: `profit = (shares × currentBid) - (shares × buyPrice)`
- **Perfect Hedge**: `hedgeShares = payout / (1 + 1/hedgePrice)`
- **Partial Hedges**: `hedgeShares = perfectHedgeShares × (percentage/100)`

### **Price Sources**
- **Bid Prices**: Used for selling (exit strategy)
- **Ask Prices**: Used for buying (hedge strategies)
- **Opposite Team Prices**: Used for hedging calculations

### **Risk Metrics**
- **Guaranteed Profit**: Only available in Perfect Hedge
- **Maximum Loss**: Calculated for each strategy
- **Upside Potential**: Higher with less hedging

---

## 📈 **Future Strategy Enhancements**

### **Planned Additions**
1. **Dynamic Hedging**: Adjust hedge percentage based on market conditions
2. **Time-Based Strategies**: Different approaches for different time horizons
3. **Volatility Hedging**: Strategies based on market volatility
4. **Portfolio Hedging**: Hedge multiple positions simultaneously
5. **Advanced Options**: More sophisticated hedging instruments

### **Research Areas**
- **Machine Learning**: Optimize hedge percentages based on historical data
- **Real-time Adjustments**: Dynamic rebalancing as prices change
- **Cross-Platform Arbitrage**: Opportunities between Kalshi and Polymarket
- **Sentiment Analysis**: Incorporate market sentiment into strategy selection

---

## 📚 **References**

- **Strategy Logic**: `/public/hedging-calculator.js` (lines 232-397)
- **Implementation**: `calculateSimpleExit()`, `calculatePerfectHedge()`, `calculatePartialHedge()`
- **Strategy Generation**: `generateAllStrategies()` function
- **UI Display**: `/pages/index.js` (strategy cards)

---

*Last Updated: [Current Date]*
*Version: 1.0*
*Maintainer: Product Team*
