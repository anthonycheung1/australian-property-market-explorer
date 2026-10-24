import { useParams } from 'react-router-dom';
import { supportedSuburbs } from '../data/suburbs.ts';

function Suburb() {
  const { state, suburb } = useParams();

  if (!state || !suburb) {
    return <h1>Suburb not found</h1>;
  }

  const matchingSuburb = supportedSuburbs.find((supportedSuburb) => {
    // Return true when the item matches.
    return supportedSuburb.state.toLowerCase() === state.toLowerCase() && supportedSuburb.value.toLowerCase().replaceAll(' ', '-').toLowerCase() === suburb.toLowerCase();
  });

  if (!matchingSuburb) {
    return <h1>Suburb not found</h1>;
  }
  else {
    return (
      <div>
        <h1>{matchingSuburb.value}</h1>
        <p>State: {matchingSuburb.state}</p>
      </div>
    );
  }
}

export default Suburb;