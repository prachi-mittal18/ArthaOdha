# Requirements: Finnhub WebSocket Integration

## Introduction

This document defines the functional and non-functional requirements for integrating the Finnhub.io real-time WebSocket API into the ArthaOdha Engine service (port 3002). The integration replaces the existing `setInterval`-based random-walk price simulation with a live, event-driven hybrid system while preserving all existing financial-math invariants, user isolation guarantees, and API contracts.

## Requirements

### Requirement 1

**User Story:** As a backend service, I want to establish and maintain a persistent WebSocket connection to Finnhub.io, so that the system can receive live trade data for subscribed symbols.

#### Acceptance Criteria

1. Given the server starts with a valid `FINNHUB_API_KEY` in `.env`, when `finnhub.connect()` is called, then a WebSocket connection to `wss://ws.finnhub.io?token=<key>` is initiated.
2. Given the connection is established, when the `open` event fires, then the service sends a `{"type":"subscribe","symbol":"<s>"}` message for every symbol in the watchlist.
3. Given the unique external symbols are extracted from `watchlistMap` via `new Set(Object.values(watchlistMap))`, when counted, then the result contains at most 40 entries (safely under the free-tier limit of 50).
4. Given an active connection, when 30 seconds elapse without activity, then the service sends a WebSocket ping frame to keep the connection alive.
5. Given Finnhub sends a `{"type":"ping"}` message, when received, then the service responds with `{"type":"pong"}`.

### Requirement 2

**User Story:** As a backend service, I want to automatically reconnect to Finnhub using exponential backoff when the connection drops, so that the system recovers from transient network failures without manual intervention.

#### Acceptance Criteria

1. Given the WebSocket closes unexpectedly, when the `close` event fires, then `onStatusChange(false)` is called and a reconnect is scheduled after the current backoff delay.
2. Given successive reconnect failures, when each attempt fails, then the delay doubles (1 s → 2 s → 4 s → … → 30 s) and never exceeds 30 seconds.
3. Given a successful reconnect, when the `open` event fires, then the backoff delay resets to 1 second, all symbols are re-subscribed, and `onStatusChange(true)` is called.
4. Given `FINNHUB_API_KEY` is not set or invalid, when the server starts, then a clear error is logged and the service operates in fallback simulation mode.

### Requirement 3

**User Story:** As a backend service, I want to process incoming Finnhub trade events and sanitise all prices through the scaled-integer math helpers, so that no raw floating-point values from external sources ever reach the database or order-matching logic.

#### Acceptance Criteria

1. Given Finnhub sends `{"type":"trade","data":[{"s":"INFY.NS","p":1500.199999,"t":...}]}`, when the message is received, then `onTrade("INFY.NS", 1500.199999)` is called.
2. Given a message contains multiple trades for the same symbol in one batch, when processed, then only the last (most recent) price for that symbol is used.
3. Given `handleTradeUpdate` receives a raw price `p`, when it updates `currentPrices`, then the stored value equals `fromCents(toCents(p))` — never the raw float.
4. Given any order execution triggered by a Finnhub trade, when `HoldingsModel`, `OrdersModel`, or `UserModel` documents are saved, then all numeric price and balance fields are produced by `fromCents(toCents(rawValue))`.
5. Given an existing holding of 2 shares at avg `1500.00` and a new BUY of 3 shares at `1510.00`, when the holding is updated, then `avg = fromCents(Math.round((2 * 150000 + 3 * 151000) / 5))` = `1506.00`.

### Requirement 4

**User Story:** As a backend service, I want to resolve Finnhub external symbols to internal ticker names and update the price map accordingly, so that aliased tickers (e.g., HUL and HINDUNILVR both mapping to HINDUNILVR.NS) are kept in sync.

#### Acceptance Criteria

1. Given `watchlistMap` maps both `"HUL"` and `"HINDUNILVR"` to `"HINDUNILVR.NS"`, when a trade for `"HINDUNILVR.NS"` arrives, then both `currentPrices["HUL"]` and `currentPrices["HINDUNILVR"]` are updated.
2. Given a Finnhub symbol that has no mapping in `watchlistMap`, when a trade arrives, then `currentPrices` is not modified and no error is thrown.

