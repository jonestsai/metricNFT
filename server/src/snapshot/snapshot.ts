import {
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
require('dotenv').config({ path: '/home/server/.env' });
const { Pool } = require('pg');
const fetch = require('node-fetch');

const { marketplaceAddresses } = require('./utils/constants');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function main() {
  // Save snapshot
  await saveSnapshot();
}

const saveSnapshot = async () => {
  const startSnapshotTime = new Date();
  const { magicEden, magicEdenV2, solanart, digitalEyes, alphaArt, FTX, SMB } = marketplaceAddresses;
  const { rows } = await pool.query(`
    SELECT collection_symbol, magiceden_api,
      COUNT(distinct owner_address) AS owners_count,
      COUNT(*) FILTER (WHERE owner_address = '${magicEden}'
        OR owner_address = '${magicEdenV2}'
        OR owner_address = '${solanart}'
        OR owner_address = '${digitalEyes}'
        OR owner_address = '${alphaArt}'
        OR owner_address = '${FTX}'
        OR owner_address = '${SMB}') AS listed_count,
      COUNT(*) FILTER (WHERE owner_address = '${magicEden}') AS magiceden,
      COUNT(*) FILTER (WHERE owner_address = '${magicEdenV2}') AS magiceden_v2,
      COUNT(*) FILTER (WHERE owner_address = '${solanart}') AS solanart,
      COUNT(*) FILTER (WHERE owner_address = '${digitalEyes}') AS digitaleyes,
      COUNT(*) FILTER (WHERE owner_address = '${alphaArt}') AS alphaart,
      COUNT(*) FILTER (WHERE owner_address = '${FTX}') AS ftx,
      COUNT(*) FILTER (WHERE owner_address = '${SMB}') AS smb
    FROM holder
    JOIN collection ON holder.collection_symbol = collection.symbol
    GROUP BY collection_symbol, magiceden_api
  `);
  console.log(rows);

  for (let row of rows) {
    const {
      collection_symbol,
      magiceden_api,
      owners_count,
      listed_count,
      magiceden,
      magiceden_v2,
      solanart,
      digitaleyes,
      alphaart,
      ftx,
      smb,
    } = row;
    console.log(owners_count);
    console.log(listed_count);

    let marketplace: any = {
      'magicEden': magiceden,
      'magicEdenV2': magiceden_v2,
      'solanart': solanart,
      'digitalEyes': digitaleyes,
      'alphaArt': alphaart,
      'FTX': ftx,
      'SMB': smb,       
    };
    marketplace = JSON.stringify(marketplace);
    console.log(marketplace);

    let retryCount: number = 0;
    let floorPrice: any;

    try {
      const response = await fetchRetry(magiceden_api, 5);
      const collection = await response.json();

      floorPrice = collection.floorPrice / LAMPORTS_PER_SOL;
      console.log(floorPrice);
    } catch (err) {
      console.log(err);
    }

    const endSnapshotTime = new Date();
    console.log(endSnapshotTime);

    const query = {
      text: 'INSERT INTO snapshot(symbol, starttime, endtime, listedcount, ownerscount, listedmarketplace, floorprice) VALUES($1, $2, $3, $4, $5, $6, $7)',
      values: [collection_symbol, startSnapshotTime, endSnapshotTime, listed_count, owners_count, marketplace, floorPrice],
    };
    pool.query(query, (err: any, res: any) => {
      console.log(err, res)
    });

    await new Promise(f => setTimeout(f, 500));
  }
}

const fetchRetry: any = async (url: any, numOfRetries: any) => {
  try {
    return await fetch(url);
  } catch(err) {
    if (numOfRetries === 0) {
      throw err;
    }
    return await fetchRetry(url, numOfRetries - 1);
  }
};

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
