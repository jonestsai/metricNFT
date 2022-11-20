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
  const browser = await puppeteer.launch({args: ['--no-zygote', '--no-sandbox']});
  let slugs = [];

  try {
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
  } catch (error) {
    console.log(error);
  } finally {
    await browser.close();
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
      continue;
    }
    const { one_day_volume, one_day_change, one_day_sales, one_day_average_price, seven_day_volume, seven_day_change, seven_day_sales, seven_day_average_price, thirty_day_volume, thirty_day_change, thirty_day_sales, thirty_day_average_price, total_volume, total_sales, total_supply, count, num_owners, average_price, num_reports, market_cap, floor_price } = collectionStats;
    
    let listedCount = await getOpenseaListings(slug);
    if (!listedCount) {
      listedCount = await getOpenseaListings(slug);
    }
    if (!listedCount) {
      listedCount = await getOpenseaListings(slug);
    }

    const [{ _1dfloor, _7dfloor }] = await getPastData(slug);
    const oneDayPriceChange = _1dfloor ? (floor_price - _1dfloor) / _1dfloor : 0;
    const sevenDayPriceChange = _7dfloor ? (floor_price - _7dfloor) / _7dfloor : 0;

    const startSnapshotTime = new Date();
    const query = {
      text: 'INSERT INTO opensea_snapshot(slug, start_time, one_day_volume, one_day_change, one_day_sales, one_day_average_price, seven_day_volume, seven_day_change, seven_day_sales, seven_day_average_price, thirty_day_volume, thirty_day_change, thirty_day_sales, thirty_day_average_price, total_volume, total_sales, total_supply, count, num_owners, average_price, num_reports, market_cap, floor_price, listed_count, one_day_price_change, seven_day_price_change) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)',
      values: [slug, startSnapshotTime, one_day_volume, one_day_change, one_day_sales, one_day_average_price, seven_day_volume, seven_day_change, seven_day_sales, seven_day_average_price, thirty_day_volume, thirty_day_change, thirty_day_sales, thirty_day_average_price, total_volume, total_sales, total_supply, count, num_owners, average_price, num_reports, market_cap, floor_price, listedCount, oneDayPriceChange, sevenDayPriceChange],
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
    return { one_day_volume: null, one_day_change: null, one_day_sales: null, one_day_average_price: null, seven_day_volume: null, seven_day_change: null, seven_day_sales: null, seven_day_average_price: null, thirty_day_volume: null, thirty_day_change: null, thirty_day_sales: null, thirty_day_average_price: null, total_volume: null, total_sales: null, total_supply: null, count: null, num_owners: null, average_price: null, num_reports: null, market_cap: null, floor_price: null };
  }
}

const getOpenseaListings = async (slug) => {
  const browser = await puppeteer.launch({args: ['--no-zygote', '--no-sandbox']});
  const [page] = await browser.pages();

  try {
    await page.setUserAgent(userAgent.toString());
    await page.setDefaultNavigationTimeout(0);
    await page.goto(`https://opensea.io/collection/${slug}?search[sortAscending]=true&search[sortBy]=PRICE&search[toggles][0]=BUY_NOW`, { waitUntil: 'networkidle0' });
    await Promise.race([
      page.waitForSelector('.fresnel-container'),
      page.waitFor(60000),
    ]);
    console.log('finished waitForSelector');
    const data = await Promise.race([
      page.$eval('*', (element) => element.textContent),
      page.waitFor(60000),
    ]);
    // console.log(data);
    const substrings = data.split('"totalCount":');
    substrings.shift(); // Remove first item
    const [totalCount] = substrings;
    const listings = totalCount.substr(0, totalCount.indexOf(','));
    console.log(listings);

    return listings;
  } catch (error) {
    console.log(error);
    return null;
  } finally {
    await browser.close();
  }
};

const getPastData = async (slug) => {
  try {
    let leftJoins = '';

    // Get the 24h and 7d floor
    for (let days = 1; days <= 10; days += 6) {
      leftJoins += `LEFT JOIN (SELECT MIN(floor_price) AS _${days}dfloor, slug AS _${days}dslug FROM opensea_snapshot WHERE start_time > (NOW() - interval '${days + 1} days') AND start_time < (NOW() - interval '${days} days') GROUP BY slug) _${days}d ON _opensea_collection.slug = _${days}d._${days}dslug `;
    }

    const { rows } = await pool.query(`
      SELECT * FROM (
        SELECT name, slug, image_url
        FROM opensea_collection
      ) _opensea_collection
      ${leftJoins}
      WHERE _opensea_collection.slug = '${slug}'
    `);

    return rows;
  } catch (error) {
    console.log(error);
    return [{ _1dfloor: null, _7dfloor: null }];
  }
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);