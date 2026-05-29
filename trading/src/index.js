/**
 * Main entry point for the NIFTY/SENSEX OTM call scalper.
 * Runs autonomously during market hours, scanning every 60 seconds.
 *
 * Before starting:
 *   1. Copy .env.example to .env and fill in your API keys
 *   2. Run: node src/auth.js  (then follow the instructions)
 *   3. Set LIVE_TRADING=true in .env when ready
 *   4. Run: npm start
 */

require("dotenv").config({ path: __dirname + "/../.env" });
const { KiteConnect } = require("kiteconnect");
const { CronJob } = require("cron");
const logger = require("./logger");
const { loadInstruments, findOTMCallStrikes } = require("./instruments");
const TradeManager = require("./tradeManager");

// ── Config ──────────────────────────────────────────────────────────────────
const API_KEY = process.env.KITE_API_KEY;
const ACCESS_TOKEN = process.env.KITE_ACCESS_TOKEN;
const MAX_TRADES = parseInt(process.env.MAX_CONCURRENT_TRADES || "3");
const CAPITAL_PER_TRADE = parseFloat(process.env.CAPITAL_PER_TRADE || "10000");
const STRIKES_OTM = parseInt(process.env.STRIKES_OTM || "2");
const TRADE_INDEX = (process.env.TRADE_INDEX || "BOTH").toUpperCase();
const LIVE = process.env.LIVE_TRADING === "true";

// Market hours: 9:15 AM – 3:20 PM IST
const MARKET_OPEN = { h: 9, m: 15 };
const MARKET_CLOSE = { h: 15, m: 20 };
// Stop taking new trades 30 min before close (options decay fast)
const CUTOFF_NEW_TRADES = { h: 14, m: 50 };

// ── Bootstrap ────────────────────────────────────────────────────────────────
if (!API_KEY || !ACCESS_TOKEN) {
  logger.error("KITE_API_KEY or KITE_ACCESS_TOKEN missing from .env");
  logger.error("Run: node src/auth.js  to generate today's access token");
  process.exit(1);
}

const kite = new KiteConnect({ api_key: API_KEY });
kite.setAccessToken(ACCESS_TOKEN);

const tradeManager = new TradeManager(kite);
let instruments = null;

// ── Helpers ──────────────────────────────────────────────────────────────────
function nowIST() {
  // Returns current time in IST (UTC+5:30)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + istOffset);
}

function isMarketOpen() {
  const t = nowIST();
  const h = t.getUTCHours();
  const m = t.getUTCMinutes();
  const totalMin = h * 60 + m;
  const openMin = MARKET_OPEN.h * 60 + MARKET_OPEN.m;
  const closeMin = MARKET_CLOSE.h * 60 + MARKET_CLOSE.m;
  return totalMin >= openMin && totalMin <= closeMin;
}

function isPastCutoff() {
  const t = nowIST();
  const h = t.getUTCHours();
  const m = t.getUTCMinutes();
  return h > CUTOFF_NEW_TRADES.h || (h === CUTOFF_NEW_TRADES.h && m >= CUTOFF_NEW_TRADES.m);
}

function isEOD() {
  const t = nowIST();
  const h = t.getUTCHours();
  const m = t.getUTCMinutes();
  const totalMin = h * 60 + m;
  const closeMin = MARKET_CLOSE.h * 60 + MARKET_CLOSE.m;
  return totalMin >= closeMin;
}

async function getIndexLTP(indexName) {
  // NSE indices use NFO for options, but LTP from NSE
  const symbolMap = {
    NIFTY: "NSE:NIFTY 50",
    SENSEX: "BSE:SENSEX",
  };
  const key = symbolMap[indexName];
  const quote = await kite.getLTP([key]);
  return quote[key]?.last_price || null;
}

