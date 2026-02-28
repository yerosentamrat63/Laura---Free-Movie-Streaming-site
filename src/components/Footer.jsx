export default function Footer() {
  return (
    <footer>
      <span className="footer-logo">laura<span>.</span></span>
      <div className="footer-grid">
        <div className="footer-col">
          <h4>Company</h4>
          <a href="#">About laura</a>
          <a href="#">Investor Relations</a>
          <a href="#">Jobs</a>
          <a href="#">Press Room</a>
        </div>
        <div className="footer-col">
          <h4>Support</h4>
          <a href="#">Help Centre</a>
          <a href="#">Account</a>
          <a href="#">Gift Cards</a>
          <a href="#">Media Centre</a>
        </div>
        <div className="footer-col">
          <h4>Legal</h4>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Use</a>
          <a href="#">Cookie Preferences</a>
          <a href="#">Legal Notices</a>
        </div>
        <div className="footer-col">
          <h4>Community</h4>
          <a href="#">Speed Test</a>
          <a href="#">Watch Anywhere</a>
          <a href="#">Redeem Gift</a>
          <a href="#">Ways to Watch</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span className="footer-copy">© 2025 laura. All rights reserved.</span>
        <select className="footer-select">
          <option>English</option>
          <option>Español</option>
          <option>Français</option>
          <option>Deutsch</option>
          <option>日本語</option>
        </select>
      </div>
      <div className="footer-attribution">
        This product uses the TMDB API but is not endorsed or certified by TMDB. Data and imagery provided by{' '}
        <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer">TMDB</a>.
      </div>
    </footer>
  );
}
