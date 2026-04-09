import { useMemo } from 'react';
import { useAssistantToolbar } from '@/Layouts/AssistantToolbarContext';
import FormChangePassPraktikan from '../Forms/FormChangePassPraktikan';
import FormTarikPraktikan from '../Forms/FormTarikPraktikan';

export default function ContentSetPraktikan() {
    useAssistantToolbar(
        useMemo(
            () => ({
                title: "Set Praktikan",
            }),
            [],
        ),
    );

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
            <FormChangePassPraktikan />
            <FormTarikPraktikan />
        </div>
    );
}
