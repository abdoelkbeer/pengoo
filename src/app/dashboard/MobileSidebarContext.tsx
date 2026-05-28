'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type MobileSidebarContextType = {
    isOpen: boolean;
    setIsOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
};

const MobileSidebarContext = createContext<MobileSidebarContextType>({
    isOpen: false,
    setIsOpen: () => { },
});

export const MobileSidebarProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <MobileSidebarContext.Provider value={{ isOpen, setIsOpen }}>
            {children}
        </MobileSidebarContext.Provider>
    );
};

export const useMobileSidebar = () => useContext(MobileSidebarContext);
