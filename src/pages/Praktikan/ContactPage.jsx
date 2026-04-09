import ContactDescription from '../../components/Components/Praktikans/Sections/ContactDescription';
import Vector from '../../components/Components/Praktikans/Sections/Vector';

export default function ContactPage() {
    return (
        <>
            <div className="bg-lightGainsboro flex justify-center mt-[75px] mx-auto rounded-lg shadow-xl max-w-4xl p-5">
                <ContactDescription />
                <Vector />
            </div>
        </>
    );
}