### Requirement 5

**User Story:** As a backend service, I want to trigger the pending order matching engine immediately on each live trade event, so that limit orders are executed as soon as their price condition is met.

#### Acceptance Criteria

1. Given a PENDING LIMIT BUY order for `"INFY"` at price `1490.00`, when a Finnhub trade arrives with price `1488.00` for `"INFY.NS"`, then the order status transitions to `"COMPLETE"` within the same event handler invocation.
2. Given a PENDING LIMIT SELL order for `"TCS"` at price `3300.00`, when a Finnhub trade arrives with price `3305.00` for `"TCS.NS"`, then the order status transitions to `"COMPLETE"`.
3. Given `processPendingOrders(ticker)` is called from `handleTradeUpdate`, when it queries MongoDB, then the query filters by `{ status: "PENDING", name: ticker }` to avoid a full collection scan.

### Requirement 6

**User Story:** As a user, I want my order executions to be completely isolated from other users, so that a trade event affecting my orders never modifies another user's holdings or balance.

#### Acceptance Criteria

1. Given two users `U1` and `U2` each have a PENDING BUY order for `"INFY"`, when the price condition is met, then `U1`'s balance and holdings are updated only with `U1`'s order values, and `U2`'s with `U2`'s.
2. Given `processPendingOrders` runs, when it reads and writes `HoldingsModel` and `UserModel`, then every query includes the `user` field scoped to `order.user`.
3. Given a PENDING BUY order where the user's balance has since dropped below the order value, when `processPendingOrders` evaluates the order, then `order.status` is set to `"REJECTED"` and saved without affecting other users.
4. Given a PENDING SELL order where the user's holding quantity is now less than `order.qty`, when `processPendingOrders` evaluates the order, then `order.status` is set to `"REJECTED"` and saved.

### Requirement 7

**User Story:** As a frontend client, I want to receive real-time price updates via Socket.io, so that the UI reflects live market prices as soon as they arrive from Finnhub.

#### Acceptance Criteria

1. Given a Finnhub trade event is received and processed, when `handleTradeUpdate` completes, then `io.emit("priceUpdate", currentPrices)` is called exactly once per processed batch.
2. Given the server is running, when 2 seconds elapse, then `io.emit("priceUpdate", currentPrices)` is called by the fallback interval timer regardless of Finnhub connection status.

### Requirement 8

**User Story:** As a backend service, I want to fall back to the internal random-walk simulation when Finnhub is disconnected, so that the frontend and order-matching engine continue to function during outages.

#### Acceptance Criteria

1. Given `isFinnhubConnected` is `false`, when the 2-second interval fires, then all stock tickers (excluding NIFTY 50 and SENSEX) have their prices updated by the random-walk algorithm.
2. Given `isFinnhubConnected` is `false`, when the interval fires, then `processPendingOrders()` is called with no ticker filter to evaluate all pending orders.
3. Given `isFinnhubConnected` is `true`, when the 2-second interval fires, then stock ticker prices are NOT updated by the random-walk algorithm.
4. Given any state of `isFinnhubConnected`, when the 2-second interval fires, then `currentPrices["NIFTY 50"]` and `currentPrices["SENSEX"]` are always updated by the random-walk algorithm (indices are not available on the free tier).

### Requirement 9

**User Story:** As a backend service, I want to handle malformed messages and database errors gracefully, so that a single bad event or transient DB failure does not crash the server or halt order processing.

#### Acceptance Criteria

1. Given Finnhub sends a message that is not valid JSON, when the `message` event fires, then the error is caught and logged, and the WebSocket connection remains open.
2. Given Finnhub sends a valid JSON message with an unknown `type`, when processed, then the message is silently ignored.
3. Given `processPendingOrders` is processing multiple orders and one throws a DB error, when the error occurs, then the error is logged and remaining orders continue to be evaluated.
