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
  await storeCollections();
  await snapshotCollectionStats();
}

const storeCollections = async () => {
  const durations = ['total_volume', 'thirty_day_volume', 'seven_day_volume', 'one_day_volume'];
  const slugs = await getSlugs(durations);
  const newSlugs = await getNewSlugs(slugs);

  try {
    for (const slug of newSlugs) {
      const response = await fetch(`https://api.opensea.io/api/v1/collection/${slug}`);
      const collection = await response.json();
      
      const { name, description, banner_image_url, image_url, large_image_url, external_url, created_date, opensea_buyer_fee_basis_points, opensea_seller_fee_basis_points, payout_address, discord_url, medium_username, telegram_url, twitter_username, instagram_username, wiki_url } = collection.collection;

      const query = {
        text: 'INSERT INTO opensea_collection(slug, name, description, banner_image_url, image_url, large_image_url, external_url, created_date, opensea_buyer_fee_basis_points, opensea_seller_fee_basis_points, payout_address, discord_url, medium_username, telegram_url, twitter_username, instagram_username, wiki_url) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) ON CONFLICT (slug) DO NOTHING',
        values: [slug, name, description, banner_image_url, image_url, large_image_url, external_url, created_date, opensea_buyer_fee_basis_points, opensea_seller_fee_basis_points, payout_address, discord_url, medium_username, telegram_url, twitter_username, instagram_username, wiki_url],
      };
      pool.query(query, (error, results) => {
        if (error) {
          console.log(error);
        }
      });
      await new Promise(f => setTimeout(f, 500));
    }
  } catch (error) {
    console.log(error);
  }
}

const getSlugs = async (durations) => {
  let slugs = [];
  try {
    const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
    const [page] = await browser.pages();

    await page.setUserAgent(userAgent.toString());

    for (const duration of durations) {
      // await page.goto(`https://opensea.io/rankings?chain=ethereum&sortBy=${durations[0]}`, { waitUntil: 'networkidle0' });
      await page.goto(`https://opensea.io/rankings?chain=ethereum&sortBy=${duration}`, { waitUntil: 'networkidle0' });
      await page.waitForTimeout(30000);
      const data = await page.$eval('*', (element) => element.textContent);

      const substrings = data.split('"slug":"');
      substrings.shift(); // Remove first item since it's not a slug

      for (const substring of substrings) {
        slugs.push(substring.substr(0, substring.indexOf('"')));
      }
      console.log(duration);
    }

    await browser.close();
  } catch (error) {
    console.log(error);
  }

  const uniqueSlugs = [...new Set(slugs)];

  return uniqueSlugs;
}

const getNewSlugs = async (slugs) => {
  const collectionSlugs = await getCollectionSlugs();
  const newSlugs = slugs.filter(slug => !collectionSlugs.includes(slug));
  console.log(newSlugs);

  return newSlugs;
}

const getCollectionSlugs = async () => {
  const { rows } = await pool.query('SELECT slug FROM opensea_collection WHERE hide IS NOT TRUE');
  let collectionSlugs = [];
  for (const row of rows) {
    collectionSlugs.push(row.slug);
  }

  return collectionSlugs;
}

const snapshotCollectionStats = async () => {
  const slugs = await getCollectionSlugs();
  for (slug of slugs) {
    console.log(slug);
    let collectionStats;
    collectionStats = await getCollectionStats(slug);
    if (!collectionStats) {
      collectionStats = await getCollectionStats(slug);
    }
    if (!collectionStats) {
      collectionStats = await getCollectionStats(slug);
    }
    const { one_day_volume, one_day_change, one_day_sales, one_day_average_price, seven_day_volume, seven_day_change, seven_day_sales, seven_day_average_price, thirty_day_volume, thirty_day_change, thirty_day_sales, thirty_day_average_price, total_volume, total_sales, total_supply, count, num_owners, average_price, num_reports, market_cap, floor_price } = collectionStats;
    const startSnapshotTime = new Date();
    const query = {
      text: 'INSERT INTO opensea_snapshot(slug, start_time, one_day_volume, one_day_change, one_day_sales, one_day_average_price, seven_day_volume, seven_day_change, seven_day_sales, seven_day_average_price, thirty_day_volume, thirty_day_change, thirty_day_sales, thirty_day_average_price, total_volume, total_sales, total_supply, count, num_owners, average_price, num_reports, market_cap, floor_price) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)',
      values: [slug, startSnapshotTime, one_day_volume, one_day_change, one_day_sales, one_day_average_price, seven_day_volume, seven_day_change, seven_day_sales, seven_day_average_price, thirty_day_volume, thirty_day_change, thirty_day_sales, thirty_day_average_price, total_volume, total_sales, total_supply, count, num_owners, average_price, num_reports, market_cap, floor_price],
    };
    pool.query(query, (error, results) => {
      if (error) {
        console.log(error);
      }
    });
    await new Promise(f => setTimeout(f, 1000));
  }
}

const getCollectionStats = async (slug) => {
  try {
    const response = await fetch(`https://api.opensea.io/api/v1/collection/${slug}/stats`);
    const stats = await response.json();

    return stats.stats;
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