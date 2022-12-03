import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { URLS } from '../Settings';

export default function CollectionSearchBar({ datalistKey }) {
  const navigate = useNavigate();
  const [collections, setCollections] = useState();

  let getCollectionsTimeout;

  const navigateToCollection = (value) => {
    clearTimeout(getCollectionsTimeout);

    getCollectionsTimeout = setTimeout(() => {
      getCollections(value);
    }, 500);

    const collection = collections?.find(c => c.name === value);
    if (collection) {
      navigate(`collection/${collection.symbol}`);
    }
  }

  const getCollections = async (value) => {
    try {
      const response = await fetch(`${URLS.api}/collection/search/${value}`);
      const collections = await response.json();
      setCollections(collections);
    } catch (error) {
      console.log(error);
    }
  }

  const collectionOptions = collections?.length > 0 ? collections.map((collection) => {
    return (
      <option key={collection.symbol} value={collection.name} />
    )
  }) : null;

  return (
    <div className="w-100">
      <input className="form-control" list={datalistKey} placeholder="Search collections..." onChange={e => navigateToCollection(e.target.value)} />
      <datalist id={datalistKey}>
        {collectionOptions}
      </datalist>
    </div>
  );
};
