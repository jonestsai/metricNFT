const { getHashList, save } = require('./lib/helpers');

async function main() {
  const hashList = await getHashList('/home/server/src/collections/taiyo-robotics/hash-list.txt');
  // console.log(hashList);
  const magicEdenAPI = 'https://api-mainnet.magiceden.dev/v2/collections/taiyo_robotics/stats';
  await save(hashList, 'TAIYO', magicEdenAPI);
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
