import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom';

import Header from './components/Header';
import Explore from './pages/Explore';
import './App.css';

function Home() {
  return (
    <h1>Home Page</h1>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Header />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          {/* <Route path="/compare" element={<Compare />} /> */}
          {/* <Route path="/about" element={<About />} /> */}
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;