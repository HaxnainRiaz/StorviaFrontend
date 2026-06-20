"use client";

import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({
    placeholder = "Search...",
    value,
    onChange,
    className = ""
}) => {
    return (
        <div className={`relative ${className}`}>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Search className="h-4 w-4 text-[#94A3B8]" />
            </div>
            <input
                type="search"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="block h-11 w-full rounded-xl border border-[#E2E8F0] bg-white pl-10 pr-4 text-sm font-medium text-[#0F172A] shadow-sm outline-none placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#1E8AF7] focus:ring-4 focus:ring-blue-50"
            />
        </div>
    );
};

export default SearchBar;
