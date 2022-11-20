require('dotenv').config({ path: '/home/server/.env' });
const fetch = require('node-fetch');
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function main() {
  await updateInfluencerWalletActivities();
}

const updateInfluencerWalletActivities = async () => {
  const influencerWallets = await getInfluencerWallets();

  for (influencerWallet of influencerWallets) {
    const { address, twitter_username } = influencerWallet;
    console.log(address);
    const walletActivities = await getWalletActivities(address);
    // console.log(walletActivities);

    if (walletActivities.length === 0) {
      continue;
    }

    for (walletActivity of walletActivities) {
      const {
        signature,
        type,
        source,
        tokenMint,
        collection,
        collectionSymbol,
        slot,
        blockTime,
        buyer,
        buyerReferral,
        seller,
        sellerReferral,
        price,
      } = walletActivity;

      const activityFound = await activityExist(signature);
      if (activityFound) {
        break;
      }

      const query = {
        text: 'INSERT INTO influencer_wallet_activity(signature, twitter_username, type, source, token_mint, collection, collection_symbol, slot, blocktime, buyer, buyer_referral, seller, seller_referral, price) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) ON CONFLICT (signature) DO NOTHING',
        values: [signature, twitter_username, type, source, tokenMint, collection, collectionSymbol, slot, blockTime, buyer, buyerReferral, seller, sellerReferral, price],
      }

      pool.query(query, (error, results) => {
        if (error) {
          console.log(error);
        }
      });
      await new Promise(f => setTimeout(f, 100));
    }
  }
}

const getInfluencerWallets = async () => {
  try {
    const { rows } = await pool.query(`
      SELECT address, twitter_username
      FROM influencer_wallet
      WHERE twitter_username IN (
        SELECT twitter_username FROM influencer
      )
    `);

    return rows;
  } catch (error) {
    console.log(error);
  }
}

const getWalletActivities = async (address) => {
  let offset = 0;
  let activityFound = false;
  let walletActivities = [];

  try {
    while (!activityFound) {
      const response = await fetch(`https://api-mainnet.magiceden.dev/v2/wallets/${address}/activities?offset=${offset}&limit=500`, {
        method: 'get',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.MAGICEDEN_API_KEY}`,
        },
      });
      const activities = await response.json();

      if (activities.length === 0) {
        break;
      }

      walletActivities = [...activities, ...walletActivities];
      offset += 500;
      activityFound = await activityExist(activities[activities.length - 1]?.signature);
      await new Promise(f => setTimeout(f, 100));
    }

    return walletActivities;
  } catch (err) {
    console.log(err);
  }
}

const activityExist = async (signature) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM influencer_wallet_activity WHERE signature = '${signature}'`);

    if (rows.length) {
      return true;
    }

    return false;
  } catch (error) {
    console.log(error);
  }
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);