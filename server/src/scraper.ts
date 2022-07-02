import {
  LAMPORTS_PER_SOL
} from '@solana/web3.js';

const puppeteer = require('puppeteer-extra');

async function main() {
  // Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
  const StealthPlugin = require('puppeteer-extra-plugin-stealth');
  puppeteer.use(StealthPlugin());

  // Add adblocker plugin to block all ads and trackers (saves bandwidth)
  //const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
  //puppeteer.use(AdblockerPlugin({ blockTrackers: true }))

  const userAgent = require('user-agents');
  // const useragent = require('random-useragent');
  // const randomUseragent = randomUseragent.getRandom(); // gets a random user agent string

  try {
    const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
    const [page] = await browser.pages();
    await page.setUserAgent(userAgent.toString());

    // MagicEden
    await getMagicedenPrice(page);
    await getMagicedenHolders(page);
    await getOpenseaSlugs(page);

    await browser.close();
  } catch (err) {
    console.error(err);
  }
}

const getMagicedenPrice = async (page: any) => {
  await page.goto('https://api-mainnet.magiceden.io/rpc/getCollectionEscrowStats/degods?edge_cache=true', { waitUntil: 'networkidle0' });
  // const data = await page.evaluate(() => document.querySelector('*').outerHTML);
  const data = await page.$eval('pre', (element: any) => element.textContent);

  const price = JSON.parse(data)?.results?.floorPrice / LAMPORTS_PER_SOL;
  console.log(price);
}

const getMagicedenHolders = async (page: any) => {
  await page.goto('https://api-mainnet.magiceden.io/rpc/getCollectionHolderStats/degods', { waitUntil: 'networkidle0' });
  const data = await page.$eval('pre', (element: any) => element.textContent);
  const totalSupply = JSON.parse(data)?.results?.totalSupply;
  const uniqueHolders = JSON.parse(data)?.results?.uniqueHolders;
  console.log(totalSupply);
  console.log(uniqueHolders);
}

const getOpenseaSlugs = async (page: any) => {
  await page.goto('https://opensea.io/rankings?chain=ethereum&sortBy=total_volume', { waitUntil: 'networkidle0' });
  await page.waitForTimeout(30000);
  const data = await page.$eval('*', (element: any) => element.textContent);
  // console.log(data);

  const substrings = data.split('"slug":"');
  substrings.shift(); // Remove first item since it's not a slug

  let slugs: string[] = [];
  for (const substring of substrings) {
    slugs.push(substring.substr(0, substring.indexOf('"')));
  }

  const uniqueSlugs = [...new Set(slugs)];
  console.log(uniqueSlugs);
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
