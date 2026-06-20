"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const Dropdown = ({
    options = [],
    value,
    onChange,
    placeholder = "Select option",
    className = "",
    label = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const selectedOption = options.find(opt => (opt.value || opt) === value);
    const displayValue = selectedOption ? (selectedOption.label || selectedOption) : placeholder;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange({ target: { value: optionValue } });
        setIsOpen(false);
    };

    return (
        <div className={cn("relative w-full", className)} ref={dropdownRef}>
            {label && (
                <label className="mb-2 block text-xs font-bold text-[#0F172A]">
                    {label}
                </label>
            )}

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex h-11 w-full items-center justify-between rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm font-medium shadow-sm transition outline-none",
                    isOpen ? "border-[#1E8AF7] ring-4 ring-blue-50" : "hover:border-[#CBD5E1]",
                    !selectedOption ? "text-[#94A3B8]" : "text-[#0F172A]"
                )}
            >
                <span className="truncate">{displayValue}</span>
                <ChevronDown className={cn("h-4 w-4 text-[#64748B] transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute z-[100] mt-2 w-full overflow-hidden rounded-xl border border-[#E2E8F0] bg-white py-1.5 shadow-xl animate-fadeIn">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {options.map((option) => {
                            const optValue = option.value || option;
                            const optLabel = option.label || option;
                            const isSelected = optValue === value;

                            return (
                                <button
                                    key={optValue}
                                    type="button"
                                    onClick={() => handleSelect(optValue)}
                                    className={cn(
                                        "flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors",
                                        isSelected ? "bg-[#EFF6FF] font-bold text-[#1E8AF7]" : "text-[#475569] hover:bg-[#F8FBFF] hover:text-[#0F172A]"
                                    )}
                                >
                                    <span>{optLabel}</span>
                                    {isSelected && <Check className="h-4 w-4 text-[#1E8AF7]" />}
                                </button>
                            );
                        })}
                        {options.length === 0 && (
                            <div className="px-6 py-3 text-sm text-neutral-400 italic">No options available</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dropdown;
