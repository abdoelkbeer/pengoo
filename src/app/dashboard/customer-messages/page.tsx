// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import WhatsAppPreview from '@/components/WhatsAppPreview';
import Link from 'next/link';

// ── Supported Language Meta Options ──
const LANGUAGE_META: Record<string, {label: string, dir: string}> = {
    ar: { label: 'العربية', dir: 'rtl' },
    en: { label: 'English', dir: 'ltr' },
    fr: { label: 'Français', dir: 'ltr' },
    de: { label: 'Deutsch', dir: 'ltr' },
    es: { label: 'Español', dir: 'ltr' },
    tr: { label: 'Türkçe', dir: 'ltr' },
    pt: { label: 'Português', dir: 'ltr' },
    it: { label: 'Italiano', dir: 'ltr' },
    nl: { label: 'Nederlands', dir: 'ltr' },
    ru: { label: 'Русский', dir: 'ltr' },
    zh: { label: '中文', dir: 'ltr' },
    ja: { label: '日本語', dir: 'ltr' },
    ko: { label: '한국어', dir: 'ltr' },
    hi: { label: 'हिन्दी', dir: 'ltr' },
    ur: { label: 'اردو', dir: 'rtl' },
    fa: { label: 'فارسی', dir: 'rtl' },
    he: { label: 'עברית', dir: 'rtl' },
    id: { label: 'Indonesian', dir: 'ltr' },
    ms: { label: 'Malay', dir: 'ltr' },
    th: { label: 'ไทย', dir: 'ltr' },
    vi: { label: 'Tiếng Việt', dir: 'ltr' },
    pl: { label: 'Polski', dir: 'ltr' },
    sv: { label: 'Svenska', dir: 'ltr' },
};

// ── WooCommerce Events ──
const WOOCOMMERCE_EVENTS = {
    ar: [
        { group: 'حالات الطلب', type: 'order.pending', label: 'بانتظار الدفع (Pending)', icon: 'schedule', color: 'amber', template: 'مرحباً {customer_name}، تم استلام طلبك رقم #{order_number} وبانتظار الدفع. المبلغ: {order_total}' },
        { group: 'حالات الطلب', type: 'order.processing', label: 'قيد المعالجة (Processing)', icon: 'autorenew', color: 'blue', template: 'مرحباً {customer_name}، طلبك رقم #{order_number} قيد التجهيز الآن. سنبلغك عند الشحن.' },
        { group: 'حالات الطلب', type: 'order.on-hold', label: 'معلق (On Hold)', icon: 'pause_circle', color: 'orange', template: 'مرحباً {customer_name}، طلبك رقم #{order_number} معلق مؤقتاً. سيتم مراجعته قريباً.' },
        { group: 'حالات الطلب', type: 'order.completed', label: 'مكتمل (Completed)', icon: 'check_circle', color: 'green', template: 'مرحباً {customer_name}، طلبك رقم #{order_number} تم تسليمه بنجاح! شكراً لتسوقك معنا 🎉' },
        { group: 'حالات الطلب', type: 'order.cancelled', label: 'ملغى (Cancelled)', icon: 'cancel', color: 'red', template: 'مرحباً {customer_name}، تم إلغاء طلبك رقم #{order_number}. تواصل معنا لأي استفسار.' },
        { group: 'حالات الطلب', type: 'order.refunded', label: 'مسترجع (Refunded)', icon: 'keyboard_return', color: 'purple', template: 'مرحباً {customer_name}، تم استرجاع مبلغ طلبك رقم #{order_number} بنجاح.' },
        { group: 'حالات الطلب', type: 'order.failed', label: 'فشل الدفع (Failed)', icon: 'error', color: 'red', template: 'مرحباً {customer_name}، فشل دفع طلبك رقم #{order_number}. يرجى المحاولة مجدداً.' },
        { group: 'الشحن', type: 'order.shipped', label: 'تم الشحن (Shipped)', icon: 'local_shipping', color: 'blue', template: 'مرحباً {customer_name}، طلبك رقم #{order_number} تم شحنه! رقم التتبع: {tracking_number}' },
        { group: 'العملاء', type: 'customer.created', label: 'عميل جديد (New Customer)', icon: 'person_add', color: 'green', template: 'مرحباً {customer_name}! نرحب بك في {store_name}. يسعدنا خدمتك 🌟' },
        { group: 'العملاء', type: 'order.note', label: 'ملاحظة على الطلب (Order Note)', icon: 'note_add', color: 'blue', template: 'مرحباً {customer_name}، لديك ملاحظة جديدة على طلبك رقم #{order_number}: {note}' },
    ],
    en: [
        { group: 'Order Status', type: 'order.pending', label: 'Pending Payment', icon: 'schedule', color: 'amber', template: 'Hi {customer_name}, your order #{order_number} has been received and is awaiting payment. Total: {order_total}' },
        { group: 'Order Status', type: 'order.processing', label: 'Processing', icon: 'autorenew', color: 'blue', template: 'Hi {customer_name}, your order #{order_number} is now being prepared. We\'ll notify you when it ships.' },
        { group: 'Order Status', type: 'order.on-hold', label: 'On Hold', icon: 'pause_circle', color: 'orange', template: 'Hi {customer_name}, your order #{order_number} is on hold. It will be reviewed shortly.' },
        { group: 'Order Status', type: 'order.completed', label: 'Completed', icon: 'check_circle', color: 'green', template: 'Hi {customer_name}, your order #{order_number} has been delivered! Thank you for shopping with us 🎉' },
        { group: 'Order Status', type: 'order.cancelled', label: 'Cancelled', icon: 'cancel', color: 'red', template: 'Hi {customer_name}, your order #{order_number} has been cancelled. Please contact us for any questions.' },
        { group: 'Order Status', type: 'order.refunded', label: 'Refunded', icon: 'keyboard_return', color: 'purple', template: 'Hi {customer_name}, a refund for your order #{order_number} has been processed successfully.' },
        { group: 'Order Status', type: 'order.failed', label: 'Payment Failed', icon: 'error', color: 'red', template: 'Hi {customer_name}, payment for your order #{order_number} has failed. Please try again.' },
        { group: 'Shipping', type: 'order.shipped', label: 'Shipped', icon: 'local_shipping', color: 'blue', template: 'Hi {customer_name}, your order #{order_number} has been shipped! Tracking: {tracking_number}' },
        { group: 'Customers', type: 'customer.created', label: 'New Customer', icon: 'person_add', color: 'green', template: 'Welcome {customer_name}! Thank you for joining {store_name}. We\'re happy to serve you 🌟' },
        { group: 'Customers', type: 'order.note', label: 'Order Note', icon: 'note_add', color: 'blue', template: 'Hi {customer_name}, you have a new note on your order #{order_number}: {note}' },
    ],
};

