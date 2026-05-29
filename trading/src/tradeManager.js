/**
 * Manages open positions: entry, monitoring, and exit on target/stop-loss.
 */

const logger = require("./logger");

const PROFIT_TARGET = parseFloat(process.env.PROFIT_TARGET_PCT || 15) / 100;
const STOP_LOSS = parseFloat(process.env.STOP_LOSS_PCT || 50) / 100;
const LIVE = process.env.LIVE_TRADING === "true";

class TradeManager {
  constructor(kite) {
    this.kite = kite;
    // Map of orderId -> { tradingsymbol, exchange, buyPrice, quantity, index }
    this.openTrades = new Map();
  }

  get activeTrades() {
    return this.openTrades.size;
  }

  async enterTrade(instrument, budgetPerTrade) {
    const { tradingsymbol, exchange, strike, expiry } = instrument;

    try {
      // Get current LTP to size the trade
      const ltp = await this._getLTP(exchange, tradingsymbol);
      if (!ltp || ltp <= 0) {
        logger.warn(`Skipping ${tradingsymbol}: could not fetch LTP`);
        return false;
      }

      // Options are lot-based. NIFTY lot = 25, SENSEX lot = 10
      const lotSize = instrument.lot_size || 25;
      const lots = Math.max(1, Math.floor(budgetPerTrade / (ltp * lotSize)));
      const quantity = lots * lotSize;

      logger.info(
        `ENTRY ${tradingsymbol} | LTP=${ltp} | Qty=${quantity} (${lots} lots) | Budget=₹${budgetPerTrade}`
      );

      if (!LIVE) {
        logger.info(`[PAPER] Would BUY ${quantity} x ${tradingsymbol} @ market`);
        const fakeOrderId = `PAPER-${Date.now()}`;
        this.openTrades.set(fakeOrderId, {
          tradingsymbol,
          exchange,
          buyPrice: ltp,
          quantity,
          strike,
          expiry,
          enteredAt: Date.now(),
        });
        return fakeOrderId;
      }

      const order = await this.kite.placeOrder("regular", {
        tradingsymbol,
        exchange,
        transaction_type: "BUY",
        order_type: "MARKET",
        quantity,
        product: "MIS", // intraday
        validity: "DAY",
      });

      const orderId = order.order_id;
      this.openTrades.set(orderId, {
        tradingsymbol,
        exchange,
        buyPrice: ltp,
        quantity,
        strike,
        expiry,
        enteredAt: Date.now(),
      });

      logger.info(`Order placed: ${orderId}`);
      return orderId;
    } catch (err) {
      logger.error(`Failed to enter trade for ${tradingsymbol}: ${err.message}`);
      return false;
    }
  }

  async monitorAndExit() {
    if (this.openTrades.size === 0) return;

    for (const [orderId, trade] of this.openTrades.entries()) {
      try {
        const ltp = await this._getLTP(trade.exchange, trade.tradingsymbol);
        if (!ltp) continue;

        const pnlPct = (ltp - trade.buyPrice) / trade.buyPrice;
        const pnlRs = (ltp - trade.buyPrice) * trade.quantity;

        logger.info(
          `Monitor ${trade.tradingsymbol} | Buy=₹${trade.buyPrice} | LTP=₹${ltp} | P&L=${(pnlPct * 100).toFixed(1)}% (₹${pnlRs.toFixed(0)})`
        );

        const shouldExit =
          pnlPct >= PROFIT_TARGET
            ? { reason: "TARGET", emoji: "✅" }
            : pnlPct <= -STOP_LOSS
            ? { reason: "STOP_LOSS", emoji: "🛑" }
            : null;

        if (shouldExit) {
          await this._exitTrade(orderId, trade, ltp, shouldExit.reason);
        }
      } catch (err) {
        logger.error(`Monitor error for ${orderId}: ${err.message}`);
      }
    }
  }

  async exitAllTrades(reason = "EOD") {
    for (const [orderId, trade] of this.openTrades.entries()) {
      const ltp = await this._getLTP(trade.exchange, trade.tradingsymbol).catch(() => null);
      await this._exitTrade(orderId, trade, ltp, reason);
    }
  }

  async _exitTrade(orderId, trade, exitPrice, reason) {
    logger.info(
      `EXIT [${reason}] ${trade.tradingsymbol} | Exit=₹${exitPrice} | P&L=₹${(
        (exitPrice - trade.buyPrice) *
        trade.quantity
      ).toFixed(0)}`
    );

    if (!LIVE) {
      logger.info(`[PAPER] Would SELL ${trade.quantity} x ${trade.tradingsymbol} @ market`);
      this.openTrades.delete(orderId);
      return;
    }

    try {
      await this.kite.placeOrder("regular", {
        tradingsymbol: trade.tradingsymbol,
        exchange: trade.exchange,
        transaction_type: "SELL",
        order_type: "MARKET",
        quantity: trade.quantity,
        product: "MIS",
        validity: "DAY",
      });
      this.openTrades.delete(orderId);
    } catch (err) {
      logger.error(`Failed to exit ${trade.tradingsymbol}: ${err.message}`);
    }
  }

  async _getLTP(exchange, tradingsymbol) {
    const key = `${exchange}:${tradingsymbol}`;
    const quote = await this.kite.getLTP([key]);
    return quote[key]?.last_price || null;
  }
}

module.exports = TradeManager;
