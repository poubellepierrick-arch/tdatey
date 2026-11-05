import React from "react";

interface ThemeStyleInjectorProps {
  themeStyle: string;
  cardBorderWidth: number;
  cardShadowOpacity: number;
}

export const ThemeStyleInjector: React.FC<ThemeStyleInjectorProps> = ({
  themeStyle,
  cardBorderWidth,
  cardShadowOpacity,
}) => {
  return (
    <>
      <button className="hidden update-border-width" />
      <style>{`
        /* Surcharge dynamique Memphis / Brutaliste / Cosmic */
        .border-4 { border-width: ${cardBorderWidth}px !important; }
        .border-2 { border-width: ${Math.max(1, Math.round(cardBorderWidth / 2))}px !important; }
        .border { border-width: ${Math.max(1, Math.round(cardBorderWidth / 4))}px !important; }
        .border-b-4 { border-bottom-width: ${cardBorderWidth}px !important; }
        .border-b-2 { border-bottom-width: ${Math.max(1, Math.round(cardBorderWidth / 2))}px !important; }
        
        /* Force la couleur des bordures */
        .border-4, .border-2, .border, .border-b-4, .border-b-2 {
          border-color: ${themeStyle === "cosmic" ? "#6366f1" : "black"} !important;
        }

        /* Adaptation proportionnelle et dynamique des ombres d'usine */
        .shadow-\\[4px_4px_0px_0px_\\#000\\], 
        .shadow-\\[0px_4px_0px_0px_\\#000\\], 
        .shadow-\\[3px_3px_0px_0px_\\#000\\], 
        .shadow-\\[2px_2px_0px_0px_\\#000\\],
        .shadow-\\[5px_5px_0px_0px_\\#000\\] {
          box-shadow: ${cardBorderWidth}px ${cardBorderWidth}px 0px 0px rgba(${themeStyle === "cosmic" ? "99, 102, 241" : "0, 0, 0"}, ${cardShadowOpacity / 100}) !important;
        }

        /* Option Thème sombre Cosmique Spatial */
        ${themeStyle === "cosmic" ? `
          header, footer, div, section, main, table, button, select, textarea, input, h3, label {
            border-color: #6366f1 !important;
          }
          .bg-white, .bg-\\[\\#fffdfa\\] {
            background-color: #111424 !important;
            color: #f3f4f6 !important;
          }
          .bg-[#fcf8f2] {
            background: #0a0f1d !important;
          }
          input, select, textarea {
            background-color: #1a1e36 !important;
            color: #ffffff !important;
          }
          p, span, label, h1, h2, h4 {
            color: #d1d5db !important;
          }
        ` : ""}

        /* Option Thème Épuré Noir-Blanc Brutaliste */
        ${themeStyle === "brutalist" ? `
          header, .bg-[#fffdfa], .bg-[#fcf8f2], .bg-yellow-50, .bg-yellow-105 {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
        ` : ""}

        /* COMPACTION GLOBALE DES TAILLES (Fewer pixels, much less scrolling) */
        body, main, header, footer, select, input, textarea, button, p, span, h1, h2, h3, h4, h5, h6 {
          font-size: 11.5px !important;
          letter-spacing: -0.01em !important;
        }
        h1 { font-size: 20px !important; }
        h2 { font-size: 16px !important; }
        h3 { font-size: 13.5px !important; }
        h4 { font-size: 12.5px !important; }
        button { font-size: 11px !important; }
        
        /* Compression des paddings et espaces verticaux */
        .p-8 { padding: 12px !important; }
        .p-6 { padding: 8px !important; }
        .p-5 { padding: 6px !important; }
        .p-4 { padding: 5px !important; }
        .p-3 { padding: 4px !important; }
        .p-2 { padding: 3px !important; }
        .p-3.5 { padding: 4px !important; }
        
        .py-8 { padding-top: 12px !important; padding-bottom: 12px !important; }
        .py-6 { padding-top: 8px !important; padding-bottom: 8px !important; }
        .py-4 { padding-top: 5px !important; padding-bottom: 5px !important; }
        .py-3.5 { padding-top: 4px !important; padding-bottom: 4px !important; }
        .py-3 { padding-top: 3px !important; padding-bottom: 3px !important; }
        .py-2.5 { padding-top: 3px !important; padding-bottom: 3px !important; }
        .py-2 { padding-top: 2px !important; padding-bottom: 2px !important; }
        .py-1.5 { padding-top: 2px !important; padding-bottom: 2px !important; }
        
        .px-8 { padding-left: 12px !important; padding-right: 12px !important; }
        .px-6 { padding-left: 8px !important; padding-right: 8px !important; }
        .px-5 { padding-left: 6px !important; padding-right: 6px !important; }
        .px-4 { padding-left: 5px !important; padding-right: 5px !important; }
        .px-3 { padding-left: 4px !important; padding-right: 4px !important; }
        .px-2.5 { padding-left: 4px !important; padding-right: 4px !important; }
        .px-2 { padding-left: 3px !important; padding-right: 3px !important; }
        
        .gap-6 { gap: 8px !important; }
        .gap-4 { gap: 6px !important; }
        .gap-3 { gap: 4px !important; }
        
        /* Spacing utils compaction */
        .space-y-8 > :not([hidden]) ~ :not([hidden]) { margin-top: 8px !important; }
        .space-y-6 > :not([hidden]) ~ :not([hidden]) { margin-top: 6px !important; }
        .space-y-5 > :not([hidden]) ~ :not([hidden]) { margin-top: 5px !important; }
        .space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 4px !important; }
        .space-y-3 > :not([hidden]) ~ :not([hidden]) { margin-top: 3px !important; }
        .space-y-2 > :not([hidden]) ~ :not([hidden]) { margin-top: 2px !important; }
        
        /* Height / width of round/square action elements */
        .h-10 { height: 26px !important; }
        .w-10 { width: 26px !important; }
        .h-8 { height: 21px !important; }
        .w-8 { width: 21px !important; }
        .h-7 { height: 18px !important; }
        .w-7 { width: 18px !important; }
        
        /* Tiny adjustments for icon elements */
        svg {
          transform: scale(0.9);
        }
      `}</style>
    </>
  );
};

export default ThemeStyleInjector;
