// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function Page() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    // Form
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [messageTemplate, setMessageTemplate] = useState('');
    const [status, setStatus] = useState('DRAFT');
    const [scheduledAt, setScheduledAt] = useState('');
    const [targetCount, setTargetCount] = useState<number>(0);
    const [audienceType, setAudienceType] = useState('manual');
    const [manualAudience, setManualAudience] = useState('');
    const [launchingId, setLaunchingId] = useState<string | null>(null);
    const [allContacts, setAllContacts] = useState<any[]>([]);
    const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
    const [contactSearch, setContactSearch] = useState('');
    const [engineProcessing, setEngineProcessing] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        loadCampaigns();
        const interval = setInterval(() => {
            loadCampaignsBackground();
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const loadCampaignsBackground = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('campaigns')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (data) setCampaigns(data);
    };

    const loadCampaigns = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('campaigns')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        setCampaigns(data || []);
        setLoading(false);
        fetchContacts();
    };

    const fetchContacts = async () => {
        const { data } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
        if (data) setAllContacts(data);
    };

    const showMsg = (msg: string) => {
        setMessage(msg);
        setTimeout(() => setMessage(null), 3000);
    };

    const openCreateForm = () => {
        setEditingId(null);
        setName('');
        setMessageTemplate('');
        setStatus('DRAFT');
        setScheduledAt('');
        setTargetCount(0);
        setAudienceType('manual');
        setManualAudience('');
        setSelectedContacts([]);
        setShowForm(true);
    };

    const openEditForm = (cam: any) => {
        setEditingId(cam.id);
        setName(cam.name || '');
        setMessageTemplate(cam.message_template || '');
        setStatus(cam.status || 'DRAFT');
        setScheduledAt(cam.scheduled_at ? new Date(cam.scheduled_at).toISOString().slice(0, 16) : '');
        setTargetCount(cam.target_count || 0);
        setAudienceType(cam.audience_type || 'manual');
        setManualAudience(cam.target_audience || '');
        setSelectedContacts(cam.audience_type === 'selected' ? (cam.target_audience || '').split(',') : []);
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!name.trim()) { showMsg('يرجى إدخال اسم الحملة'); return; }
        setSaving(true);
        try {
            const body = {
                id: editingId,
                name,
                message_template: messageTemplate,
                status,
                scheduled_at: scheduledAt || null,
                target_count: targetCount,
                target_audience: audienceType === 'selected' ? selectedContacts.join(',') : manualAudience,
                audience_type: audienceType
            };
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch('/api/campaigns', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                showMsg(editingId ? 'تم تحديث الحملة بنجاح ✓' : 'تم إنشاء الحملة بنجاح ✓');
                setShowForm(false);
                loadCampaigns();
            } else {
                showMsg('فشل الحفظ: ' + data.error);
            }
        } catch (err) {
            showMsg('حدث خطأ غير متوقع');
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه الحملة؟')) return;
        try {
            const res = await fetch('/api/campaigns', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const data = await res.json();
            if (data.success) {
                showMsg('تم حذف الحملة بنجاح');
                loadCampaigns();
            }
        } catch (err) {
            showMsg('فشل حذف الحملة');
        }
    };

    const toggleStatus = async (cam: any) => {
        const newStatus = cam.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        try {
            const res = await fetch('/api/campaigns', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: cam.id, status: newStatus })
            });
            if ((await res.json()).success) {
                showMsg('تم تغيير حالة الحملة بنجاح');
                loadCampaigns();
            }
        } catch (err) { }
    };

    const handleLaunch = async (cam: any) => {
        if (!confirm(`هل أنت متأكد من بدء الحملة "${cam.name}"؟ سيتم إضافة الرسائل إلى طابور الإرسال.`)) return;
        setLaunchingId(cam.id);
        try {
            const res = await fetch('/api/campaigns', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: cam.id,
                    action: 'launch',
                    audience: cam.target_audience,
                    audienceType: cam.audience_type || 'manual'
                })
            });
            const data = await res.json();
            if (data.success) {
                showMsg(data.message);
                loadCampaigns();
            } else {
                showMsg('فشل بدء الحملة: ' + data.error);
            }
        } catch (err) {
            showMsg('حدث خطأ أثناء بدء الحملة');
        }
        setLaunchingId(null);
        // Automatically trigger the engine to start processing the campaign messages
        runSenderEngineOnce();
    };

    const runSenderEngineOnce = async () => {
        try {
            await fetch('/api/whatsapp/send', { method: 'POST' });
        } catch (error) {
            console.error('Auto-engine error:', error);
        }
    };

    const handleRunSenderEngineAction = async () => {
        setEngineProcessing(true);
        try {
            let processedTotal = 0;
            let hasMore = true;

            while (hasMore) {
                const res = await fetch('/api/whatsapp/send', { method: 'POST' });
                const data = await res.json();

                if (data.processed > 0) {
                    processedTotal += data.processed;
                    if (data.remaining > 0) {
                        hasMore = true;
                        await new Promise(r => setTimeout(r, 1000));
                    } else {
                        hasMore = false;
                    }
                } else {
                    hasMore = false;
                }

                if (!hasMore) {
                    if (processedTotal > 0) {
                        showMsg(`تم الانتهاء من معالجة ${processedTotal} رسالة بنجاح`);
                    } else {
                        showMsg('لا يوجد رسائل معلقة حالياً');
                    }
                }
            }
        } catch (error) {
            console.error('Engine error:', error);
            showMsg('حدث خطأ أثناء تشغيل محرك الإرسال');
        } finally {
            setEngineProcessing(false);
        }
    };

    const totalCount = campaigns.length;
    const activeCount = campaigns.filter(c => c.status === 'ACTIVE' || c.status === 'SCHEDULED').length;
    const completedCount = campaigns.filter(c => c.status === 'COMPLETED').length;

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-10">
                <div className="flex flex-col items-center text-primary">
                    <span className="material-symbols-outlined text-4xl animate-spin mb-3">sync</span>
                    <span className="font-bold">جاري التحميل...</span>
                </div>
            </div>
        );
    }

    return (
        <>
            {message && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-medium">{message}</div>
            )}
            <div className="flex-1 flex flex-col p-8 gap-6 max-w-7xl mx-auto w-full pb-24">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold text-slate-900">الحملات التسويقية</h1>
                        <p className="text-sm text-slate-500">أنشئ وأدر حملات واتساب التسويقية بذكاء</p>
                    </div>
                    <button
                        onClick={openCreateForm}
                        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all active:scale-95"
                    >
                        <span>إنشاء حملة جديدة</span>
                    </button>
                    <button
                        onClick={handleRunSenderEngineAction}
                        disabled={engineProcessing}
                        className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <span className={`material-symbols-outlined text-xl ${engineProcessing ? 'animate-spin' : 'text-amber-500'}`}>
                            {engineProcessing ? 'sync' : 'bolt'}
                        </span>
                        <span>{engineProcessing ? 'جاري الإرسال...' : 'تشغيل محرك الإرسال'}</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-slate-500">إجمالي الحملات</span>
                                <span className="text-2xl font-bold text-slate-900">{totalCount}</span>
                            </div>
                            <div className="rounded-lg bg-blue-100 p-2 text-blue-600"><span className="material-symbols-outlined">campaign</span></div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-slate-500">حملات نشطة / مجدولة</span>
                                <span className="text-2xl font-bold text-green-600">{activeCount}</span>
                            </div>
                            <div className="rounded-lg bg-green-100 p-2 text-green-600"><span className="material-symbols-outlined">play_circle</span></div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-slate-500">مكتملة</span>
                                <span className="text-2xl font-bold text-slate-600">{completedCount}</span>
                            </div>
                            <div className="rounded-lg bg-slate-100 p-2 text-slate-600"><span className="material-symbols-outlined">check_circle</span></div>
                        </div>
                    </div>
                </div>

                {/* Campaign List */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {campaigns.length === 0 ? (
                        <div className="py-16 text-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="p-4 bg-slate-50 rounded-full"><span className="material-symbols-outlined text-4xl text-slate-300">campaign</span></div>
                                <p className="text-slate-500 font-medium">لا توجد حملات حالياً</p>
                                <p className="text-slate-400 text-sm">اضغط على "إنشاء حملة جديدة" للبدء</p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right min-w-[800px]">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="py-4 px-6 text-xs font-bold text-slate-500">اسم الحملة</th>
                                        <th className="py-4 px-6 text-xs font-bold text-slate-500">الوقت</th>
                                        <th className="py-4 px-6 text-xs font-bold text-slate-500">المرسلة / المستهدفة</th>
                                        <th className="py-4 px-6 text-xs font-bold text-slate-500">الحالة</th>
                                        <th className="py-4 px-6 text-xs font-bold text-slate-500 text-center">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {campaigns.map(cam => (
                                        <tr key={cam.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-4 px-6">
                                                <p className="font-bold text-slate-800">{cam.name}</p>
                                                <p className="text-xs text-slate-400 mt-1 line-clamp-1 max-w-xs">{cam.message_template}</p>
                                            </td>
                                            <td className="py-4 px-6">
                                                {cam.scheduled_at ? (
                                                    <div className="flex flex-col text-sm text-slate-600">
                                                        <span>{new Date(cam.scheduled_at).toLocaleDateString('ar-EG')}</span>
                                                        <span className="text-xs text-slate-400">{new Date(cam.scheduled_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400">فوراً</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-slate-100 rounded-full h-2 max-w-[100px] overflow-hidden">
                                                        <div className="bg-primary h-full rounded-full" style={{ width: `${cam.target_count ? Math.min(100, (cam.sent_count || 0) / cam.target_count * 100) : 0}%` }}></div>
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-600" dir="ltr">{cam.sent_count || 0} / {cam.target_count || 0}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex gap-2 items-center">
                                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border ${cam.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        cam.status === 'DRAFT' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                                                            cam.status === 'PAUSED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                                cam.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                    'bg-slate-50 text-slate-600 border-slate-200'
                                                        }`}>
                                                        <span className={`size-1.5 rounded-full ${cam.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' : cam.status === 'PAUSED' ? 'bg-amber-500' : cam.status === 'SCHEDULED' ? 'bg-blue-500' : 'bg-slate-400'}`}></span>
                                                        {cam.status === 'ACTIVE' ? 'نشطة' : cam.status === 'PAUSED' ? 'موقوفة' : cam.status === 'DRAFT' ? 'مسودة' : cam.status === 'SCHEDULED' ? 'مجدولة' : 'مكتملة'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {cam.status !== 'COMPLETED' && (
                                                        <button onClick={() => toggleStatus(cam)} className={`p-1.5 rounded-lg transition-colors ${cam.status === 'ACTIVE' ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'}`} title={cam.status === 'ACTIVE' ? 'إيقاف مؤقت' : 'تفعيل'}>
                                                            <span className="material-symbols-outlined text-[20px]">{cam.status === 'ACTIVE' ? 'pause' : 'play_arrow'}</span>
                                                        </button>
                                                    )}
                                                    {(cam.status === 'DRAFT' || cam.status === 'SCHEDULED' || cam.status === 'PAUSED') && (
                                                        <button
                                                            onClick={() => handleLaunch(cam)}
                                                            disabled={launchingId === cam.id}
                                                            className="p-1.5 rounded-lg text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
                                                            title="بدء الإرسال (Launch)"
                                                        >
                                                            <span className={`material-symbols-outlined text-[20px] ${launchingId === cam.id ? 'animate-spin' : ''}`}>
                                                                {launchingId === cam.id ? 'sync' : 'rocket_launch'}
                                                            </span>
                                                        </button>
                                                    )}
                                                    <button onClick={() => openEditForm(cam)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors" title="تعديل">
                                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                                    </button>
                                                    <button onClick={() => handleDelete(cam.id)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="حذف">
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Edit/Create Campaign Modal */}
                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 relative max-h-[90vh] overflow-y-auto">
                            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-1 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                            <h2 className="text-xl font-bold text-slate-900 mb-6">{editingId ? 'تعديل الحملة' : 'إنشاء حملة جديدة'}</h2>

                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">اسم الحملة</label>
                                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none" placeholder="مثال: خصم العيد 20%" />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">حالة الحملة</label>
                                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none">
                                            <option value="DRAFT">مسودة</option>
                                            <option value="SCHEDULED">مجدولة</option>
                                            <option value="ACTIVE">نشطة</option>
                                            <option value="PAUSED">موقوفة</option>
                                            <option value="COMPLETED">مكتملة</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">موعد الإرسال (اختياري)</label>
                                        <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-right" />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">العدد المستهدف (تقريبي)</label>
                                        <input type="number" min="0" value={targetCount} onChange={(e) => setTargetCount(parseInt(e.target.value) || 0)} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-right" placeholder="1000" />
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center justify-between text-sm font-semibold text-slate-700 mb-1.5">
                                        <span>نص الرسالة</span>
                                    </label>
                                    <textarea value={messageTemplate} onChange={(e) => setMessageTemplate(e.target.value)} className="w-full h-32 rounded-xl border border-slate-300 px-4 py-2.5 bg-slate-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none" placeholder="اكتب نص الرسالة هنا..." />
                                </div>

                                <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-slate-900">الجمهور المستهدف (أرقام الهاتف)</label>
                                        <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                                            <button
                                                onClick={() => setAudienceType('manual')}
                                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${audienceType === 'manual' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                                            >
                                                يدوي / ملف
                                            </button>
                                            <button
                                                onClick={() => setAudienceType('all')}
                                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${audienceType === 'all' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                                            >
                                                الكل
                                            </button>
                                            <button
                                                onClick={() => setAudienceType('selected')}
                                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${audienceType === 'selected' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                                            >
                                                اختيار محدد
                                            </button>
                                        </div>
                                    </div>

                                    {audienceType === 'manual' ? (
                                        <>
                                            <textarea
                                                value={manualAudience}
                                                onChange={(e) => setManualAudience(e.target.value)}
                                                className="w-full h-32 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                                placeholder="أدخل الأرقام هنا، رقم في كل سطر أو مفصولة بفواصل..."
                                            />
                                            <div className="flex items-center gap-2">
                                                <label className="flex-1 flex flex-col items-center justify-center py-3 border-2 border-dashed border-slate-300 rounded-xl hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
                                                    <span className="material-symbols-outlined text-slate-400">upload_file</span>
                                                    <span className="text-xs text-slate-500 font-medium">رفع ملف CSV أو Text</span>
                                                    <input
                                                        type="file"
                                                        accept=".csv,.txt"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const reader = new FileReader();
                                                                reader.onload = (ev) => setManualAudience(ev.target?.result as string);
                                                                reader.readAsText(file);
                                                            }
                                                        }}
                                                    />
                                                </label>
                                                <button
                                                    onClick={async () => {
                                                        const phones = manualAudience.split(/[\n,]+/).map(p => ({ phone_number: p.trim() })).filter(p => p.phone_number.length >= 8);
                                                        if (phones.length === 0) { showMsg('لا توجد أرقام صالحة لحفظها'); return; }
                                                        try {
                                                            const res = await fetch('/api/contacts', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ contacts: phones })
                                                            });
                                                            if ((await res.json()).success) {
                                                                showMsg('تم حفظ الأرقام في جهات الاتصال ✓');
                                                                fetchContacts();
                                                            }
                                                        } catch (err) { showMsg('فشل حفظ الأرقام'); }
                                                    }}
                                                    className="flex flex-col items-center justify-center py-3 px-4 border border-slate-300 rounded-xl hover:bg-slate-100 transition-all text-slate-600"
                                                    title="حفظ هذه الأرقام في جهات الاتصال"
                                                >
                                                    <span className="material-symbols-outlined">save</span>
                                                    <span className="text-[10px] font-bold">حفظ كجهات اتصال</span>
                                                </button>
                                            </div>
                                        </>
                                    ) : audienceType === 'all' ? (
                                        <div className="py-8 text-center bg-white rounded-lg border border-slate-100">
                                            <span className="material-symbols-outlined text-3xl text-primary mb-2">groups</span>
                                            <p className="text-sm font-bold text-slate-900">سيتم اختيار جميع الأرقام المحفوظة</p>
                                            <p className="text-xs text-slate-500 mt-1">سيقوم النظام بسحب الأرقام من جدول جهات الاتصال الخاص بك.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="relative">
                                                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                                                <input
                                                    type="text"
                                                    placeholder="بحث في جهات الاتصال..."
                                                    value={contactSearch}
                                                    onChange={(e) => setContactSearch(e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-lg pr-9 pl-3 py-2 text-xs focus:ring-2 focus:ring-primary/10 outline-none"
                                                />
                                            </div>
                                            <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-lg divide-y divide-slate-50 bg-white">
                                                {allContacts.filter(c => c.phone_number.includes(contactSearch) || (c.name && c.name.includes(contactSearch))).map(contact => (
                                                    <label key={contact.id} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 cursor-pointer transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedContacts.includes(contact.phone_number)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedContacts([...selectedContacts, contact.phone_number]);
                                                                else setSelectedContacts(selectedContacts.filter(id => id !== contact.phone_number));
                                                            }}
                                                            className="accent-primary size-4"
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-800">{contact.name || contact.phone_number}</span>
                                                            {contact.name && <span className="text-[10px] text-slate-400 font-mono">{contact.phone_number}</span>}
                                                        </div>
                                                    </label>
                                                ))}
                                                {allContacts.length === 0 && (
                                                    <div className="p-4 text-center text-xs text-slate-400">لا توجد جهات اتصال محفوظة</div>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
                                                <span>تم اختيار: {selectedContacts.length} رقم</span>
                                                <button onClick={() => setSelectedContacts(allContacts.map(c => c.phone_number))} className="text-primary font-bold">اختيار الكل</button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <button onClick={() => setShowForm(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                                        إلغاء
                                    </button>
                                    <button onClick={handleSave} disabled={saving} className="flex-[2] py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 shadow-lg shadow-primary/20 transition-colors disabled:opacity-50">
                                        {saving ? 'جاري الحفظ...' : editingId ? 'حفظ التعديلات' : 'إنشاء الحملة'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
