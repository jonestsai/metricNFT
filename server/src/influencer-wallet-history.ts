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
const customConnection = new anchor.web3.Connection(
  'https://solana--mainnet.datahub.figment.io/apikey/72194b21b1ed56d33b6135399463dc35'
);

/**
 * Connection to the network
 */
let connection: Connection;

async function main() {
  // connection = new Connection(clusterApiUrl('mainnet-beta'));
  connection = customConnection;

  // Get sale transactions and store to influencer wallet history table
  await getTransactions('Ez2U27TRScksd6q7xoVgX44gX9HAjviN2cdKAL3cFBFE', null);
}

const getTransactions = async (address:any, beforeSignature:any) => {
  const publicKey = new PublicKey(address);
  const twitterUsername = '0xBrando';
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

    if (transaction?.meta?.err === null) {
      // console.log(transaction!.meta!.err);

      const blockTime = transaction!.blockTime!;
      const datetime = new Date(blockTime*1000);
      // console.log(datetime);

      const marketplace: any = getMarketPlace(transaction!.transaction!.message!.accountKeys);

      let fromAddress: any = null;
      let fromPreBalance: number = NaN;
      let fromPostBalance: number = NaN;
      let toAddress: any = null;
      let toPreBalance: number = NaN;
      let toPostBalance: number = NaN;

      const accountKeys = transaction!.transaction!.message!.accountKeys.map((accountKey) => accountKey.toString());
      // console.log(accountKeys);

      const postBalances = transaction!.meta!.postBalances;
      const preBalances = transaction!.meta!.preBalances;
      const balanceChange = postBalances.map((postBalance, index) => {
        return postBalance - preBalances[index];
      })
      // console.log(balanceChange);

      const highestBalanceChange = Math.max(...balanceChange);
      const lowestBalanceChange = Math.min(...balanceChange);
        
      let sol = 0;
      sol = Math.abs(lowestBalanceChange/LAMPORTS_PER_SOL);
      // console.log(sol);
      let spl = 0;

      if (sol > 0.2) {
        if (moreThanOneReceiver(balanceChange) && !marketplace) {
          console.log('More than one receiver, skipping');
          continue;
        }
        fromAddress = accountKeys[balanceChange.indexOf(lowestBalanceChange)];
        fromPreBalance = preBalances[balanceChange.indexOf(lowestBalanceChange)] / LAMPORTS_PER_SOL;
        fromPostBalance = postBalances[balanceChange.indexOf(lowestBalanceChange)] / LAMPORTS_PER_SOL;
        toAddress = accountKeys[balanceChange.indexOf(highestBalanceChange)];
        toPreBalance = preBalances[balanceChange.indexOf(highestBalanceChange)] / LAMPORTS_PER_SOL;
        toPostBalance = postBalances[balanceChange.indexOf(highestBalanceChange)] / LAMPORTS_PER_SOL;
      } else {
        const preTokenBalance1 = transaction?.meta?.preTokenBalances![0] as any;
        const preTokenBalance1Amount = Number(preTokenBalance1?.uiTokenAmount?.amount);
        const preTokenBalance2 = (transaction?.meta?.preTokenBalances)?.find((preTokenBalance) => {
          return preTokenBalance?.owner !== preTokenBalance1?.owner;
        });
        const preTokenBalance2Amount = Number(preTokenBalance2?.uiTokenAmount?.amount);
        const postTokenBalance1 = (transaction?.meta?.postTokenBalances)?.find((postTokenBalance) => {
          return postTokenBalance?.owner === preTokenBalance1?.owner;
        });
        const postTokenBalance1Amount = Number(postTokenBalance1?.uiTokenAmount?.amount);
        const postTokenBalance2 = (transaction?.meta?.postTokenBalances)?.find((postTokenBalance) => {
          return postTokenBalance?.owner !== preTokenBalance1?.owner;
        });
        const postTokenBalance2Amount = Number(postTokenBalance2?.uiTokenAmount?.amount);
        const postTokenBalance3 = (transaction?.meta?.postTokenBalances)?.find((postTokenBalance) => {
          return postTokenBalance?.owner !== postTokenBalance1?.owner && postTokenBalance?.owner !== postTokenBalance2?.owner;
        });
        if (postTokenBalance3) {
          console.log('More than one owner, skipping');
          continue;
        }
        // console.log(preTokenBalance1);
        // console.log(preTokenBalance2);
        // console.log(postTokenBalance1);
        // console.log(postTokenBalance2);
        if (postTokenBalance1Amount || postTokenBalance1Amount === 0) {
          fromAddress = preTokenBalance1Amount > postTokenBalance1Amount ? postTokenBalance1?.owner : postTokenBalance2?.owner;
          fromPreBalance = preTokenBalance1Amount > postTokenBalance1Amount ? preTokenBalance1Amount : preTokenBalance2Amount;
          fromPostBalance = preTokenBalance1Amount > postTokenBalance1Amount ? postTokenBalance1Amount : postTokenBalance2Amount;
          toAddress = preTokenBalance1Amount > postTokenBalance1Amount ? postTokenBalance2?.owner : postTokenBalance1?.owner;
          toPreBalance = preTokenBalance1Amount > postTokenBalance1Amount ? preTokenBalance2Amount : preTokenBalance1Amount;
          toPostBalance = preTokenBalance1Amount > postTokenBalance1Amount ? postTokenBalance2Amount : postTokenBalance1Amount;
          spl = fromPreBalance - fromPostBalance;
        }
      }

      // console.log(fromAddress);
      // console.log(fromPreBalance);
      // console.log(fromPostBalance);
      // console.log(toAddress);
      // console.log(toPreBalance);
      // console.log(toPostBalance);

      // console.log(accountKeys[accountKeys.length - 1]);
      // console.log(accountKeys);
      // console.log(transaction!.transaction!.message!.instructions);
      // console.log(transaction!.meta!.preBalances);
      // console.log(transaction!.meta!.postBalances);
      // console.log(transaction!.meta!.preTokenBalances);
      // console.log(transaction!.meta!.postTokenBalances);

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

      const tokenAddress = preTokenBalances?.mint;
      if (fromAddress && toAddress) {
        if (tokenAddress) {
          try {
            const metadataPDA = await Metadata.getPDA(tokenAddress);
            const mintAccountInfo:any = await connection.getAccountInfo(metadataPDA);
            const {
              data: { data: metadata }
            } = Metadata.from(new Account(tokenAddress, mintAccountInfo));
            // console.log(metadata);
            console.log(metadata!.name);
            console.log(metadata!.symbol);

            saveToDB(tx.signature, twitterUsername, address, metadata!.name, metadata!.symbol, sol, spl, datetime, marketplace, fromAddress, toAddress, fromPreBalance, fromPostBalance, toPreBalance, toPostBalance, accountKeys[accountKeys.length - 1], tokenAddress);
          } catch (error) {
            console.log(error);
            try {
              saveToDB(tx.signature, twitterUsername, address, '', '', sol, spl, datetime, marketplace, fromAddress, toAddress, fromPreBalance, fromPostBalance, toPreBalance, toPostBalance, accountKeys[accountKeys.length - 1], tokenAddress);
            } catch (error) {
              console.log(error);
            }
          }
        } else {
          try {
            saveToDB(tx.signature, twitterUsername, address, '', '', sol, spl, datetime, marketplace, fromAddress, toAddress, fromPreBalance, fromPostBalance, toPreBalance, toPostBalance, accountKeys[accountKeys.length - 1], tokenAddress);
          } catch (error) {
            console.log(error);
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
  if (count > 1) {
    count = 0;
    await getTransactions(address, lastSignature);
  }
}

const getMarketPlace = (accountKeys: PublicKey[]) => {
  const magicEdenProgram = 'MEisE1HzehtrDpAAT8PnLHjpSSkRYakotTuJRPjTpo8';
  const magicEdenProgram2 = 'M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K';
  const solanartProgram = 'CJsLwbP1iu5DuUikHEJnLfANgKy6stB2uFgvBBHoyxwz';
  const solseaProgram = '617jbWo616ggkDxvW1Le8pV38XLbVSyWY8ae6QUmGBAU';
  const alphaArtProgram = 'HZaWndaNWHFDd9Dhk5pqUUtsmoBCqzb1MLu3NAh1VX6B';
  const digitalEyesProgram = 'A7p8451ktDCHq5yYaHczeLMYsjRsAkzc3hCXcSrwYHU7';
  const yawwwProgram = '5SKmrbAxnHV2sgqyDXkGrLrokZYtWWVEEk5Soed7VLVN';
  const solventProgram = 'SVTy4zMgDPExf1RaJdoCo5HvuyxrxdRsqF1uf2Rcd7J';
  const hyperspaceProgram = 'HYPERfwdTjyJ2SCaKHmpF2MtrXqWxrsotYDsTrshHWq8';
  const auctionHouseProgram = 'hausS13jsjafwWwGqZTUQRmWyvyxn9EQpqMwV1PBBmk';
  let accountKey = (accountKeys)!.find((accountKey) => {
    return accountKey.toBase58() === magicEdenProgram
      || accountKey.toBase58() === magicEdenProgram2
      || accountKey.toBase58() === solanartProgram
      || accountKey.toBase58() === solseaProgram
      || accountKey.toBase58() === alphaArtProgram
      || accountKey.toBase58() === digitalEyesProgram
      || accountKey.toBase58() === yawwwProgram
      || accountKey.toBase58() === solventProgram
      || accountKey.toBase58() === hyperspaceProgram
      || accountKey.toBase58() === auctionHouseProgram;
  });

  let marketplace: any = null;

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
  if (accountKey?.toString() === yawwwProgram) {
    marketplace = 'YAWWW';
  }
  if (accountKey?.toString() === solventProgram) {
    marketplace = 'Solvent';
  }
  if (accountKey?.toString() === hyperspaceProgram) {
    marketplace = 'Hyperspace';
  }
  if (accountKey?.toString() === auctionHouseProgram) {
    marketplace = 'AuctionHouse';
  }
  // console.log(marketplace);
  return marketplace;
}

const moreThanOneReceiver = (balanceChange: number[]) => {
  let receivedBalance = 0;
  for (const balance of balanceChange) {
    if (receivedBalance && balance/LAMPORTS_PER_SOL > 0.2) {
      return true;
    }
    if (balance/LAMPORTS_PER_SOL > 0.2) {
      receivedBalance = balance;
    }
  }
  return false;
}

const saveToDB = (signature: string, twitterUsername: string, address: string, name: string, symbol: string, sol: number, spl: number, datetime: Date, marketplace: any, fromAddress: any, toAddress: any, fromPreBalance: number, fromPostBalance: number, toPreBalance: number, toPostBalance: number, accountKeys: string, tokenAddress: any) => {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  const query = {
    text: 'INSERT INTO influencer_wallet_history(signature, twitter_username, address, name, symbol, sol, spl, datetime, marketplace, from_addr, to_addr, from_addr_prebalance, from_addr_postbalance, to_addr_prebalance, to_addr_postbalance, program_id, mint) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)',
    values: [signature, twitterUsername, address, name, symbol, sol, spl, datetime, marketplace, fromAddress, toAddress, fromPreBalance, fromPostBalance, toPreBalance, toPostBalance, accountKeys, tokenAddress],
  };

  pool.query(query, (err: any, res: any) => {
    console.log(err, res)
    pool.end()
  });
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
