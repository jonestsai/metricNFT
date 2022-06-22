require('dotenv').config({ path: '/home/server/.env' });
const fetch = require('node-fetch');
const moment = require('moment');
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function main() {
  const magicedenCollections = await getMagicedenCollections();
  await magicedenCollectionsSnapshot(magicedenCollections);
}

const getMagicedenCollections = async () => {
  const previousDate = moment().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss');

  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT ON (symbol) *
      FROM magiceden_snapshot
      WHERE avg_price_24hr IS NOT null AND start_time > '${previousDate}'
      ORDER BY symbol, start_time DESC`
    );

    return rows;
  } catch (error) {
    console.log(error);
  }
}

const magicedenCollectionsSnapshot = async (collections) => {
  for (collection of collections) {
    const { symbol } = collection;
    console.log(symbol);
    const collectionStats = await getMagicedenCollectionStats(symbol);
    const { floorPrice, listedCount, avgPrice24hr, volumeAll } = collectionStats;

    const [{ _1dfloor, _7dfloor }] = await getPastData(symbol);
    const oneDayPriceChange = _1dfloor ? (floorPrice - _1dfloor) / _1dfloor : 0;
    const sevenDayPriceChange = _7dfloor ? (floorPrice - _7dfloor) / _7dfloor : 0;

    const startSnapshotTime = new Date();
    const query = {
      text: 'INSERT INTO magiceden_hourly_snapshot(symbol, start_time, floor_price, listed_count, avg_price_24hr, volume_all, one_day_price_change, seven_day_price_change) VALUES($1, $2, $3, $4, $5, $6, $7, $8)',
      values: [symbol, startSnapshotTime, floorPrice, listedCount, avgPrice24hr, volumeAll, oneDayPriceChange, sevenDayPriceChange],
    };
    pool.query(query, (error, results) => {
      if (error) {
        console.log(error);
      }
    });
    await new Promise(f => setTimeout(f, 100));
  }
}

const getMagicedenCollectionStats = async (symbol) => {
  try {
    const response = await fetch(`https://api-mainnet.magiceden.dev/v2/collections/${symbol}/stats`, {
      method: 'get',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MAGICEDEN_API_KEY}`,
      },
    });
    const stats = await response.json();

    return stats;
  } catch (error) {
    console.log(error);
    return { floorPrice: null, listedCount: null, avgPrice24hr: null, volumeAll: null };
  }
}

const getPastData = async (symbol) => {
  try {
    let leftJoins = '';

    // Get the 24h and 7d floor
    for (let days = 1; days <= 10; days += 6) {
      leftJoins += `LEFT JOIN (SELECT MIN(floor_price) AS _${days}dfloor, symbol AS _${days}dsymbol FROM magiceden_snapshot WHERE start_time > (NOW() - interval '${days + 1} days') AND start_time < (NOW() - interval '${days} days') GROUP BY symbol) _${days}d ON _magiceden_collection.symbol = _${days}d._${days}dsymbol `;
    }

    const { rows } = await pool.query(`
      SELECT * FROM (
        SELECT name, symbol, image
        FROM magiceden_collection
      ) _magiceden_collection
      ${leftJoins}
      WHERE _magiceden_collection.symbol = '${symbol}'
    `);

    return rows;
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