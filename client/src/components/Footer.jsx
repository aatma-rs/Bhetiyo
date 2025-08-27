import logo from '../assets/logo.png';
import './Footer.css';

function Footer(){
    return(
        <footer>
            <div className='footer-image'>
                 <img src={logo} alt="Logo" />
            </div>
           
            <div className='footer-list'>
                <ul>
                    <li><a href="#">Lost Items</a></li>
                    <li><a href="#">Found Items</a></li>
                    <li><a href="#">Report Lost Item</a></li>
                    <li><a href="#">Report Found Item</a></li>
                </ul>
            </div>
            <p className="footer-text">&copy; {new Date().getFullYear()} Bhetiyo. All rights reserved.</p>
            
        </footer>
    );
}

export default Footer