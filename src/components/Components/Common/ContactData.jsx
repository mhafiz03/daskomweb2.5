import iconEmail from '../../../assets/contact/iconEmail.svg';
import iconInstagram from '../../../assets/contact/iconInstagram.svg';
import iconLine from '../../../assets/contact/iconLine.svg';
import iconWhatsapp from '../../../assets/contact/iconWhatsapp.svg';
import iconYoutube from '../../../assets/contact/iconYoutube.svg';

export const contactData = [
    {
        name: "Official Account (OA)",
        details: [
            { src: iconLine, text: "@875lgdsi", alt: "Line Official Account" },
            { src: iconInstagram, text: "@telu.daskom", alt: "Instagram Official Account" },
            { src: iconYoutube, text: "@Daskom Tel-U", alt: "YouTube Channel" },
        ],
    },
    {
        name: "Roudhotul Jannah [RDJ]",
        details: [
            { src: iconWhatsapp, text: "085722532973", alt: "WhatsApp Roudhotul Jannah" },
            { src: iconLine, text: "roudho_", alt: "Line Roudhotul Jannah" },
        ],
    },
    {
        name: "Stevannie Pratama [SNI]",
        details: [
            { src: iconWhatsapp, text: "085269958753", alt: "WhatsApp Stevannie Pratama" },
            { src: iconLine, text: "stevannie30", alt: "Line Stevannie Pratama" },
        ],
    },
    {
        name: "Email",
        details: [
            { src: iconEmail, text: "contact@daskomlab.com", alt: "Email Daskom Lab" },
        ],
    },
];
