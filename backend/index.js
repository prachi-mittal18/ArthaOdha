require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const FinnhubService = require("./services/FinnhubService");
const axios = require("axios");

const { HoldingsModel } = require("./model/HoldingsModel");
const { PositionsModel } = require("./model/PositionsModel");
const { OrdersModel } = require("./model/OrdersModel");
const { UserModel } = require("./model/UserModel");
const PORT = process.env.PORT || 3002;

/**
 * Configuration & Helpers
 */

// Helper functions for safe financial math using scaled integers (cents/paise)
const toCents = (amount) => Math.round(Number(amount) * 100);
const fromCents = (cents) => Number((cents / 100).toFixed(2));


// Mapping internal tickers to Finnhub NSE Symbols
const watchlistMap = {
  "INFY": "INFY.NS", "TCS": "TCS.NS", "RELIANCE": "RELIANCE.NS",
  "BHARTIARTL": "BHARTIARTL.NS", "HDFCBANK": "HDFCBANK.NS", "ITC": "ITC.NS",
  "TATAPOWER": "TATAPOWER.NS", "WIPRO": "WIPRO.NS", "M&M": "M&M.NS",
  "HINDUNILVR": "HINDUNILVR.NS", "SBIN": "SBIN.NS", "KPITTECH": "KPITTECH.NS",
  "QUICKHEAL": "QUICKHEAL.NS", "ONGC": "ONGC.NS", "ICICIBANK": "ICICIBANK.NS",
  "AXISBANK": "AXISBANK.NS", "KOTAKBANK": "KOTAKBANK.NS", "LT": "LT.NS",
  "BAJFINANCE": "BAJFINANCE.NS", "MARUTI": "MARUTI.NS", "SUNPHARMA": "SUNPHARMA.NS",
  "DRREDDY": "DRREDDY.NS", "CIPLA": "CIPLA.NS", "DIVISLAB": "DIVISLAB.NS",
  "NESTLEIND": "NESTLEIND.NS", "TITAN": "TITAN.NS", "ULTRACEMCO": "ULTRACEMCO.NS",
  "ASIANPAINT": "ASIANPAINT.NS", "BAJAJFINSV": "BAJAJFINSV.NS", "TECHM": "TECHM.NS",
  "HCLTECH": "HCLTECH.NS", "POWERGRID": "POWERGRID.NS", "NTPC": "NTPC.NS",
  "COALINDIA": "COALINDIA.NS", "GRASIM": "GRASIM.NS", "JSWSTEEL": "JSWSTEEL.NS",
  "TATASTEEL": "TATASTEEL.NS", "HINDALCO": "HINDALCO.NS", "ADANIENT": "ADANIENT.NS",
  "ADANIPORTS": "ADANIPORTS.NS"
};

// Simulated Live Price Ticker initialization
let currentPrices = {};
["NIFTY 50", "SENSEX", ...Object.keys(watchlistMap)].forEach(ticker => {
  const basePrices = {
    "NIFTY 50": 23000.45, "SENSEX": 75000.85, "INFY": 1264.80, "TCS": 3850.50,
    "RELIANCE": 2500.10, "BHARTIARTL": 540.60, "HDFCBANK": 1520.30, "ITC": 205.15,
    "TATAPOWER": 120.40, "WIPRO": 570.80, "M&M": 779.80,
    "HINDUNILVR": 2417.40, "SBIN": 430.20, "KPITTECH": 266.45, "QUICKHEAL": 160.00,
    "ONGC": 116.80, "ICICIBANK": 900.00, "AXISBANK": 850.00, "KOTAKBANK": 1800.00,
    "LT": 2200.00, "BAJFINANCE": 6000.00, "MARUTI": 8500.00, "SUNPHARMA": 950.00,
    "DRREDDY": 4500.00, "CIPLA": 1100.00, "DIVISLAB": 3500.00, "NESTLEIND": 19000.00,
    "TITAN": 2500.00, "ULTRACEMCO": 7000.00, "ASIANPAINT": 2800.00, "BAJAJFINSV": 1400.00,
    "TECHM": 1000.00, "HCLTECH": 1100.00, "POWERGRID": 220.00, "NTPC": 170.00,
    "COALINDIA": 210.00, "GRASIM": 1600.00, "JSWSTEEL": 700.00, "TATASTEEL": 110.00,
    "HINDALCO": 400.00, "ADANIENT": 2400.00, "ADANIPORTS": 700.00
  };
  currentPrices[ticker] = fromCents(toCents(basePrices[ticker] || 100.00));
});

