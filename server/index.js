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
  let nameCase;
  let collectionQuery;

  try {
    const { rows } = await pool.query(`SELECT * from collection`);

    nameCase = rows.reduce((expression, row) => {
      const { symbol, namematch } = row;
      const nameCaseExpression = namematch ? `WHEN name ~ '${namematch}' THEN '${symbol}' ` : '';

      return `${expression}${nameCaseExpression}`;
    }, '');
    // res.status(200).json(nameCase);

    collectionQuery = rows.reduce((query, row, index) => {
      const { symbol, minprice, namematch } = row;
      const nameMatchQuery = namematch ? `name ~ '${namematch}'` : `symbol = '${symbol}'`;

      if (index === rows.length - 1) {
        return `${query}(${nameMatchQuery} AND price > ${minprice})`;
      }

      return `${query}(${nameMatchQuery} AND price > ${minprice}) OR `;
    }, '');
    // res.status(200).json(collectionQuery);
  } catch (err) {
    console.log(err.stack);
  }

  let leftJoins = '';

  // Get the 24h and 7d floor
  for (let days = 1; days <= 10; days += 6) {
    leftJoins += `LEFT JOIN (SELECT MIN(price) AS _${days}dfloor, CASE ${nameCase} ELSE symbol END AS _symbol FROM sales WHERE datetime > (NOW() - interval '${days + 1} days') AND datetime < (NOW() - interval '${days} days') AND (${collectionQuery}) AND hide IS NOT TRUE GROUP BY _symbol) _${days}d ON _snapshot.symbol = _${days}d._symbol `;
  }
  // res.status(200).json(leftJoins);

  pool.query(`
    SELECT * from (
      SELECT name, symbol, maxsupply, image, slug
      FROM collection
    ) _collection
    LEFT JOIN (
      SELECT DISTINCT ON (symbol) *
      FROM snapshot
      ORDER BY symbol, starttime DESC
    ) _snapshot
    ON _collection.symbol = _snapshot.symbol
    LEFT JOIN (
      SELECT SUM(price) AS _24hVolume,
        CASE ${nameCase}
          ELSE symbol
        END AS _symbol
      FROM sales
      WHERE datetime > (NOW() - interval '24 hours') AND datetime < NOW()
        AND (${collectionQuery})
      GROUP BY _symbol
    ) _sales
    ON _snapshot.symbol = _sales._symbol
    ${leftJoins}`, (error, results) => {
    if (error) {
      throw error;
    }
    res.status(200).json(results.rows);
  });
});

app.get('/api/:slug', async (req, res) => {
  const { slug } = req.params;
  const { rows } = await pool.query(`SELECT * FROM collection WHERE slug = '${slug}'`);

  const [{ symbol, minprice, namematch }] = rows;
  const nameCase = namematch ? `CASE WHEN name ~ '${namematch}' THEN '${symbol}' END` : 'symbol';
  const nameMatchQuery = namematch ? `name ~ '${namematch}'` : `symbol = '${symbol}'`;
  const collectionQuery = `${nameMatchQuery} AND price > ${minprice}`;

  pool.query(`
    SELECT DISTINCT ON (starttime::date) starttime::date, listedcount, ownerscount, floorprice, price
    FROM snapshot
    LEFT JOIN (
      SELECT DISTINCT ON (datetime::date) datetime::date, symbol, price,
        ${nameCase}
        AS _symbol
      FROM sales
      WHERE ${collectionQuery} AND datetime > (NOW() - interval '30 days') AND datetime < NOW() AND hide IS NOT TRUE
      ORDER BY datetime desc, price asc
    ) _sales
    ON snapshot.starttime::date = _sales.datetime::date
    WHERE snapshot.symbol = '${symbol}' and starttime > (NOW() - interval '30 days') AND starttime < NOW()
    ORDER BY starttime`, (error, results) => {
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
    WHERE users.wallet_address = '${walletAddress}'`, (error, results) => {
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