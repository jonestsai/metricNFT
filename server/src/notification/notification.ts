export {};

import { LAMPORTS_PER_SOL } from '@solana/web3.js';
require('dotenv').config({ path: '/home/server/.env' });
const formData = require('form-data');
const Mailgun = require('mailgun.js');
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
  try {
    const { rows } = await pool.query(`
      SELECT * FROM users
      JOIN notification
      ON users.wallet_address = notification.wallet_address
      WHERE notification.sent_at IS NULL`);
    // console.log(rows);

    for (let row of rows) {
      const { wallet_address, email, collection_symbol, collection_name, sign, price } = row;
      try {
        const response = await fetch(`https://api-mainnet.magiceden.dev/v2/collections/${collection_symbol}/stats`);
        const collection = await response.json();
        const floorPrice = collection.floorPrice / LAMPORTS_PER_SOL;
        // console.log(floorPrice);

        if (sign === '>') {
          if (floorPrice > price) {
            console.log(`${wallet_address} ${collection_symbol} price ${sign} ${price}`);
            await send(email, collection_name, sign, price);
            await updateDB(wallet_address, collection_symbol, sign, price);
          }
        }

        if (sign === '<') {
          if (floorPrice < price) {
            console.log(`${wallet_address} ${collection_symbol} price ${sign} ${price}`);
            await send(email, collection_name, sign, price);
            await updateDB(wallet_address, collection_symbol, sign, price);
          }
        }
      } catch (err) {
        console.log(err);
      }
    }
  } catch (err) {
    console.log(err);
  }
}

const send = async (to: any, collection_name: any, sign: any, price: any) => {
  const domain = process.env.MAILGUN_DOMAIN;
  const apiKey = process.env.MAILGUN_SECRET;
  const from = 'MetricNFT <notification@metricnft.com>';
  const mailgun = new Mailgun(formData);
  const mailgunClient = mailgun.client({ username: 'api', key: apiKey || '' });

  const data = {
    from: from,
    to: to,
    subject: `New Notification for ${collection_name}`,
    html: `${collection_name} has reached your price target of ${sign} ${price} SOL.`
  };
  try {
    // Invokes the method to send emails given the above data with the helper library
    await mailgunClient.messages.create(domain, data);
    console.log('Message Sent');
  } catch (error) {
    console.log('got an error: ', error);
  }
}

const updateDB = async (wallet_address: any, collection_symbol: any, sign: any, price: any) => {
  const { rows } = await pool.query(`
    UPDATE notification SET sent_at = NOW()
    WHERE wallet_address = '${wallet_address}' AND collection_symbol = '${collection_symbol}' AND sign = '${sign}' AND price = '${price}'`);
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
