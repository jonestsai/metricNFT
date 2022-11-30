require('dotenv').config();
const cors = require('cors');
const express = require('express');
const moment = require('moment');
const fetch = require('node-fetch');
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
    origin: ['https://www.metricnft.com', 'http://198.199.117.248:3000', 'http://localhost:3000'],
}));
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies

app.get('/api/magiceden', async (req, res) => {
  let leftJoins = '';

  pool.query(`
    SELECT * FROM home
    WHERE chain = 'solana' AND datetime::date > '${moment().subtract(2, 'days').format('YYYY-MM-DD')}'
    ORDER BY floor_market_cap DESC
    LIMIT 300`, (error, results) => {
    if (error) {
      throw error;
    }
    res.status(200).json(results.rows);
  });
});

app.get('/api/opensea', async (req, res) => {
  let leftJoins = '';

  pool.query(`
    SELECT * FROM home
    WHERE chain = 'ethereum' AND datetime::date > '${moment().subtract(2, 'days').format('YYYY-MM-DD')}'
    ORDER BY floor_market_cap DESC
    LIMIT 300`, (error, results) => {
    if (error) {
      throw error;
    }
    res.status(200).json(results.rows);
  });
});

app.get('/api/collection/:slug', async (req, res) => {
  const { slug } = req.params;

  const chain = await getCollectionChain(slug);

  if (chain === 'solana') {
    pool.query(`
      SELECT DISTINCT ON (magiceden_snapshot.start_time::date) magiceden_snapshot.start_time::date, '${chain}' AS chain, name, description, image, floor_price, listed_count, howrare_holders, howrare_url, unique_holders, total_supply, one_day_volume, volume_all
      FROM magiceden_snapshot
      LEFT JOIN (
        SELECT symbol, name, description, image
        FROM magiceden_collection
      ) _magiceden_collection
      ON magiceden_snapshot.symbol = _magiceden_collection.symbol
      LEFT JOIN (
        SELECT DISTINCT ON (howrare_snapshot.start_time::date) howrare_snapshot.start_time::date, holders AS howrare_holders, url AS howrare_url
        FROM howrare_snapshot
        JOIN (
          SELECT name, magiceden_symbol, url
          FROM howrare_collection
        ) _howrare_collection
        ON howrare_snapshot.name = _howrare_collection.name
        WHERE magiceden_symbol = '${slug}' AND start_time > (NOW() - interval '360 days') AND start_time < NOW()
        ORDER BY howrare_snapshot.start_time::date
      ) _howrare_snapshot
      ON magiceden_snapshot.start_time::date = _howrare_snapshot.start_time::date
      WHERE magiceden_snapshot.symbol = '${slug}' AND magiceden_snapshot.start_time > (NOW() - interval '360 days') AND magiceden_snapshot.start_time < NOW()
      ORDER BY magiceden_snapshot.start_time::date`, (error, results) => {
      if (error) {
        console.log(error);
        throw error;
      }
      res.status(200).json(results.rows);
    });
  } else {
    pool.query(`
      SELECT DISTINCT ON (opensea_snapshot.start_time::date) opensea_snapshot.start_time::date, '${chain}' AS chain, name, description, image_url AS image, floor_price, listed_count, num_owners, total_supply, one_day_volume, total_volume AS volume_all
      FROM opensea_snapshot
      LEFT JOIN (
        SELECT slug, name, description, image_url
        FROM opensea_collection
      ) _opensea_collection
      ON opensea_snapshot.slug = _opensea_collection.slug
      WHERE opensea_snapshot.slug = '${slug}' AND opensea_snapshot.start_time > (NOW() - interval '360 days') AND opensea_snapshot.start_time < NOW()
      ORDER BY opensea_snapshot.start_time::date`, (error, results) => {
      if (error) {
        console.log(error);
        throw error;
      }
      res.status(200).json(results.rows);
    });
  }
});

