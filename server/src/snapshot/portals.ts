const { getHashList, save } = require('./lib/helpers');

async function main() {
  const hashList = await getHashList('/home/server/src/collections/portals/hash-list.txt');
  // console.log(hashList);
  const magicEdenAPI = 'https://api-mainnet.magiceden.dev/v2/collections/portals/stats';
  await save(hashList, 'PRTL', magicEdenAPI);
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
