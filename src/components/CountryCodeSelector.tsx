'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Country, COUNTRIES } from '@/utils/countries';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Props {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    disabled?: boolean;
    variant?: 'default' | 'prefix';
}

export default function CountryCodeSelector({ value, onChange, className, disabled, variant = 'default' }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedCountry = useMemo(() => {
        return COUNTRIES.find(c => c.code === value) || COUNTRIES[0];
    }, [value]);

    const filteredCountries = useMemo(() => {
        if (!search) return COUNTRIES;
        const s = search.toLowerCase();
        return COUNTRIES.filter(c => 
            c.name.toLowerCase().includes(s) || 
            c.code.includes(s) || 
            c.iso.toLowerCase().includes(s)
        );
    }, [search]);

    // Handle outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSelect = (country: Country) => {
        onChange(country.code);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full h-full flex items-center justify-between transition-all outline-none font-bold text-base",
                    variant === 'default' ? "rounded-xl border border-slate-200 bg-white px-4 gap-3" : "rounded-l-xl border border-slate-200 bg-slate-50 px-3 gap-2",
                    isOpen && "bg-white border-primary ring-4 ring-primary/10 z-20",
                    disabled && "opacity-50 cursor-not-allowed",
                    className
                )}
                dir="ltr"
            >
                <div className="flex items-center gap-1.5 overflow-hidden">
                    <img 
                        src={`https://flagcdn.com/w80/${selectedCountry.iso.toLowerCase()}.png`} 
                        alt={selectedCountry.name}
                        className="w-7 h-4.5 object-cover rounded shadow-sm border border-slate-200/50 shrink-0"
                    />
                    <span className="text-base text-slate-700 tracking-tight whitespace-nowrap">{selectedCountry.iso} {selectedCountry.code}</span>
                </div>
                <motion.span 
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="material-symbols-outlined text-slate-400 text-xl"
                >
                    expand_more
                </motion.span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full left-0 mt-2 w-[280px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl z-[100] overflow-hidden"
                    >
                        {/* Search Input */}
                        <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="relative group">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="بحث عن دولة..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-right z-10 relative"
                                    dir="rtl"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px] group-focus-within:text-primary z-20">search</span>
                            </div>
                        </div>

                        {/* Country List */}
                        <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                            {filteredCountries.length > 0 ? (
                                filteredCountries.map((c) => (
                                    <button
                                        key={c.iso + c.code}
                                        type="button"
                                        onClick={() => handleSelect(c)}
                                        className={cn(
                                            "w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-right relative",
                                            c.code === value && "bg-primary/5 text-primary"
                                        )}
                                        dir="rtl"
                                    >
                                        <img 
                                            src={`https://flagcdn.com/w40/${c.iso.toLowerCase()}.png`} 
                                            alt={c.name}
                                            className="w-6 h-4 object-cover rounded-sm shadow-sm border border-slate-200"
                                        />
                                        <div className="flex-1 flex flex-col items-start gap-0.5">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{c.name}</span>
                                            <span className="text-[10px] text-slate-400 font-mono" dir="ltr">{c.code}</span>
                                        </div>
                                        {c.code === value && (
                                            <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                        )}
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-8 text-center text-slate-400 flex flex-col items-center gap-2">
                                    <span className="material-symbols-outlined text-4xl opacity-20">search_off</span>
                                    <span className="text-xs font-bold">عذراً، لم نجد نتائج</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
