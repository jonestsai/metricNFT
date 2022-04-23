export {};

import { PublicKey } from '@solana/web3.js';

require('dotenv').config({ path: '/home/server/.env' });
const { Pool } = require('pg');

const anchor = require("@project-serum/anchor");
const anchorConnection = new anchor.web3.Connection(
  "https://solana-api.projectserum.com"
);

const fetch = require('node-fetch');
const fs = require('fs');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function main() {
  // Update holders
  await updateHolders();

  // const sales = await getSales('DAPE');
}

const updateHolders = async () => {
  const { rows } = await pool.query(`
    SELECT * FROM holder
    ORDER BY updated_at ASC`);
  // console.log(rows);

  for (let row of rows) {
    const { token_address, owner_address } = row;

    let retryCount: number = 0;
    let nftOwner = await getNftOwner(token_address);

    // Retry several times if there's rpc error
    while (!nftOwner && retryCount < 50) {
      nftOwner = await getNftOwner(token_address);
      retryCount++;
      console.log(retryCount);

      if (retryCount == 50) {
        throw new Error('Retry count reached 50 times. RPC error.');
      }
    }

    if (owner_address !== nftOwner) {
      console.log(`Token Address: ${token_address}`);
      console.log(`Old Holder Address: ${owner_address}`);
      console.log(`New Holder Address: ${nftOwner}`);
      pool.query(`UPDATE holder SET owner_address = '${nftOwner}', updated_at = NOW() WHERE token_address = '${token_address}'`, (err: any, res: any) => {
        console.log(err, res)
      });
      await new Promise(f => setTimeout(f, 500));
    }
  }
};

// const getSales = async (collection: any) => {
//   const { rows } = await pool.query(`
//     SELECT * FROM sales
//     JOIN collection ON sales.symbol = collection.symbol
//     WHERE sales.symbol = '${collection}' AND sales.price > collection.minprice
//     ORDER BY sales.datetime ASC`);
//   // console.log(rows);

//   for (let row of rows) {
//     const { mint, toaddr, datetime } = row;
//     console.log(mint);
//     pool.query(`UPDATE holder_temp SET owner_address = '${toaddr}', updated_at = '${datetime}' WHERE token_address = '${mint}'`, (err: any, res: any) => {
//       console.log(err, res)
//     });
//     await new Promise(f => setTimeout(f, 500));
//   }
// };

const getNftOwner = async (address: any) => {
  const TOKEN_PUBKEY = new PublicKey(
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
  );
  let res;

  try {
    let filter = {
      memcmp: {
        offset: 0,
        bytes: address,
      },
    };
    let filter2 = {
      dataSize: 165,
    };
    let getFilter = [filter, filter2];
    let programAccountsConfig = { filters: getFilter, encoding: "jsonParsed" };
    let _listOfTokens = await anchorConnection.getParsedProgramAccounts(
      TOKEN_PUBKEY,
      programAccountsConfig
    );

    for (let i = 0; i < _listOfTokens.length; i++) {
      if (
        _listOfTokens[i]["account"]["data"]["parsed"]["info"]["tokenAmount"][
          "amount"
        ] == 1
      ) {
        res = _listOfTokens[i]["account"]["data"]["parsed"]["info"]["owner"];
        // console.log(res);
      }
    }
  } catch (e) {
    console.log('Failed');
    console.log(e);
    await new Promise(f => setTimeout(f, 500));
  }
  
  return res;
};

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
