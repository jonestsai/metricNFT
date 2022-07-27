export function isCurrencyString(string) { // Does the string consists of 0-9, comma, period, or currency symbols
  return /^[0-9,.$€₿Ξ]*$/.test(string) && typeof string === 'string';
}

export function currencyToNumber(string) {
  return Number(string.replace(/,|\$|€|₿|Ξ/g, ''));
}

export function getTopOwnersByQuantity(owners, ownersCount) {
  const counts = {};

  Object.values(owners).map((owner) => {
    counts[owner] = counts[owner] ? counts[owner] + 1 : 1;
  });

  const sortedByCount = Object.keys(counts).sort((a, b) => {
    return counts[b] - counts[a];
  });

  const topOwners = sortedByCount.slice(0, ownersCount);

  return topOwners.map((key) => ({ [key]: counts[key] }));
};
