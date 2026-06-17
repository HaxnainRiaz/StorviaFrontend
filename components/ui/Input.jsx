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
                <label htmlFor={id} className="block text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em] mb-2 ml-1">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#B8A68A]">
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
                    className={`w-full ${Icon ? 'pl-14' : 'px-6'} py-4 bg-white border border-[#F5F3F0] rounded-2xl text-sm font-medium text-[#0a4019] placeholder-[#B8A68A] shadow-sm hover:shadow-md ${error ? 'border-red-500 shadow-red-50' : ''}`}
                />
            </div>
            {error && <p className="mt-1 text-[10px] text-red-500 font-bold uppercase ml-1 tracking-wider">{error}</p>}
        </div>
    );
};

export default Input;
