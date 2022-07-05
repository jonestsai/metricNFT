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
  let collectionHolderStats;
  let totalSupply;
  let uniqueHolders;
  let isError;
  for (collection of collections) {
    try {
      const { symbol } = collection;
      console.log(symbol);
      const collectionStats = await getMagicedenCollectionStats(symbol);
      const { floorPrice, listedCount, avgPrice24hr, volumeAll } = collectionStats;
      collectionHolderStats = await getCollectionHolderStats(symbol);
      ({ totalSupply, uniqueHolders, isError } = collectionHolderStats);

      // Retry getCollectionHolderStats if return is null
      if (!totalSupply && !uniqueHolders && isError) {
        collectionHolderStats = await getCollectionHolderStats(symbol);
        ({ totalSupply, uniqueHolders, isError } = collectionHolderStats);
      }
      if (!totalSupply && !uniqueHolders && isError) {
        collectionHolderStats = await getCollectionHolderStats(symbol);
        ({ totalSupply, uniqueHolders, isError } = collectionHolderStats);
      }

      const [{ _1dfloor, _7dfloor, _24hvolume }] = await getPastData(symbol);
      const oneDayPriceChange = _1dfloor ? (floorPrice - _1dfloor) / _1dfloor : 0;
      const sevenDayPriceChange = _7dfloor ? (floorPrice - _7dfloor) / _7dfloor : 0;
      const oneDayVolume = _24hvolume;

      const startSnapshotTime = new Date();
      const query = {
        text: 'INSERT INTO magiceden_snapshot(symbol, start_time, floor_price, listed_count, avg_price_24hr, volume_all, total_supply, unique_holders, one_day_price_change, seven_day_price_change, one_day_volume) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
        values: [symbol, startSnapshotTime, floorPrice, listedCount, avgPrice24hr, volumeAll, totalSupply, uniqueHolders, oneDayPriceChange, sevenDayPriceChange, oneDayVolume],
      };
      pool.query(query, (error, results) => {
        if (error) {
          console.log(error);
        }
      });
      await new Promise(f => setTimeout(f, 1000));
    } catch (error) {
      console.log(error);
    }
  }
}

const getMagicedenCollectionStats = async (symbol) => {
  try {
    const response = await fetch(`https://api-mainnet.magiceden.dev/v2/collections/${symbol}/stats`);
    const stats = await response.json();

    return stats;
  } catch (error) {
    console.log(error);
    return { floorPrice: null, listedCount: null, avgPrice24hr: null, volumeAll: null };
  }
}

const getCollectionHolderStats = async (symbol) => {
  const browser = await puppeteer.launch({args: ['--single-process', '--no-zygote', '--no-sandbox']});

  try {
    const [page] = await browser.pages();
    await page.setUserAgent(userAgent.toString());
    await page.goto(`https://api-mainnet.magiceden.io/rpc/getCollectionHolderStats/${symbol}`, { waitUntil: 'networkidle0' });
    const data = await page.$eval('pre', (element) => element.textContent);
    const totalSupply = JSON.parse(data)?.results?.totalSupply;
    const uniqueHolders = JSON.parse(data)?.results?.uniqueHolders;

    return { totalSupply, uniqueHolders, isError: false };
  } catch (error) {
    console.log(error);
    return { totalSupply: null, uniqueHolders: null, isError: true };
  } finally {
    await browser.close();
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
      LEFT JOIN LATERAL (
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
      ON _magiceden_collection.symbol = _24hvolume.symbol
      ${leftJoins}
      WHERE _magiceden_collection.symbol = '${symbol}'
    `);

    return rows;
  } catch (error) {
    console.log(error);
    return [{ _1dfloor: null, _7dfloor: null, _24hvolume: null }];
  }
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);