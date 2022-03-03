const { getHashList, save } = require('./lib/helpers');

async function main() {
  const hashList = await getHashList('/home/server/src/collections/nyan-heroes/hash-list.txt');
  // console.log(hashList);
  await save(hashList, 'Nyan');
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
