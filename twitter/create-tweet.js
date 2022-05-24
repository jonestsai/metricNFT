import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} from '@solana/web3.js';
import { TwitterApi } from 'twitter-api-v2';
import fs from 'fs';
import Axios from 'axios';
import { Account } from "@metaplex-foundation/mpl-core";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import dotenv from 'dotenv';
dotenv.config({ path: '/home/twitter/.env' });
import * as pg from 'pg'
const { Pool } = pg.default;

import { royaltyAddresses } from './utils/constants.js';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  // host: '198.199.117.248',
  database: process.env.DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

let connection;

async function main() {
  connection = new Connection(clusterApiUrl('mainnet-beta'));

  // Get sale transactions and store to sales table
  for (const address in royaltyAddresses) {
    const minPrice = await getMinPrice(royaltyAddresses[address]);
    await getSales(address, null, minPrice);
  }
}

const getMinPrice = async (symbol) => {
  const { rows } = await pool.query(`
    SELECT * FROM collection
    WHERE symbol = '${symbol}'`
  );
  const [row] = rows;
  const { minprice } = row;
  return Number(minprice);
}

const getSales = async (address, beforeSignature, minPrice) => {
  const publicKey = new PublicKey(address);
  let result;

  // Comment this out when testing few transactions
  if (beforeSignature){
    result = await connection.getSignaturesForAddress(publicKey, { limit: 1000, before: beforeSignature });
  } else {
    result = await connection.getSignaturesForAddress(publicKey, { limit: 1000 });
  }

  // Use this when testing few transactions
  // result = await connection.getSignaturesForAddress(publicKey, { limit: 1 });

  let lastSignature;
  let count = 0;
  // console.log(result);

  let holders = [];
  let txID;
  let name;
  let price;

  for (const tx of result) {
    console.log(tx.signature);
    txID = tx.signature;

    let transaction = await connection.getTransaction(tx.signature); // tx.signature
    // console.log(transaction);

    // Try one more time if transaction is null (it fails randomly)
    if (!transaction) {
      transaction = await connection.getTransaction(tx.signature); // tx.signature
    }

    // Try one more time if transaction is null (it fails randomly)
    if (!transaction) {
      transaction = await connection.getTransaction(tx.signature); // tx.signature
    }

    // Try one more time if transaction is null (it fails randomly)
    if (!transaction) {
      transaction = await connection.getTransaction(tx.signature); // tx.signature
    }

    if (transaction?.meta?.err === null) {
      // console.log(transaction!.meta!.err);

      const postBalances = transaction?.meta?.postBalances;
      const preBalances = transaction?.meta?.preBalances;
      const balanceChange = postBalances.map((postBalance, index) => {
        return postBalance - preBalances[index];
      })
      // console.log(balanceChange);

      const accountKeys = transaction?.transaction?.message?.accountKeys.map((accountKey) => accountKey.toString());
      // console.log(accountKeys);

      const highestBalanceChange = Math.max(...balanceChange);
      const fromAddress = accountKeys[balanceChange.indexOf(highestBalanceChange)];
      const fromPreBalance = preBalances[balanceChange.indexOf(highestBalanceChange)];
      const fromPostBalance = postBalances[balanceChange.indexOf(highestBalanceChange)];
      const lowestBalanceChange = Math.min(...balanceChange);
      const toAddress = accountKeys[balanceChange.indexOf(lowestBalanceChange)];
      const toPreBalance = preBalances[balanceChange.indexOf(lowestBalanceChange)];
      const toPostBalance = postBalances[balanceChange.indexOf(lowestBalanceChange)];
      // console.log(fromAddress);
      // console.log(fromPreBalance/LAMPORTS_PER_SOL);
      // console.log(fromPostBalance/LAMPORTS_PER_SOL);
      // console.log(toAddress);
      // console.log(toPreBalance/LAMPORTS_PER_SOL);
      // console.log(toPostBalance/LAMPORTS_PER_SOL);

      price = Math.abs(lowestBalanceChange/LAMPORTS_PER_SOL);
      console.log(price);

      const blockTime = transaction?.blockTime;
      const datetime = new Date(blockTime*1000);
      console.log(datetime);

      const magicEdenProgram = 'MEisE1HzehtrDpAAT8PnLHjpSSkRYakotTuJRPjTpo8';
      const magicEdenProgram2 = 'M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K';
      const solanartProgram = 'CJsLwbP1iu5DuUikHEJnLfANgKy6stB2uFgvBBHoyxwz';
      const solseaProgram = '617jbWo616ggkDxvW1Le8pV38XLbVSyWY8ae6QUmGBAU';
      const alphaArtProgram = 'HZaWndaNWHFDd9Dhk5pqUUtsmoBCqzb1MLu3NAh1VX6B';
      const digitalEyesProgram = 'A7p8451ktDCHq5yYaHczeLMYsjRsAkzc3hCXcSrwYHU7';
      let accountKey = (transaction?.transaction?.message?.accountKeys)?.find((accountKey) => {
        return accountKey.toBase58() === magicEdenProgram || accountKey.toBase58() === magicEdenProgram2 || accountKey.toBase58() === solanartProgram || accountKey.toBase58() === solseaProgram || accountKey.toBase58() === alphaArtProgram || accountKey.toBase58() === digitalEyesProgram;
      });
      let marketplace;

      if (accountKey?.toString() === magicEdenProgram) {
        marketplace = 'Magic Eden';
      }
      if (accountKey?.toString() === magicEdenProgram2) {
        marketplace = 'Magic Eden v2';
      }
      if (accountKey?.toString() === solanartProgram) {
        marketplace = 'Solanart';
      }
      if (accountKey?.toString() === solseaProgram) {
        marketplace = 'Solsea';
      }
      if (accountKey?.toString() === alphaArtProgram) {
        marketplace = 'Alpha art';
      }
      if (accountKey?.toString() === digitalEyesProgram) {
        marketplace = 'DigitalEyes';
      }
      // console.log(marketplace);
      // console.log(accountKeys[accountKeys.length - 1]);
      // console.log(accountKeys);
      // console.log(transaction!.transaction!.message!.instructions);
      // console.log(transaction!.meta!.preTokenBalances);
      // console.log(transaction!.meta!.postTokenBalances);

      const magicEdenAddress = 'GUfCR9mK6azb9vcpsxgXyj7XRPAKJd4KMHTTVvtncGgp';
      const solanartAddress = '3D49QorJyNaL4rcpiynbuS3pRH4Y7EXEM6v6ZGaqfFGK';
      let preTokenBalances = (transaction?.meta?.preTokenBalances)?.find((preTokenBalance) => {
        return preTokenBalance?.owner === magicEdenAddress || preTokenBalance?.owner === solanartAddress;
      });

      // Get the correct token from SMB marketplace (required starting from 2022-02-15)
      if (!preTokenBalances) {
        const notSMBMint = 'So11111111111111111111111111111111111111112';
        preTokenBalances = (transaction?.meta?.preTokenBalances)?.find((preTokenBalance) => {
          return preTokenBalance?.mint !== notSMBMint;
        });
      }

      // Sale happened from a marketplace other than ME, Solanart, and SMB
      if (!preTokenBalances) {
        preTokenBalances = transaction?.meta?.preTokenBalances[0];
      }

      console.log(price);
      console.log(minPrice);

      if (preTokenBalances?.mint && price > minPrice) {
        try {
          const tokenAddress = preTokenBalances?.mint;
          const metadataPDA = await Metadata.getPDA(tokenAddress);
          const mintAccountInfo = await connection.getAccountInfo(metadataPDA);
          const {
            data: { data: metadata }
          } = Metadata.from(new Account(tokenAddress, mintAccountInfo));
          // console.log(metadata);
          // console.log(metadata?.name);
          // console.log(metadata?.symbol);
          name = metadata?.name;

          // Save to db
          if (fromPostBalance !== 0 && preTokenBalances?.mint) {
            console.log('Save to DB');
            const query = {
              text: 'INSERT INTO sales_backup(id, name, symbol, price, datetime, marketplace, fromaddr, toaddr, fromaddrprebalance, fromaddrpostbalance, toaddrprebalance, toaddrpostbalance, programid, mint) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
              values: [txID, name, metadata?.symbol, price, datetime, marketplace, fromAddress, toAddress, fromPreBalance/LAMPORTS_PER_SOL, fromPostBalance/LAMPORTS_PER_SOL, toPreBalance/LAMPORTS_PER_SOL, toPostBalance/LAMPORTS_PER_SOL, accountKeys[accountKeys.length - 1], tokenAddress],
            };
            const results = await pool.query(query);
            console.log(results);

            // Store holders
            holders.push({ tokenAddress, toAddress, name, price, txID });
          }
        } catch (error) {
          console.log(error);
          if (error?.detail?.includes('already exists.')) {
            console.log('Sales transactions before this time have already been recorded. Tweeting now.');

            // Reverse holders that were stored from the most recent sale and save to DB
            holders.reverse();
            for (let holder of holders) {
              // Send out tweet
              console.log('sending out tweet');
              await newTweet(holder?.tokenAddress, holder?.name, holder?.price.toFixed(2), holder?.txID);
            }

            return;
          }
        }
      }

    }

    lastSignature = tx.signature;
    count++;
    console.log(count);
    await new Promise(f => setTimeout(f, 500));
  }

  // Comment this out for testing few transactions
  if (count == 1000) {
    count = 0;
    await getSales(address, lastSignature, minPrice);
  }
}

