"use client";

import React from 'react';

const Input = ({
    label,
    type = "text",
    name,
    value,
    onChange,
    placeholder,
    required = false,
    className = "",
    error = "",
    id,
    icon: Icon
}) => {
    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label htmlFor={id} className="mb-2 block text-xs font-bold text-[#0F172A]">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                        <Icon size={18} />
                    </div>
                )}
                <input
                    id={id}
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    className={`h-11 w-full ${Icon ? 'pl-10 pr-3' : 'px-3'} rounded-xl border border-[#E2E8F0] bg-white text-sm font-medium text-[#0F172A] shadow-sm outline-none placeholder:text-[#94A3B8] hover:border-[#CBD5E1] focus:border-[#1E8AF7] focus:ring-4 focus:ring-blue-50 ${error ? 'border-red-500 ring-4 ring-red-50' : ''}`}
                />
            </div>
            {error && <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>}
        </div>
    );
};

export default Input;
