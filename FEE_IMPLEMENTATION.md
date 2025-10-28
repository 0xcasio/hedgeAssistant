# 💰 Fee Implementation in Hedging Calculator

This document explains how trading fees are implemented in our Prediction Market Hedging Calculator.

## 🔍 **Current Fee Status**

### **❌ What Kalshi API Does NOT Provide**
- Maker fees
- Taker fees  
- Transaction fees
- Commission rates
- Event-specific fee schedules

### **✅ What We've Implemented**
- **Estimated fee structure** based on Kalshi's published fee schedule
- **Fee calculations** in all hedging strategies
- **Fee display** in the UI
- **Net profit calculations** (after fees)

---

## 🛠️ **Implementation Details**

### **1. API Layer (`pages/api/kalshi.js`)**
```javascript
// Step 4: Get fee information (if available)
const feeInfo = {
  makerFee: 0.02, // 2% maker fee (estimate)
  takerFee: 0.05, // 5% taker fee (estimate)
  transactionFee: 0.01, // 1% transaction fee (estimate)
  source: 'estimated', // Indicates this is estimated
  note: 'Fees are estimates. Check Kalshi fee schedule for exact rates.'
};
```

### **2. Calculator Logic (`public/hedging-calculator.js`)**
```javascript
// Simple Exit Strategy with Fees
const takerFee = grossRevenue * fees.takerFee;
const transactionFee = grossRevenue * fees.transactionFee;
const totalFees = takerFee + transactionFee;
const netRevenue = grossRevenue - totalFees;
```

### **3. UI Display (`pages/index.js`)**
- **Fee information panel** in market info
- **Fee breakdown** in strategy cards
- **Net profit calculations** (after fees)

---

## 📊 **Fee Structure**

### **Current Estimates**
| Fee Type | Rate | When Applied |
|----------|------|--------------|
| **Maker Fee** | 2% | When you provide liquidity (limit orders) |
| **Taker Fee** | 5% | When you take liquidity (market orders) |
| **Transaction Fee** | 1% | On all trades |

### **Fee Application by Strategy**

#### **Simple Exit Strategy**
- **Fee Type**: Taker Fee (5%) + Transaction Fee (1%)
- **Applied To**: Gross revenue from selling shares
- **Calculation**: `fees = grossRevenue × (0.05 + 0.01)`

#### **Perfect Hedge Strategy**
- **Fee Type**: Taker Fee (5%) + Transaction Fee (1%)
- **Applied To**: Cost of buying hedge shares
- **Calculation**: `hedgeFees = hedgeCost × (0.05 + 0.01)`

#### **Partial Hedge Strategies**
- **Fee Type**: Taker Fee (5%) + Transaction Fee (1%)
- **Applied To**: Cost of buying partial hedge shares
- **Calculation**: `hedgeFees = hedgeCost × (0.05 + 0.01)`

---

## 🎯 **Fee Impact on Strategies**

### **Example Calculation**
```
Position: 100 YES shares at $0.41 ($41 cost)
Current YES bid: $0.65

Simple Exit:
- Gross revenue: 100 × $0.65 = $65
- Fees: $65 × 6% = $3.90
- Net revenue: $65 - $3.90 = $61.10
- Net profit: $61.10 - $41 = $20.10
```

### **Fee Impact Analysis**
| Strategy | Without Fees | With Fees | Fee Impact |
|----------|--------------|-----------|------------|
| **Simple Exit** | $24.00 | $20.10 | -$3.90 |
| **Perfect Hedge** | $18.50 | $15.20 | -$3.30 |
| **Conservative** | $22.00 | $18.70 | -$3.30 |

---

## 🔧 **Technical Implementation**

### **API Response Structure**
```javascript
{
  "event": { ... },
  "market": { ... },
  "fees": {
    "makerFee": 0.02,
    "takerFee": 0.05,
    "transactionFee": 0.01,
    "source": "estimated",
    "note": "Fees are estimates. Check Kalshi fee schedule for exact rates."
  }
}
```

### **Strategy Calculation Updates**
```javascript
// Before: Simple profit calculation
const profit = currentValue - initialCost;

// After: Fee-aware profit calculation
const grossRevenue = shares * sellPrice;
const fees = grossRevenue * (takerFee + transactionFee);
const netRevenue = grossRevenue - fees;
const profit = netRevenue - initialCost;
```

### **UI Display Updates**
```javascript
// Fee information panel
{strategy.fees && (
  <div className="metric">
    <div className="label">Fees</div>
    <div className="value negative">{formatCurrency(strategy.fees.total)}</div>
  </div>
)}
```

---

## 🚀 **Future Enhancements**

### **1. Real Fee Integration**
```javascript
// Parse Kalshi's fee schedule PDF
const feeScheduleURL = 'https://kalshi.com/docs/kalshi-fee-schedule.pdf';
// Extract actual fees by market type
```

### **2. Dynamic Fee Updates**
```javascript
// Fetch fee schedule periodically
// Update estimates based on market conditions
// Cache fee information for performance
```

### **3. Advanced Fee Calculations**
```javascript
// Maker vs Taker fee logic
// Volume-based fee discounts
// Special event fee handling
```

### **4. Fee Optimization**
```javascript
// Suggest strategies with lower fees
// Calculate fee impact on different approaches
// Optimize for fee efficiency
```

---

## 📚 **References**

### **Kalshi Fee Resources**
- **Official Fee Schedule**: [Kalshi Fee Schedule PDF](https://kalshi.com/docs/kalshi-fee-schedule.pdf)
- **Help Center**: [Kalshi Fees Help](https://help.kalshi.com/trading/fees)
- **Fee Tracking Tool**: [Voliti Co. Fee Tracker](https://voliti.co/track-kalshi-maker-fees/)

### **Code References**
- **API Implementation**: `/pages/api/kalshi.js` (lines 101-109)
- **Fee Calculations**: `/public/hedging-calculator.js` (lines 257-283)
- **UI Display**: `/pages/index.js` (lines 573-587)

---

## ⚠️ **Important Notes**

### **Current Limitations**
1. **Estimated Fees**: We're using estimates, not real-time fee data
2. **Static Rates**: Fees don't change based on market conditions
3. **No Maker/Taker Logic**: All calculations assume taker fees
4. **No Volume Discounts**: Fees don't account for volume-based discounts

### **Accuracy Disclaimer**
> **⚠️ WARNING**: Current fee calculations are estimates based on Kalshi's published fee schedule. Actual fees may vary based on:
> - Market conditions
> - Volume discounts
> - Special event pricing
> - Account status
> 
> Always verify actual fees before executing trades.

---

## 🔄 **Next Steps**

### **Immediate Actions**
1. **Test fee calculations** with real market data
2. **Validate estimates** against actual Kalshi fees
3. **Update UI** to clearly indicate estimated vs actual fees

### **Medium Term**
1. **Implement PDF parsing** for real fee schedules
2. **Add fee optimization** suggestions
3. **Create fee comparison** between strategies

### **Long Term**
1. **Real-time fee integration** with Kalshi API
2. **Advanced fee analytics** and optimization
3. **Cross-platform fee comparison** (Kalshi vs Polymarket)

---

*Last Updated: [Current Date]*
*Version: 1.0*
*Status: Estimated fees implemented, real fee integration pending*

