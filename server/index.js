const cors = require('cors');
const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
    origin: ['http://www.metricnft.com', 'http://198.199.117.248:3000'],
}));

app.get('/api', async (req, res) => {
  const pool = new Pool({
    user: '***REMOVED***',
    host: 'localhost',
    database: 'metricnft',
    password: '***REMOVED***',
    port: ***REMOVED***,
  });

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
      SELECT name, symbol, maxsupply, image
      FROM collection
    ) _collection
    LEFT JOIN (
      SELECT DISTINCT ON (symbol) *
      FROM snapshot
      ORDER BY symbol, starttime DESC
    ) _snapshot
    ON _collection.symbol = _snapshot.symbol
    LEFT JOIN (
      SELECT MIN(price) AS floor, SUM(price) AS _24hVolume,
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

app.get('/api/user', (req, res) => {
  res.json({ message: 'Looks good to me!!!' });
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});