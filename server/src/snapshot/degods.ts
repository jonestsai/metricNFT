const { getHashList, save } = require('./lib/helpers-temp');

async function main() {
  const hashList = await getHashList('/home/server/src/collections/degods/hash-list.txt');
  // console.log(hashList);
  await save(hashList, 'DGOD');
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
