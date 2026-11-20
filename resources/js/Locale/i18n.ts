import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { L10n, setCulture } from "@syncfusion/ej2-base";
import enJSON from "./en/en.json";
import arJSON from "./ar/ar.json";

const getInitialLanguage = (): 'ar' | 'en' => {
    if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path.startsWith('/ar/') || path === '/ar') {
            return 'ar';
        }
        if (path.startsWith('/en/') || path === '/en') {
            return 'en';
        }
        const cookieMatch = document.cookie.match(/(^|;)\s*locale\s*=\s*([^;]+)/);
        if (cookieMatch && (cookieMatch[2] === 'ar' || cookieMatch[2] === 'en')) {
            return cookieMatch[2] as 'ar' | 'en';
        }
        const stored = localStorage.getItem('i18nextLng');
        if (stored === 'ar' || stored === 'en') {
            return stored;
        }
        if (document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl') {
            return 'ar';
        }
    }
    return 'en';
};

const initialLng = getInitialLanguage();

// Syncfusion EJ2 Grid & Pager Localization
L10n.load({
    ar: {
        grid: {
            EmptyRecord: 'لا توجد سجلات لعرضها',
            GroupDropArea: 'اسحب رأس عمود هنا لتجميعه',
            UnGroup: 'انقر هنا لإلغاء التجميع',
            EmptyDataSourceError: 'مصدر البيانات فارغ عند التحميل الأولي',
            Item: 'عنصر',
            Items: 'عناصر',
            Search: 'بحث...',
            Print: 'طباعة',
            Pdfexport: 'تصدير PDF',
            Excelexport: 'تصدير Excel',
            Csvexport: 'تصدير CSV',
            Save: 'حفظ',
            Cancel: 'إلغاء',
            Edit: 'تعديل',
            Delete: 'حذف',
            Add: 'إضافة',
            Update: 'تحديث',
            FilterButton: 'تصفية',
            ClearButton: 'مسح',
            EnterValue: 'أدخل القيمة',
            SelectAll: 'تحديد الكل',
            Blanks: 'فارغ',
            True: 'صحيح',
            False: 'خطأ',
            FilterbarTitle: 'شريط التصفية',
            Matchs: 'لا توجد نتائج مطابقة',
        },
        pager: {
            currentPageInfo: '{0} من {1} صفحة',
            totalItemsInfo: '({0} عنصر)',
            firstPageTooltip: 'الذهاب إلى الصفحة الأولى',
            lastPageTooltip: 'الذهاب إلى الصفحة الأخيرة',
            nextPageTooltip: 'الذهاب إلى الصفحة التالية',
            previousPageTooltip: 'الذهاب إلى الصفحة السابقة',
            nextPagerTooltip: 'الانتقال إلى الصفحات التالية',
            previousPagerTooltip: 'الانتقال إلى الصفحات السابقة',
            pagerDropDown: 'عناصر لكل صفحة',
            pagerAllDropDown: 'عناصر',
            All: 'الكل',
            pagerTooltip: 'الذهاب إلى رقم الصفحة'
        }
    },
    en: {
        grid: {
            EmptyRecord: 'No records to display',
            GroupDropArea: 'Drag a column header here to group its column',
            UnGroup: 'Click here to ungroup',
            EmptyDataSourceError: 'DataSource must not be empty at initial load',
            Item: 'Item',
            Items: 'Items',
            Search: 'Search...',
            Print: 'Print',
            Pdfexport: 'Export PDF',
            Excelexport: 'Export Excel',
            Csvexport: 'Export CSV',
            Save: 'Save',
            Cancel: 'Cancel',
            Edit: 'Edit',
            Delete: 'Delete',
            Add: 'Add',
            Update: 'Update',
            FilterButton: 'Filter',
            ClearButton: 'Clear',
            EnterValue: 'Enter the value',
            SelectAll: 'Select All',
            Blanks: 'Blanks',
            True: 'True',
            False: 'False',
            FilterbarTitle: 'Filter bar',
            Matchs: 'No matches found',
        },
        pager: {
            currentPageInfo: '{0} of {1} pages',
            totalItemsInfo: '({0} items)',
            firstPageTooltip: 'Go to first page',
            lastPageTooltip: 'Go to last page',
            nextPageTooltip: 'Go to next page',
            previousPageTooltip: 'Go to previous page',
            nextPagerTooltip: 'Go to next pager',
            previousPagerTooltip: 'Go to previous pager',
            pagerDropDown: 'Items per page',
            pagerAllDropDown: 'Items',
            All: 'All',
            pagerTooltip: 'Go to page number'
        }
    }
});

// Set initial Syncfusion culture
setCulture(initialLng);

i18n.use(initReactI18next).init({
    resources: {
        en: { translation: enJSON },
        ar: { translation: arJSON },
    },
    lng: initialLng,
    fallbackLng: "en",
    interpolation: {
        escapeValue: false,
    },
});

// Synchronize Syncfusion culture and persistence dynamically on language change
i18n.on('languageChanged', (lng: string) => {
    const culture = lng.startsWith('ar') ? 'ar' : 'en';
    setCulture(culture);
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem('i18nextLng', culture);
            document.cookie = `locale=${culture}; path=/; max-age=31536000; SameSite=Lax`;
        } catch {
            // Ignore storage quota/permission errors
        }
    }
});

export default i18n;
