const { getHashList, save } = require('./lib/helpers');

async function main() {
  const hashList = await getHashList('/home/server/src/collections/thugbirdz/hash-list.txt');
  // console.log(hashList);
  await save(hashList, 'THUG');
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);
