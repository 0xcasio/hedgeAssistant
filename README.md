# 🎯 Prediction Market Hedging Calculator

An application that calculates optimal hedging strategies for prediction market positions, helping traders minimize risk and maximize returns across platforms like Kalshi.

## 🚀 Live Demo

TBD

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution Overview](#-solution-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Screenshots](#-screenshots)
- [Getting Started](#-getting-started)
- [Usage Guide](#-usage-guide)
- [API Integration](#-api-integration)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

## 🎯 Problem Statement

### The Challenge
Prediction market traders face significant challenges when managing risk:

- **Complex Risk Management**: Calculating optimal hedge positions across multiple scenarios requires sophisticated mathematical models
- **Manual Calculations**: Traders often rely on spreadsheets or manual calculations, leading to errors and missed opportunities
- **Real-time Decision Making**: Market conditions change rapidly, requiring instant calculations for optimal timing
- **Mobile Accessibility**: Existing tools lack mobile-friendly interfaces for on-the-go trading decisions

### Market Impact
- Traders lose money due to suboptimal hedging strategies
- Risk management is often reactive rather than proactive
- Limited tools for comparing strategies across different market scenarios

## 💡 Solution Overview

### Our Approach
The Prediction Market Hedging Calculator provides:

1. **Automated Strategy Calculation**: Advanced algorithms calculate multiple hedging strategies instantly
2. **Kalshi Support**: Seamless integration with Kalshi APIs
3. **Real-time Market Data**: Live price feeds and market information
4. **Mobile-First Design**: Responsive interface optimized for all devices
5. **Comprehensive Analysis**: Detailed breakdown of profits, risks, and scenarios

### Key Innovations
- **Dynamic Strategy Ranking**: Algorithms automatically rank strategies by return, profit, and risk metrics
- **Cross-Platform Fee Integration**: Accurate calculations including platform-specific trading fees
- **Interactive Mobile Experience**: Bottom-sheet modal for mobile configuration
- **Real-time Price Updates**: Live market data with refresh capabilities

## ✨ Key Features

### 🧮 Advanced Hedging Strategies
- **Perfect Hedge**: Guaranteed profit regardless of outcome
- **Simple Exit**: Quick position closure with calculated returns
- **Conservative Hedge**: Lower risk, moderate returns
- **Moderate Strategy**: Balanced risk-reward approach
- **Minimal Hedge**: Small position adjustments


## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/0xcasio/HedgeAssisttan.git
   cd prediction-market-hedging-calculator
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Environment Setup
Create a `.env.local` file for API configurations:
```env
# Optional: Add any API keys or configuration here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📖 Usage Guide

### Basic Workflow

1. **Enter Market URL**
   - Paste a Kalshi or Polymarket market URL
   - The app automatically detects the platform and fetches market data

2. **Select Team and Position**
   - Click on a team from the market prices
   - Choose YES or NO for your position
   - Set your position size (contracts or dollar amount)

3. **Calculate Strategies**
   - Click "Calculate Strategies" to run the analysis
   - View ranked hedging strategies with detailed metrics

4. **Analyze Results**
   - Sort strategies by different criteria
   - Expand strategy cards for detailed information
   - Review market data and fee structures

### Advanced Features

#### Strategy Sorting
- **Return**: Sort by percentage return
- **Profit**: Sort by absolute profit amount
- **If Yes Wins**: Sort by profit if original position wins
- **If No Wins**: Sort by profit if hedge position wins

#### Mobile Usage
- Tap team buttons to open configuration modal
- Use bottom-sheet interface for easy mobile interaction
- Modal automatically closes after calculation

## 🔌 API Integration

### Supported Platforms

#### Kalshi Integration
- **Market Data**: Real-time prices and market information
- **Team Detection**: Automatic team and outcome identification


### API Endpoints
```
/api/kalshi?url={market_url}
/api/polymarket?identifier={market_id}&type={market_type}
```

## 📁 Project Structure

```
prediction-market-hedging-calculator/
├── components/
│   └── ui/                 # Reusable UI components
├── pages/
│   ├── api/               # API routes
│   │   ├── kalshi.js      # Kalshi API integration
│   │   └── polymarket.js  # Polymarket API integration
│   ├── _app.js            # App configuration
│   └── index.js           # Main application page
├── public/
│   └── hedging-calculator.js  # Core calculation logic
├── styles/
│   └── globals.css        # Global styles and Tailwind
├── tailwind.config.js     # Tailwind configuration
├── postcss.config.js      # PostCSS configuration
└── package.json           # Dependencies and scripts
```


**Built with ❤️ for the prediction market trading community**

*Star ⭐ this repository if you find it helpful!*# HedgeAssisttan
