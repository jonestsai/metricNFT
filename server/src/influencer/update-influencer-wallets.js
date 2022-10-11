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
  await updateInfluencerWallets();
}

const updateInfluencerWallets = async () => {
  const influencerWallets = await getInfluencerWallets();

  for (influencerWallet of influencerWallets) {
    const { address } = influencerWallet;
    console.log(address);
    const walletStats = await getWalletStats(address);
    // console.log(walletStats);

    if (!walletStats) {
      continue;
    }

    const {
      listed_nfts,
      owned_nfts,
      portfolio_value,
      sol_name,twitter,
      num_sold_1day,
      volume_sold_1day,
      num_bought_1day,
      volume_bought_1day,
      num_bids_1day,
      bids_made_amount_1day,
      max_purchase_1day,
      max_sale_1day,
      num_minted_1day,
      minted_amount_1day,
      wallet_score_1day,
      max_purchase_item_1day,
      max_sale_item_1day,
      num_sold,
      volume_sold,
      num_bought,
      volume_bought,
      num_bids,
      bids_made_amount,
      max_purchase,
      max_sale,
      num_minted,
      minted_amount,
      wallet_score,
      max_purchase_item,
      max_sale_item,
      rank,
    } = walletStats;

    const query = {
      text: 'UPDATE influencer_wallet SET listed_nfts = $1, owned_nfts = $2, portfolio_value = $3, sol_name = $4, twitter = $5, num_sold_1day = $6, volume_sold_1day = $7, num_bought_1day = $8, volume_bought_1day = $9, num_bids_1day = $10, bids_made_amount_1day = $11, max_purchase_1day = $12, max_sale_1day = $13, num_minted_1day = $14, minted_amount_1day = $15, wallet_score_1day = $16, max_purchase_item_1day = $17, max_sale_item_1day = $18, num_sold = $19, volume_sold = $20, num_bought = $21, volume_bought = $22, num_bids = $23, bids_made_amount = $24, max_purchase = $25, max_sale = $26, num_minted = $27, minted_amount = $28, wallet_score = $29, max_purchase_item = $30, max_sale_item = $31, rank = $32 WHERE address = $33',
      values: [listed_nfts, owned_nfts, portfolio_value, sol_name, twitter, num_sold_1day, volume_sold_1day, num_bought_1day, volume_bought_1day, num_bids_1day, bids_made_amount_1day, max_purchase_1day, max_sale_1day, num_minted_1day, minted_amount_1day, wallet_score_1day, max_purchase_item_1day, max_sale_item_1day, num_sold, volume_sold, num_bought, volume_bought, num_bids, bids_made_amount, max_purchase, max_sale, num_minted, minted_amount, wallet_score, max_purchase_item, max_sale_item, rank, address],
    }

    console.log(query);
    pool.query(query, (error, results) => {
      if (error) {
        console.log(error);
      }
    });
    await new Promise(f => setTimeout(f, 100));
  }
}

const getInfluencerWallets = async () => {
  try {
    const { rows } = await pool.query('SELECT address FROM influencer_wallet');

    return rows;
  } catch (error) {
    console.log(error);
  }
}

const getWalletStats = async (address) => {
  try {
    const response = await fetch('https://beta.api.solanalysis.com/rest/get-wallet-stats', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: process.env.HYPERSPACE_API_KEY,
      },
      body: JSON.stringify({
        condition: {
          time_period: 'ALL',
          search_address: address,
          include_user_rank: true,
        }
      }),
    });
    const { wallet_stats } = await response.json();
    const [stats] = wallet_stats;

    return stats;
  } catch (error) {
    console.log(error);
    return null;
  }
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);