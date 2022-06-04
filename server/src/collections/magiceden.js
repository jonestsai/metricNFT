require('dotenv').config({ path: '/home/server/.env' });
const fetch = require('node-fetch');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const userAgent = require('user-agents');
const { Pool } = require('pg');

puppeteer.use(StealthPlugin());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function main() {
  const newCollections = await getNewCollections();
  await storeMagicEdenCollection(newCollections);
  const magicedenCollections = await getMagicedenCollections();
  await magicedenCollectionsSnapshot(magicedenCollections);
}

const getNewCollections = async () => {
  const offset = 0;
  const limit = 500;

  try {
    const response = await fetch(`https://api-mainnet.magiceden.dev/v2/collections?offset=${offset}&limit=${limit}`);
    const collections = await response.json();

    return collections;
  } catch (error) {
    console.log(error);
  }
}

const storeMagicEdenCollection = async (collections) => {
  let collectionCount = 0;
  let stopCount = 0;

  try {
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

      const newCollectionCount = await getCollectionCount();
      console.log(collectionCount);
      console.log(newCollectionCount);
      console.log(stopCount);
      if (collectionCount === newCollectionCount) {
        stopCount++;
        if (stopThresholdReached(stopCount, 50)) {
          throw new Error('Stop threshold reached.');
        }
      }
      collectionCount = newCollectionCount;
    }
  } catch (error) {
    console.log(error);
  }
}

const getCollectionCount = async () => {
  const { rows } = await pool.query(`SELECT COUNT(*) FROM magiceden_collection`);
  const [row] = rows;  
  const { count } = row;
  return count;
}

const stopThresholdReached = (stopCount, count) => {
  return stopCount === count;
}

const getMagicedenCollections = async () => {
  try {
    const { rows } = await pool.query(`SELECT symbol, name FROM magiceden_collection`);

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
    const collectionHolderStats = await getCollectionHolderStats(symbol);
    const { totalSupply, uniqueHolders } = collectionHolderStats;
    const startSnapshotTime = new Date();
    const query = {
      text: 'INSERT INTO magiceden_snapshot(symbol, start_time, floor_price, listed_count, avg_price_24hr, volume_all, total_supply, unique_holders) VALUES($1, $2, $3, $4, $5, $6, $7, $8)',
      values: [symbol, startSnapshotTime, floorPrice, listedCount, avgPrice24hr, volumeAll, totalSupply, uniqueHolders],
    };
    pool.query(query, (error, results) => {
      if (error) {
        console.log(error);
      }
    });
    await new Promise(f => setTimeout(f, 1000));
  }
}

const getMagicedenCollectionStats = async (symbol) => {
  try {
    const response = await fetch(`https://api-mainnet.magiceden.dev/v2/collections/${symbol}/stats`);
    const stats = await response.json();

    return stats;
  } catch (error) {
    console.log(error);
  }
}

const getCollectionHolderStats = async (symbol) => {
  try {
    const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
    const [page] = await browser.pages();
    await page.setUserAgent(userAgent.toString());
    await page.goto(`https://api-mainnet.magiceden.io/rpc/getCollectionHolderStats/${symbol}`, { waitUntil: 'networkidle0' });
    const data = await page.$eval('pre', (element) => element.textContent);
    const totalSupply = JSON.parse(data)?.results?.totalSupply;
    const uniqueHolders = JSON.parse(data)?.results?.uniqueHolders;
    await browser.close();

    return { totalSupply, uniqueHolders };
  } catch (error) {
    console.log(error);
    return { totalSupply: null, uniqueHolders: null };
  }
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);