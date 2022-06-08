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
  const previousDate = moment().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss');

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

    const startSnapshotTime = new Date();
    const query = {
      text: 'INSERT INTO magiceden_hourly_snapshot(symbol, start_time, floor_price, listed_count, avg_price_24hr, volume_all) VALUES($1, $2, $3, $4, $5, $6)',
      values: [symbol, startSnapshotTime, floorPrice, listedCount, avgPrice24hr, volumeAll],
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
  }
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);