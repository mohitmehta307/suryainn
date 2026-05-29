/**
 * Quick connectivity test — run before starting the bot.
 * node src/test-connection.js
 */

require("dotenv").config({ path: __dirname + "/../.env" });
const { KiteConnect } = require("kiteconnect");
const logger = require("./logger");

async function test() {
  const kite = new KiteConnect({ api_key: process.env.KITE_API_KEY });
  kite.setAccessToken(process.env.KITE_ACCESS_TOKEN);

  try {
    const profile = await kite.getProfile();
    logger.info(`Connected: ${profile.user_name} | ${profile.email}`);

    const niftyLTP = await kite.getLTP(["NSE:NIFTY 50"]);
    logger.info(`NIFTY 50 LTP: ₹${niftyLTP["NSE:NIFTY 50"].last_price}`);

    const sensexLTP = await kite.getLTP(["BSE:SENSEX"]);
    logger.info(`SENSEX LTP: ₹${sensexLTP["BSE:SENSEX"].last_price}`);

    logger.info("All checks passed. You are ready to start the bot.");
  } catch (err) {
    logger.error(`Test failed: ${err.message}`);
  }
}

test();
