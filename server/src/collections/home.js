require('dotenv').config({ path: '/home/server/.env' });

const { LAMPORTS_PER_SOL } = require('@solana/web3.js');
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
  await storeHomePageCollections();
}

const storeHomePageCollections = async () => {
  const magicedenCollections = await getMagicedenCollections();
  await storeMagicedenCollections(magicedenCollections);
  const openseaCollections = await getOpenseaCollections();
  await storeOpenseaCollections(openseaCollections);
}

const getMagicedenCollections = async () => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM (
        SELECT symbol, name, image, display
        FROM magiceden_collection
      ) _magiceden_collection
      LEFT JOIN (
        SELECT DISTINCT ON (symbol) *
        FROM magiceden_snapshot
        WHERE start_time::date > '${moment().subtract(2, 'days').format('YYYY-MM-DD')}'
        ORDER BY symbol, start_time DESC
      ) _magiceden_snapshot
      ON _magiceden_collection.symbol = _magiceden_snapshot.symbol
      LEFT JOIN (
        SELECT symbol as hourly_snapshot_symbol, start_time AS live_start_time, floor_price AS live_floor_price, one_day_price_change AS live_one_day_price_change, seven_day_price_change AS live_seven_day_price_change, listed_count AS live_listed_count, volume_all AS live_volume_all
        FROM magiceden_hourly_snapshot
      ) _magiceden_hourly_snapshot
      ON _magiceden_hourly_snapshot.hourly_snapshot_symbol = _magiceden_collection.symbol AND _magiceden_hourly_snapshot.live_start_time = (
        SELECT MAX(start_time) from magiceden_hourly_snapshot WHERE symbol = _magiceden_collection.symbol AND start_time > '${moment().subtract(3, 'hours').format('YYYY-MM-DD HH:mm:ss')}' AND start_time IS NOT NULL
      )
      WHERE ((total_supply IS NOT NULL AND unique_holders > 50 AND (listed_count > 20 OR live_listed_count > 20)) OR display IS TRUE) AND display IS NOT FALSE
      ORDER BY _magiceden_snapshot.floor_price * total_supply DESC
      LIMIT 1000`
    );

    return rows;
  } catch (error) {
    console.log(error);
  }
}

const storeMagicedenCollections = async (collections) => {
  const chain = 'solana';

  for (collection of collections) {
    const { symbol, name, image, start_time, live_start_time, floor_price, live_floor_price, one_day_price_change, live_one_day_price_change, seven_day_price_change, live_seven_day_price_change, one_day_volume, total_supply, unique_holders, listed_count, live_listed_count } = collection;
    const datetime = live_start_time || start_time;
    const floorPrice = (live_floor_price || floor_price) / LAMPORTS_PER_SOL;
    const oneDayPriceChange = live_one_day_price_change || one_day_price_change;
    const sevenDayPriceChange = live_seven_day_price_change || seven_day_price_change;
    const oneDayVolume = one_day_volume / LAMPORTS_PER_SOL;
    const maxSupply = total_supply;
    const uniqueHolders = unique_holders;
    const listedCount = live_listed_count || listed_count;
    const floorMarketCap = floorPrice * maxSupply;

    const query = {
      text: `
        INSERT INTO home (symbol, name, image, chain, datetime, floor_price, one_day_price_change, seven_day_price_change, one_day_volume, floor_market_cap, total_supply, unique_holders, listed_count)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (symbol)
        DO UPDATE SET datetime = $5, floor_price = $6, one_day_price_change = $7, seven_day_price_change = $8, one_day_volume = $9, floor_market_cap = $10, total_supply = $11, unique_holders = $12, listed_count = $13`,
      values: [symbol, name, image, chain, datetime, floorPrice, oneDayPriceChange, sevenDayPriceChange, oneDayVolume, floorMarketCap, maxSupply, uniqueHolders, listedCount],
    };
    pool.query(query, (error, results) => {
      if (error) {
        console.log(error);
      }
    });
    await new Promise(f => setTimeout(f, 100));
  }
}

const getOpenseaCollections = async () => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM (
        SELECT slug, name, image_url
        FROM opensea_collection
      ) _opensea_collection
      LEFT JOIN (
        SELECT DISTINCT ON (slug) *
        FROM opensea_snapshot
        WHERE start_time::date > '${moment().subtract(2, 'days').format('YYYY-MM-DD')}'
        ORDER BY slug, start_time DESC
      ) _opensea_snapshot
      ON _opensea_collection.slug = _opensea_snapshot.slug
      WHERE total_supply IS NOT NULL AND num_owners > 50 AND listed_count > 20
      ORDER BY _opensea_snapshot.floor_price * total_supply DESC
      LIMIT 1000`
    );

    return rows;
  } catch (error) {
    console.log(error);
  }
}

const storeOpenseaCollections = async (collections) => {
  const chain = 'ethereum';

  for (collection of collections) {
    const { slug, name, image_url, start_time, floor_price, one_day_price_change, seven_day_price_change, one_day_volume, total_supply, num_owners, listed_count } = collection;
    const symbol = slug;
    const image = image_url;
    const datetime = start_time;
    const floorPrice = floor_price;
    const oneDayPriceChange = one_day_price_change;
    const sevenDayPriceChange = seven_day_price_change;
    const oneDayVolume = one_day_volume;
    const maxSupply = total_supply;
    const uniqueHolders = num_owners;
    const listedCount = listed_count;
    const floorMarketCap = floorPrice * maxSupply;

    const query = {
      text: `
        INSERT INTO home (symbol, name, image, chain, datetime, floor_price, one_day_price_change, seven_day_price_change, one_day_volume, floor_market_cap, total_supply, unique_holders, listed_count)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (symbol)
        DO UPDATE SET datetime = $5, floor_price = $6, one_day_price_change = $7, seven_day_price_change = $8, one_day_volume = $9, floor_market_cap = $10, total_supply = $11, unique_holders = $12, listed_count = $13`,
      values: [symbol, name, image, chain, datetime, floorPrice, oneDayPriceChange, sevenDayPriceChange, oneDayVolume, floorMarketCap, maxSupply, uniqueHolders, listedCount],
    };
    pool.query(query, (error, results) => {
      if (error) {
        console.log(error);
      }
    });
    await new Promise(f => setTimeout(f, 100));
  }
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);