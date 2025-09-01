import { Link } from 'react-router-dom';
import './Footer.css';

function Footer(){
    return(
        <footer>
            <div className='footer-image'>
                 <img src="http://localhost:5000/uploads/logo.png" alt="Logo" />
            </div>
           
            <div className='footer-list'>
                <ul>
                    <li><Link to="/lostItems">Lost Items</Link></li>
                    <li><Link to="/foundItems">Found Items</Link></li>
                    <li><Link to="/reportLost">Report Lost Item</Link></li>
                    <li><Link to="/reportFound">Report Found Item</Link></li>
                </ul>
            </div>
            <p className="footer-text">&copy; {new Date().getFullYear()} Bhetiyo. All rights reserved.</p>
            
        </footer>
    );
}

export default Footer;