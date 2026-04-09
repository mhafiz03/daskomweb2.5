import { useState } from "react";
import { useKelasQuery } from "@/hooks/useKelasQuery";

export default function DropdownListKelas() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("-- Pilih Kelas --");

  const {
    data: kelas = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useKelasQuery();

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSelect = (option) => {
    setSelectedOption(option);
    setIsOpen(false);
  };

  const kelasIsEmpty = !isLoading && !isError && kelas.length === 0;

  return (
    <div className="relative">
      <button
        onClick={() => {
          if (isError) {
            refetch();
          }
          toggleDropdown();
        }}
        className="flex items-center gap-2 border-2 border-darkBrown text-darkBrown font-semibold rounded-md px-7 py-1 shadow-md"
        disabled={isLoading}
      >
        {isLoading ? "Loading..." : selectedOption}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 bg-white border-2 border-darkBrown rounded-md shadow-md w-[168px] z-10">
          <ul>
            {isError && (
              <li className="px-4 py-2 text-red-600">
                {error?.message ?? "Gagal memuat kelas"}
              </li>
            )}
            {kelasIsEmpty && (
              <li className="px-4 py-2 text-gray-500">No kelas available</li>
            )}
            {!isError && !kelasIsEmpty &&
              kelas.map((kel) => (
                <li
                  key={kel.id}
                  onClick={() => handleSelect(kel.kelas)}
                  className="px-4 py-2 text-darkBrown hover:bg-gray-100 cursor-pointer"
                >
                  {kel.kelas}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
