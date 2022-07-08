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
    origin: ['https://www.metricnft.com', 'http://198.199.117.248:3000'],
}));
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies

app.get('/api', async (req, res) => {
  let leftJoins = '';

  pool.query(`
    SELECT * FROM (
      SELECT name, symbol, image
      FROM magiceden_collection
    ) _magiceden_collection
    LEFT JOIN (
      SELECT DISTINCT ON (symbol) *
      FROM magiceden_snapshot
      WHERE start_time::date > '${moment().subtract(2, 'days').format('YYYY-MM-DD')}'
      ORDER BY symbol, start_time DESC
    ) _magiceden_snapshot
    ON _magiceden_collection.symbol = _magiceden_snapshot.symbol
    LEFT JOIN (
      SELECT DISTINCT ON (symbol) symbol as hourly_snapshot_symbol, floor_price AS live_floor_price, one_day_price_change AS live_one_day_price_change, seven_day_price_change AS live_seven_day_price_change, listed_count AS live_listed_count, volume_all AS live_volume_all
      FROM magiceden_hourly_snapshot
      WHERE start_time > '${moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')}'
      ORDER BY symbol, start_time DESC
    ) _magiceden_hourly_snapshot
    ON _magiceden_collection.symbol = _magiceden_hourly_snapshot.hourly_snapshot_symbol`, (error, results) => {
    if (error) {
      throw error;
    }
    res.status(200).json(results.rows);
  });
});

app.get('/api/:slug', async (req, res) => {
  const { slug } = req.params;

  pool.query(`
    SELECT DISTINCT ON (magiceden_snapshot.start_time::date) magiceden_snapshot.start_time::date, *
      FROM magiceden_snapshot
    LEFT JOIN (
      SELECT DISTINCT ON (howrare_snapshot.start_time::date) howrare_snapshot.start_time::date, holders AS howrare_holders
      FROM howrare_snapshot
      JOIN (
        SELECT name, magiceden_symbol
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
});

app.get('/api/users/watchlist', async (req, res) => {
  const { symbol } = req.query;
  const symbols = symbol.toString();

  pool.query(`
    SELECT DISTINCT ON (magiceden_snapshot.start_time::date, magiceden_snapshot.symbol) magiceden_snapshot.start_time::date, *
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
    ORDER BY magiceden_snapshot.symbol, magiceden_snapshot.start_time::date`, (error, results) => {
    if (error) {
      console.log(error);
      throw error;
    }
    res.status(200).json(results.rows);
  });
});

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

app.get('/api/magic-eden/wallets/:walletAddress/tokens', async (req, res) => {
  const { walletAddress } = req.params;
  const { offset, limit, listedOnly } = req.query;

  try {
    const response = await fetch(`https://api-mainnet.magiceden.dev/v2/wallets/${walletAddress}/tokens?offset=${offset}&limit=${limit}&listedOnly=${listedOnly}`);
    const tokens = await response.json();
    res.status(200).json(tokens);
  } catch (err) {
    console.log(err);
  }
});

app.get('/api/magic-eden/wallets/:walletAddress/activities', async (req, res) => {
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

app.get('/api/magic-eden/collections', (req, res) => {
  pool.query(`SELECT * FROM magiceden_collection`, (error, results) => {
    if (error) {
      console.log(error);
      throw error;
    }
    res.status(200).json(results.rows);
  });
});

// Store collections from Magic Eden API
app.get('/api/magic-eden/collections/store', async (req, res) => {
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

app.get('/api/user', (req, res) => {
  res.json({ message: 'Looks good to me!!!' });
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});

app.get('/api/dev/magiceden', async (req, res) => {
  let leftJoins = '';

  pool.query(`
    SELECT * FROM (
      SELECT name, symbol, image
      FROM magiceden_collection
    ) _magiceden_collection
    LEFT JOIN (
      SELECT DISTINCT ON (symbol) *
      FROM magiceden_snapshot
      WHERE start_time::date > '${moment().subtract(2, 'days').format('YYYY-MM-DD')}'
      ORDER BY symbol, start_time DESC
    ) _magiceden_snapshot
    ON _magiceden_collection.symbol = _magiceden_snapshot.symbol
    LEFT JOIN (
      SELECT DISTINCT ON (symbol) symbol as hourly_snapshot_symbol, floor_price AS live_floor_price, one_day_price_change AS live_one_day_price_change, seven_day_price_change AS live_seven_day_price_change, listed_count AS live_listed_count, volume_all AS live_volume_all
      FROM magiceden_hourly_snapshot
      WHERE start_time > '${moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')}'
      ORDER BY symbol, start_time DESC
    ) _magiceden_hourly_snapshot
    ON _magiceden_collection.symbol = _magiceden_hourly_snapshot.hourly_snapshot_symbol`, (error, results) => {
    if (error) {
      throw error;
    }
    res.status(200).json(results.rows);
  });
});

app.get('/api/dev/opensea', async (req, res) => {
  let leftJoins = '';

  pool.query(`
    SELECT * FROM (
      SELECT name, slug, image_url
      FROM opensea_collection
    ) _opensea_collection
    LEFT JOIN (
      SELECT DISTINCT ON (slug) *
      FROM opensea_snapshot
      WHERE start_time::date > '${moment().subtract(2, 'days').format('YYYY-MM-DD')}'
      ORDER BY slug, start_time DESC
    ) _opensea_snapshot
    ON _opensea_collection.slug = _opensea_snapshot.slug`, (error, results) => {
    if (error) {
      throw error;
    }
    res.status(200).json(results.rows);
  });
});

app.get('/api/dev/:slug', async (req, res) => {
  const { slug } = req.params;

  pool.query(`
    SELECT DISTINCT ON (magiceden_snapshot.start_time::date) magiceden_snapshot.start_time::date, *
      FROM magiceden_snapshot
    LEFT JOIN (
      SELECT DISTINCT ON (howrare_snapshot.start_time::date) howrare_snapshot.start_time::date, holders AS howrare_holders
      FROM howrare_snapshot
      JOIN (
        SELECT name, magiceden_symbol
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
});