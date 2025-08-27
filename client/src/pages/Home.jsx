import Card, { CardsContainer } from "../Card.jsx";
import Box from "../Box/Box.jsx";

function Home() {
  return (
    <>
        <h2>&nbsp;&nbsp;&nbsp;&nbsp;Welcome to Bhetiyo Website</h2>
        <Box />
        <h2>&nbsp;&nbsp;&nbsp;&nbsp;All Items:</h2>
        <div className="cards-container">
          <CardsContainer/>
        </div>
        
    </>
  );
}

export default Home;