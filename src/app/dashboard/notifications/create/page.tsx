// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Data
  const [stores, setStores] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);

  // Form
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedConnection, setSelectedConnection] = useState('');
  const [recipient, setRecipient] = useState('customer');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [sendToAdmin, setSendToAdmin] = useState(false);
  const [buttonsConfig, setButtonsConfig] = useState<any[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [testPhone, setTestPhone] = useState('');

  const events = [
    { value: 'order.created', label: 'طلب جديد (Pending)', icon: 'pending', color: 'yellow' },
    { value: 'order.processing', label: 'قيد المعالجة (Processing)', icon: 'autorenew', color: 'blue' },
    { value: 'order.completed', label: 'مكتمل (Completed)', icon: 'check_circle', color: 'green' },
    { value: 'order.refunded', label: 'مسترجع (Refunded)', icon: 'keyboard_return', color: 'red' },
    { value: 'order.cancelled', label: 'ملغي (Cancelled)', icon: 'cancel', color: 'slate' },
  ];

  const variables = [
    { key: '{customer_name}', label: 'اسم العميل' },
    { key: '{customer_phone}', label: 'رقم العميل' },
    { key: '{order_id}', label: 'رقم الطلب' },
    { key: '{order_total}', label: 'مبلغ الطلب' },
    { key: '{product_list}', label: 'قائمة المنتجات' },
    { key: '{shipping_address}', label: 'عنوان الشحن' },
    { key: '{tracking_url}', label: 'رابط التتبع' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: storesData } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);
    setStores(storesData || []);
    if (storesData && storesData.length > 0) setSelectedStore(storesData[0].id);

    const { data: connsData } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'CONNECTED');
    setConnections(connsData || []);
    if (connsData && connsData.length > 0) setSelectedConnection(connsData[0].id);

    setLoading(false);
  };

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSave = async () => {
    if (!selectedStore) { showMessage('يرجى ربط متجر أولاً من صفحة التكاملات'); return; }
    if (!selectedEvent) { showMessage('يرجى اختيار حدث الإطلاق'); return; }
    if (!messageTemplate.trim()) { showMessage('يرجى كتابة نص الرسالة'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: selectedStore,
          event_type: selectedEvent,
          message_template: messageTemplate,
          is_active: true,
          send_to_admin: sendToAdmin,
          buttons_config: buttonsConfig
        })
      });
      const data = await res.json();
      if (data.success) {
        showMessage('تم إنشاء قاعدة الإشعار بنجاح ✓');
        setTimeout(() => router.push('/dashboard/integrations/woocommerce'), 1500);
      } else {
        showMessage('فشل الإنشاء: ' + data.error);
      }
    } catch (err) {
      showMessage('حدث خطأ غير متوقع');
    }
    setSaving(false);
  };

  const totalSteps = 4;
  const progress = Math.round((step / totalSteps) * 100);

  const canProceed = () => {
    if (step === 1) return !!selectedEvent;
    if (step === 2) return !!selectedStore;
    if (step === 3) return !!messageTemplate.trim();
    return true;
  };

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
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-medium">
          {message}
        </div>
      )}
      <main className="flex-1 w-full flex flex-col py-8 px-4 md:px-10 lg:px-20">
        <div className="flex flex-col max-w-[900px] mx-auto w-full gap-8">

          <div className="flex flex-col gap-2">
            <h1 className="text-slate-900 text-3xl font-black">إنشاء قاعدة إشعارات</h1>
            <p className="text-slate-500 text-base">قم بتكوين رسائل واتساب آلية لأحداث متجرك.</p>
          </div>

          {/* Progress */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-end mb-2">
              <p className="text-slate-900 text-lg font-bold">الخطوة {step} من {totalSteps}</p>
              <span className="text-primary font-bold bg-primary/10 px-3 py-1 rounded-full text-xs">{progress}% مكتمل</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
          </div>

          {/* Step 1: Select Event */}
          {step === 1 && (
            <div className="bg-white border-2 border-primary/20 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">1</div>
                <h3 className="text-xl font-bold text-slate-900">اختر حدث الإطلاق</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {events.map(event => (
                  <button
                    key={event.value}
                    onClick={() => setSelectedEvent(event.value)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-right ${selectedEvent === event.value ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <span className="material-symbols-outlined text-2xl">{event.icon}</span>
                    <span className="font-bold text-slate-800">{event.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Store */}
          {step === 2 && (
            <div className="bg-white border-2 border-primary/20 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">2</div>
                <h3 className="text-xl font-bold text-slate-900">اختر المتجر</h3>
              </div>
              {stores.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">storefront</span>
                  <p className="text-slate-500 font-medium mb-4">لا يوجد متاجر مربوطة</p>
                  <a href="/dashboard/integrations/woocommerce" className="text-primary font-bold hover:underline">اربط متجرك أولاً ←</a>
                </div>
              ) : (
                <div className="space-y-3">
                  {stores.map(store => (
                    <button
                      key={store.id}
                      onClick={() => setSelectedStore(store.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-right ${selectedStore === store.id ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <span className="material-symbols-outlined text-2xl text-purple-500">storefront</span>
                      <div className="flex-1">
                        <span className="font-bold text-slate-800 block" dir="ltr">{store.store_url}</span>
                        <span className="text-xs text-slate-500">مربوط منذ {new Date(store.created_at).toLocaleDateString('ar-EG')}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Write Message */}
          {step === 3 && (
            <div className="bg-white border-2 border-primary/20 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">3</div>
                <h3 className="text-xl font-bold text-slate-900">محتوى الرسالة</h3>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 mb-2">المتغيرات المتاحة</label>
                <div className="flex flex-wrap gap-2">
                  {variables.map(v => (
                    <button
                      key={v.key}
                      onClick={() => setMessageTemplate(prev => prev + ' ' + v.key)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm text-slate-400">data_object</span>
                      {v.key}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">نص الرسالة</label>
                <textarea
                  className="w-full h-40 p-4 rounded-xl border border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-base leading-relaxed resize-none bg-slate-50 focus:bg-white"
                  placeholder="اكتب رسالتك هنا..."
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                />
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-slate-400">{messageTemplate.length} حرف</span>
                </div>
              </div>
              {/* Admin Alert Toggle */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">تلقي تنبيه واتساب للأدمن</h4>
                      <p className="text-xs text-slate-500">سيتم إرسال نسخة من هذا التنبيه إلى رقم هاتفك المسجل.</p>
                    </div>
                  </div>
                  <button
                    dir="ltr"
                    onClick={() => setSendToAdmin(!sendToAdmin)}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${sendToAdmin ? 'bg-primary' : 'bg-slate-200'}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${sendToAdmin ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
              </div>

              {/* Interactive Buttons Config */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-900 text-sm">أزرار تفاعلية (حد أقصى 3)</h4>
                  <button
                    onClick={() => {
                        if (buttonsConfig.length < 3) {
                            setButtonsConfig([...buttonsConfig, { text: '', action: 'none', value: '', reply: '' }]);
                        } else {
                            showMessage('الحد الأقصى هو 3 أزرار');
                        }
                    }}
                    disabled={buttonsConfig.length >= 3}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1 disabled:opacity-30"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    إضافة زر
                  </button>
                </div>
                
                <div className="space-y-4">
                  {buttonsConfig.map((btn, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 relative">
                      <button 
                        onClick={() => setButtonsConfig(buttonsConfig.filter((_, i) => i !== idx))}
                        className="absolute top-2 left-2 size-6 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">الرقم أو النص المطلوب للرد (مثال: 1 أو تأكيد)</label>
                          <input 
                            type="text"
                            maxLength={20}
                            placeholder="مثال: 1"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-primary outline-none"
                            value={btn.text}
                            onChange={(e) => {
                                const newConfigs = [...buttonsConfig];
                                newConfigs[idx].text = e.target.value;
                                setButtonsConfig(newConfigs);
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">الإجراء (Action)</label>
                          <select 
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-primary outline-none bg-white"
                            value={btn.action}
                            onChange={(e) => {
                                const newConfigs = [...buttonsConfig];
                                newConfigs[idx].action = e.target.value;
                                if (e.target.value === 'update_wc_status' && !newConfigs[idx].value) {
                                    newConfigs[idx].value = 'processing';
                                }
                                setButtonsConfig(newConfigs);
                            }}
                          >
                            <option value="wc_meta_confirm">تأكيد الطلب (تحديث خانة ووكومرس)</option>
                            <option value="wc_meta_cancel">إلغاء الطلب (تحديث خانة ووكومرس)</option>
                            <option value="wc_meta_support">تواصل مع الدعم (تحديث خانة ووكومرس)</option>
                          </select>
                        </div>
                      </div>



                      <div className="mt-3">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">الرد التلقائي (يرسل للعميل بعد الضغط)</label>
                        <textarea 
                          rows={2}
                          placeholder="مثال: شكراً لك! تم تأكيد طلبك."
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-primary outline-none resize-none"
                          value={btn.reply}
                          onChange={(e) => {
                              const newConfigs = [...buttonsConfig];
                              newConfigs[idx].reply = e.target.value;
                              setButtonsConfig(newConfigs);
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  {buttonsConfig.length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl">
                      <p className="text-xs text-slate-400">لا يوجد أزرار مضافة حالياً</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex justify-end">
                    <button 
                        onClick={() => setIsPreviewOpen(true)}
                        className="text-xs font-bold text-slate-500 hover:text-primary flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        معاينة في واتساب
                    </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Preview & Save */}
          {step === 4 && (
            <div className="bg-white border-2 border-primary/20 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">4</div>
                <h3 className="text-xl font-bold text-slate-900">معاينة وحفظ</h3>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between p-4 bg-slate-50 rounded-xl">
                  <span className="text-slate-500">الحدث:</span>
                  <span className="font-bold text-slate-800">{events.find(e => e.value === selectedEvent)?.label || '-'}</span>
                </div>
                <div className="flex justify-between p-4 bg-slate-50 rounded-xl">
                  <span className="text-slate-500">المتجر:</span>
                  <span className="font-bold text-slate-800" dir="ltr">{stores.find(s => s.id === selectedStore)?.store_url || '-'}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 block mb-2">نص الرسالة:</span>
                  <p className="text-slate-800 whitespace-pre-wrap bg-white p-3 rounded-lg border border-slate-200">{messageTemplate || '-'}</p>
                </div>
                <div className="flex justify-between p-4 bg-slate-50 rounded-xl">
                  <span className="text-slate-500">تنبيه واتساب للأدمن:</span>
                  <span className={`font-bold ${sendToAdmin ? 'text-green-600' : 'text-slate-400'}`}>
                    {sendToAdmin ? 'مفعّل ✓' : 'معطّل'}
                  </span>
                </div>
              </div>

              <WhatsAppPreview
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                message={messageTemplate}
                title={events.find(e => e.value === selectedEvent)?.label || "معاينة الرسالة"}
                buttons={buttonsConfig}
              />

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
              >
                {saving ? 'جاري الحفظ...' : 'حفظ وتفعيل القاعدة ✓'}
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 pb-10">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors disabled:opacity-30"
            >
              السابق
            </button>
            {step < totalSteps && (
              <button
                onClick={() => setStep(Math.min(totalSteps, step + 1))}
                disabled={!canProceed()}
                className="px-8 py-3 rounded-xl bg-primary text-white font-bold hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 disabled:opacity-30"
              >
                التالي
                <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_forward</span>
              </button>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
