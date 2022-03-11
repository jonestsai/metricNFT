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
const { Pool } = require('pg')

const anchor = require("@project-serum/anchor");
const anchorConnection = new anchor.web3.Connection(
  "https://solana-api.projectserum.com"
);
const genesysgoConnection = new anchor.web3.Connection(
  'https://ssc-dao.genesysgo.net/'
);

const fs = require('fs');
require('dotenv').config();

/**
 * Connection to the network
 */
let connection: Connection;

async function main() {
  connection = new Connection(clusterApiUrl('mainnet-beta'));

  const account = await connection.getTokenLargestAccounts(new PublicKey('HCtiWFmT3ytpaWcY51re6TrvQwMUNHHDzvukKJSL2amV'));
  const accountAddr = account!.value![0]!.address.toString();

  // const data = await connection.getAccountInfo(new PublicKey(accountAddr));
  // console.log(data);
  // console.log(data!.owner.toString());

  // const tokenAddress = 'HCtiWFmT3ytpaWcY51re6TrvQwMUNHHDzvukKJSL2amV';
  // const metadataPDA = await Metadata.getPDA(tokenAddress);
  // const mintAccountInfo:any = await connection.getAccountInfo(metadataPDA);
  // const data = Metadata.from(new Account(tokenAddress, mintAccountInfo));
  // console.log(metadataPDA.toString());

  // await solanaMainRPC('9jdNJL6Gqf4poAKPxSoZv5h9vXHznHSwrjJGvCPMsV9e');
  // await genesysgoRPC('HyyUwkpUvfePrTKCnxBdopf31tXtEHTMfDbbNGySTvmL');
  // const db = await getDB(3);
}

const genesysgoRPC = async (address: any) => {
  const TOKEN_PUBKEY = new PublicKey(
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
  );
  let res;

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
      console.log(res);
    }
  }
}

const solanaMainRPC = async (address: any) => {
  const TOKEN_PUBKEY = new PublicKey(
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
  );
  let res;

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
  let _listOfTokens = await connection.getParsedProgramAccounts(
    TOKEN_PUBKEY,
    programAccountsConfig
  );

  for (let i = 0; i < _listOfTokens.length; i++) {
    if (
      (_listOfTokens[i]["account"]["data"] as any)["parsed"]["info"]["tokenAmount"][
        "amount"
      ] == 1
    ) {
      res = (_listOfTokens[i]["account"]["data"] as any)["parsed"]["info"]["owner"];
      console.log(res);
    }
  }
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
    text: `SELECT * from snapshot_test WHERE id = ${id}`,
  };

  const results = await pool.query(query, (err: any, res: any) => {
    if (err) {
      console.log(err.stack);
    } else {
      console.log(id);
      // console.log(Object.keys(JSON.parse(res.rows[0].owners)).length);
      console.log(res.rows[0].starttime);
      console.log(res.rows[0].endtime);
      // console.log(JSON.stringify(Object.keys(JSON.parse(res.rows[0].owners))));
      // console.log(JSON.parse(res.rows[0].owners)['8PcX7pTiD32VBG9be2RRcMK8Ju6GDoF8XiVECEjiEVgk']);

      // fs.writeFile('/home/server/src/test.txt', content, err => {
      //   if (err) {
      //     console.error(err);
      //     return;
      //   }
      //   //file written successfully
      // });
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