// Normalize process.env to handle spaces in keys or values from manual .env edits
Object.keys(process.env).forEach((key) => {
  const trimmedKey = key.trim();
  const value = process.env[key] ? process.env[key].trim() : "";
  if (trimmedKey !== key) {
    delete process.env[key];
  }
  process.env[trimmedKey] = value;
});

const url = process.env.MONGO_URL;
const tokenKey = process.env.TOKEN_KEY;

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.FRONTEND_URLS 
  ? process.env.FRONTEND_URLS.split(",") 
  : ["http://localhost:3000", "http://localhost:3001"];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const cookieParser = require("cookie-parser");
const authRoute = require("./Routes/AuthRoute");
const { userVerification } = require("./Middlewares/AuthMiddleware");

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

app.use("/", authRoute);

app.get("/allHoldings", userVerification, async (req, res) => {
  try {
    const allHoldings = await HoldingsModel.find({ user: req.user.id });
    return res.status(200).json(allHoldings);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR: Failed to fetch holdings for user ${req.user.id}:`, error);
    return res.status(500).json({ message: "Error fetching holdings", success: false });
  }
});

app.get("/allPositions", userVerification, async (req, res) => {
  try {
    const allPositions = await PositionsModel.find({ user: req.user.id });
    return res.status(200).json(allPositions);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR: Failed to fetch positions for user ${req.user.id}:`, error);
    return res.status(500).json({ message: "Error fetching positions", success: false });
  }
});

