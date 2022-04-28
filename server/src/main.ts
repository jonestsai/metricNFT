import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} from '@solana/web3.js';
// import { Connection } from "@metaplex/js";
import { Account } from "@metaplex-foundation/mpl-core";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";

require('dotenv').config();
const fetch = require('node-fetch');
const { Pool } = require('pg');

const anchor = require("@project-serum/anchor");
const genesysgoConnection = new anchor.web3.Connection(
  'https://ssc-dao.genesysgo.net/'
);

/**
 * Connection to the network
 */
let connection: Connection;

async function main() {
  connection = new Connection(clusterApiUrl('mainnet-beta'));
  // connection = genesysgoConnection;

  // Get sale transactions and store to sales table
  await getSales(null);
}

/*
 * Signature, price, datetime, fromAddress, toAddress, fromPreBalance, fromPostBalance, toPreBalance, toPostBalance, name, symbol, image?, marketplace, buy/bid?, programId
 *
 */
const getSales = async (beforeSignature:any) => {
  // const publicKey = new PublicKey('LabA65AnCMHv7y7JVwjYcF5eBR1a55w49JyzbLvgK3p') // MonkeLab
  // const publicKey = new PublicKey('3BjpoZic969Wh8dvgYApuCKL3v5nzgpLAekvumD44qZJ'); // SMB
  // const publicKey = new PublicKey('bDmnDkeV7xqWsEwKQEgZny6vXbHBoCYrjxA4aCr9fHU'); // SMB2
  // const publicKey = new PublicKey('3B86L4BrRjm9V7sd3AjjJq5XFtyqMgCYMCTwqMMvAxgr'); // DTP
  // const publicKey = new PublicKey('9FYsKrNuEweb55Wa2jaj8wTKYDBvuCG3huhakEj96iN9'); // DAA
  // const publicKey = new PublicKey('AvkbtawpmMSy571f71WsWEn41ATHg5iHw27LoYJdk8QA'); // Thugbirdz
  // const publicKey = new PublicKey('CzrE3LhijwcmvsXZa8YavqgR9EzW3UGqoSWZKwGpZVqM'); // Thugbirdz2
  // const publicKey = new PublicKey('DRGNjvBvnXNiQz9dTppGk1tAsVxtJsvhEmojEfBU3ezf'); // Boryoku Dragonz
  // const publicKey = new PublicKey('8hTYASw98ZCZJwuEF9apPhmQTW7TYaoh9AnJfeV2X5tx'); // Mindfolk
  // const publicKey = new PublicKey('8Kag8CqNdCX55s4A5W4iraS71h6mv6uTHqsJbexdrrZm'); // Aurory
  // const publicKey = new PublicKey('CDgbhX61QFADQAeeYKP5BQ7nnzDyMkkR3NEhYF2ETn1k'); // Taiyo
  // const publicKey = new PublicKey('AxFuniPo7RaDgPH6Gizf4GZmLQFc4M5ipckeeZfkrPNn'); // DeGods
  // const publicKey = new PublicKey('7wzoWjLRJRVKMR7PhGffpXBpBsCqLRks2zb3Cnap8PZ3'); // Nyan Hero
  // const publicKey = new PublicKey('D6wZ5U9onMC578mrKMp5PZtfyc5262426qKsYJW7nT3p'); // SSC
  // const publicKey = new PublicKey('GdtkQajEADGbfSUEBS5zctYrhemXYQkqnrMiGY7n7vAw'); // PRTL
  // const publicKey = new PublicKey('PUFFgnKKhQ23vp8uSPwdzrUhEr7WpLmjM85NB1FQgpb'); // SAC
  // const publicKey = new PublicKey('9Da5CoqR8H4YGWEYK6jtcTU69rr6XEkffadN8UFjJkeA'); // CoC
  // const publicKey = new PublicKey('7zL7HVn85F5yFT6XM3BsJcQF7PBcNE7R2BT5GyfunpKe'); // OKB
  // const publicKey = new PublicKey('BSLiqdvTiCLSkpRasjBBJQqNHRLuvp4vP2qyzKALjs9W'); // Blocksmith Labs
  // const publicKey = new PublicKey('Em4DcHQwUxhHfEWhz8aZABXU6nUADTGFBPKHoBhKZr9h'); // SOLGods
  // const publicKey = new PublicKey('6WQPJrQBHwXGNiAffuYt5v96FzS3c4W6Hfi7dvoNkNX4'); // Catalina Whale Mixer
  // const publicKey = new PublicKey('3pMvTLUA9NzZQd4gi725p89mvND1wRNQM3C8XEv1hTdA'); // Famous Fox Federation
  // const publicKey = new PublicKey('74q6RGYyDsjNAjynqyx6P5SGh9HimS1p9TSLb1Z8RTM8'); // Bohemia
  const publicKey = new PublicKey('AfVySHXxTrf5vvLMRCNdfeWmE9h6QFsxzxJ2fgJj7VrQ'); // Astrals
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

  for (const tx of result) {
    console.log(tx.signature);
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

    if (transaction!.meta!.err === null) {
      // console.log(transaction!.meta!.err);

      const postBalances = transaction!.meta!.postBalances;
      const preBalances = transaction!.meta!.preBalances;
      const balanceChange = postBalances.map((postBalance, index) => {
        return postBalance - preBalances[index];
      })
      // console.log(balanceChange);

      const accountKeys = transaction!.transaction!.message!.accountKeys.map((accountKey) => accountKey.toString());
      // console.log(accountKeys);

      const highestBalanceChange = Math.max(...balanceChange);
      const fromAddress = accountKeys[balanceChange.indexOf(highestBalanceChange)];
      const fromPreBalance = preBalances[balanceChange.indexOf(highestBalanceChange)];
      const fromPostBalance = postBalances[balanceChange.indexOf(highestBalanceChange)];
      const lowestBalanceChange = Math.min(...balanceChange);
      const toAddress = accountKeys[balanceChange.indexOf(lowestBalanceChange)];
      const toPreBalance = preBalances[balanceChange.indexOf(lowestBalanceChange)];
      const toPostBalance = postBalances[balanceChange.indexOf(lowestBalanceChange)];
      console.log(fromAddress);
      console.log(fromPreBalance/LAMPORTS_PER_SOL);
      console.log(fromPostBalance/LAMPORTS_PER_SOL);
      console.log(toAddress);
      console.log(toPreBalance/LAMPORTS_PER_SOL);
      console.log(toPostBalance/LAMPORTS_PER_SOL);

      const price = Math.abs(lowestBalanceChange/LAMPORTS_PER_SOL);
      console.log(price);

      const blockTime = transaction!.blockTime!;
      const datetime = new Date(blockTime*1000);
      console.log(datetime);

      const magicEdenProgram = 'MEisE1HzehtrDpAAT8PnLHjpSSkRYakotTuJRPjTpo8';
      const magicEdenProgram2 = 'M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K';
      const solanartProgram = 'CJsLwbP1iu5DuUikHEJnLfANgKy6stB2uFgvBBHoyxwz';
      const solseaProgram = '617jbWo616ggkDxvW1Le8pV38XLbVSyWY8ae6QUmGBAU';
      const alphaArtProgram = 'HZaWndaNWHFDd9Dhk5pqUUtsmoBCqzb1MLu3NAh1VX6B';
      const digitalEyesProgram = 'A7p8451ktDCHq5yYaHczeLMYsjRsAkzc3hCXcSrwYHU7';
      let accountKey = (transaction!.transaction!.message!.accountKeys)!.find((accountKey) => {
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
      console.log(marketplace);
      console.log(accountKeys[accountKeys.length - 1]);
      // console.log(accountKeys);
      // console.log(transaction!.transaction!.message!.instructions);
      console.log(transaction!.meta!.preTokenBalances);
      console.log(transaction!.meta!.postTokenBalances);

      const magicEdenAddress = 'GUfCR9mK6azb9vcpsxgXyj7XRPAKJd4KMHTTVvtncGgp';
      const solanartAddress = '3D49QorJyNaL4rcpiynbuS3pRH4Y7EXEM6v6ZGaqfFGK';
      let preTokenBalances = (transaction!.meta!.preTokenBalances)!.find((preTokenBalance) => {
        return preTokenBalance?.owner === magicEdenAddress || preTokenBalance?.owner === solanartAddress;
      });

      // Get the correct token from SMB marketplace (required starting from 2022-02-15)
      if (!preTokenBalances) {
        const notSMBMint = 'So11111111111111111111111111111111111111112';
        preTokenBalances = (transaction!.meta!.preTokenBalances)!.find((preTokenBalance) => {
          return preTokenBalance?.mint !== notSMBMint;
        });
      }

      // Sale happened from a marketplace other than ME, Solanart, and SMB
      if (!preTokenBalances) {
        preTokenBalances = transaction!.meta!.preTokenBalances![0] as any;
      }

      if (preTokenBalances?.mint) {
        try {
          const tokenAddress = preTokenBalances?.mint;
          const metadataPDA = await Metadata.getPDA(tokenAddress);
          const mintAccountInfo:any = await connection.getAccountInfo(metadataPDA);
          const {
            data: { data: metadata }
          } = Metadata.from(new Account(tokenAddress, mintAccountInfo));
          // console.log(metadata);
          console.log(metadata!.name);
          console.log(metadata!.symbol);

          // Save to db
          if (fromPostBalance !== 0 && preTokenBalances?.mint) {
            console.log('Save to DB');
            const pool = new Pool({
              user: process.env.DB_USER,
              host: process.env.DB_HOST,
              // host: '198.199.117.248',
              database: process.env.DATABASE,
              password: process.env.DB_PASSWORD,
              port: process.env.DB_PORT,
            });
            const query = {
              text: 'INSERT INTO sales(id, name, symbol, price, datetime, marketplace, fromaddr, toaddr, fromaddrprebalance, fromaddrpostbalance, toaddrprebalance, toaddrpostbalance, programid, mint) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
              values: [tx.signature, metadata!.name, metadata!.symbol, price, datetime, marketplace, fromAddress, toAddress, fromPreBalance/LAMPORTS_PER_SOL, fromPostBalance/LAMPORTS_PER_SOL, toPreBalance/LAMPORTS_PER_SOL, toPostBalance/LAMPORTS_PER_SOL, accountKeys[accountKeys.length - 1], tokenAddress],
            };
            pool.query(query, (err: any, res: any) => {
              console.log(err, res)
              pool.end()
            })
          }

          // Save this data separately into a separate table
          // const response = await fetch(metadata!.uri);
          // const data = await response.json();
          // console.log(data);
        } catch (error) {
          console.log(error);
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
    await getSales(lastSignature);
  }
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
