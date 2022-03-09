const { getHashList, save } = require('./lib/helpers');

async function main() {
  const hashList = await getHashList('/home/server/src/collections/mindfolk/hash-list.txt');
  // console.log(hashList);
  await save(hashList, 'MNDFLK');
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
