const { SmartAPI, WebSocketV2 } = require('smartapi-javascript');
const { generateSync } = require('otplib');

class AngelOneService {
  /**
   * Creates a new AngelOneService instance
   *
   * @param {string} apiKey - API Key from environment
   * @param {string} clientCode - Client ID from environment
   * @param {string} password - Client Password from environment
   * @param {string} totpSecret - TOTP Secret from environment
   * @param {string[]} symbols - List of numeric tokens to subscribe to (e.g., ["2885", "11536"])
   * @param {Function} onTrade - Callback executed on every tick event: (token, price) => Promise<void>
   * @param {Function} onStatusChange - Callback to track connection status: (isConnected) => void
   */
  constructor(apiKey, clientCode, password, totpSecret, symbols, onTrade, onStatusChange) {
    this.apiKey = apiKey;
    this.clientCode = clientCode;
    this.password = password;
    this.totpSecret = totpSecret;
    this.symbols = symbols;
    this.onTrade = onTrade;
    this.onStatusChange = onStatusChange;

    this.smartApi = new SmartAPI({
      api_key: this.apiKey
    });
    this.ws = null;
    this.isConnected = false;
    this._reconnectTimer = null;
  }

  /**
   * Initiates the login and WebSocket connection to Angel One
   */
  async connect() {
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }

    console.log(`[${new Date().toISOString()}] AngelOneService: Attempting login and connection...`);

    try {
      // 1. Generate TOTP dynamically
      const totpCode = generateSync({ secret: this.totpSecret });
      
      // 2. Generate session
      const session = await this.smartApi.generateSession(this.clientCode, this.password, totpCode);
      if (!session.status) {
        throw new Error(`Login failed: ${session.message || "Unknown error"}`);
      }

      const jwtToken = session.data.jwtToken;
      const feedToken = session.data.feedToken;

      console.log(`[${new Date().toISOString()}] AngelOneService: Login successful. JWT token received.`);

      // 3. Initialize WebSocketV2
      this.ws = new WebSocketV2({
        jwttoken: jwtToken,
        apikey: this.apiKey,
        clientcode: this.clientCode,
        feedtype: feedToken
      });

      // 4. Register event handlers
      this.ws.on('tick', (ticks) => {
        if (Array.isArray(ticks)) {
          ticks.forEach(tick => this._handleTick(tick));
        } else if (ticks) {
          this._handleTick(ticks);
        }
      });

      this.ws.on('error', (err) => {
        console.error(`[${new Date().toISOString()}] AngelOneService: WebSocket error:`, err.message || err);
        this._handleDisconnect();
      });

      this.ws.on('close', () => {
        console.warn(`[${new Date().toISOString()}] AngelOneService: WebSocket connection closed.`);
        this._handleDisconnect();
      });

      // 5. Connect the socket
      await this.ws.connect();

      console.log(`[${new Date().toISOString()}] AngelOneService: WS Connected. Subscribing to tokens...`);
      this.isConnected = true;
      this.onStatusChange(true);

      // Subscribe to symbols
      // mode: 1 (LTP), exchangeType: 1 (NSE CM)
      const json_req = {
        correlationID: "novapulse1",
        action: 1, // Subscribe
        mode: 1, // LTP
        exchangeType: 1, // nse_cm
        tokens: this.symbols
      };
      try {
        this.ws.fetchData(json_req);
      } catch (err) {
        console.error(`[${new Date().toISOString()}] AngelOneService: Subscription error:`, err.message);
      }

    } catch (err) {
      console.error(`[${new Date().toISOString()}] AngelOneService: Connection error:`, err.message);
      this._handleDisconnect();
    }
  }

  _handleTick(tick) {
    if (tick && tick.token && tick.last_traded_price) {
      const cleanToken = tick.token.replace(/"/g, '').trim();
      // Divide last_traded_price by 100 as it is returned in paise
      const price = Number(tick.last_traded_price) / 100;
      this.onTrade(cleanToken, price);
    }
  }

  _handleDisconnect() {
    this.isConnected = false;
    this.onStatusChange(false);
    
    // Stop WS if existing
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }

    // Schedule retry/reconnect after 10 seconds
    if (!this._reconnectTimer) {
      console.log(`[${new Date().toISOString()}] AngelOneService: Scheduling reconnect in 10s...`);
      this._reconnectTimer = setTimeout(() => {
        this._reconnectTimer = null;
        this.connect();
      }, 10000);
    }
  }

  /**
   * Gracefully disconnects and cancels any reconnection timers
   */
  disconnect() {
    console.log(`[${new Date().toISOString()}] AngelOneService: Disconnecting gracefully...`);
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch (err) {}
      this.ws = null;
    }
    this.isConnected = false;
    this.onStatusChange(false);
  }
}

module.exports = AngelOneService;
