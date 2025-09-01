import { CardsContainer } from "../Card.jsx";
import './Home.css';

function Home() {
  return (
    <div className="home-container">
      <h2 className="all-items-title">All Items:</h2>
      <CardsContainer />
    </div>
  );
}

export default Home;  