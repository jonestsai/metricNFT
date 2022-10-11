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
  await updateInfluencers();
}

const updateInfluencers = async () => {
  const influencers = await getInfluencers();

  for (influencer of influencers) {
    const { twitter_username } = influencer;
    console.log(twitter_username);
    const influencerWallets = await getInfluencerWallets(twitter_username);
    // console.log(influencerWallets);

    const {
      portfolio_value,
      listed_nfts,
      owned_nfts,
      num_sold,
      volume_sold,
      num_bought,
      volume_bought,
      max_purchase,
      max_sale,
      max_purchase_item,
      max_sale_item,
    } = influencerWallets;

    const query = {
      text: 'UPDATE influencer SET portfolio_value = $1, listed_nfts = $2, owned_nfts = $3, num_sold = $4, volume_sold = $5, num_bought = $6, volume_bought = $7, max_purchase = $8, max_sale = $9, max_purchase_item = $10, max_sale_item = $11 WHERE twitter_username = $12',
      values: [portfolio_value, listed_nfts, owned_nfts, num_sold, volume_sold, num_bought, volume_bought, max_purchase, max_sale, max_purchase_item, max_sale_item, twitter_username],
    }

    pool.query(query, (error, results) => {
      if (error) {
        console.log(error);
      }
    });
    await new Promise(f => setTimeout(f, 100));
  }
}

const getInfluencers = async () => {
  try {
    const { rows } = await pool.query('SELECT twitter_username FROM influencer');

    return rows;
  } catch (error) {
    console.log(error);
  }
}

const getInfluencerWallets = async (twitter_username) => {
  const combinedWalletStats = await getCombinedWalletStats(twitter_username);
  const maxPurchase = await getMaxPurchase(twitter_username);
  const maxSale = await getMaxSale(twitter_username);

  return {
    ...combinedWalletStats,
    ...maxPurchase,
    ...maxSale,
  }
}

const getCombinedWalletStats = async (twitter_username) => {
  try {
    const { rows } = await pool.query(`
      SELECT SUM (portfolio_value) AS portfolio_value,
        SUM (listed_nfts) AS listed_nfts,
        SUM (owned_nfts) AS owned_nfts,
        SUM (num_sold) AS num_sold,
        SUM (volume_sold) AS volume_sold,
        SUM (num_bought) AS num_bought,
        SUM (volume_bought) AS volume_bought,
        MAX (max_purchase) AS max_purchase,
        MAX (max_sale) AS max_sale
      FROM influencer_wallet
      WHERE twitter_username = '${twitter_username}'
    `);
    const [stats] = rows;

    return stats;
  } catch (error) {
    console.log(error);
  }
}

const getMaxPurchase = async (twitter_username) => {
  try {
    const { rows } = await pool.query(`
      SELECT max_purchase_item
      FROM influencer_wallet
      WHERE max_purchase = (
        SELECT MAX (max_purchase)
        FROM influencer_wallet
        WHERE twitter_username = '${twitter_username}'
      )
    `);
    const [maxPurchase] = rows;

    return maxPurchase;
  } catch (error) {
    console.log(error);
  }
}

const getMaxSale = async (twitter_username) => {
  try {
    const { rows } = await pool.query(`
      SELECT max_sale_item
      FROM influencer_wallet
      WHERE max_sale = (
        SELECT MAX (max_sale)
        FROM influencer_wallet
        WHERE twitter_username = '${twitter_username}'
      )
    `);
    const [maxSale] = rows;

    return maxSale;
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