declare module 'arabic-persian-reshaper' {
  export const ArabicShaper: {
    convertArabic: (text: string) => string;
    convertArabicBack: (text: string) => string;
  };
  export const PersianShaper: {
    convertArabic: (text: string) => string;
    convertArabicBack: (text: string) => string;
  };
  const defaultExport: {
    ArabicShaper: typeof ArabicShaper;
    PersianShaper: typeof PersianShaper;
  };
  export default defaultExport;
}
