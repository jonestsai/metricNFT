export {};

import {
  PublicKey,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
require('dotenv').config({ path: '/home/server/.env' });
const { Pool } = require('pg');

const anchor = require("@project-serum/anchor");
const anchorConnection = new anchor.web3.Connection(
  "https://solana-api.projectserum.com"
);
const genesysgoConnection = new anchor.web3.Connection(
  'https://ssc-dao.genesysgo.net/'
);

const fetch = require('node-fetch');
const fs = require('fs');

const getHashList = async (hashList: any) => {
  const rawdata =  await fs.readFileSync(hashList, 'utf8' , (err: any, data: any) => {
    if (err) {
      console.log(err);
      return;
    }
  });
  return JSON.parse(rawdata);
};

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

const save = async (hashList: any, collection: any, magicEdenAPI: any) => {
  const startSnapshotTime = new Date();
  let snapshot = {} as any;
  let retryCount: number = 0;
  let count = 0;
  for (let hash of hashList) {
    let nftOwner = await getNftOwner(hash);

    // Retry several times if there's rpc error
    while (!nftOwner && retryCount < 50) {
      nftOwner = await getNftOwner(hash);
      retryCount++;
      console.log(retryCount);

      if (retryCount == 50) {
        throw new Error('Retry count reached 50 times. RPC error.');
      }
    }
    snapshot[hash] = nftOwner;
    console.log(nftOwner);
    console.log(hash);
    console.log(snapshot[hash]);

    count++;
    console.log(count);

    retryCount = 0;
  }

  let snapshotCount: any = {};

  for (let owner in snapshot){
    // const key: any = Object.keys(owner);
    snapshotCount[snapshot[owner]] = {
      count: snapshotCount[snapshot[owner]] ? snapshotCount[snapshot[owner]].count + 1 : 1,
    }
  }

  const magicEden = snapshotCount['GUfCR9mK6azb9vcpsxgXyj7XRPAKJd4KMHTTVvtncGgp']?.count || 0;
  const magicEdenV2 = snapshotCount['1BWutmTvYPwDtmw9abTkS4Ssr8no61spGAvW1X6NDix']?.count || 0;
  const solanart = snapshotCount['3D49QorJyNaL4rcpiynbuS3pRH4Y7EXEM6v6ZGaqfFGK']?.count || 0;
  const digitalEyes = snapshotCount['F4ghBzHFNgJxV4wEQDchU5i7n4XWWMBSaq7CuswGiVsr']?.count || 0;
  const alphaArt = snapshotCount['4pUQS4Jo2dsfWzt3VgHXy3H6RYnEDd11oWPiaM2rdAPw']?.count || 0;
  const FTX = snapshotCount['73tF8uN3BwVzUzwETv59WNAafuEBct2zTgYbYXLggQiU']?.count || 0;
  const SMB = snapshotCount['7Ppgch9d4XRAygVNJP4bDkc7V6htYXGfghX4zzG9r4cH']?.count || 0;
  const listedCount = magicEden + magicEdenV2 + solanart + digitalEyes + alphaArt + FTX + SMB;
  console.log('magicEden: '+magicEden);
  console.log('magicEdenV2: '+magicEdenV2);
  console.log('solanart: '+solanart);
  console.log('digitalEyes: '+digitalEyes);
  console.log('alphaArt: '+alphaArt);
  console.log('FTX: '+FTX);
  console.log('SMB: '+SMB);
  console.log(listedCount);
  const ownersCount = Object.values(snapshotCount).length;
  console.log(ownersCount);

  let marketplace: any = {
    magicEden,
    magicEdenV2,
    solanart,
    digitalEyes,
    alphaArt,
    FTX,
    SMB,        
  };
  marketplace = JSON.stringify(marketplace);
  console.log(marketplace);

  snapshot = JSON.stringify(snapshot);
  const endSnapshotTime = new Date();
  console.log(endSnapshotTime);

  let floorPrice: any;

  try {
    const response = await fetch(magicEdenAPI);
    const collection = await response.json();
    floorPrice = collection.floorPrice / LAMPORTS_PER_SOL;
    console.log(floorPrice);
  } catch (err) {
    console.log(err);
  }

  console.log('Save to DB');
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });
  const query = {
    text: 'INSERT INTO snapshot_test(symbol, starttime, endtime, listedcount, ownerscount, listedmarketplace, floorprice) VALUES($1, $2, $3, $4, $5, $6, $7)',
    values: [collection, startSnapshotTime, endSnapshotTime, listedCount, ownersCount, marketplace, floorPrice],
  };
  pool.query(query, (err: any, res: any) => {
    console.log(err, res)
    pool.end()
  });

  await new Promise(f => setTimeout(f, 500));
}

module.exports = {
  getHashList,
  save,
};
