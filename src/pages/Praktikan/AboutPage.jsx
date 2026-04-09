import AboutDescription from '../../components/Components/Praktikans/Sections/AboutDescription';
import Vector from '../../components/Components/Praktikans/Sections/Vector';

export default function AboutPage() {
    return (
        <>
            <div className="bg-lightGainsboro flex justify-center mt-[75px] mx-auto rounded-lg shadow-xl max-w-4xl min-h-[475px] p-5">
                <AboutDescription />
                <Vector />
            </div>
        </>
    );
}
