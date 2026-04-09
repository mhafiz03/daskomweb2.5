import TypewriterText from '@/Components/Common/TypewriterText';

export default function MainLanding({ onGetStartedClick }) {
    return (
        <div className="flex flex-grow items-center justify-center min-h-[calc(100vh-14rem)]">
            <div className="text-center">
                <h1 className="gradient-heading font-bold text-3xl">Welcome To</h1>
                <h1 className="font-bold text-[55px] leading-tight">
                    <TypewriterText
                        text="Daskom Laboratory"
                        className="justify-center"
                        textClassName="gradient-heading"
                        iconClassName="h-11 w-11"
                        respectMotionPreference={false}
                    />
                </h1>
                <button 
                    onClick={onGetStartedClick}
                    className="mt-6 px-12 py-3 glass-button rounded-depth-full text-xl font-semibold hover:-translate-y-1"
                >
                    Get Started
                </button>
            </div>
        </div>
    );
}