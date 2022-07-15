import { LAMPORTS_PER_SOL } from './constants';

export function getListedCount(chain, collection) {
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

export function getOwnersCount(chain, collection) {
  return collection.length > 0
  ? collection.reduce((ownersCount, detail) => {
    const { start_time, unique_holders, howrare_holders, num_owners } = detail;
    const datetime = new Date(start_time);
    const date = datetime.getUTCDate();
    const month = datetime.toLocaleString('default', { month: 'short', timeZone: 'UTC' });
    const holders = chain === 'solana' ? (howrare_holders || unique_holders) : num_owners;

    if (holders !== null) {
      ownersCount.push({ date: `${date}. ${month}`, 'Total Owners': Number(holders) });
    }

    return ownersCount;
  }, [])
  : null;
};

export function getPrice(chain, collection) {
  let lastPrice;
  let updatedPrice;
  return collection.length > 0
  ? collection.reduce((price, detail) => {
    const { start_time, floor_price } = detail;
    const datetime = new Date(start_time);
    const date = datetime.getUTCDate();
    const month = datetime.toLocaleString('default', { month: 'short', timeZone: 'UTC' });
    updatedPrice = chain === 'solana' ? Number(Number(floor_price / LAMPORTS_PER_SOL)?.toFixed(2)) : Number(Number(floor_price)?.toFixed(2));

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

export function getSalesVolume(chain, collection) {
  return collection.length > 0
  ? collection.reduce((salesVolume, detail) => {
    const { start_time, _24hvolume, one_day_volume } = detail;
    const datetime = new Date(start_time);
    const date = datetime.getUTCDate();
    const month = datetime.toLocaleString('default', { month: 'short', timeZone: 'UTC' });

    if (_24hvolume !== null) {
      const oneDayVolume = _24hvolume < 0 ? 0 : _24hvolume;
      const volume = chain === 'solana' ? Number(oneDayVolume / LAMPORTS_PER_SOL) : Number(one_day_volume);
      salesVolume.push({ date: `${date}. ${month}`, 'Volume': volume });
    }

    return salesVolume;
  }, [])
  : null;
};

export function ListedCountTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-light text-dark rounded opacity-75 p-2">
        <div className="text-start">{label}</div>
        <div className="text-start">{`Total Listed: ${payload[0].value}`}</div>
      </div>
    );
  }

  return null;
};

export function OwnersCountTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-light text-dark rounded opacity-75 p-2">
        <div className="text-start">{label}</div>
        <div className="text-start">{`Total Owners: ${payload[0].value}`}</div>
      </div>
    );
  }

  return null;
};

export function PriceTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-light text-dark rounded opacity-75 p-2">
        <div className="text-start">{label}</div>
        <div className="text-start">{`Floor Price: ${payload[0].value}`}</div>
      </div>
    );
  }

  return null;
};

export function SalesVolumeTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-light text-dark rounded opacity-75 p-2">
        <div className="text-start">{label}</div>
        <div className="text-start">{`Volume: ${Number(payload[0].value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2} )}`}</div>
      </div>
    );
  }

  return null;
};