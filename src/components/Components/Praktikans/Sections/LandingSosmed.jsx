import { socialMediaLinks } from './SocialMediaData';
import SocialMediaIcon from './SocialMediaIcon';

export default function LandingSosmed() {
    return (
        <div className="relative mb-20">
            <div className="flex absolute left-1/2 transform -translate-x-1/2 -top-3 gap-3 rounded-depth-full px-6 py-3 items-center">
                {socialMediaLinks.map((link, index) => (
                    <SocialMediaIcon 
                        key={index} 
                        href={link.href} 
                        src={link.src} 
                        alt={link.alt} 
                    />
                ))}
            </div>
        </div>
    );
}