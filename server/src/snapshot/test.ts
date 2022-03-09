const { getHashList, save } = require('./lib/helpers-test');

async function main() {
  const hashList = await getHashList('/home/server/src/collections/mindfolk/hash-list.txt');
  // console.log(hashList);
  const magicEdenAPI = 'https://api-mainnet.magiceden.io/rpc/getCollectionEscrowStats/mindfolk?edge_cache=true';
  await save(hashList, 'MNDFLK', magicEdenAPI);
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
