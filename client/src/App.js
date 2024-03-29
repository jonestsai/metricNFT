import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
    LedgerWalletAdapter,
    PhantomWalletAdapter,
    SlopeWalletAdapter,
    SolflareWalletAdapter,
    SolletExtensionWalletAdapter,
    SolletWalletAdapter,
    TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import {
    WalletModalProvider,
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import React, { useState, useEffect, useMemo } from 'react';
import ReactGA from 'react-ga';
import { hotjar } from 'react-hotjar';
import { NavLink, Routes, Route, useLocation, useSearchParams } from 'react-router-dom';

import Top from './components/layout/Top';
import Bottom from './components/layout/Bottom';
import { URLS } from './Settings';
import usePageTracking from './utils/usePageTracking';
import { LAMPORTS_PER_SOL } from './utils/constants';
import Collection from './views/Collection';
import Account from './views/Account';
import Home from './views/Home';
import Watchlist from './views/Watchlist';
import Influencers from './views/Influencers';
import InfluencerDetail from './views/InfluencerDetail';
import logo from './logo.svg';
import './App.css';

// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');

export default function App() {
  usePageTracking();

  const [magicedenCollections, setMagicedenCollections] = useState();
  const [openseaCollections, setOpenseaCollections] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    document.body.style.backgroundColor = "#212529";
    document.body.style.color = "white";
    hotjar.initialize('3261893', '6');
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    setIsLoading(true);

    try {
      const [magiceden, opensea] = await Promise.all([
        fetch(`${URLS.api}/magiceden`),
        fetch(`${URLS.api}/opensea`),
      ]);
      const magicedenCollections = await magiceden.json();
      const openseaCollections = await opensea.json();

      setMagicedenCollections(magicedenCollections);
      setOpenseaCollections(openseaCollections);
    } catch (error) {
      // Do nothing
    } finally {
      setIsLoading(false);
    }
  }

  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
  // Only the wallets you configure here will be compiled into your application, and only the dependencies
  // of wallets that your users connect to will be loaded.
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SlopeWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
      new SolletWalletAdapter({ network }),
      new SolletExtensionWalletAdapter({ network }),
    ],
    [network]
  );

  const partner = searchParams.get('partner');

  return (
    <div className="App">
      {/*<Navigation />*/}
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <Top partner={partner} />
            <Main
              magicedenCollections={magicedenCollections}
              openseaCollections={openseaCollections}
              isLoading={isLoading}
              partner={partner}
            />
            <Bottom partner={partner} />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </div>
  );
}

const Navigation = () => (
  <nav>
  <ul>
  <li><NavLink to='/'>Home</NavLink></li>
  <li><NavLink to='/about'>About</NavLink></li>
  <li><NavLink to='/contact'>Contact</NavLink></li>
  </ul>
  </nav>
);

const About = () => (
  <div className='about'>
  <h1>About Me</h1>
  <p>Ipsum dolor dolorem consectetur est velit fugiat. Dolorem provident corporis fuga saepe distinctio ipsam? Et quos harum excepturi dolorum molestias?</p>
  <p>Ipsum dolor dolorem consectetur est velit fugiat. Dolorem provident corporis fuga saepe distinctio ipsam? Et quos harum excepturi dolorum molestias?</p>
  </div>
);

const Contact = () => (
  <div className='contact'>
  <h1>Contact Me</h1>
  <p>You can reach me via email: <strong>hello@example.com</strong></p>
  </div>
);

const Main = ({ magicedenCollections, openseaCollections, isLoading, partner }) => {
  return (
    <Routes>
      <Route path='/' element={<Home magicedenCollections={magicedenCollections} openseaCollections={openseaCollections} isLoading={isLoading} partner={partner} />}></Route>
      <Route path='/collection/:symbol' element={<Collection />}></Route>
      <Route path='/watchlist' element={<Watchlist />}></Route>
      <Route path='/influencers' element={<Influencers />}></Route>
      <Route path='/influencers/:username' element={<InfluencerDetail />}></Route>
      <Route path='/account' element={<Account />}></Route>
      <Route path='/about' element={<About />}></Route>
      <Route path='/contact' element={<Contact />}></Route>
    </Routes>
  );
};
