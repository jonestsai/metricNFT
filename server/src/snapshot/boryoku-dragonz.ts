const { getHashList, save } = require('./lib/helpers');

async function main() {
  const hashList = await getHashList('/home/server/src/collections/boryoku-dragonz/hash-list.txt');
  // console.log(hashList);
  const magicEdenAPI = 'https://api-mainnet.magiceden.dev/v2/collections/boryoku_dragonz/stats';
  await save(hashList, 'BORYOKU', magicEdenAPI);
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
