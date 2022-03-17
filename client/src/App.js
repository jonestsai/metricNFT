import React, { useState, useEffect } from 'react';
import ReactGA from 'react-ga';
import { NavLink, Routes, Route, useLocation } from 'react-router-dom';

import Top from './components/layout/Top';
import Bottom from './components/layout/Bottom';
import { URLS } from './Settings';
import usePageTracking from './utils/usePageTracking';
import Collection from './views/Collection';
import Home from './views/Home';
import logo from './logo.svg';
import './App.css';

export default function App() {
  usePageTracking();

  const [collections, setCollections] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.body.style.backgroundColor = "#212529";
    document.body.style.color = "white";
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`${URLS.api}`);
      const collections = await response.json();

      setCollections(collections);
    } catch (error) {
      // Do nothing
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="App">
      {/*<Navigation />*/}
      <Top />
      <Main
        collections={collections}
        isLoading={isLoading}
      />
      <Bottom />
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

const Main = ({ collections, isLoading }) => {
  const collectionRoutes = collections?.map((collection, index) => {
    const { name, slug } = collection;
    return (
      <Route key={collection.id} path={slug} element={<Collection name={name} collectionAPI={slug} />}></Route>
    );
  });

  return (
    <Routes>
      <Route path='/' element={<Home collections={collections} isLoading={isLoading} />}></Route>
      {collectionRoutes}
      <Route path='/about' element={<About />}></Route>
      <Route path='/contact' element={<Contact />}></Route>
    </Routes>
  );
};