app.get('/api/collection/:slug/chart/:resolution', async (req, res) => {
  const puppeteer = require('puppeteer-extra');
  const StealthPlugin = require('puppeteer-extra-plugin-stealth');
  const userAgent = require('user-agents');
  puppeteer.use(StealthPlugin());

  const { slug, resolution } = req.params;

  const chain = await getCollectionChain(slug);

  if (chain === 'solana') {
    const browser = await puppeteer.launch({args: ['--no-zygote', '--no-sandbox']});
    try {
      const [page] = await browser.pages();
      await page.setUserAgent(userAgent.toString());
      await page.goto(`https://stats-mainnet.magiceden.io/collection_stats/getCollectionTimeSeries/${slug}?edge_cache=true&resolution=${resolution}&addLastDatum=true`, { waitUntil: 'networkidle0' });
      const data = await page.$eval('pre', (element) => element.textContent);

      res.status(200).json(JSON.parse(data));
    } catch (error) {
      console.log(error);
    } finally {
      await browser.close();
    }
  }
});

const getCollectionChain = async (slug) => {
  const { rows } = await pool.query(`SELECT symbol FROM magiceden_collection WHERE symbol = '${slug}'`);

  if (rows.length > 0) {
    return 'solana';
  }

  return 'ethereum';
}

app.get('/api/collection/search/:query', async (req, res) => {
  const { query } = req.params;

  pool.query(`SELECT symbol, name FROM magiceden_collection WHERE REPLACE(name, ' ', '') ILIKE REPLACE('%${query}%', ' ', '')`, (error, results) => {
    if (error) {
      console.log(error);
      throw error;
    }
    res.status(200).json(results.rows);
  });
});

app.get('/api/users/watchlist', async (req, res) => {
  const { symbol } = req.query;
  const symbols = symbol.toString();
  const magicedenWatchlist = await getMagicedenWatchlist(symbols);
  const openseaWatchlist = await getOpenseaWatchlist(symbols);
  const watchlist = magicedenWatchlist?.concat(openseaWatchlist);
  
  res.status(200).json(watchlist);
});

const getMagicedenWatchlist = async (symbols) => {
  const { rows } = await pool.query(`
    SELECT DISTINCT ON (magiceden_snapshot.start_time::date, magiceden_snapshot.symbol) magiceden_snapshot.start_time::date, 'solana' as chain, *
    FROM magiceden_snapshot
    LEFT JOIN (
      SELECT name, symbol, image
      FROM magiceden_collection
    ) _magiceden_collection
    ON magiceden_snapshot.symbol = _magiceden_collection.symbol
    LEFT JOIN (
      SELECT DISTINCT ON (howrare_snapshot.start_time::date, magiceden_symbol) howrare_snapshot.start_time::date, holders AS howrare_holders, magiceden_symbol
      FROM howrare_snapshot
      JOIN (
        SELECT name, magiceden_symbol
        FROM howrare_collection
      ) _howrare_collection
      ON howrare_snapshot.name = _howrare_collection.name
      WHERE magiceden_symbol IN (${symbols}) AND start_time > (NOW() - interval '30 days') AND start_time < NOW()
      ORDER BY howrare_snapshot.start_time::date
    ) _howrare_snapshot
    ON magiceden_snapshot.start_time::date = _howrare_snapshot.start_time::date AND magiceden_snapshot.symbol = magiceden_symbol
    LEFT JOIN (
      SELECT DISTINCT ON (start_time::date, symbol) start_time::date,
        volume_all - LAG(volume_all) OVER (ORDER BY symbol, start_time) AS _24hvolume, symbol
      FROM magiceden_snapshot
      WHERE symbol IN (${symbols})
      ORDER BY start_time::date
    ) _24hvolume
    ON magiceden_snapshot.start_time::date = _24hvolume.start_time::date AND magiceden_snapshot.symbol = _24hvolume.symbol
    WHERE magiceden_snapshot.symbol IN (${symbols}) AND magiceden_snapshot.start_time > (NOW() - interval '30 days') AND magiceden_snapshot.start_time < NOW()
    ORDER BY magiceden_snapshot.symbol, magiceden_snapshot.start_time::date`);

  return rows;
}

