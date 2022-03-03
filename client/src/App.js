import React from 'react';
import { NavLink, Routes, Route } from 'react-router-dom';

import Home from './views/Home';
import logo from './logo.svg';
import './App.css';

export default class App extends React.Component {
  render() {
    return (
      <div className="App">
        {/*<Navigation />*/}
        <Main />
      </div>
    );
  }
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

const Main = () => (
  <Routes>
  <Route path='/' element={<Home />}></Route>
  <Route path='/about' element={<About />}></Route>
  <Route path='/contact' element={<Contact />}></Route>
  </Routes>
);
