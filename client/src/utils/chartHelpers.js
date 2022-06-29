import { LAMPORTS_PER_SOL } from './constants';

export function getListedCount(collection) {
  return collection.length > 0
  ? collection.reduce((listedCount, detail) => {
    const { start_time, listed_count } = detail;
    const datetime = new Date(start_time);
    const date = datetime.getUTCDate();
    const month = datetime.toLocaleString('default', { month: 'short', timeZone: 'UTC' });

    if (listed_count !== null) {
      listedCount.push({ date: `${date}. ${month}`, 'Total Listed': Number(listed_count) });
    }

    return listedCount;
  }, [])
  : null;
};

export function getOwnersCount(collection) {
  return collection.length > 0
  ? collection.reduce((ownersCount, detail) => {
    const { start_time, unique_holders, howrare_holders } = detail;
    const datetime = new Date(start_time);
    const date = datetime.getUTCDate();
    const month = datetime.toLocaleString('default', { month: 'short', timeZone: 'UTC' });
    const holders = howrare_holders || unique_holders;

    if (holders !== null) {
      ownersCount.push({ date: `${date}. ${month}`, 'Total Owners': Number(holders) });
    }

    return ownersCount;
  }, [])
  : null;
};

export function getPrice(collection) {
  let lastPrice;
  let updatedPrice;
  return collection.length > 0
  ? collection.reduce((price, detail) => {
    const { start_time, floor_price } = detail;
    const datetime = new Date(start_time);
    const date = datetime.getUTCDate();
    const month = datetime.toLocaleString('default', { month: 'short', timeZone: 'UTC' });
    updatedPrice = Number(Number(floor_price / LAMPORTS_PER_SOL)?.toFixed(2));

    if (updatedPrice == 0) {
      updatedPrice = lastPrice;
    }

    lastPrice = updatedPrice;

    if (updatedPrice !== null) {
      price.push({ date: `${date}. ${month}`, 'Price': updatedPrice });
    }

    return price;
  }, [])
  : null;
};

export function getSalesVolume(collection) {
  return collection.length > 0
  ? collection.reduce((salesVolume, detail) => {
    const { start_time, _24hvolume } = detail;
    const datetime = new Date(start_time);
    const date = datetime.getUTCDate();
    const month = datetime.toLocaleString('default', { month: 'short', timeZone: 'UTC' });

    if (_24hvolume !== null) {
      salesVolume.push({ date: `${date}. ${month}`, 'Volume': Number(_24hvolume / LAMPORTS_PER_SOL) });
    }

    return salesVolume;
  }, [])
  : null;
};
