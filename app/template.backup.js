"use client";

export default function Template({ children }) {
    return (
        <div className="animate-fadeIn w-full">
            {children}
        </div>
    );
}