const newTweet = async (tokenAddress, name, price, id) => {
  const metadataPDA = await Metadata.getPDA(tokenAddress);
  const mintAccountInfo = await connection.getAccountInfo(metadataPDA);
  const {
    data: { data: metadata }
  } = Metadata.from(new Account(tokenAddress, mintAccountInfo));
  const { uri } = metadata;
  // console.log(uri);

  const image = await getImage(uri);
  await downloadImage(image, 'img.jpg');

  try {
    if (name.startsWith('Okay')) {
      const client = new TwitterApi({
        appKey: process.env.appKeyOkayBears,
        appSecret: process.env.appSecretOkayBears,
        accessToken: process.env.accessTokenOkayBears,
        accessSecret: process.env.accessSecretOkayBears,
      });
      const mediaIds = await Promise.all([
        // file path
        client.v1.uploadMedia('./img.jpg'),
      ]);
      await client.v1.tweet(`👌🐻 ${name}\n\n💵 SOLD for ${price} SOL\n\n🛒 https://magiceden.io/item-details/${tokenAddress}\n\n🧾 https://solscan.io/tx/${id}\n\n#WAGBO #OkayBears #OkBears #SolanaNFTs #Solana`, { media_ids: mediaIds });
    }
    if (name.startsWith('Trippin')) {
      const client = new TwitterApi({
        appKey: process.env.appKeyTrippinApe,
        appSecret: process.env.appSecretTrippinApe,
        accessToken: process.env.accessTokenTrippinApe,
        accessSecret: process.env.accessSecretTrippinApe,
      });
      const mediaIds = await Promise.all([
        // file path
        client.v1.uploadMedia('./img.jpg'),
      ]);
      await client.v1.tweet(`${name}\n\n💵 SOLD for ${price} SOL\n\n🛒 https://magiceden.io/item-details/${tokenAddress}\n\n🧾 https://solscan.io/tx/${id}\n\n#TrippinApeNFT #TAT #TrippinApeTribe #Trippinape`, { media_ids: mediaIds });
    }
    if (name.startsWith('Mad Scientist')) {
      const client = new TwitterApi({
        appKey: process.env.appKeyCommuni3,
        appSecret: process.env.appSecretCommuni3,
        accessToken: process.env.accessTokenCommuni3,
        accessSecret: process.env.accessSecretCommuni3,
      });
      const mediaIds = await Promise.all([
        // file path
        client.v1.uploadMedia('./img.jpg'),
      ]);
      await client.v1.tweet(`${name}\n\n💵 SOLD for ${price} SOL\n\n🛒 https://magiceden.io/item-details/${tokenAddress}\n\n🧾 https://solscan.io/tx/${id}\n\n#Communi3 #C3 #SolanaNFTs #Solana`, { media_ids: mediaIds });
    }
  } catch (error) {
    console.log(error);
  }
}

const getImage = async (url) => {
  const res = await Axios({
    url,
    method: 'GET',
  });

  const { data: { image } } = res;
  // console.log(image);

  return image;
}

const downloadImage = async (url, filepath) => {
  const response = await Axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });
  return new Promise((resolve, reject) => {
    response.data.pipe(fs.createWriteStream(filepath))
    .on('error', reject)
    .once('close', () => resolve(filepath)); 
  });
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);