const getOpenseaWatchlist = async (slugs) => {
  const { rows } = await pool.query(`
    SELECT DISTINCT ON (opensea_snapshot.start_time::date, opensea_snapshot.slug) opensea_snapshot.start_time::date, 'ethereum' as chain, *
    FROM opensea_snapshot
    LEFT JOIN (
      SELECT name, slug, image_url
      FROM opensea_collection
    ) _opensea_collection
    ON opensea_snapshot.slug = _opensea_collection.slug
    WHERE opensea_snapshot.slug IN (${slugs}) AND opensea_snapshot.start_time > (NOW() - interval '30 days') AND opensea_snapshot.start_time < NOW()
    ORDER BY opensea_snapshot.slug, opensea_snapshot.start_time::date`);

  return rows;
}

app.get('/api/influencers', async (req, res) => {
  pool.query('SELECT * FROM influencer ORDER BY portfolio_value DESC', (error, results) => {
    if (error) {
      throw error;
    }
    res.status(200).json(results.rows);
  });
});

app.get('/api/influencers/:username', async (req, res) => {
  const { username } = req.params;
  const [influencer] = await getInfluencer(username);
  const viewableWallets = await getViewableWallets(username);
  const wallets = await getWallets(username);
  const activities = await getActivities(username);
  
  res.status(200).json({ ...influencer, viewableWallets, wallets, activities });
});

const getInfluencer = async (username) => {
  const { rows } = await pool.query(`
    SELECT * FROM influencer
    WHERE twitter_username = '${username}'
  `);

  return rows;
}

const getViewableWallets = async (username) => {
  const { rows } = await pool.query(`
    SELECT * FROM influencer
    JOIN influencer_wallet
    ON influencer.twitter_username = influencer_wallet.twitter_username
    WHERE influencer_wallet.twitter_username = '${username}' AND influencer_wallet.view IS NOT NULL
  `);

  return rows;
}

const getWallets = async (username) => {
  const { rows } = await pool.query(`
    SELECT * FROM influencer
    JOIN influencer_wallet
    ON influencer.twitter_username = influencer_wallet.twitter_username
    WHERE influencer_wallet.twitter_username = '${username}'
  `);

  return rows;
}

const getActivities = async (username) => {
  const { rows } = await pool.query(`
    SELECT * FROM influencer_wallet_activity
    WHERE twitter_username = '${username}'
    ORDER BY blocktime DESC
    LIMIT 100
  `);

  return rows;
}

app.get('/api/users/:walletAddress', (req, res) => {
  const { walletAddress } = req.params;
  pool.query(`SELECT * FROM users
    JOIN notification
    ON users.wallet_address = notification.wallet_address
    WHERE users.wallet_address = '${walletAddress}' AND notification.deleted_at IS NULL`, (error, results) => {
    if (error) {
      console.log(error);
      throw error;
    }
    res.status(200).json(results.rows);
  });
});

app.post('/api/users/create', (req, res) => {
  const { wallet_address, email, phone, discord, twitter } = req.body;
  const query = {
    text: 'INSERT INTO users(wallet_address, email, phone, discord, twitter, last_ip, created_at, updated_at, unsubscribed_at, banned_at) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (wallet_address) DO UPDATE SET email = $11, updated_at = $12',
    values: [wallet_address, email, phone, discord, twitter, null, new Date(), new Date(), null, null, email, new Date()],
  };
  pool.query(query, (error, results) => {
    if (error) {
      console.log(error);
      throw error;
    }
    res.status(200).json(results);
  });
});

