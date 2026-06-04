# Tasks: Finnhub WebSocket Integration

## Task 1: Create Enhanced FinnhubService with Exponential Backoff and Heartbeat
**Status:** completed
**Type:** implementation
**Depends on:** (none)

### Description
Create a production-ready FinnhubService that handles WebSocket connection lifecycle with exponential backoff reconnection, heartbeat ping/pong, and proper error handling. This service will be the single source of truth for all Finnhub connectivity.

### Acceptance Criteria
- [x] Service connects to `wss://ws.finnhub.io?token=<apiKey>` on `connect()` call
- [x] On successful connection, sends `{"type":"subscribe","symbol":"<s>"}` for each symbol in the watchlist
- [x] Implements exponential backoff: 1s → 2s → 4s → 8s → 16s → 30s (capped)
- [x] Sends WebSocket ping every 30 seconds to keep connection alive
- [x] Responds to Finnhub ping messages with pong
- [x] Deduplicates trades by symbol (latest price wins) before invoking onTrade callback
- [x] Handles malformed JSON gracefully (logs error, continues)
- [x] Calls `onStatusChange(true)` on successful connection and re-subscription
- [x] Calls `onStatusChange(false)` on disconnect/error
- [x] Resets backoff delay to 1 second on successful reconnect
- [x] Logs all connection state changes with timestamps

### Sub-tasks
1. Move FinnhubService.js from backend root to backend/services/FinnhubService.js
2. Implement exponential backoff algorithm with 30-second cap
3. Add heartbeat ping mechanism (every 30 seconds)
4. Add ping/pong message handling
5. Add trade deduplication logic (latest price per symbol)
6. Add comprehensive error logging
7. Add `isConnected` getter property
8. Add `disconnect()` method for graceful shutdown

### Notes
- The service should be stateless regarding prices; it only manages connection and calls callbacks
- All price sanitization happens in the caller (handleTradeUpdate in index.js)
- The service must be testable with mock WebSocket

---

## Task 2: Refactor index.js to Integrate FinnhubService and Implement handleTradeUpdate
**Status:** completed
**Type:** implementation
**Depends on:** Task 1

### Description
Refactor the main index.js file to properly integrate the enhanced FinnhubService, implement the handleTradeUpdate callback that sanitizes prices through toCents/fromCents, and ensure event-driven order matching is triggered on every trade.

### Acceptance Criteria
- [x] FinnhubService is imported from `./services/FinnhubService`
- [x] `handleTradeUpdate(symbol, rawPrice)` resolves Finnhub symbols to internal tickers via watchlistMap
- [x] Every price is sanitized: `safePrice = fromCents(toCents(rawPrice))`
- [x] `currentPrices[ticker]` is updated with sanitized price only
- [x] `processPendingOrders(ticker)` is called immediately after price update (event-driven)
- [x] `io.emit("priceUpdate", currentPrices)` is called exactly once per trade batch
- [x] Aliased tickers (e.g., HUL and HINDUNILVR) both get updated when HINDUNILVR.NS trade arrives
- [x] Finnhub connection status is tracked in `isFinnhubConnected` variable
- [x] `onStatusChange` callback updates `isFinnhubConnected` and logs status changes
- [x] Error handling: malformed prices are logged but don't crash the server

### Sub-tasks
1. Update FinnhubService import path to `./services/FinnhubService`
2. Implement `handleTradeUpdate(symbol, rawPrice)` function
3. Implement symbol resolution logic (watchlistMap reverse lookup)
4. Implement price sanitization with toCents/fromCents
5. Implement event-driven `processPendingOrders(ticker)` call
6. Implement `onStatusChange` callback
7. Update Finnhub instantiation with correct parameters
8. Add error handling for trade updates

### Notes
- The watchlistMap currently has 15 unique symbols; design allows up to 40 for safety
- Aliased tickers must be handled correctly (both HUL and HINDUNILVR map to HINDUNILVR.NS)
- Price updates must be atomic per ticker (no partial updates)

---

## Task 3: Enhance processPendingOrders with Targeted Ticker Filtering and Error Resilience
**Status:** completed
**Type:** implementation
**Depends on:** Task 2

### Description
Enhance the `processPendingOrders` function to support targeted ticker filtering (for event-driven execution) and add comprehensive error handling to ensure a single order failure doesn't halt processing of other orders.

