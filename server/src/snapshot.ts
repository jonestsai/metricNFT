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
const anchorConnection = new anchor.web3.Connection(
  "https://solana-api.projectserum.com"
);
const genesysgoConnection = new anchor.web3.Connection(
  'https://ssc-dao.genesysgo.net/'
);

const fs = require('fs');

/**
 * Connection to the network
 */
let connection: Connection;

async function main() {
  connection = new Connection(clusterApiUrl('mainnet-beta'));

  // const hashList = await getHashList('/home/server/src/collections/thugbirdz/hash-list.txt');
  // console.log(hashList);
  // await save(hashList, 'THUG');

  // for (let i = 1850; i < 3000; i++) {
  //   const db = await getDB(i);
  // }
  // const db = await getDB(13);

  for (let i = 2123; i <= 2128; i++) {
    await updateCount(i);
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
    let _listOfTokens = await genesysgoConnection.getParsedProgramAccounts(
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

  if (!res) {
    console.log(address);
  }
  return res;
};

const getHashList = async (hashList: any) => {
  const rawdata =  await fs.readFileSync(hashList, 'utf8' , (err: any, data: any) => {
    if (err) {
      console.error(err);
      return;
    }
  });
  return JSON.parse(rawdata);
};

const save = async (hashList: any, collection: any) => {
  const startSnapshotTime = new Date();
  let snapshot = {} as any;
  let count = 0;
  for (let hash of hashList) {
    let nftOwner = await getNftOwner(hash);

    // Retry several times if there's rpc error
    while (!nftOwner) {
      nftOwner = await getNftOwner(hash);
    }
    snapshot[hash] = nftOwner;
    console.log(nftOwner);
    console.log(hash);
    console.log(snapshot[hash]);
    count++;
    console.log(count);
  }
  snapshot = JSON.stringify(snapshot);
  const endSnapshotTime = new Date();
  console.log(endSnapshotTime);

  console.log('Save to DB');
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });
  const query = {
    text: 'INSERT INTO snapshot_test(symbol, starttime, endtime, owners) VALUES($1, $2, $3, $4)',
    values: [collection, startSnapshotTime, endSnapshotTime, snapshot],
  };
  pool.query(query, (err: any, res: any) => {
    console.log(err, res)
    pool.end()
  });

  await new Promise(f => setTimeout(f, 500));
}

const getDB = async (id: any) => {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });
  const query = {
    text: `SELECT * from snapshot WHERE id = ${id}`,
  };

  const results = await pool.query(query, (err: any, res: any) => {
    if (err) {
      console.log(err.stack);
    } else {
      console.log(id);
      console.log(Object.keys(res.rows[0].owners).length); // owner jsonb type
      console.log(res.rows[0].starttime);
      console.log(res.rows[0].endtime);
      // console.log(Object.keys(JSON.parse(res.rows[0].owners)).length); // owner text type
      // console.log(JSON.parse(res.rows[0].owners)['8PcX7pTiD32VBG9be2RRcMK8Ju6GDoF8XiVECEjiEVgk']);
    }
  });
  // console.log(results);
  
  await new Promise(f => setTimeout(f, 500));
}

const updateCount = async (id: any) => {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });
  const query = {
    text: `SELECT * from snapshot WHERE id = ${id}`,
  };

  const results = await pool.query(query, (err: any, res: any) => {
    if (err) {
      console.log(err.stack);
    } else {
      console.log(id);
      console.log(Object.keys(res.rows[0].owners).length); // owner jsonb type
      console.log(res.rows[0].starttime);
      console.log(res.rows[0].endtime);
      // console.log(Object.keys(JSON.parse(res.rows[0].owners)).length); // owner text type
      // console.log(JSON.parse(res.rows[0].owners)['8PcX7pTiD32VBG9be2RRcMK8Ju6GDoF8XiVECEjiEVgk']);

      const snapshot = res.rows[0].owners;

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

      console.log('Save to DB');
      pool.query(`UPDATE snapshot SET listedcount = ${listedCount}, ownerscount = ${ownersCount}, listedmarketplace = '${marketplace}' WHERE id = ${id}`, (err: any, res: any) => {
        console.log(err, res)
        pool.end()
      });
    }
  });
  // console.log(results);
  
  await new Promise(f => setTimeout(f, 500));
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