app.post('/api/users/notification', (req, res) => {
  const { wallet_address, symbol, name, image, sign, price } = req.body;
  const query = {
    text: 'INSERT INTO notification(wallet_address, collection_symbol, collection_name, collection_image, sign, price, created_at, sent_at) VALUES($1, $2, $3, $4, $5, $6, $7, $8)',
    values: [wallet_address, symbol, name, image, sign, price, new Date(), null],
  };
  pool.query(query, (error, results) => {
    if (error) {
      console.log(error);
      throw error;
    }
    res.status(200).json(results);
  });
});

app.post('/api/users/notification/delete', (req, res) => {
  const { id } = req.body;
  const query = {
    text: 'UPDATE notification SET deleted_at = $1 WHERE id = $2',
    values: [new Date(), id],
  };
  pool.query(query, (error, results) => {
    if (error) {
      console.log(error);
      throw error;
    }
    res.status(200).json(results);
  });
});

app.get('/api/magiceden/wallets/:walletAddress/tokens', async (req, res) => {
  const { walletAddress } = req.params;
  const { offset, limit, listStatus } = req.query;

  try {
    const response = await fetch(`https://api-mainnet.magiceden.dev/v2/wallets/${walletAddress}/tokens?offset=${offset}&limit=${limit}&listStatus=${listStatus}`);
    const tokens = await response.json();
    res.status(200).json(tokens);
  } catch (err) {
    console.log(err);
  }
});

app.get('/api/magiceden/wallets/:walletAddress/activities', async (req, res) => {
  const { walletAddress } = req.params;
  const { offset, limit } = req.query;

  try {
    const response = await fetch(`https://api-mainnet.magiceden.dev/v2/wallets/${walletAddress}/activities?offset=${offset}&limit=${limit}`);
    const activities = await response.json();
    res.status(200).json(activities);
  } catch (err) {
    console.log(err);
  }
});

app.get('/api/magiceden/collections', (req, res) => {
  pool.query(`SELECT symbol, name FROM magiceden_collection`, (error, results) => {
    if (error) {
      console.log(error);
      throw error;
    }
    res.status(200).json(results.rows);
  });
});

// Store collections from Magic Eden API
app.get('/api/magiceden/collections/store', async (req, res) => {
  const { offset, limit } = req.query;

  try {
    const response = await fetch(`https://api-mainnet.magiceden.dev/v2/collections?offset=${offset}&limit=${limit}`);
    const collections = await response.json();

    for (collection of collections) {
      const { symbol, name, description, image, twitter, discord, website, isFlagged, flagMessage, categories } = collection;
      console.log(symbol);
      const query = {
        text: 'INSERT INTO magiceden_collection(symbol, name, description, image, twitter, discord, website, isFlagged, flagMessage, categories) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (symbol) DO NOTHING',
        values: [symbol, name, description, image, twitter, discord, website, isFlagged, flagMessage, categories],
      };
      pool.query(query, (error, results) => {
        if (error) {
          console.log(error);
        }
      });
      await new Promise(f => setTimeout(f, 500));
    }
    res.status(200).json(results);
  } catch (err) {
    console.log(err);
  }
});

app.get('/api/opensea/collections', (req, res) => {
  pool.query(`SELECT * FROM opensea_collection`, (error, results) => {
    if (error) {
      console.log(error);
      throw error;
    }
    res.status(200).json(results.rows);
  });
});

app.get('/api/hyperspace/get-wallet-stats/:address', async (req, res) => {
  const { address } = req.params;

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
    res.status(200).json(stats);
  } catch (err) {
    console.log(err);
  }
});

app.get('/api/howrare/collections/:collection/owners', async (req, res) => {
  const { collection } = req.params;

  try {
    const response = await fetch(`https://api.howrare.is/v0.1/collections/${collection}/owners`);
    const { result: { data: { owners } } } = await response.json();
    res.status(200).json(owners);
  } catch (err) {
    console.log(err);
  }
});

app.get('/api/user', (req, res) => {
  res.json({ message: 'Looks good to me!!!' });
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});

