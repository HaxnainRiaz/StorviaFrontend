"use client";

import React from 'react';

const Button = ({
    children,
    onClick,
    variant = 'primary',
    type = 'button',
    className = '',
    disabled = false,
    icon: Icon
}) => {
    const baseStyles = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap";

    const variants = {
        primary: "bg-[#1E8AF7] text-white shadow-sm shadow-blue-200 hover:bg-[#0F74D8]",
        secondary: "border border-[#E2E8F0] bg-white text-[#0F172A] shadow-sm hover:border-[#93C5FD] hover:text-[#1E8AF7]",
        outline: "border border-[#93C5FD] bg-white text-[#1E8AF7] hover:bg-[#EFF6FF]",
        ghost: "text-[#475569] hover:bg-[#E8F3FF] hover:text-[#1E8AF7]"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant]} ${className}`}
        >
            {Icon && <Icon className="h-4 w-4" />}
            {children}
        </button>
    );
};

export default Button;
