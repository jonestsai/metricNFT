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
  const howrareCollections = await getHowrareCollections();
  const magicedenCollections = await getMagicedenCollections();
  await storeHowrareCollections(howrareCollections, magicedenCollections);
  await howrareCollectionsSnapshot(howrareCollections);
}

const getHowrareCollections = async () => {
  try {
    const response = await fetch(`https://api.howrare.is/v0.1/collections/`);
    const { result } = await response.json();
    const { data } = result;

    return data;
  } catch (error) {
    console.log(error);
  }
}

const getMagicedenCollections = async () => {
  try {
    const { rows } = await pool.query(`SELECT symbol, name FROM magiceden_collection`);

    return rows;
  } catch (error) {
    console.log(error);
  }
}

const storeHowrareCollections = async (howrareCollections, magicedenCollections) => {
  for (collection of howrareCollections) {
    const { name, url, logo, items } = collection;
    const magiceden_symbol = getMagicedenSymbol(name, url, magicedenCollections);
    console.log(name);
    console.log(magiceden_symbol);
    const query = {
      text: 'INSERT INTO howrare_collection(name, url, logo, items, magiceden_symbol) VALUES($1, $2, $3, $4, $5) ON CONFLICT (name) DO NOTHING',
      values: [name, url, logo, items, magiceden_symbol],
    };
    pool.query(query, (error, results) => {
      if (error) {
        console.log(error);
      }
    });
    await new Promise(f => setTimeout(f, 500));
  }
}

const getMagicedenSymbol = (howrareName, howrareURL, magicedenCollections) => {
  const collectionByName = magicedenCollections.find(collection => collection.name === howrareName);
  const collectionByURL = magicedenCollections.find(collection => `/${collection.symbol}` == howrareURL);
  return collectionByName?.symbol || collectionByURL?.symbol;
}

const howrareCollectionsSnapshot = async (howrareCollections) => {
  for (collection of howrareCollections) {
    const { name, on_sale, holders, floor, floor_marketcap, floor_marketcap_pretty } = collection;
    console.log(name);
    const startSnapshotTime = new Date();
    const query = {
      text: 'INSERT INTO howrare_snapshot(name, start_time, on_sale, holders, floor, floor_marketcap, floor_marketcap_pretty) VALUES($1, $2, $3, $4, $5, $6, $7)',
      values: [name, startSnapshotTime, on_sale, holders, floor, floor_marketcap, floor_marketcap_pretty],
    };
    pool.query(query, (error, results) => {
      if (error) {
        console.log(error);
      }
    });
    await new Promise(f => setTimeout(f, 500));
  }
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);