app.get("/user/pnl-trend", userVerification, async (req, res) => {
  try {
    const holdings = await HoldingsModel.find({ user: req.user.id });
    if (!holdings.length) return res.status(200).json({ labels: [], data: [] });

    const to = Math.floor(Date.now() / 1000);
    const from = to - 10 * 24 * 60 * 60; // Fetch 10 days to ensure 7 trading days
    const trendMap = {}; // date -> totalPnL

    // Generate stable date keys for the mock fallback
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]); // Use YYYY-MM-DD for stable keys
    }

    let fallbackTriggered = false;

    // Sequential fetch for demo; in production, use a caching layer or batch service
    for (const stock of holdings) {
      const symbol = watchlistMap[stock.name] || `${stock.name}.NS`;
      try {
        const response = await axios.get(`https://finnhub.io/api/v1/stock/candle`, {
          params: { symbol, resolution: 'D', from, to, token: process.env.FINNHUB_API_KEY }
        });

        // Fallback for 403/No Data: Generate mock historical trend if API is restricted
        if (!response.data || response.data.s === "no_data" || !response.data.c) {
          throw new Error("API restricted or no data");
        }

        response.data.c.forEach((price, idx) => {
          const date = new Date(response.data.t[idx] * 1000).toISOString().split('T')[0];
          const pnl = (price - stock.avg) * stock.qty;
          trendMap[date] = (trendMap[date] || 0) + pnl;
        });
      } catch (e) { 
        fallbackTriggered = true;
        
        // Generate stable mock historical P&L based on current price
        const currentPrice = currentPrices[stock.name] || stock.avg;
        const tickerHash = stock.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        // Ensure every date in our range has a value even if API fails
        dates.forEach((date, i) => {
          // Deterministic variance based on ticker name and day index to stop graph jitter
          const variance = ((tickerHash * (i + 1)) % 40) / 1000; // 0 to 0.04 (4% range)
          const direction = (tickerHash % 2 === 0) ? 1 : -1;
          const mockHistoricalPrice = currentPrice * (1 + (direction * variance));

          const pnl = (mockHistoricalPrice - stock.avg) * stock.qty;
          trendMap[date] = (trendMap[date] || 0) + pnl;
        });
      }
    }

    if (fallbackTriggered) {
      console.info(`[${new Date().toISOString()}] INFO: P&L Trend generated using deterministic mock fallback (API restricted).`);
    }

    // Sort by string comparison (works for YYYY-MM-DD) or date parsing
    const sortedDates = Object.keys(trendMap).sort().slice(-7);
    
    // Format labels for the frontend: "Jun 1", "Jun 2", etc.
    const labels = sortedDates.map(d => new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' }));
    const data = sortedDates.map(d => fromCents(toCents(trendMap[d])));

    return res.status(200).json({ labels, data });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/allOrders", userVerification, async (req, res) => {
  try {
    const allOrders = await OrdersModel.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json(allOrders);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR: Failed to fetch orders for user ${req.user.id}:`, error);
    return res.status(500).json({ message: "Error fetching orders", success: false });
  }
});

app.get("/user/funds", userVerification, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    const allHoldings = await HoldingsModel.find({ user: req.user.id });

    // Calculate total investment (Margin Used) using safe financial math
    const marginUsedCents = allHoldings.reduce((acc, holding) => {
      return acc + (holding.qty * toCents(holding.avg));
    }, 0);

    return res.status(200).json({
      balance: user.balance,
      marginUsed: fromCents(marginUsedCents),
      openingBalance: user.openingBalance || user.balance,
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR: Failed to fetch funds for user ${req.user.id}:`, error.message);
    return res.status(500).json({ message: "Error fetching funds summary", success: false });
  }
});

