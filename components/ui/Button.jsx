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
    const baseStyles = "inline-flex items-center justify-center px-3 md:px-5 py-3 rounded-full font-medium transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm whitespace-nowrap uppercase tracking-wider";

    const variants = {
        primary: "bg-[#0a4019] text-white hover:bg-[#08241d] shadow-md hover:shadow-lg",
        secondary: "bg-[#d3d3d3] text-[#0a4019] hover:bg-[#B8A68A] shadow-sm hover:shadow-md",
        outline: "border-2 border-[#0a4019] text-[#0a4019] hover:bg-[#0a4019] hover:text-white",
        ghost: "text-[#0a4019] hover:bg-[#F5F3F0]"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant]} ${className}`}
        >
            {Icon && <Icon className="mr-2 w-4 h-4" />}
            {children}
        </button>
    );
};

export default Button;
