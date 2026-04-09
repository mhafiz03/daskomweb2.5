import daskomLogo from '../../../../assets/daskomLogoLandscape.svg';
import ThemeToggle from '@/Components/Common/ThemeToggle';

export default function LandingNavbar({ onAboutClick, onContactClick }) {
    return (
    <div className="flex mx-auto w-full max-w-7xl justify-between items-center h-20 px-6 mt-6 transition-all duration-500">
            <a href="https://www.daskomlab.com/" target="_blank" rel="noopener noreferrer">
                <img className="w-[140px] h-auto hover:drop-shadow-xl cursor-pointer transition-all duration-300 dark:brightness-0 dark:invert" src={daskomLogo} alt="Daskom Logo" />
            </a>
            <ul className="flex gap-2 items-center">
                <ThemeToggle className="pointer-events-auto" />
                <li 
                    onClick={onContactClick}
                    className="h-10 px-4 flex items-center justify-center glass-button rounded-depth-lg font-semibold cursor-pointer hover:-translate-y-0.5"
                >
                    Contact
                </li>
                <li 
                    onClick={onAboutClick}
                    className="h-10 px-4 flex items-center justify-center glass-button rounded-depth-lg font-semibold cursor-pointer hover:-translate-y-0.5"
                >
                    About
                </li>
            </ul>
        </div>
    );
}