const SALLA_EVENTS = {
    ar: [
        { group: 'حالات الطلب', type: 'order.created', label: 'طلب جديد (Order Created)', icon: 'add_shopping_cart', color: 'green', template: 'مرحباً {customer_name}، تم استلام طلبك رقم #{order_number} بنجاح! شكراً لك 🎉' },
        { group: 'حالات الطلب', type: 'order.shipped', label: 'تم الشحن (Shipped)', icon: 'local_shipping', color: 'blue', template: 'بشرى سارة {customer_name}! طلبك رقم #{order_number} في الطريق إليك الآن 🚚' },
        { group: 'حالات الطلب', type: 'order.completed', label: 'تم التوصيل (Delivered)', icon: 'task_alt', color: 'emerald', template: 'مرحباً {customer_name}، تم توصيل طلبك #{order_number}. نأمل أن تنال منتجاتنا رضاك ✨' },
        { group: 'حالات الطلب', type: 'order.cancelled', label: 'طلب ملغي (Cancelled)', icon: 'cancel', color: 'red', template: 'نعتذر منك {customer_name}، تم إلغاء طلبك رقم #{order_number}. تواصل معنا لأي استفسار.' },
    ],
    en: [
        { group: 'Order Status', type: 'order.created', label: 'Order Created', icon: 'add_shopping_cart', color: 'green', template: 'Hi {customer_name}, your order #{order_number} has been received! Thank you 🎉' },
        { group: 'Order Status', type: 'order.shipped', label: 'Shipped', icon: 'local_shipping', color: 'blue', template: 'Great news {customer_name}! Your order #{order_number} is on its way 🚚' },
        { group: 'Order Status', type: 'order.completed', label: 'Delivered', icon: 'task_alt', color: 'emerald', template: 'Hi {customer_name}, your order #{order_number} has been delivered. We hope you love it ✨' },
        { group: 'Order Status', type: 'order.cancelled', label: 'Cancelled', icon: 'cancel', color: 'red', template: 'Hi {customer_name}, your order #{order_number} has been cancelled. Contact us for any questions.' },
    ],
};

const ZID_EVENTS = {
    ar: [
        { group: 'حالات الطلب', type: 'order.created', label: 'طلب جديد (Order Created)', icon: 'add_shopping_cart', color: 'orange', template: 'مرحباً {customer_name}، تم استلام طلبك رقم #{order_number} بنجاح! شكراً لك 🎉' },
        { group: 'حالات الطلب', type: 'order.shipped', label: 'تم الشحن (Shipped)', icon: 'local_shipping', color: 'blue', template: 'بشرى سارة {customer_name}! طلبك رقم #{order_number} في الطريق إليك الآن 🚚' },
        { group: 'حالات الطلب', type: 'order.completed', label: 'تم التوصيل (Delivered)', icon: 'task_alt', color: 'emerald', template: 'مرحباً {customer_name}، تم توصيل طلبك #{order_number}. نأمل أن تنال منتجاتنا رضاك ✨' },
        { group: 'حالات الطلب', type: 'order.cancelled', label: 'طلب ملغي (Cancelled)', icon: 'cancel', color: 'red', template: 'نعتذر منك {customer_name}، تم إلغاء طلبك رقم #{order_number}. تواصل معنا لأي استفسار.' },
    ],
    en: [
        { group: 'Order Status', type: 'order.created', label: 'Order Created', icon: 'add_shopping_cart', color: 'orange', template: 'Hi {customer_name}, your order #{order_number} has been received! Thank you 🎉' },
        { group: 'Order Status', type: 'order.shipped', label: 'Shipped', icon: 'local_shipping', color: 'blue', template: 'Great news {customer_name}! Your order #{order_number} is on its way 🚚' },
        { group: 'Order Status', type: 'order.completed', label: 'Delivered', icon: 'task_alt', color: 'emerald', template: 'Hi {customer_name}, your order #{order_number} has been delivered. We hope you love it ✨' },
        { group: 'Order Status', type: 'order.cancelled', label: 'Cancelled', icon: 'cancel', color: 'red', template: 'Hi {customer_name}, your order #{order_number} has been cancelled. Contact us for any questions.' },
    ],
};

