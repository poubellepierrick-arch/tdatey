import React, { createContext, useContext, useMemo, useCallback } from 'react';
import type { AppIcons, IconData, AppIconName } from '../types';

type DefaultIconMap = Record<string, { component: React.FC<any>, label: string }>;

interface IconContextType {
    getIcon: (name: AppIconName, props?: React.HTMLAttributes<HTMLSpanElement> & { title?: string }) => React.ReactNode;
    appIcons: AppIcons;
    defaultIcons: DefaultIconMap;
}

const IconContext = createContext<IconContextType | null>(null);

export const useIcons = (): IconContextType => {
    const context = useContext(IconContext);
    if (!context) {
        throw new Error('useIcons must be used within an IconProvider');
    }
    return context;
};

interface IconProviderProps {
    children: React.ReactNode;
    defaultIcons: DefaultIconMap;
    appIcons: AppIcons;
}

export const IconProvider: React.FC<IconProviderProps> = ({ children, defaultIcons, appIcons }) => {
    const getIcon = useCallback((name: AppIconName, props?: React.HTMLAttributes<HTMLSpanElement> & { title?: string }): React.ReactNode => {
        const customIcon = appIcons?.[name];

        if (customIcon && typeof customIcon === 'object' && customIcon.type === 'svg') {
            const { className, ...restProps } = props || {};
            const finalClassName = `inline-block w-[1em] h-[1em] fill-current ${className || ''}`;
            
            // Process SVG string for better scaling
            const processedContent = customIcon.content
                .replace(/ width="[^"]*"/g, '')
                .replace(/ height="[^"]*"/g, '')
                .replace('<svg', '<svg width="100%" height="100%"');

            return (
                <span 
                    {...restProps}
                    className={finalClassName} 
                    dangerouslySetInnerHTML={{ __html: processedContent }} 
                />
            );
        }

        const DefaultIconComponent = defaultIcons[name]?.component;
        if (DefaultIconComponent) {
            return <DefaultIconComponent {...props} />;
        }

        return <span {...props}>❓</span>; // Fallback for missing icon
    }, [appIcons, defaultIcons]);

    const contextValue = useMemo(() => ({
        getIcon,
        appIcons: appIcons || {},
        defaultIcons,
    }), [getIcon, appIcons, defaultIcons]);

    return (
        <IconContext.Provider value={contextValue}>
            {children}
        </IconContext.Provider>
    );
};