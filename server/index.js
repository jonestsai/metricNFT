require('dotenv').config();
const cors = require('cors');
const express = require('express');
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

  // Get the 24h and 7d floor
  for (let days = 1; days <= 10; days += 6) {
    leftJoins += `LEFT JOIN (SELECT MIN(floor_price) AS _${days}dfloor, symbol AS _${days}dsymbol FROM magiceden_snapshot WHERE start_time > (NOW() - interval '${days + 1} days') AND start_time < (NOW() - interval '${days} days') GROUP BY symbol) _${days}d ON _magiceden_collection.symbol = _${days}d._${days}dsymbol `;
  }

  pool.query(`
    SELECT * FROM (
      SELECT name, symbol
      FROM magiceden_collection
    ) _magiceden_collection
    LEFT JOIN (
      SELECT logo AS howrare_image, name AS howrare_name, magiceden_symbol, items AS howrare_max_supply
      FROM howrare_collection
    ) _howrare_collection
    ON _magiceden_collection.symbol = _howrare_collection.magiceden_symbol
    LEFT JOIN (
      SELECT symbol, image AS collection_image, magiceden_symbol, maxsupply AS collection_max_supply
      FROM collection
    ) _collection
    ON _magiceden_collection.symbol = _collection.magiceden_symbol
    LEFT JOIN (
      SELECT DISTINCT ON (symbol) *
      FROM magiceden_snapshot
      ORDER BY symbol, start_time DESC
    ) _magiceden_snapshot
    ON _magiceden_collection.symbol = _magiceden_snapshot.symbol
    LEFT JOIN (
      SELECT DISTINCT ON (symbol) symbol, floor_price AS live_floor_price, listed_count AS live_listed_count, volume_all AS live_volume_all
      FROM magiceden_hourly_snapshot
      ORDER BY symbol, start_time DESC
    ) _magiceden_hourly_snapshot
    ON _magiceden_collection.symbol = _magiceden_hourly_snapshot.symbol
    LEFT JOIN (
      SELECT DISTINCT ON (name) name AS howrare_snapshot_name, holders AS howrare_holders, start_time
      FROM howrare_snapshot
      ORDER BY howrare_snapshot_name, start_time DESC
    ) _howrare_snapshot
    ON _howrare_collection.howrare_name = _howrare_snapshot.howrare_snapshot_name
    LEFT JOIN (
      SELECT DISTINCT ON (symbol) symbol, ownerscount AS holders, starttime
      FROM snapshot
      ORDER BY symbol, starttime DESC
    ) _snapshot
    ON _collection.symbol = _snapshot.symbol
    LEFT JOIN (
      SELECT symbol,
        SUM(CASE _magiceden_snapshot.row
          WHEN 1 THEN volume_all
          WHEN 2 THEN -volume_all
          ELSE 0
        END) AS _24hvolume
      FROM (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY symbol ORDER BY start_time desc) AS row
        FROM magiceden_snapshot) _magiceden_snapshot
      WHERE _magiceden_snapshot.row <= 2
      GROUP BY symbol
    ) _24hvolume
    ON _magiceden_snapshot.symbol = _24hvolume.symbol
    ${leftJoins}
    WHERE _collection.magiceden_symbol IS NOT null OR _howrare_collection.howrare_image IS NOT null`, (error, results) => {
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
      SELECT DISTINCT ON (snapshot.starttime::date) snapshot.starttime::date, ownerscount AS holders
      FROM snapshot
      JOIN (
        SELECT symbol, magiceden_symbol
      FROM collection
      ) _collection
      ON snapshot.symbol = _collection.symbol
      WHERE magiceden_symbol = '${slug}' AND starttime > (NOW() - interval '30 days') AND starttime < NOW()
      ORDER BY snapshot.starttime::date
    ) _snapshot
    ON magiceden_snapshot.start_time::date = _snapshot.starttime::date
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

app.get('/api/dev/home', async (req, res) => {
  let leftJoins = '';

  // Get the 24h and 7d floor
  for (let days = 1; days <= 10; days += 6) {
    leftJoins += `LEFT JOIN (SELECT MIN(floor_price) AS _${days}dfloor, symbol AS _${days}dsymbol FROM magiceden_snapshot WHERE start_time > (NOW() - interval '${days + 1} days') AND start_time < (NOW() - interval '${days} days') GROUP BY symbol) _${days}d ON _magiceden_collection.symbol = _${days}d._${days}dsymbol `;
  }

  pool.query(`
    SELECT * FROM (
      SELECT name, symbol, image
      FROM magiceden_collection
    ) _magiceden_collection
    LEFT JOIN (
      SELECT DISTINCT ON (symbol) *
      FROM magiceden_snapshot
      ORDER BY symbol, start_time DESC
    ) _magiceden_snapshot
    ON _magiceden_collection.symbol = _magiceden_snapshot.symbol
    LEFT JOIN (
      SELECT DISTINCT ON (symbol) symbol, floor_price AS live_floor_price, listed_count AS live_listed_count, volume_all AS live_volume_all
      FROM magiceden_hourly_snapshot
      ORDER BY symbol, start_time DESC
    ) _magiceden_hourly_snapshot
    ON _magiceden_collection.symbol = _magiceden_hourly_snapshot.symbol
    LEFT JOIN (
      SELECT symbol,
        SUM(CASE _magiceden_snapshot.row
          WHEN 1 THEN volume_all
          WHEN 2 THEN -volume_all
          ELSE 0
        END) AS _24hvolume
      FROM (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY symbol ORDER BY start_time desc) AS row
        FROM magiceden_snapshot) _magiceden_snapshot
      WHERE _magiceden_snapshot.row <= 2
      GROUP BY symbol
    ) _24hvolume
    ON _magiceden_snapshot.symbol = _24hvolume.symbol
    ${leftJoins}
    WHERE _magiceden_snapshot.floor_price IS NOT NULL AND _magiceden_snapshot.total_supply IS NOT NULL AND _magiceden_snapshot.unique_holders > 50`, (error, results) => {
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
      SELECT DISTINCT ON (snapshot.starttime::date) snapshot.starttime::date, ownerscount AS holders
      FROM snapshot
      JOIN (
        SELECT symbol, magiceden_symbol
      FROM collection
      ) _collection
      ON snapshot.symbol = _collection.symbol
      WHERE magiceden_symbol = '${slug}' AND starttime > (NOW() - interval '30 days') AND starttime < NOW()
      ORDER BY snapshot.starttime::date
    ) _snapshot
    ON magiceden_snapshot.start_time::date = _snapshot.starttime::date
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