// ── Core scan loop ────────────────────────────────────────────────────────────
async function scanAndTrade() {
  if (!isMarketOpen()) {
    logger.info("Market closed. Waiting...");
    return;
  }

  if (isEOD()) {
    logger.info("EOD reached — squaring off all open positions...");
    await tradeManager.exitAllTrades("EOD");
    return;
  }

  // Always monitor existing positions first
  await tradeManager.monitorAndExit();

  // Don't open new trades after cutoff
  if (isPastCutoff()) {
    logger.info("Past new-trade cutoff. Only monitoring existing positions.");
    return;
  }

  // Check slot availability
  const slotsAvailable = MAX_TRADES - tradeManager.activeTrades;
  if (slotsAvailable <= 0) {
    logger.info(`All ${MAX_TRADES} trade slots occupied. Monitoring only.`);
    return;
  }

  // Load instruments if not cached
  if (!instruments) {
    instruments = await loadInstruments(kite);
  }

  // Determine which indices to trade
  const indices = TRADE_INDEX === "BOTH" ? ["NIFTY", "SENSEX"] : [TRADE_INDEX];

  for (const indexName of indices) {
    if (tradeManager.activeTrades >= MAX_TRADES) break;

    try {
      const currentPrice = await getIndexLTP(indexName);
      if (!currentPrice) {
        logger.warn(`Could not fetch LTP for ${indexName}`);
        continue;
      }

      logger.info(`${indexName} LTP: ₹${currentPrice}`);

      const otmStrikes = findOTMCallStrikes(instruments, indexName, currentPrice, STRIKES_OTM);

      if (otmStrikes.length === 0) {
        logger.warn(`No OTM strikes found for ${indexName}`);
        continue;
      }

      // Pick the first available strike (lowest OTM = better liquidity)
      for (const strike of otmStrikes) {
        if (tradeManager.activeTrades >= MAX_TRADES) break;

        // Don't enter same symbol twice
        const alreadyTrading = [...tradeManager.openTrades.values()].some(
          (t) => t.tradingsymbol === strike.tradingsymbol
        );
        if (alreadyTrading) continue;

        logger.info(`Signal: ${strike.tradingsymbol} (${indexName} ${strike.strike}CE, expiry ${strike.expiry})`);
        await tradeManager.enterTrade(strike, CAPITAL_PER_TRADE);

        // Small delay between entries to avoid rate limits
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch (err) {
      logger.error(`Error processing ${indexName}: ${err.message}`);
    }
  }
}

// ── Startup ───────────────────────────────────────────────────────────────────
async function main() {
  logger.info("=".repeat(60));
  logger.info(`Kite OTM Scalper starting | Mode: ${LIVE ? "LIVE" : "PAPER"}`);
  logger.info(`Config: MAX_TRADES=${MAX_TRADES} | CAPITAL_PER_TRADE=₹${CAPITAL_PER_TRADE}`);
  logger.info(`Target: +${process.env.PROFIT_TARGET_PCT}% | Stop: -${process.env.STOP_LOSS_PCT}%`);
  logger.info(`Indices: ${TRADE_INDEX} | Strikes OTM: ${STRIKES_OTM}`);
  logger.info("=".repeat(60));

  // Verify connection
  try {
    const profile = await kite.getProfile();
    logger.info(`Connected as: ${profile.user_name} (${profile.user_id})`);
  } catch (err) {
    logger.error(`Connection failed: ${err.message}`);
    logger.error("Check your access token — run: node src/auth.js");
    process.exit(1);
  }

  if (!LIVE) {
    logger.info("*** PAPER TRADING MODE — No real orders will be placed ***");
  }

  // Run immediately on start, then every 60 seconds
  await scanAndTrade();

  const job = new CronJob("*/60 * * * * *", async () => {
    try {
      await scanAndTrade();
    } catch (err) {
      logger.error(`Unhandled error in scan loop: ${err.message}`);
    }
  });

  job.start();
  logger.info("Scheduler started. Scanning every 60 seconds.");

  // Graceful shutdown
  process.on("SIGINT", async () => {
    logger.info("Shutting down — squaring off all open positions...");
    await tradeManager.exitAllTrades("SHUTDOWN");
    logger.info("All positions closed. Bye.");
    process.exit(0);
  });
}

main().catch((err) => {
  logger.error(`Fatal: ${err.message}`);
  process.exit(1);
});
