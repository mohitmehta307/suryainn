/**
 * Daily auth flow: generates access token from request token.
 * Run this script once each morning before starting the bot.
 * Usage: node src/auth.js <request_token>
 *
 * Get request_token by visiting:
 * https://kite.zerodha.com/connect/login?api_key=YOUR_API_KEY&v=3
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { KiteConnect } = require("kiteconnect");
const fs = require("fs");
const path = require("path");

const apiKey = process.env.KITE_API_KEY;
const apiSecret = process.env.KITE_API_SECRET;
const requestToken = process.argv[2];

if (!apiKey || !apiSecret) {
  console.error("Missing KITE_API_KEY or KITE_API_SECRET in .env");
  process.exit(1);
}

if (!requestToken) {
  const loginUrl = `https://kite.zerodha.com/connect/login?api_key=${apiKey}&v=3`;
  console.log("\nStep 1: Visit this URL in your browser:");
  console.log(loginUrl);
  console.log("\nStep 2: After login, copy the request_token from the redirect URL");
  console.log("Step 3: Run: node src/auth.js <request_token>\n");
  process.exit(0);
}

async function generateToken() {
  const kite = new KiteConnect({ api_key: apiKey });

  try {
    const session = await kite.generateSession(requestToken, apiSecret);
    const accessToken = session.access_token;

    // Write access token back to .env
    const envPath = path.join(__dirname, "../.env");
    let envContent = fs.existsSync(envPath)
      ? fs.readFileSync(envPath, "utf8")
      : fs.readFileSync(path.join(__dirname, "../.env.example"), "utf8");

    if (envContent.includes("KITE_ACCESS_TOKEN=")) {
      envContent = envContent.replace(
        /KITE_ACCESS_TOKEN=.*/,
        `KITE_ACCESS_TOKEN=${accessToken}`
      );
    } else {
      envContent += `\nKITE_ACCESS_TOKEN=${accessToken}`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log("Access token saved to .env");
    console.log(`Token: ${accessToken.substring(0, 10)}...`);
    console.log("\nYou can now start the bot: npm start");
  } catch (err) {
    console.error("Failed to generate session:", err.message);
    process.exit(1);
  }
}

generateToken();
