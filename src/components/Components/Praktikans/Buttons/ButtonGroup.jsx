import React from 'react';
import ButtonMode from './ButtonMode';

const buttonTypes = ['praktikan', 'assistant'];

export default function ButtonGroup({ currentMode, onModeChange }) {
    const handleModeClick = (type) => {
        if (onModeChange) {
            onModeChange(type);
        }
    };

    return (
        <div className="flex gap-4">
            {buttonTypes.map((type) => (
                <button 
                    key={type} 
                    onClick={() => handleModeClick(type)}
                    type="button"
                >
                    <ButtonMode type={type} isActive={currentMode === type} />
                </button>
            ))}
        </div>
    );
}