const SHOPIFY_EVENTS = {
    ar: [
        { group: 'حالات الطلب', type: 'orders/create', label: 'طلب جديد (Order Created)', icon: 'add_shopping_cart', color: 'amber', template: 'مرحباً {customer_name}، تم استلام طلبك رقم #{order_number} بنجاح. سنقوم بتجهيزه قريباً.' },
        { group: 'حالات الطلب', type: 'orders/updated', label: 'تحديث الطلب (Order Updated)', icon: 'update', color: 'blue', template: 'مرحباً {customer_name}، تم تحديث حالة طلبك رقم #{order_number}.' },
        { group: 'حالات الطلب', type: 'orders/fulfilled', label: 'تم الشحن (Order Fulfilled)', icon: 'local_shipping', color: 'green', template: 'مرحباً {customer_name}، طلبك رقم #{order_number} في الطريق إليك الآن! 🚚' },
        { group: 'حالات الطلب', type: 'orders/cancelled', label: 'طلب ملغى (Order Cancelled)', icon: 'cancel', color: 'red', template: 'مرحباً {customer_name}، تم إلغاء طلبك رقم #{order_number}. تواصل معنا إذا كان لديك أي استفسار.' },
        { group: 'العملاء', type: 'customers/create', label: 'عميل جديد (New Customer)', icon: 'person_add', color: 'teal', template: 'أهلاً بك {customer_name} في متجرنا! يسعدنا انضمامك إلينا 🌟' },
    ],
    en: [
        { group: 'Order Status', type: 'orders/create', label: 'Order Created', icon: 'add_shopping_cart', color: 'amber', template: 'Hi {customer_name}, your order #{order_number} has been received. We\'ll prepare it soon.' },
        { group: 'Order Status', type: 'orders/updated', label: 'Order Updated', icon: 'update', color: 'blue', template: 'Hi {customer_name}, your order #{order_number} has been updated.' },
        { group: 'Order Status', type: 'orders/fulfilled', label: 'Order Fulfilled', icon: 'local_shipping', color: 'green', template: 'Hi {customer_name}, your order #{order_number} is on its way! 🚚' },
        { group: 'Order Status', type: 'orders/cancelled', label: 'Order Cancelled', icon: 'cancel', color: 'red', template: 'Hi {customer_name}, your order #{order_number} has been cancelled. Contact us for any questions.' },
        { group: 'Customers', type: 'customers/create', label: 'New Customer', icon: 'person_add', color: 'teal', template: 'Welcome {customer_name} to our store! We\'re glad to have you 🌟' },
    ],
};

const getEventTypes = (storeType, lang) => {
    const map = {
        woocommerce: WOOCOMMERCE_EVENTS,
        salla: SALLA_EVENTS,
        zid: ZID_EVENTS,
        shopify: SHOPIFY_EVENTS,
    };
    const events = map[storeType] || WOOCOMMERCE_EVENTS;
    return events[lang] || events['en'] || events['ar'];
};

const SUPPORTED_ACTIONS = [
    { id: 'wc_meta_confirm', labelAr: 'تأكيد الطلب (تحديث خانة ووكومرس)', labelEn: 'Confirm Order (Meta)', icon: 'check_circle' },
    { id: 'wc_meta_cancel', labelAr: 'إلغاء الطلب (تحديث خانة ووكومرس)', labelEn: 'Cancel Order (Meta)', icon: 'cancel' },
    { id: 'wc_meta_support', labelAr: 'تواصل مع الدعم (تحديث خانة ووكومرس)', labelEn: 'Support (Meta)', icon: 'headset_mic' },
];

