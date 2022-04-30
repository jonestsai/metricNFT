export {};

import { PublicKey } from '@solana/web3.js';
import { Account } from "@metaplex-foundation/mpl-core";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";

require('dotenv').config({ path: '/home/server/.env' });
const { Pool } = require('pg');

const { hashLists } = require('./utils/constants');

const anchor = require("@project-serum/anchor");
const anchorConnection = new anchor.web3.Connection(
  "https://ssc-dao.genesysgo.net/"
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
  // Initialize holders
  for (const list in hashLists) {
    const hashList = await getHashList(list);
    await initializeHolders(hashList, hashLists[list]);
  }
}

const getHashList = async (hashList: any) => {
  const rawdata =  await fs.readFileSync(hashList, 'utf8' , (err: any, data: any) => {
    if (err) {
      console.log(err);
      return;
    }
  });
  return JSON.parse(rawdata);
};

const initializeHolders = async (hashList: any, collection: any) => {
  let retryCount: number = 0;
  let count = 0;
  for (let hash of hashList) {
    let nftOwner = await getNftOwner(hash);

    // Retry several times if there's rpc error
    while (!nftOwner && retryCount < 3) {
      nftOwner = await getNftOwner(hash);
      retryCount++;
      console.log(retryCount);

      if (retryCount == 3) {
        // throw new Error('Retry count reached 3 times. RPC error or no owner.');
        console.log('Retry count reached 3 times. RPC error or no owner.');
        break;
      }
    }

    if (!nftOwner) {
      continue;
    }

    const metadataPDA = await Metadata.getPDA(hash);
    let mintAccountInfo:any = await getAccountInfo(metadataPDA);
    while (!mintAccountInfo) {
      mintAccountInfo = await getAccountInfo(metadataPDA);
      console.log('Retrying...');
    }
    const {
      data: { data: metadata }
    } = Metadata.from(new Account(hash, mintAccountInfo));

    console.log('Save to DB');
    const query = {
      text: 'INSERT INTO holder(token_address, collection_symbol, collection_name, owner_address, updated_at, deleted_at) VALUES($1, $2, $3, $4, $5, $6) ON CONFLICT (token_address) DO UPDATE SET owner_address = $4, updated_at = $5',
      values: [hash, collection, metadata!.name, nftOwner, new Date(), null],
    };
    pool.query(query, (err: any, res: any) => {
      console.log(err, res)
    });
    await new Promise(f => setTimeout(f, 500));

    count++;
    console.log(count);

    retryCount = 0;
  }
}

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

const getAccountInfo = async (metadataPDA: any) => {
  let accountInfo;
  try {
    accountInfo = await anchorConnection.getAccountInfo(metadataPDA);
  } catch (e) {
    console.log(e);
    await new Promise(f => setTimeout(f, 500));
  }
  return accountInfo;
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