app.get('/api/dev/magiceden', async (req, res) => {
  let leftJoins = '';

  pool.query(`
    SELECT * FROM home
    WHERE chain = 'solana' AND datetime::date > '${moment().subtract(2, 'days').format('YYYY-MM-DD')}'
    ORDER BY floor_market_cap DESC
    LIMIT 1000`, (error, results) => {
    if (error) {
      throw error;
    }
    res.status(200).json(results.rows);
  });
});

app.get('/api/dev/opensea', async (req, res) => {
  let leftJoins = '';

  pool.query(`
    SELECT * FROM home
    WHERE chain = 'ethereum' AND datetime::date > '${moment().subtract(2, 'days').format('YYYY-MM-DD')}'
    ORDER BY floor_market_cap DESC
    LIMIT 1000`, (error, results) => {
    if (error) {
      throw error;
    }
    res.status(200).json(results.rows);
  });
});

app.get('/api/dev/:slug', async (req, res) => {
  const { slug } = req.params;

  const chain = await getCollectionChain(slug);

  if (chain === 'solana') {
    pool.query(`
      SELECT DISTINCT ON (magiceden_snapshot.start_time::date) magiceden_snapshot.start_time::date, '${chain}' AS chain, name, description, image, floor_price, listed_count, howrare_holders, howrare_url, unique_holders, total_supply, one_day_volume, volume_all
      FROM magiceden_snapshot
      LEFT JOIN (
        SELECT symbol, name, description, image
        FROM magiceden_collection
      ) _magiceden_collection
      ON magiceden_snapshot.symbol = _magiceden_collection.symbol
      LEFT JOIN (
        SELECT DISTINCT ON (howrare_snapshot.start_time::date) howrare_snapshot.start_time::date, holders AS howrare_holders, url AS howrare_url
        FROM howrare_snapshot
        JOIN (
          SELECT name, magiceden_symbol, url
          FROM howrare_collection
        ) _howrare_collection
        ON howrare_snapshot.name = _howrare_collection.name
        WHERE magiceden_symbol = '${slug}' AND start_time > (NOW() - interval '30 days') AND start_time < NOW()
        ORDER BY howrare_snapshot.start_time::date
      ) _howrare_snapshot
      ON magiceden_snapshot.start_time::date = _howrare_snapshot.start_time::date
      LEFT JOIN (
        SELECT DISTINCT ON (start_time::date) start_time::date,
          volume_all - LAG(volume_all) OVER (ORDER BY start_time) AS _24hvolume
        FROM magiceden_snapshot
        WHERE symbol = '${slug}'
        ORDER BY start_time::date
      ) _24hvolume
      ON magiceden_snapshot.start_time::date = _24hvolume.start_time::date
      WHERE magiceden_snapshot.symbol = '${slug}' AND magiceden_snapshot.start_time > (NOW() - interval '30 days') AND magiceden_snapshot.start_time < NOW()
      ORDER BY magiceden_snapshot.start_time::date`, (error, results) => {
      if (error) {
        console.log(error);
        throw error;
      }
      res.status(200).json(results.rows);
    });
  } else {
    pool.query(`
      SELECT DISTINCT ON (opensea_snapshot.start_time::date) opensea_snapshot.start_time::date, '${chain}' AS chain, name, description, image_url AS image, floor_price, listed_count, num_owners, total_supply, one_day_volume, total_volume AS volume_all
      FROM opensea_snapshot
      LEFT JOIN (
        SELECT slug, name, description, image_url
        FROM opensea_collection
      ) _opensea_collection
      ON opensea_snapshot.slug = _opensea_collection.slug
      WHERE opensea_snapshot.slug = '${slug}' AND opensea_snapshot.start_time > (NOW() - interval '30 days') AND opensea_snapshot.start_time < NOW()
      ORDER BY opensea_snapshot.start_time::date`, (error, results) => {
      if (error) {
        console.log(error);
        throw error;
      }
      res.status(200).json(results.rows);
    });
  }
});
