import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
} from '@solana/web3.js';
// import { Connection } from "@metaplex/js";
import { Account } from "@metaplex-foundation/mpl-core";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";

const fetch = require('node-fetch');
const { Pool } = require('pg');
const fs = require('fs');

/**
 * Connection to the network
 */
let connection: Connection;

async function main() {
  connection = new Connection(clusterApiUrl('mainnet-beta'));

  // Get sale transactions and store to sales table
  await getSales('jJGKFK9wfczNjRaB2LpuSKVZww6TqtBwGAFkp8Uie56Fyp69hjryQBokqiMvQu6dXnkyK2dRKDsEv9GzXsFCbwm');
  // await getHashList(null);
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
  // const publicKey = new PublicKey('DC2mkgwhy56w3viNtHDjJQmc7SGu2QX785bS4aexojwX'); // DAA hash_list
  const publicKey = new PublicKey('9uBX3ASjxWvNBAD1xjbVaKA74mWGZys3RGSF7DdeDD3F'); // SMB hash_list
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
      if (!preTokenBalances) {
        preTokenBalances = transaction!.meta!.preTokenBalances![0] as any;
      }

      // temp
      const postTokenBalances = transaction!.meta!.postTokenBalances![0] as any;

      if (postTokenBalances?.mint) { //preTokenBalances?.mint
        try {
          const tokenAddress = postTokenBalances?.mint; //preTokenBalances?.mint
          const metadataPDA = await Metadata.getPDA(tokenAddress);
          const mintAccountInfo:any = await connection.getAccountInfo(metadataPDA);
          const {
            data: { data: metadata }
          } = Metadata.from(new Account(tokenAddress, mintAccountInfo));
          // console.log(metadata);
          console.log(metadata!.name);
          console.log(metadata!.symbol);

          // Save to db
          // if (fromPostBalance !== 0 && preTokenBalances?.mint) {
            console.log('Save to DB');
            const pool = new Pool({
              user: '***REMOVED***',
              host: 'localhost',
              database: 'metricnft',
              password: '***REMOVED***',
              port: ***REMOVED***,
            });
            const query = {
              text: 'INSERT INTO hash_list(id, name, symbol, price, datetime, marketplace, fromaddr, toaddr, fromaddrprebalance, fromaddrpostbalance, toaddrprebalance, toaddrpostbalance, programid, mint) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
              values: [tx.signature, metadata!.name, metadata!.symbol, price, datetime, marketplace, fromAddress, toAddress, fromPreBalance/LAMPORTS_PER_SOL, fromPostBalance/LAMPORTS_PER_SOL, toPreBalance/LAMPORTS_PER_SOL, toPostBalance/LAMPORTS_PER_SOL, accountKeys[accountKeys.length - 1], tokenAddress],
            };
            pool.query(query, (err: any, res: any) => {
              console.log(err, res)
              pool.end()
            })
          // }

          // Save this data separately into a separate table
          // const response = await fetch(metadata!.uri);
          // const data = await response.json();
          // console.log(data);
        } catch (error) {
          console.log(error)
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

const getHashList = async (a:any) => {
  const pool = new Pool({
    user: '***REMOVED***',
    host: 'localhost',
    database: 'metricnft',
    password: '***REMOVED***',
    port: ***REMOVED***,
  });
  const query = {
    text: `SELECT * from hash_list WHERE symbol = 'DAPE'`,
  };

  const results = await pool.query(query, (err: any, res: any) => {
    if (err) {
      console.log(err.stack);
    } else {
      let hashList = new Array();
      for (let row of res.rows) {
        // console.log(row);
        // console.log(row.mint);
        hashList.push(row.mint);
      }

      fs.writeFile('src/hash-list.json', JSON.stringify(hashList), function(err: any) {
        if (err) {
          return console.error(err);
        }
        console.log("File created!");
      });
    }
  });
  // console.log(results);
  
  await new Promise(f => setTimeout(f, 500));

  // const hashList = results!.rows.map((row:any) => {
  //   return row!.mint;
  // });

  // console.log(results.!rows);
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