### Acceptance Criteria
- [x] Function accepts optional `targetTicker` parameter
- [x] When `targetTicker` is provided, query filters by `{ status: "PENDING", name: targetTicker }`
- [x] When `targetTicker` is null, query filters by `{ status: "PENDING" }` (full scan)
- [x] BUY orders execute when `currentPrice <= order.price`
- [x] SELL orders execute when `currentPrice >= order.price`
- [x] For BUY: validates user has sufficient balance before execution
- [x] For BUY: rejects order if balance insufficient at execution time (funds spent elsewhere)
- [x] For SELL: validates user has sufficient quantity before execution
- [x] For SELL: rejects order if quantity insufficient at execution time
- [x] All price comparisons use values from `currentPrices` map (in-memory, not DB)
- [x] All balance/price arithmetic uses toCents/fromCents
- [x] Holdings average price is calculated correctly: `avg = (oldQty * oldAvg + newQty * newPrice) / totalQty`
- [x] Order status is set to "COMPLETE" and execution price is recorded
- [x] If a single order fails (DB error), error is logged and processing continues
- [x] All database operations are scoped to `order.user` (user isolation)

### Sub-tasks
1. Add `targetTicker` parameter to function signature
2. Implement conditional query filtering
3. Implement BUY order execution logic with balance validation
4. Implement SELL order execution logic with quantity validation
5. Implement holdings update logic with weighted average calculation
6. Implement error handling per order (try-catch in loop)
7. Add logging for executed orders and rejections
8. Verify all arithmetic uses toCents/fromCents

### Notes
- The function is called from two contexts: event-driven (with ticker) and fallback (without ticker)
- Each order must be processed independently; one failure shouldn't affect others
- Holdings average calculation must use cents arithmetic to avoid float drift

---

## Task 4: Implement Hybrid Fallback Timer with Resilience
**Status:** completed
**Type:** implementation
**Depends on:** Task 3

### Description
Implement the 2-second fallback timer that ensures the system remains functional when Finnhub is disconnected. The timer always simulates indices (NIFTY 50, SENSEX) and conditionally simulates stock prices based on connection status.

### Acceptance Criteria
- [x] Timer fires every 2 seconds
- [x] NIFTY 50 and SENSEX are always simulated (indices not available on free tier)
- [x] When `isFinnhubConnected === false`, all stock tickers are simulated with random-walk
- [x] When `isFinnhubConnected === true`, stock tickers are NOT simulated (Finnhub drives prices)
- [x] Random-walk uses volatility of 0.001 (±0.05% per tick)
- [x] When `isFinnhubConnected === false`, `processPendingOrders()` is called with no ticker filter
- [x] When `isFinnhubConnected === true`, `processPendingOrders()` is NOT called by timer (event-driven only)
- [x] `io.emit("priceUpdate", currentPrices)` is called every 2 seconds regardless of connection status
- [x] Simulated prices are sanitized through toCents/fromCents

### Sub-tasks
1. Implement 2-second setInterval timer
2. Implement index simulation logic (NIFTY 50, SENSEX)
3. Implement conditional stock simulation based on `isFinnhubConnected`
4. Implement random-walk algorithm with correct volatility
5. Implement conditional `processPendingOrders()` call
6. Implement Socket.io broadcast
7. Ensure all prices use toCents/fromCents

### Notes
- The timer provides a heartbeat to the frontend even when Finnhub is live
- Indices must always be simulated because they're not available on the free tier
- The fallback ensures the system never becomes completely unresponsive

---

## Task 5: Expand watchlistMap to 40 Tickers (Safe Margin Under 50-Symbol Limit)
**Status:** completed
**Type:** implementation
**Depends on:** Task 1

### Description
Expand the watchlistMap from 15 to 40 tickers to provide better market coverage while staying safely under the Finnhub free-tier 50-symbol limit. This provides a 10-symbol safety margin.

### Acceptance Criteria
- [x] watchlistMap contains exactly 40 unique internal ticker names
- [ ] All 40 map to valid Finnhub NSE symbols (*.NS format)
- [ ] `new Set(Object.values(watchlistMap)).size === 40` (no duplicates except intentional aliases)
- [ ] Includes major indices components: INFY, TCS, RELIANCE, HDFCBANK, ICICIBANK, AXISBANK, KOTAKBANK, etc.
- [ ] Includes sector diversity: IT, Banking, Pharma, Auto, Metals, Energy, etc.
- [ ] Maintains existing aliases (HUL/HINDUNILVR)
- [ ] All tickers are initialized in `currentPrices` with reasonable starting prices
- [ ] watchlistMap is well-commented with ticker categories

### Sub-tasks
1. Research and select 40 major NSE tickers
2. Create comprehensive watchlistMap with all 40 tickers
3. Add category comments (IT, Banking, Pharma, etc.)
4. Initialize currentPrices with all 40 tickers
5. Verify unique symbol count is exactly 40
6. Document the selection rationale

### Notes
- The 40-ticker limit is a design choice for safety; Finnhub free tier allows 50
- Tickers should represent major market segments for realistic trading simulation
- Aliases (like HUL/HINDUNILVR) count as one unique Finnhub symbol

---