app.post("/newOrder", userVerification, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    
    // Canonicalize name: If HUL is sent, treat it as HINDUNILVR (the primary)
    const canonicalName = (req.body.name === "HUL") ? "HINDUNILVR" : req.body.name;

    const qty = Number(req.body.qty);
    const priceCents = toCents(req.body.price);
    const orderValueCents = qty * priceCents;

    const userBalanceCents = toCents(user.balance);
    const marketPrice = currentPrices[canonicalName] || req.body.price;
    
    let orderStatus = "COMPLETE";

    // Price validation for Limit Orders
    if (req.body.orderType === "LIMIT") {
      if (req.body.mode === "BUY" && marketPrice > req.body.price) {
        orderStatus = "PENDING";
      } else if (req.body.mode === "SELL" && marketPrice < req.body.price) {
        orderStatus = "PENDING";
      }
    }

    const newOrder = new OrdersModel({
      name: canonicalName,
      qty: req.body.qty,
      mode: req.body.mode,
      price: req.body.price,
      orderType: req.body.orderType || "MARKET",
      status: orderStatus,
      user: req.user.id, // Associate the order with the person who placed it
    });

    // --- Pre-Execution Validation: Validate funds/holdings before accepting order (Market or Limit) ---
    if (req.body.mode === "BUY") {
      if (userBalanceCents < orderValueCents) {
        newOrder.status = "REJECTED";
        await newOrder.save();
        console.log(`[${new Date().toISOString()}] ORDER_REJECTED: User ${req.user.id} | BUY ${req.body.qty} ${req.body.name} - Insufficient funds`);
        return res.status(400).json({ message: "Insufficient funds", success: false });
      }
    } else if (req.body.mode === "SELL") {
      const existingHolding = await HoldingsModel.findOne({ user: req.user.id, name: canonicalName });
      if (!existingHolding || existingHolding.qty < qty) {
        newOrder.status = "REJECTED";
        await newOrder.save();
        console.log(`[${new Date().toISOString()}] ORDER_REJECTED: User ${req.user.id} | SELL ${qty} ${canonicalName} - Insufficient quantity`);
        return res.status(400).json({ message: "Insufficient quantity to sell", success: false });
      }
    }

    if (orderStatus === "PENDING") {
      await newOrder.save();
      return res.status(201).json({ 
        message: "Limit order placed. Status: PENDING", 
        success: true 
      });
    }

    // Logic to update Holdings based on the order
    if (req.body.mode === "BUY") {
      await newOrder.save(); // Saves as COMPLETE

      const existingHolding = await HoldingsModel.findOne({ 
        user: req.user.id, 
        name: canonicalName 
      });

      // Safely subtract balance in cents
      user.balance = fromCents(userBalanceCents - orderValueCents);
      await user.save();

      if (existingHolding) {
        const totalQty = existingHolding.qty + qty;
      
        // new avg = ((old qnty * old avg) + (new qnty * new avg)) / total qnty
        const existingAvgCents = toCents(existingHolding.avg);
        const newAvgCents = Math.round(((existingHolding.qty * existingAvgCents) + (qty * priceCents)) / totalQty);
        
        existingHolding.qty = totalQty;
        existingHolding.avg = fromCents(newAvgCents);
        await existingHolding.save();
      } else {
        await HoldingsModel.create({
          name: canonicalName,
          qty: req.body.qty,
          avg: req.body.price,
          price: req.body.price, // Market price at time of buy
          user: req.user.id,
          net: "0%",
          day: "0%"
        });
      }
    } else if (req.body.mode === "SELL") {
      const existingHolding = await HoldingsModel.findOne({ 
        user: req.user.id, 
        name: canonicalName 
      });

      await newOrder.save(); // Saves as COMPLETE
      user.balance = fromCents(userBalanceCents + orderValueCents);
      await user.save();

      const totalQty = existingHolding.qty - qty;
      
      if (totalQty === 0) {
        await HoldingsModel.deleteOne({ _id: existingHolding._id });
      } else {
        existingHolding.qty = totalQty;
        await existingHolding.save();
      }
    }

    console.log(`[${new Date().toISOString()}] ORDER_COMPLETE: User ${req.user.id} | ${req.body.mode} ${req.body.qty} ${req.body.name} at ${req.body.price} (${req.body.orderType})`);
    return res.status(201).json({ message: "Order saved successfully", success: true });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR: Failed to process newOrder for user ${req.user.id}:`, error.message);
    return res.status(500).json({ message: "Failed to save order", success: false });
  }
});

const processPendingOrders = async (targetTicker = null) => {
  try {
    const query = { status: "PENDING" };
    if (targetTicker) query.name = targetTicker;

    const pendingOrders = await OrdersModel.find(query);

    for (const pendingOrder of pendingOrders) {
      // Task 7: Atomic Lock to prevent concurrent processing (Race Condition Protection)
      const order = await OrdersModel.findOneAndUpdate(
        { _id: pendingOrder._id, status: "PENDING" },
        { $set: { status: "PROCESSING" } },
        { new: true }
      );

      if (!order) continue; // Order was already picked up by another process

      const currentPrice = currentPrices[order.name];
      if (currentPrice === undefined) {
        await OrdersModel.updateOne({ _id: order._id }, { $set: { status: "PENDING" } });
        continue;
      }

      let shouldExecute = false;
      if (order.mode === "BUY" && currentPrice <= order.price) {
        shouldExecute = true;
      } else if (order.mode === "SELL" && currentPrice >= order.price) {
        shouldExecute = true;
      }

      if (!shouldExecute) {
        // Release lock if conditions not met
        await OrdersModel.updateOne({ _id: order._id }, { $set: { status: "PENDING" } });
        continue;
      }

      try {
        const user = await UserModel.findById(order.user);
        const priceCents = toCents(currentPrice);
        const orderValueCents = order.qty * priceCents;
        const userBalanceCents = toCents(user.balance);

        if (order.mode === "BUY") {
          if (userBalanceCents < orderValueCents) {
            order.status = "REJECTED"; // Funds might have been spent elsewhere while pending
            await order.save();
            console.log(`[${new Date().toISOString()}] ORDER_REJECTED (Pending): User ${order.user} | BUY ${order.qty} ${order.name} - Insufficient funds at execution time (Order: ${order._id})`);
            continue;
          }

          user.balance = fromCents(userBalanceCents - orderValueCents);
          await user.save();

          const existingHolding = await HoldingsModel.findOne({ user: order.user, name: order.name });
          if (existingHolding) {
            const totalQty = existingHolding.qty + order.qty;
            const newAvgCents = Math.round(((existingHolding.qty * toCents(existingHolding.avg)) + (order.qty * priceCents)) / totalQty);
            existingHolding.qty = totalQty;
            existingHolding.avg = fromCents(newAvgCents);
            await existingHolding.save();
          } else {
            await HoldingsModel.create({ name: order.name, qty: order.qty, avg: currentPrice, price: currentPrice, user: order.user });
          }
        } else if (order.mode === "SELL") {
          const existingHolding = await HoldingsModel.findOne({ user: order.user, name: order.name });
          if (!existingHolding || existingHolding.qty < order.qty) {
            order.status = "REJECTED";
            await order.save();
            console.log(`[${new Date().toISOString()}] ORDER_REJECTED (Pending): User ${order.user} | SELL ${order.qty} ${order.name} - Insufficient quantity at execution time (Order: ${order._id})`);
            continue;
          }

          user.balance = fromCents(userBalanceCents + orderValueCents);
          await user.save();

          if (existingHolding.qty === order.qty) {
            await HoldingsModel.deleteOne({ _id: existingHolding._id });
          } else {
            existingHolding.qty -= order.qty;
            await existingHolding.save();
          }
        }

        order.status = "COMPLETE";
        order.price = currentPrice; // Update to actual execution price
        await order.save();
        console.log(`[${new Date().toISOString()}] ORDER_COMPLETE (Pending): User ${order.user} | ${order.mode} ${order.qty} ${order.name} executed at ${currentPrice} (Order: ${order._id})`);
      } catch (err) {
        console.error(`[${new Date().toISOString()}] ERROR: Failed to execute order ${order._id}:`, err.message);
        // Rollback status so it can be retried on next tick
        await OrdersModel.updateOne({ _id: order._id }, { $set: { status: "PENDING" } });
      }
    }
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ERROR: Error processing pending orders:`, err.message);
  }
};

