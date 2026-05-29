/**
 * Fetches and caches the instruments list. Also resolves option strikes.
 */

const fs = require("fs");
const path = require("path");
const logger = require("./logger");

const CACHE_FILE = path.join(__dirname, "../data/instruments_cache.json");
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// Exchange segment for index options
const EXCHANGE = { NIFTY: "NFO", SENSEX: "BFO" };
const UNDERLYING = { NIFTY: "NIFTY", SENSEX: "SENSEX" };

let _cache = null;

async function loadInstruments(kite) {
  const now = Date.now();

  if (_cache && now - _cache.ts < CACHE_TTL_MS) {
    return _cache.data;
  }

  if (fs.existsSync(CACHE_FILE)) {
    const cached = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
    if (now - cached.ts < CACHE_TTL_MS) {
      _cache = cached;
      return cached.data;
    }
  }

  logger.info("Fetching fresh instruments list from Kite...");
  const nfoInstruments = await kite.getInstruments("NFO");
  const bfoInstruments = await kite.getInstruments("BFO");
  const data = { NFO: nfoInstruments, BFO: bfoInstruments };

  _cache = { ts: now, data };
  fs.writeFileSync(CACHE_FILE, JSON.stringify(_cache));
  logger.info(`Loaded ${nfoInstruments.length} NFO + ${bfoInstruments.length} BFO instruments`);
  return data;
}

/**
 * Find the nearest weekly expiry option strikes for the given index.
 * Returns array of instrument objects for CE options at 2-3 strikes OTM.
 */
function findOTMCallStrikes(instruments, indexName, currentPrice, strikeCount = 2) {
  const exchange = EXCHANGE[indexName];
  const underlying = UNDERLYING[indexName];
  const instrumentList = instruments[exchange];

  const today = new Date();

  // Filter CE options for this underlying expiring in the next ~14 days
  const ceOptions = instrumentList.filter((inst) => {
    if (inst.instrument_type !== "CE") return false;
    if (!inst.tradingsymbol.startsWith(underlying)) return false;
    const expiry = new Date(inst.expiry);
    const daysToExpiry = (expiry - today) / (1000 * 60 * 60 * 24);
    return daysToExpiry >= 0 && daysToExpiry <= 14;
  });

  if (ceOptions.length === 0) {
    logger.warn(`No CE options found for ${indexName}`);
    return [];
  }

  // Find nearest weekly expiry
  const expiryDates = [...new Set(ceOptions.map((o) => o.expiry))].sort();
  const nearestExpiry = expiryDates[0];

  // Get strikes for nearest expiry
  const thisWeekOptions = ceOptions.filter((o) => o.expiry === nearestExpiry);

  // Determine strike step (NIFTY=50, SENSEX=100)
  const strikeStep = indexName === "NIFTY" ? 50 : 100;

  // Round current price up to nearest strike
  const atmStrike = Math.ceil(currentPrice / strikeStep) * strikeStep;

  // Pick 2 and 3 strikes OTM
  const targetStrikes = [
    atmStrike + strikeStep * strikeCount,
    atmStrike + strikeStep * (strikeCount + 1),
  ];

  const selectedOptions = thisWeekOptions
    .filter((o) => targetStrikes.includes(o.strike))
    .sort((a, b) => a.strike - b.strike);

  if (selectedOptions.length === 0) {
    logger.warn(
      `No matching strikes found for ${indexName} @ ${currentPrice}. ATM=${atmStrike}, targets=${targetStrikes}`
    );
  }

  return selectedOptions;
}

module.exports = { loadInstruments, findOTMCallStrikes };