const getStoreDisplayName = (s: any, lang: string) => {
    if (!s) return lang === 'ar' ? 'اختر متجر' : 'Select Store';
    const platformNames = ['woocommerce', 'salla', 'zid', 'shopify'];
    const name = s.name?.toLowerCase().trim();
    if (!s.name || platformNames.includes(name)) {
        if (s.store_url) {
            try {
                return new URL(s.store_url).hostname;
            } catch {
                return s.store_url.replace(/^https?:\/\//, '').split('/')[0];
            }
        }
        return s.store_type?.toUpperCase() || (lang === 'ar' ? 'متجر' : 'Store');
    }
    return s.name;
};

export default function CustomerMessagesPage() {
    const [allStores, setAllStores] = useState<any[]>([]);
    const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
    const [store, setStore] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [rules, setRules] = useState<any[]>([]);
    const [availableLanguages, setAvailableLanguages] = useState<any[]>([
        { code: 'ar', label: 'العربية', dir: 'rtl' },
        { code: 'en', label: 'English', dir: 'ltr' }
    ]);
    const [activeLang, setActiveLang] = useState<string>('ar');
    const uiLang = 'ar';
    const [isSyncingLangs, setIsSyncingLangs] = useState(false);
    const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
    const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);

    // Preview Modal State
    const [previewMessage, setPreviewMessage] = useState<string>('');
    const [previewTitle, setPreviewTitle] = useState<string>('');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Editing State
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
    const [editingTemplate, setEditingTemplate] = useState<string>('');
    const [buttonsConfig, setButtonsConfig] = useState<any>({ buttons: [] });
    const [isSaving, setIsSaving] = useState(false);

    const supabase = createClient();

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: stores } = await supabase
            .from('stores')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (stores && stores.length > 0) {
            setAllStores(stores);
            if (!selectedStoreId) {
                const initialStoreId = stores[0].id;
                setSelectedStoreId(initialStoreId);
                await loadStoreData(initialStoreId, user.id);
            } else {
                await loadStoreData(selectedStoreId, user.id);
            }
        } else {
            setLoading(false);
        }
    };

    const loadStoreData = async (storeId: string, userId: string) => {
        const currentStore = allStores.find(s => s.id === storeId);
        
        if (!currentStore) {
            console.error('[CustomerMessages] Store not found in list:', storeId);
            return;
        }

        console.log('[CustomerMessages] Loading data for store:', currentStore.name || currentStore.store_url);
        setStore(currentStore);

        // Build available languages
        let langsToUse = [];
        if (currentStore.store_languages && Array.isArray(currentStore.store_languages) && currentStore.store_languages.length > 0) {
            langsToUse = currentStore.store_languages.map((l: any) => {
                const meta = LANGUAGE_META[l.code] || { label: l.name || l.code, dir: 'ltr' };
                return { code: l.code, label: meta.label, dir: meta.dir, is_default: l.is_default };
            });
        } else {
            const siteLangCode = currentStore.site_language || 'ar';
            const meta = LANGUAGE_META[siteLangCode] || { label: siteLangCode, dir: 'ltr' };
            langsToUse = [{ code: siteLangCode, label: meta.label, dir: meta.dir, is_default: true }];
            if (siteLangCode === 'ar' && !langsToUse.find(l => l.code === 'en')) {
                langsToUse.push({ code: 'en', label: 'English', dir: 'ltr', is_default: false });
            }
        }
        setAvailableLanguages(langsToUse);

        // Auto-select the default or the first language
        const defaultLang = langsToUse.find(l => l.is_default);
        setActiveLang(defaultLang ? defaultLang.code : langsToUse[0].code);

        const { data: rulesData } = await supabase
            .from('notification_rules')
            .select('*')
            .eq('store_id', storeId)
            .eq('user_id', userId);

        setRules(rulesData || []);
        setLoading(false);
    };

    // Watch for store selection changes
    useEffect(() => {
        if (selectedStoreId && allStores.length > 0) {
            setLoading(true);
            (async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) await loadStoreData(selectedStoreId, user.id);
            })();
        }
    }, [selectedStoreId]);

    const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
        window.dispatchEvent(new CustomEvent('new-notification', {
            detail: {
                id: Math.random().toString(36).substr(2, 9),
                title: type === 'error' ? 'تنبيه' : 'تم بنجاح',
                message: text,
                type: type,
                created_at: new Date().toISOString()
            }
        }));
    };

    // Get rule for specific event + language
    const getRuleForEvent = (eventType: string, lang: string) => {
        return rules.find(r => r.event_type === eventType && r.language === lang);
    };

    // Get count of active rules per language
    const getActiveCountForLang = (lang: string) => {
        return rules.filter(r => r.is_active && r.language === lang).length;
    };

    const handleToggleRule = async (eventType: string, currentlyActive: boolean, template: string) => {
        const existingRule = getRuleForEvent(eventType, activeLang);
        try {
            if (existingRule) {
                const res = await fetch('/api/notifications', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: existingRule.id, is_active: !currentlyActive })
                });
                const data = await res.json();
                if (data.success) setRules(rules.map(r => r.id === existingRule.id ? { ...r, is_active: !currentlyActive } : r));
            } else if (store) {
                const res = await fetch('/api/notifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ store_id: store.id, event_type: eventType, message_template: template, is_active: true, language: activeLang })
                });
                const data = await res.json();
                if (data.success) {
                    setRules([...rules, data.rule]);
                    showMessage(uiLang === 'ar' ? 'تم تفعيل الرسالة بنجاح ✓' : 'Message activated successfully ✓');
                } else {
                    showMessage(uiLang === 'ar' ? 'فشل التفعيل: ' + (data.error || 'خطأ في الربط') : 'Activation failed: ' + (data.error || 'connection error'), 'error');
                }
            } else {
                showMessage(uiLang === 'ar' ? 'يرجى ربط المتجر أولاً من صفحة الإعدادات' : 'Please connect your store first from Settings', 'error');
            }
        } catch (err: any) {
            showMessage((uiLang === 'ar' ? 'حدث خطأ في الاتصال: ' : 'Connection error: ') + err.message, 'error');
        }
    };

    const handleSaveTemplate = async (ruleId: string) => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: ruleId, 
                    message_template: editingTemplate,
                    buttons_config: buttonsConfig
                })
            });
            const data = await res.json();
            if (data.success) {
                setRules(rules.map(r => r.id === ruleId ? { ...r, message_template: editingTemplate, buttons_config: buttonsConfig } : r));
                setEditingRuleId(null);
                showMessage(uiLang === 'ar' ? 'تم حفظ التعديلات بنجاح' : 'Changes saved successfully');
            } else {
                showMessage(uiLang === 'ar' ? 'فشل حفظ التعديلات' : 'Failed to save changes', 'error');
            }
        } catch {
            showMessage(uiLang === 'ar' ? 'فشل حفظ التعديلات' : 'Failed to save changes', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteRule = async (id: string) => {
        if (!confirm(uiLang === 'ar' ? 'هل أنت متأكد من حذف هذه القاعدة؟' : 'Are you sure you want to delete this rule?')) return;
        const res = await fetch('/api/notifications', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
        const data = await res.json();
        if (data.success) {
            setRules(rules.filter(r => r.id !== id));
            if (editingRuleId === id) setEditingRuleId(null);
            showMessage(uiLang === 'ar' ? 'تم الحذف بنجاح' : 'Deleted successfully');
        }
    };

    const eventTypes = getEventTypes(store?.store_type, activeLang);

    const openPreview = (message: string, eventType: string, ruleButtons: any = null) => {
        setPreviewMessage(message);
        const label = eventTypes.find(e => e.type === eventType)?.label || eventType;
        setPreviewTitle(`${uiLang === 'ar' ? 'معاينة' : 'Preview'}: ${label}`);
        
        // Handle both old and new button formats for preview
        let previewBtns = ruleButtons;
        if (ruleButtons && !Array.isArray(ruleButtons) && !ruleButtons.buttons) {
            // Convert old format to array for preview tool
            const temp = [];
            if (ruleButtons.confirm) temp.push({ text: uiLang === 'ar' ? 'تأكيد الطلب' : 'Confirm' });
            if (ruleButtons.cancel) temp.push({ text: uiLang === 'ar' ? 'إلغاء الطلب' : 'Cancel' });
            if (ruleButtons.support) temp.push({ text: uiLang === 'ar' ? 'الدعم' : 'Support' });
            previewBtns = temp;
        } else if (ruleButtons?.buttons) {
            previewBtns = ruleButtons.buttons;
        }

        setPreviewButtons(previewBtns);
        setIsPreviewOpen(true);
    };

    const [previewButtons, setPreviewButtons] = useState<any>(null);

    if (loading) return (
        <div className="flex-1 flex items-center justify-center p-10">
            <div className="flex flex-col items-center text-primary">
                <span className="material-symbols-outlined text-4xl animate-spin mb-3">sync</span>
                <span className="font-bold">جاري التحميل...</span>
            </div>
        </div>
    );

    if (!store) return (
        <div className="flex-1 px-6 py-8 md:px-10">
            <div className="max-w-5xl mx-auto flex flex-col gap-6 text-center pt-20">
                <div className="bg-amber-50 p-6 rounded-3xl mx-auto border border-amber-200 shadow-sm max-w-xl">
                    <span className="material-symbols-outlined text-5xl text-amber-500 mb-4 block mx-auto">storefront</span>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">قم بربط متجرك أولاً</h2>
                    <p className="text-slate-600 mb-6">لتتمكن من تفعيل رسائل العملاء التلقائية، تحتاج أولاً إلى ربط متجرك بالمنصة.</p>
                    <Link href="/dashboard/integrations" className="inline-flex items-center justify-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
                        <span className="material-symbols-outlined">link</span>
                        ربط متجرك الآن
                    </Link>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div className="flex-1 px-6 py-8 md:px-10">
                <div className="max-w-5xl mx-auto flex flex-col gap-6">

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-20">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                {uiLang === 'ar' ? 'رسائل العملاء الآلية' : 'Automated Customer Messages'}
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">
                                {uiLang === 'ar'
                                    ? 'تفعيل وإدارة الرسائل التلقائية التي ترسل للعملاء عند تغير حالات الطلب'
                                    : 'Enable and manage automated messages sent to customers on order status changes'}
                            </p>
                        </div>
                        
                        {/* ── Store Selector ── */}
                        <div className="flex flex-col gap-1 relative z-40">
                            <label className="text-xs font-bold text-slate-500 mr-2">
                                {uiLang === 'ar' ? 'المتجر المختار' : 'Selected Store'}
                            </label>
                            <button
                                onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
                                className="flex items-center justify-between min-w-[200px] bg-primary/5 hover:bg-primary/10 border border-primary/20 text-primary font-bold rounded-2xl px-4 py-2.5 transition-all shadow-sm"
                            >
                                <div className="flex items-center gap-2 text-left">
                                    <span className="material-symbols-outlined text-[20px]">storefront</span>
                                    <span className="truncate max-w-[150px]">{getStoreDisplayName(store, activeLang)}</span>
                                </div>
                                <span className={`material-symbols-outlined transition-transform ${isStoreDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                            </button>

                            {isStoreDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsStoreDropdownOpen(false)}></div>
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden min-w-[250px] animate-in fade-in slide-in-from-top-2">
                                        {allStores.map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => {
                                                    setSelectedStoreId(s.id);
                                                    setIsStoreDropdownOpen(false);
                                                }}
                                                className={`flex items-center justify-between w-full text-start px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${selectedStoreId === s.id ? 'bg-primary/5 text-primary' : 'text-slate-700'}`}
                                            >
                                                <div className="flex flex-col text-left overflow-hidden">
                                                    <span className="font-bold truncate">{getStoreDisplayName(s, activeLang)}</span>
                                                    <span className="text-[10px] opacity-60 uppercase">{s.store_type}</span>
                                                </div>
                                                {selectedStoreId === s.id && (
                                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* ── Language Selector Dropdown ── */}
                    <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <div className="flex flex-col gap-1 relative z-30">
                            <label className="text-sm font-bold text-slate-700">
                                {uiLang === 'ar' ? 'اختر لغة الرسائل' : 'Select Message Language'}
                            </label>
                            
                            {/* Custom Dropdown Button */}
                            <button
                                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                                className="flex items-center justify-between w-full min-w-[220px] bg-white border border-slate-300 text-slate-900 font-bold rounded-xl px-4 py-2.5 outline-none hover:border-primary hover:ring-4 hover:ring-primary/10 transition-all cursor-pointer shadow-sm"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-slate-400 text-xl">language</span>
                                    <span>
                                        {availableLanguages.find(l => l.code === activeLang)?.label || activeLang}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Active badge on button itself if hovered/active */}
                                    {getActiveCountForLang(activeLang) > 0 && (
                                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600">
                                            {getActiveCountForLang(activeLang)} مفعل
                                        </span>
                                    )}
                                    <span className={`material-symbols-outlined text-slate-400 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`}>
                                        expand_more
                                    </span>
                                </div>
                            </button>

                            {/* Dropdown Menu Overlay & List */}
                            {isLangDropdownOpen && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-40" 
                                        onClick={() => setIsLangDropdownOpen(false)}
                                    ></div>
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden min-w-[220px] animate-in fade-in slide-in-from-top-2">
                                        {availableLanguages.map((lang: any) => {
                                            const count = getActiveCountForLang(lang.code);
                                            const isSelected = lang.code === activeLang;
                                            return (
                                                <button
                                                    key={lang.code}
                                                    onClick={() => {
                                                        setActiveLang(lang.code);
                                                        setEditingRuleId(null);
                                                        setIsLangDropdownOpen(false);
                                                    }}
                                                    className={`flex items-center justify-between w-full text-start px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${isSelected ? 'bg-primary/5 text-primary' : 'text-slate-700'}`}
                                                >
                                                    <span className={`font-bold ${isSelected ? 'text-primary' : ''}`}>
                                                        {lang.label}
                                                    </span>
                                                    {count > 0 && (
                                                        <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${isSelected ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>
                                                            {count}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Sync Languages Button */}
                        <div className="flex flex-col gap-1 sm:mt-0 mt-2 sm:mr-auto">
                            <button
                                onClick={async () => {
                                    setIsSyncingLangs(true);
                                    try {
                                        const res = await fetch('/api/woocommerce/sync-languages', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ store_id: store.id })
                                        });
                                        const data = await res.json();
                                        if (data.success) {
                                            const langCount = data.store_languages ? data.store_languages.length : 0;
                                            showMessage(uiLang === 'ar' ? `تم تحديث اللغات بنجاح. تم اكتشاف ${langCount} لغات في المتجر.` : `Languages synced successfully. Detected ${langCount} languages.`);
                                            loadData(); // Reload to get updated languages
                                        } else {
                                            showMessage(data.error || 'Failed to sync', 'error');
                                        }
                                    } catch (e: any) {
                                        showMessage(e.message, 'error');
                                    } finally {
                                        setIsSyncingLangs(false);
                                    }
                                }}
                                disabled={isSyncingLangs}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-primary hover:text-primary text-slate-600 rounded-xl font-bold text-sm transition-all disabled:opacity-50 mt-auto"
                            >
                                <span className={`material-symbols-outlined text-[18px] ${isSyncingLangs ? 'animate-spin' : ''}`}>sync</span>
                                {uiLang === 'ar' ? 'تحديث اللغات من المتجر' : 'Sync Languages'}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-900">
                                {uiLang === 'ar' ? 'الرسائل التلقائية' : 'Automated Messages'}
                            </h3>
                            <span className="bg-primary/10 text-primary text-sm font-bold px-4 py-1.5 rounded-full border border-primary/20">
                                {getActiveCountForLang(activeLang)} {uiLang === 'ar' ? 'مفعّل' : 'active'}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                            {eventTypes.map(event => {
                                const eventType = event.type;
                                const rule = getRuleForEvent(eventType, activeLang);
                                const isEditing = rule && editingRuleId === rule.id;
                                const isActive = rule?.is_active || false;
                                const template = isEditing ? editingTemplate : (rule?.message_template || event.template);
                                const displayButtons = isEditing ? buttonsConfig : (rule?.buttons_config || { confirm: false, cancel: false, support: false });

                                // Languages where this event is currently active (excluding the activeLang)
                                const activeOtherLangs = rules
                                    .filter(r => r.event_type === event.type && r.is_active && r.language !== activeLang)
                                    .map(r => r.language);

                                return (
                                    <div key={event.type} className={`bg-white rounded-3xl border shadow-sm transition-all hover:shadow-xl group relative overflow-hidden flex flex-col ${isActive ? 'border-primary/20 hover:border-primary/40' : 'border-slate-200 hover:border-slate-300'}`}>

                                        {/* Header area of card */}
                                        <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between relative z-10">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <div className={`w-fit px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 ${isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                                        {isActive ? (uiLang === 'ar' ? 'نشط ويعمل' : 'Active') : (uiLang === 'ar' ? 'متوقف حالياً' : 'Inactive')}
                                                    </div>
                                                    {activeOtherLangs.length > 0 && (
                                                        <div className="flex gap-1 flex-wrap">
                                                            {activeOtherLangs.map((langCode: string) => (
                                                                <div key={langCode} className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-500 flex items-center gap-1" title="Active in this language">
                                                                    <span className="text-xs">🌐</span>
                                                                    {langCode.toUpperCase()}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                                                    <span className={`material-symbols-outlined text-${event.color}-500`}>{event.icon}</span>
                                                    {event.label}
                                                </h3>
                                            </div>

                                            <label className="relative inline-flex items-center cursor-pointer mt-1">
                                                <input
                                                    checked={isActive}
                                                    onChange={() => handleToggleRule(event.type, isActive, event.template)}
                                                    className="sr-only peer" type="checkbox"
                                                />
                                                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:right-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-[22px] after:w-[22px] after:transition-all peer-checked:bg-primary shadow-inner"></div>
                                            </label>
                                        </div>

                                        {/* Preview Message Snippet */}
                                        <div className="p-6 flex-1 flex flex-col justify-center bg-slate-50/50 min-h-[140px]">
                                            <div className={`relative bg-[#DCF8C6] p-4 rounded-3xl ${LANGUAGE_META[activeLang]?.dir === 'rtl' ? 'rounded-tr-sm' : 'rounded-tl-sm'} text-slate-800 text-sm font-medium leading-relaxed shadow-sm border border-[#DCF8C6]/50 drop-shadow-sm group-hover:scale-[1.01] transition-transform ${LANGUAGE_META[activeLang]?.dir === 'rtl' ? 'origin-right' : 'origin-left'}`} dir={LANGUAGE_META[activeLang]?.dir || 'ltr'}>
                                                <p className="line-clamp-4 whitespace-pre-wrap">{template}</p>
                                                {/* Little chat tail */}
                                                <div className={`absolute top-0 ${LANGUAGE_META[activeLang]?.dir === 'rtl' ? '-right-2' : '-left-2'} w-3 h-3 text-[#DCF8C6]`}>
                                                    <svg viewBox="0 0 8 13" width="8" height="13" className="fill-current" style={LANGUAGE_META[activeLang]?.dir !== 'rtl' ? { transform: 'scaleX(-1)' } : {}}>
                                                        <path fill="currentColor" d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z"></path>
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="p-4 grid grid-cols-2 gap-2 bg-white border-t border-slate-100 mt-auto">
                                            <button
                                                onClick={() => openPreview(template, event.type, displayButtons)}
                                                className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                {uiLang === 'ar' ? 'معاينة' : 'Preview'}
                                            </button>

                                            {rule ? (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={() => {
                                                            if (editingRuleId === rule.id) {
                                                                setEditingRuleId(null);
                                                            } else {
                                                                setEditingRuleId(rule.id);
                                                                setEditingTemplate(rule.message_template);
                                                                setButtonsConfig(rule.buttons_config || { confirm: false, cancel: false, support: false });
                                                            }
                                                        }}
                                                        className={`flex items-center justify-center py-2.5 rounded-2xl font-bold transition-all ${editingRuleId === rule.id ? 'bg-primary text-white shadow-lg shadow-blue-500/30' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'}`}
                                                        title={uiLang === 'ar' ? 'تعديل القالب' : 'Edit Template'}
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">{editingRuleId === rule.id ? 'close' : 'edit'}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteRule(rule.id)}
                                                        className="flex items-center justify-center py-2.5 rounded-2xl text-red-600 bg-red-50 font-bold hover:bg-red-100 transition-colors"
                                                        title={uiLang === 'ar' ? 'حذف القاعدة' : 'Delete Rule'}
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleToggleRule(event.type, false, event.template)}
                                                    className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                                                    {uiLang === 'ar' ? 'تفعيل' : 'Activate'}
                                                </button>
                                            )}
                                        </div>

                                        {/* Inline Editor */}
                                        {rule && editingRuleId === rule.id && (
                                            <div className="p-6 bg-slate-50 border-t border-slate-100 animate-in slide-in-from-top duration-300">
                                                <div className="flex items-center justify-between mb-3 text-sm text-slate-500">
                                                    <span className="font-bold text-slate-700">
                                                        {uiLang === 'ar' ? 'تعديل قالب الرسالة' : 'Edit Message Template'}
                                                    </span>
                                                    <div className="flex gap-2">
                                                        {['{customer_name}', '{customer_phone}', '{order_number}', '{order_total}', '{product_list}', '{shipping_address}'].map(tag => (
                                                            <button
                                                                key={tag}
                                                                onClick={() => setEditingTemplate(prev => prev + ' ' + tag)}
                                                                className="px-2 py-0.5 rounded bg-white border border-slate-200 hover:border-primary hover:text-primary transition-colors text-[10px] font-mono whitespace-nowrap"
                                                            >
                                                                {tag}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <textarea
                                                    value={editingTemplate}
                                                    onChange={(e) => setEditingTemplate(e.target.value)}
                                                    className="w-full h-32 p-4 rounded-2xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm outline-none resize-none font-medium leading-relaxed"
                                                    placeholder={uiLang === 'ar' ? 'اكتب رسالتك هنا...' : 'Type your message here...'}
                                                    dir={LANGUAGE_META[activeLang]?.dir || 'ltr'}
                                                />

                                                {/* Buttons Configuration Inline */}
                                                <div className="mt-4 p-5 bg-white rounded-3xl border border-slate-200">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div>
                                                            <p className="text-base font-black text-slate-900 flex items-center gap-2">
                                                                <span className="material-symbols-outlined text-primary">smart_button</span>
                                                                {uiLang === 'ar' ? 'أزرار تفاعلية مخصصة' : 'Custom Interactive Buttons'}
                                                            </p>
                                                            <p className="text-xs text-slate-500 mt-1">
                                                                {uiLang === 'ar' 
                                                                    ? 'أضف حتى 3 أزرار تظهر تحت الرسالة للعميل' 
                                                                    : 'Add up to 3 buttons that appear under the message'}
                                                            </p>
                                                        </div>
                                                        {(!buttonsConfig?.buttons || buttonsConfig.buttons.length < 3) && (
                                                            <button
                                                                onClick={() => {
                                                                    const newBtn = { id: Math.random().toString(36).substr(2, 9), text: '', action: 'reply', reply_text: '' };
                                                                    setButtonsConfig((prev: any) => ({
                                                                        ...prev,
                                                                        buttons: [...(prev.buttons || []), newBtn]
                                                                    }));
                                                                }}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-xs font-bold transition-colors"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">add</span>
                                                                {uiLang === 'ar' ? 'إضافة زر' : 'Add Button'}
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="space-y-3">
                                                        {(buttonsConfig?.buttons || []).map((btn: any, index: number) => (
                                                            <div key={btn.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-3 relative animate-in slide-in-from-right-2 duration-200">
                                                                <button 
                                                                    onClick={() => {
                                                                        setButtonsConfig((prev: any) => ({
                                                                            ...prev,
                                                                            buttons: prev.buttons.filter((b: any) => b.id !== btn.id)
                                                                        }));
                                                                    }}
                                                                    className="absolute top-2 left-2 p-1 text-slate-400 hover:text-red-500 transition-colors"
                                                                >
                                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                </button>

                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                    <div className="flex flex-col gap-1">
                                                                        <label className="text-[10px] font-bold text-slate-500 uppercase px-1">{uiLang === 'ar' ? 'الرقم أو النص المطلوب للرد' : 'Number or Text to Reply'}</label>
                                                                        <input 
                                                                            type="text"
                                                                            value={btn.text}
                                                                            maxLength={20}
                                                                            onChange={(e) => {
                                                                                const newBtns = [...buttonsConfig.buttons];
                                                                                newBtns[index].text = e.target.value;
                                                                                setButtonsConfig({ ...buttonsConfig, buttons: newBtns });
                                                                            }}
                                                                            className="w-full text-sm p-2.5 rounded-xl border border-slate-200 focus:border-primary outline-none transition-all"
                                                                            placeholder={uiLang === 'ar' ? 'مثال: 1 أو تأكيد' : 'ex: 1 or Confirm'}
                                                                        />
                                                                    </div>
                                                                    <div className="flex flex-col gap-1">
                                                                        <label className="text-[10px] font-bold text-slate-500 uppercase px-1">{uiLang === 'ar' ? 'الإجراء عند الضغط' : 'Action on Click'}</label>
                                                                        <select 
                                                                            value={btn.action}
                                                                            onChange={(e) => {
                                                                                const newBtns = [...buttonsConfig.buttons];
                                                                                newBtns[index].action = e.target.value;
                                                                                setButtonsConfig({ ...buttonsConfig, buttons: newBtns });
                                                                            }}
                                                                            className="w-full text-sm p-2.5 rounded-xl border border-slate-200 focus:border-primary outline-none bg-white font-bold"
                                                                        >
                                                                            {SUPPORTED_ACTIONS.map(a => (
                                                                                <option key={a.id} value={a.id}>{uiLang === 'ar' ? a.labelAr : a.labelEn}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                </div>

                                                                {(btn.action === 'reply' || btn.action.startsWith('wc_meta_')) && (
                                                                    <div className="flex flex-col gap-1">
                                                                        <label className="text-[10px] font-bold text-emerald-600 uppercase px-1">{uiLang === 'ar' ? 'رسالة الرد التلقائي' : 'Auto Reply Message'}</label>
                                                                        <input 
                                                                            type="text"
                                                                            value={btn.reply_text || ''}
                                                                            onChange={(e) => {
                                                                                const newBtns = [...buttonsConfig.buttons];
                                                                                newBtns[index].reply_text = e.target.value;
                                                                                setButtonsConfig({ ...buttonsConfig, buttons: newBtns });
                                                                            }}
                                                                            className="w-full text-sm p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 focus:bg-white focus:border-emerald-500 outline-none transition-all"
                                                                            placeholder={uiLang === 'ar' ? 'ماذا سيرد النظام على العميل؟' : 'What will the system reply?'}
                                                                        />
                                                                    </div>
                                                                )}


                                                            </div>
                                                        ))}

                                                        {(!buttonsConfig?.buttons || buttonsConfig.buttons.length === 0) && (
                                                            <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                                <span className="material-symbols-outlined text-slate-300 text-4xl mb-2">touch_app</span>
                                                                <p className="text-sm text-slate-400 font-medium">{uiLang === 'ar' ? 'لا توجد أزرار مضافة حالياً' : 'No buttons added yet'}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-end gap-2 mt-4">
                                                    <button
                                                        disabled={isSaving}
                                                        onClick={() => setEditingRuleId(null)}
                                                        className="px-4 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-200 transition-colors text-sm"
                                                    >
                                                        {uiLang === 'ar' ? 'إلغاء' : 'Cancel'}
                                                    </button>
                                                    <button
                                                        disabled={isSaving}
                                                        onClick={() => handleSaveTemplate(rule.id)}
                                                        className="px-6 py-2 rounded-xl bg-primary text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 text-sm flex items-center gap-2"
                                                    >
                                                        {isSaving ? (
                                                            <span className="sidebar-loading-spinner !size-4 !border-white"></span>
                                                        ) : (
                                                            <span className="material-symbols-outlined text-[18px]">save_as</span>
                                                        )}
                                                        {uiLang === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>

            {/* WhatsApp Preview Modal */}
            <WhatsAppPreview
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                message={previewMessage}
                title={previewTitle}
                buttons={previewButtons}
            />
        </>
    );
}
