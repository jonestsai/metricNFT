export function isCurrencyString(string) { // Does the string consists of 0-9, comma, period, or currency symbols
  return /^[0-9,.$€₿Ξ]*$/.test(string) && typeof string === 'string';
}

export function currencyToNumber(string) {
  return Number(string.replace(/,|\$|€|₿|Ξ/g, ''));
}

export function getTopOwnersByQuantity(owners, ownersCount) {
  const quantity = {};

  Object.values(owners).map((owner) => {
    quantity[owner] = quantity[owner] ? quantity[owner] + 1 : 1;
  });

  const sortedByCount = Object.keys(quantity).sort((a, b) => {
    return quantity[b] - quantity[a];
  });

  const topOwners = sortedByCount.slice(0, ownersCount);

  return topOwners.reduce((owners, key) => ({
    ...owners,
    [key]: quantity[key],
  }), {});
};