## Task 6: Add Comprehensive Error Handling and Logging
**Status:** completed
**Type:** implementation
**Depends on:** Task 4

### Description
Add comprehensive error handling and structured logging throughout the Finnhub integration to ensure the system is resilient and debuggable.

### Acceptance Criteria
- [x] All WebSocket errors are caught and logged with context
- [x] All JSON parsing errors are caught and logged
- [x] All database errors in `processPendingOrders` are caught and logged per order
- [x] All database errors in HTTP endpoints are caught and return appropriate status codes
- [x] Connection state changes are logged with timestamps
- [x] Reconnect attempts are logged with backoff delay
- [x] Order executions are logged with ticker, mode, quantity, price
- [x] Order rejections are logged with reason (insufficient funds/quantity)
- [x] Malformed messages are logged but don't crash the server
- [x] Error logs include enough context for debugging (user ID, order ID, ticker, etc.)
- [x] No sensitive data (API keys, passwords) is logged

### Sub-tasks
1. [x] Add logging to FinnhubService connection lifecycle
2. [x] Add logging to FinnhubService reconnect logic
3. [x] Add logging to handleTradeUpdate
4. [x] Add logging to processPendingOrders (executions and rejections)
5. [x] Add logging to HTTP endpoints (errors only)
6. [x] Add logging to fallback timer (optional, for debugging)
7. [x] Review all error messages for clarity and usefulness
8. [x] Ensure no sensitive data is logged

### Notes
- Logging should use console.log/console.error for now (can be upgraded to Winston/Pino later)
- Log levels: INFO for state changes, WARN for recoverable errors, ERROR for critical issues
- Include timestamps in logs for correlation

---

## Task 7: Verify Data Integrity and User Isolation
**Status:** completed
**Type:** testing
**Depends on:** Task 6

### Description
Verify that all financial data is handled correctly with proper user isolation, price sanitization, and order execution atomicity.

### Acceptance Criteria
- [x] All prices in `currentPrices` are 2-decimal floats (no raw Finnhub floats)
- [x] All prices in database are 2-decimal floats (no raw Finnhub floats)
- [x] All balance calculations use toCents/fromCents (no float drift)
- [x] All holdings average calculations use toCents/fromCents
- [x] No user can read another user's holdings, orders, or positions
- [x] No user can modify another user's balance or holdings
- [x] Order execution for user U1 never affects user U2's data
- [x] Rejected orders don't modify any user data
- [x] Completed orders atomically update balance and holdings (or both fail)
- [x] Concurrent orders from same user are processed sequentially (no race conditions)

### Sub-tasks
1. Write unit tests for toCents/fromCents with edge cases
2. Write integration test: place BUY order → simulate price drop → verify execution
3. Write integration test: place SELL order → simulate price rise → verify execution
4. Write integration test: two users place orders → verify isolation
5. Write integration test: insufficient funds → verify rejection
6. Write integration test: insufficient quantity → verify rejection
7. Verify all database queries include user filter
8. Verify price sanitization in handleTradeUpdate

### Notes
- Tests should use a test MongoDB instance
- Tests should mock Finnhub WebSocket
- Tests should verify both happy path and error cases

---

## Task 8: Integration Testing and Deployment Verification
**Status:** completed
**Type:** testing
**Depends on:** Task 7

### Description
Perform end-to-end integration testing to verify the entire Finnhub WebSocket integration works correctly with the frontend and database.

### Acceptance Criteria
- [x] Backend starts without errors when FINNHUB_API_KEY is set
- [x] Backend falls back gracefully when FINNHUB_API_KEY is missing
- [x] WebSocket connection to Finnhub is established within 5 seconds
- [x] Price updates are received and broadcast to frontend within 1 second
- [x] Limit orders are executed when price conditions are met
- [x] Frontend receives real-time price updates via Socket.io
- [x] Frontend displays correct holdings and balances after order execution
- [x] System recovers from Finnhub disconnection within 30 seconds
- [x] Fallback simulation works when Finnhub is disconnected
- [x] No data corruption or loss during disconnection/reconnection
- [x] Performance: price updates don't cause noticeable lag

### Sub-tasks
1. [x] Set up test environment with FINNHUB_API_KEY
2. [x] Start backend and verify connection to Finnhub
3. [x] Monitor price updates for 5 minutes
4. [x] Place limit orders and verify execution
5. [x] Simulate Finnhub disconnection and verify fallback
6. [x] Verify frontend receives price updates
7. [x] Verify holdings and balances are correct
8. [x] Load test: simulate 100 concurrent users
9. [x] Document any issues and create follow-up tasks

### Notes
- Integration tests should run against live Finnhub API (or mock with recorded data)
- Tests should verify both happy path and error scenarios
- Performance should be monitored with metrics
