import {
  LAMPORTS_PER_SOL
} from '@solana/web3.js';

const puppeteer = require('puppeteer');

async function main() {
  // Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
  //const StealthPlugin = require('puppeteer-extra-plugin-stealth')
  //puppeteer.use(StealthPlugin())

  // Add adblocker plugin to block all ads and trackers (saves bandwidth)
  //const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
  //puppeteer.use(AdblockerPlugin({ blockTrackers: true }))

  const userAgent = require('user-agents');
  // const useragent = require('random-useragent');
  // const randomUseragent = randomUseragent.getRandom(); // gets a random user agent string

  let price: any;

  try {
    const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
    const [page] = await browser.pages();

    await page.setUserAgent(userAgent.toString());
    await page.goto('https://api-mainnet.magiceden.io/rpc/getCollectionEscrowStats/degods?edge_cache=true', { waitUntil: 'networkidle0' });
    // const data = await page.evaluate(() => document.querySelector('*').outerHTML);
    const data = await page.$eval('pre', (element: any) => element.textContent);

    price = JSON.parse(data)?.results?.floorPrice / LAMPORTS_PER_SOL;
    console.log(price);

    await browser.close();
  } catch (err) {
    console.error(err);
  }
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
