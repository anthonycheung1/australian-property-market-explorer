import { BrowserRouter, Routes, Route, } from 'react-router-dom';

import Header from './components/Header';
import Explore from './pages/Explore';
import Suburb from './pages/Suburb';
import Compare from './pages/Compare';
import './App.css';

function Home() {
  return (
    <h1>Home Page</h1>
  );
}

function App() {
  return (
    <BrowserRouter basename="/australian-property-market-explorer">
      <Header />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/suburb/:state/:suburb" element={<Suburb />} />
          <Route path="/compare" element={<Compare />} />
          {/* <Route path="/about" element={<About />} /> */}
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;