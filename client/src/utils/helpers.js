export function isCurrencyString(string) { // Does the string consists of 0-9, comma, period, or currency symbols
  return /^[0-9,.$€₿Ξ]*$/.test(string) && typeof string === 'string';
}

export function currencyToNumber(string) {
	return Number(string.replace(/,|\$|€|₿|Ξ/g, ''));
}
