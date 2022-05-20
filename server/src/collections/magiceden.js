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
  const magicedenCollections = await getMagicedenCollections();
  await storeMagicEdenCollection(magicedenCollections);
}

const getMagicedenCollections = async () => {
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

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);