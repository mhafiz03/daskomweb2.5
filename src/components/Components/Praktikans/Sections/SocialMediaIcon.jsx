export default function SocialMediaIcon({ href, src, alt }) {
    return (
        <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="glass-button rounded-depth-full h-12 w-12 flex items-center justify-center hover:-translate-y-1"
        >
            <img 
                className="h-6 w-6 cursor-pointer transition-transform duration-300 invert"
                src={src} 
                alt={alt} 
            />
        </a>
    );
}