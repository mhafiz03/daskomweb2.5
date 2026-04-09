import { useState, useEffect } from "react";
import iconSwipeLeft from "../../../../assets/polling/iconSwipeLeft.svg";
import iconSwipeLeftHover from "../../../../assets/polling/iconSwipeLeftHover.svg";
import iconSwipeRight from "../../../../assets/polling/iconSwipeRight.svg";
import iconSwipeRightHover from "../../../../assets/polling/iconSwipeRightHover.svg";

export default function PollingHeader({ onCategoryClick, activeCategory, availableCategories }) {
    const [startIndex, setStartIndex] = useState(0);
    const [isHoverLeft, setIsHoverLeft] = useState(false);
    const [isHoverRight, setIsHoverRight] = useState(false);

    const maxVisibleCategories = 5;
    const visibleCategories = availableCategories.slice(startIndex, startIndex + maxVisibleCategories);

    const handleScrollLeft = () => {
        if (startIndex > 0) {
            setStartIndex((prev) => prev - 1);
        }
    };

    const handleScrollRight = () => {
        if (startIndex < availableCategories.length - maxVisibleCategories) {
            setStartIndex((prev) => prev + 1);
        }
    };

    if (!availableCategories || availableCategories.length === 0) {
        return (
            <div className="rounded-depth-lg border border-depth bg-depth-card px-4 py-3 text-center text-depth-secondary shadow-depth-lg">
                No categories available...
            </div>
        );
    }

    return (
        <div className="rounded-depth-lg border border-depth bg-[var(--depth-color-primary)] px-4 py-3 shadow-depth-lg overflow-hidden">
            <div className="flex items-center max-w-full gap-3">
                <button
                    aria-label="Scroll Left"
                    onMouseEnter={() => setIsHoverLeft(true)}
                    onMouseLeave={() => setIsHoverLeft(false)}
                    onClick={handleScrollLeft}
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition hover:bg-white/20 ${
                        startIndex <= 0 ? "cursor-not-allowed opacity-30" : ""
                    }`}
                    disabled={startIndex <= 0}
                >
                    <img
                        src={isHoverLeft ? iconSwipeLeftHover : iconSwipeLeft}
                        alt="Scroll Left"
                        className="h-full w-full"
                    />
                </button>

                <div className="flex flex-1 items-center justify-center overflow-hidden">
                    <div className="flex gap-4">
                        {visibleCategories.map((category) => (
                            <div
                                key={category.id}
                                className={`group cursor-pointer px-4 text-center ${
                                    activeCategory === category.id.toString() ? 'text-yellow-300' : 'text-white'
                                }`}
                                onClick={() => onCategoryClick(category.id.toString())}
                            >
                                <h1 className="relative whitespace-nowrap text-lg font-bold">
                                    {category.judul}
                                    <span className={`absolute bottom-0 left-1/2 h-[2px] w-[70%] origin-center -translate-x-1/2 scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${
                                        activeCategory === category.id.toString() ? 'bg-yellow-300' : 'bg-white'
                                    }`}></span>
                                </h1>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    aria-label="Scroll Right"
                    onMouseEnter={() => setIsHoverRight(true)}
                    onMouseLeave={() => setIsHoverRight(false)}
                    onClick={handleScrollRight}
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition hover:bg-white/20 ${
                        startIndex >= availableCategories.length - maxVisibleCategories
                            ? "cursor-not-allowed opacity-30"
                            : ""
                    }`}
                    disabled={startIndex >= availableCategories.length - maxVisibleCategories}
                >
                    <img
                        src={isHoverRight ? iconSwipeRightHover : iconSwipeRight}
                        alt="Scroll Right"
                        className="h-full w-full"
                    />
                </button>
            </div>
        </div>
    );
}