// --- Finnhub WebSocket Integration ---
let isFinnhubConnected = false;
// Track pending batch emission to ensure io.emit is called exactly once per trade batch
let batchEmitScheduled = false;
// Track pending order processing per ticker to avoid DB spam on high-volume trade ticks
const pendingTickerExecution = new Set();

const handleTradeUpdate = async (symbol, price) => {
  // Find all internal names mapped to this symbol (e.g., both HUL and HINDUNILVR)
  const internalTickers = Object.keys(watchlistMap).filter(key => watchlistMap[key] === symbol);
  
  if (internalTickers.length === 0) {
    console.warn(`[${new Date().toISOString()}] WS_WARN: Received trade for unmapped symbol: ${symbol}`);
    return;
  }

  const priceCents = toCents(price);
  const safePrice = fromCents(priceCents);

  console.log(`[${new Date().toISOString()}] TRADE_UPDATE: Symbol ${symbol} resolved to [${internalTickers.join(", ")}] at price ${safePrice}`);

  for (const ticker of internalTickers) {
    currentPrices[ticker] = safePrice;
    
    // Debounce order processing per ticker: wait for the next tick to aggregate trades
    if (!pendingTickerExecution.has(ticker)) {
      pendingTickerExecution.add(ticker);
      setImmediate(() => {
        processPendingOrders(ticker)
          .catch(err => console.error(`[${new Date().toISOString()}] ERROR: Order engine failed for ${ticker}:`, err.message))
          .finally(() => pendingTickerExecution.delete(ticker));
      });
    }
  }

  // Batch emission: Schedule a single emit for all trades in this incoming packet
  if (!batchEmitScheduled) {
    batchEmitScheduled = true;
    setImmediate(() => {
      io.emit("priceUpdate", currentPrices);
      batchEmitScheduled = false;
    });
  }
};

