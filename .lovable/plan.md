

## استبدال رمز الدولار ($) برمز الريال السعودي الجديد

### المواقع المتبقية التي لا تزال تستخدم `$`

| الملف | السطر | السياق |
|------|------|--------|
| `src/pages/MyListingsPage.tsx` | 42 | سعر اليوم في بطاقة الإعلان |
| `src/pages/MyBookingsPage.tsx` | 75 | إجمالي سعر الحجز |
| `src/pages/NearbyPage.tsx` | 134 | سعر داخل popup الخريطة (DOM يدوي) |
| `src/pages/NearbyPage.tsx` | 336 | سعر داخل دبوس الخريطة (HTML نصّي) |
| `src/pages/NearbyPage.tsx` | 469 | سعر في القائمة الجانبية |

### خطة التنفيذ

**1. ملفات React (JSX) — استخدام مكوّن `<SaudiRiyal />`**
- `MyListingsPage.tsx` السطر 42: استبدال `${item.price_per_day}` بـ:
  ```tsx
  <span className="inline-flex items-baseline gap-1">{item.price_per_day}<SaudiRiyal className="h-3 w-3" /></span>{t('item.perDay')}
  ```
- `MyBookingsPage.tsx` السطر 75: نفس النمط مع `b.total_price`.
- `NearbyPage.tsx` السطر 469: نفس النمط مع `item.price_per_day`.

**2. عناصر DOM/HTML يدوية في `NearbyPage.tsx`**
الدبابيس و popup مبنية بـ `document.createElement` و innerHTML نصّي، لذا لا يمكن استخدام مكوّن React مباشرة. الحل: تضمين SVG الريال inline كسلسلة نصّية ثابتة.

- إضافة ثابت في أعلى الملف:
  ```ts
  const RIYAL_SVG = `<svg viewBox="0 0 1124.14 1256.39" width="0.85em" height="0.85em" fill="currentColor" style="display:inline-block;vertical-align:baseline;margin-inline-start:2px"><path d="..."/><path d="..."/></svg>`;
  ```
  (نسخ الـ paths من `src/components/SaudiRiyal.tsx`)
- السطر 134 (popup):
  ```ts
  price.innerHTML = `${item.price_per_day}${RIYAL_SVG}/${dayLabel}`;
  ```
- السطر 336 (pin bubble):
  ```ts
  <span class="nearby-pin__price">${item.price_per_day}${RIYAL_SVG}</span>
  ```

**3. استيراد المكوّن**
إضافة `import { SaudiRiyal } from '@/components/SaudiRiyal';` في الملفات الثلاثة (إن لم يكن موجوداً).

### ملاحظات
- لن يتم تغيير أي ملفات أخرى — تم تأكيد أن باقي صفحات السعر (`ItemCard`, `ItemDetailsPage`, `PaymentForm`, `BookingDetailsPage`) تستخدم `<SaudiRiyal />` بالفعل.
- بدون أي تغييرات في قاعدة البيانات أو الترجمات.

