import { Link } from "react-router-dom";
import './Box.css';

const boxes = [
  { title: 'Lost Items', link: '/lostItems' },
  { title: 'Found Items', link: '/foundItems' },
  { title: 'Report a Lost Item', link: '/reportLost' },
  { title: 'Report a Found Item', link: '/reportFound' }
];

function Box() {
  return (
    <div className="box-container">
      {boxes.map(({ title, link }, index) => (
        <Link to={link} className="box" key={index}>
          <div className="box-title">{title}</div>
        </Link>
      ))}
    </div>
  );
}

export default Box;