const uniqueSymbols = [...new Set(Object.values(watchlistMap))];

const finnhub = new FinnhubService(
  process.env.FINNHUB_API_KEY,
  uniqueSymbols,
  handleTradeUpdate,
  (status) => {
    console.log(`[${new Date().toISOString()}] INFO: Finnhub connection status changed to: ${status ? "CONNECTED" : "DISCONNECTED"}`);
    isFinnhubConnected = status;
    io.emit("connectionStatus", { isLive: status });
  }
);

// --- Hybrid Fallback & Heartbeat ---
setInterval(() => {
  // 1. Always simulate Indices (NIFTY/SENSEX) as they are often restricted on free stock streams
  ["NIFTY 50", "SENSEX"].forEach(ticker => {
    const change = (Math.random() * 0.0002) - 0.0001;
    currentPrices[ticker] = fromCents(toCents(currentPrices[ticker] * (1 + change)));
  });

  // 2. Resilience: If WS is down, resume simulation for all stocks
  if (!isFinnhubConnected) {
    Object.keys(currentPrices).forEach((ticker) => {
      if (ticker === "NIFTY 50" || ticker === "SENSEX") return;
      const volatility = 0.001; 
      const change = (Math.random() * volatility) - (volatility / 2);
      currentPrices[ticker] = fromCents(toCents(currentPrices[ticker] * (1 + change)));
    });
    processPendingOrders();
  }

  io.emit("priceUpdate", currentPrices);
}, 2000);

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  // Send current Finnhub status to the new user immediately
  socket.emit("connectionStatus", { isLive: isFinnhubConnected });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`[${new Date().toISOString()}] FATAL: Port ${PORT} is already in use. Use 'Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force' in PowerShell to free it.`);
    process.exit(1);
  }
  console.error(`[${new Date().toISOString()}] SERVER ERROR:`, e.message);
});

server.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Server is running on port ${PORT}`);
  
  // Start Finnhub connection only after server is successfully bound to the port
  console.log(`[${new Date().toISOString()}] INFO: Initializing Finnhub with ${uniqueSymbols.length} symbols.`);
  finnhub.connect();

  if (!url) {
    console.error(`[${new Date().toISOString()}] FATAL: MONGO_URL is not defined in .env file.`);
    process.exit(1);
  }

  if (!tokenKey) {
    console.error(`[${new Date().toISOString()}] FATAL: TOKEN_KEY is not defined in .env file. Login will fail.`);
    process.exit(1);
  }

  mongoose.connect(url)
    .then(async () => {
      console.log("MongoDB connected successfully");
      
      try {
        // One-time migration: set balance for existing users who don't have it
        const result = await UserModel.updateMany(
          { balance: { $exists: false } },
          { $set: { balance: 100000 } }
        );
        if (result.modifiedCount > 0) {
          console.log(`Migrated balance for ${result.modifiedCount} existing user(s).`);
        }

        // Optimize performance: Create compound index for order matching
        await OrdersModel.collection.createIndex({ status: 1, name: 1 });
        console.log("MongoDB Index created/verified for Orders collection (status, name).");
      } catch (initErr) {
        console.error("Error during database initialization:", initErr.message);
      }
    })
    .catch(err => console.error("MongoDB connection error:", err.message));
});