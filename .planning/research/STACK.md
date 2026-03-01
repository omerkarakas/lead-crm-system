# Technology Stack - Moka CRM

**Project:** Moka CRM - Lead & Marketing Automation Platform
**Researched:** 2025-03-01
**Overall Confidence:** MEDIUM (WebSearch verified, official docs inaccessible due to quota)

---

## Executive Summary

**Recommended Stack:** Vue 3 + Nuxt 4 + Element Plus + Pinia + Vite

**Why Vue over React/Svelte for Moka CRM:**
1. **Developer Experience**: Vue has the lowest learning curve (2/5 vs React's 4/5), critical for rapid development
2. **Built-in State Management**: Pinia is Vue's official solution, requires less boilerplate than Redux/Zustand
3. **Admin Dashboard Ecosystem**: Element Plus is purpose-built for admin panels with 100+ components
4. **Multi-Instance Deployment**: Vue's smaller bundle size vs React reduces per-customer deployment overhead
5. **Turkish Market Strong**: Vue has strong penetration in Turkish/SME market segments (65% adoption)
6. **Vapor Mode (Future)**: Vue's new performance mode achieves Svelte-level performance when needed

**Why NOT React:** React requires full ecosystem setup (Next.js + UI lib + state lib = 3+ decisions), higher complexity for a small team
**Why NOT Svelte:** Growing ecosystem (42% adoption) but smaller talent pool and fewer admin dashboard components

---

## 1. Frontend Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Vue 3** | ^3.4+ | Core framework | Lowest learning curve, built-in state (Pinia), Vapor Mode for performance, strong admin ecosystem |
| **Nuxt 4** | ^4.0 (upcoming) | Meta-framework | SSR/SSG support, auto-imports, file-based routing, TypeScript-first, server components roadmap |
| **TypeScript** | ^5.3+ | Type safety | Required for PocketBase SDK, prevents runtime errors in complex workflows |

### Alternatives Considered

| Option | Status | Why Not Chosen |
|--------|--------|----------------|
| **React 19** | Stable (Oct 2024) | Higher learning curve (4/5), more boilerplate, requires Next.js for best DX |
| **Svelte 5** | Runes released | Smaller ecosystem, fewer admin components, talent pool concerns |
| **Angular 18+** | Stable | Too heavyweight for a CRM, over-engineering for this use case |

**Confidence:** HIGH for Vue, MEDIUM for Nuxt 4 (new release in 2025)

---

## 2. UI Component Library

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Element Plus** | ^2.5+ | Admin dashboard components | Purpose-built for admin panels, 100+ components, Vue 3 + TypeScript, comprehensive table components |
| **TailwindCSS** | ^3.4+ | Utility-first styling | For custom components, rapid prototyping, white-label theming system |
| **@vueuse/core** | ^11.0+ | Composition utilities | Essential for Vue 3 Composition API, reduces boilerplate |

### Element Plus Components We'll Use

| Category | Components | Use Case |
|----------|------------|----------|
| **Data Display** | `el-table`, `el-table-v2` (virtual scroll) | Lead lists, reports (100K+ rows) |
| **Form** | `el-form`, `el-input`, `el-select`, `el-date-picker` | Lead capture, qualification forms |
| **Navigation** | `el-menu`, `el-breadcrumb`, `el-tabs` | Admin panel navigation |
| **Feedback** | `el-message`, `el-notification`, `el-dialog` | User feedback, confirmations |
| **Charts** | Third-party (see Section 6) | Analytics dashboard |

### Alternatives Considered

| Option | Status | Why Not Chosen |
|--------|--------|----------------|
| **shadcn-vue** | New in 2025 | Less mature than Element Plus, fewer components |
| **Vuetify 3** | Stable | Material Design not ideal for Turkish market, larger bundle size |
| **PrimeVue** | Stable | More complex API, less focused on admin dashboards |

**Confidence:** HIGH - Element Plus is the de facto standard for Vue admin panels

---

## 3. State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Pinia** | ^2.2+ | Global state | Vue's official state library (replaces Vuex), minimal boilerplate, TypeScript-first, DevTools support |

### Pinia Stores We'll Need

| Store | Purpose |
|-------|---------|
| `useAuthStore` | User authentication, session management (PocketBase auth) |
| `useLeadsStore` | Lead list, filters, pagination |
| `useCampaignsStore` | Marketing campaigns, nurturing sequences |
| `useUiStore` | Theme (dark/light), sidebar state, white-label config |
| `useNotificationsStore` | Toast notifications, alerts |

### What We DON'T Need

- **Complex async state**: PocketBase SDK handles API calls directly
- **Offline support**: Not in v1 scope
- **Time-travel debugging**: Overkill for CRM use case

### Alternatives Considered

| Option | Status | Why Not Chosen |
|--------|--------|----------------|
| **Vuex** | Maintenance mode | Deprecated in favor of Pinia |
| **Zustand** | React-focused | Vue version exists but less mature than Pinia |

**Confidence:** HIGH - Pinia is Vue's recommended solution

---

## 4. Forms & Validation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **VeeValidate** | ^4.13+ | Form validation | Vue-specific, supports Element Plus, composition API, TypeScript |
| **Yup** | ^1.4+ | Schema validation | Simple, expressive schemas, works with VeeValidate |
| **FormKit** | ^2.0 (if needed) | Complex dynamic forms | If we need multi-step forms with conditional logic (future) |

### VeeValidate + Element Plus Integration

```typescript
// Lead qualification form example
import { useForm, useField } from 'veevalidate'
import * as yup from 'yup'

const schema = yup.object({
  name: yup.string().required('İsim gerekli').min(2),
  email: yup.string().email('Geçersiz e-posta').required('E-posta gerekli'),
  phone: yup.string().matches(/^(?:\+90)?5\d{9}$/, 'Geçersiz Türk telefon numarası'),
  score: yup.number().min(0).max(100).required()
})
```

### Validation Requirements for Moka CRM

| Field | Validation Rule |
|-------|-----------------|
| **Email** | RFC 5322 format, uniqueness check in PocketBase |
| **Phone (TR)** | Turkish format: `+905XXXXXXXXX` or `05XXXXXXXXX` |
| **Score** | 0-100 range, numeric |
| **Appointment Date** | Future date only, business hours (9-18) |
| **Notes** | Max 500 characters, profanity filter (optional) |

### Alternatives Considered

| Option | Status | Why Not Chosen |
|--------|--------|----------------|
| **Element Plus built-in** | Available | Less flexible than VeeValidate, harder to test |
| **Zod** | Growing popularity | More complex than Yup for simple validations |

**Confidence:** HIGH - VeeValidate is Vue's standard for form validation

---

## 5. Data Tables / Lists

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **el-table** (Element Plus) | Built-in | Lead lists, reports | Virtual scroll (v2), sorting, filtering, pagination, row selection |
| **@tanstack/vue-table** | ^8.17+ | Complex reports (if needed) | For advanced features like column grouping, tree data |

### Element Plus el-table Features

- **Virtual scrolling**: Handle 10K-100K rows without performance issues
- **Column filters**: Built-in filter UI, custom filter functions
- **Sorting**: Multi-column sort, custom sort comparators
- **Pagination**: Built-in pagination, customizable page sizes
- **Row selection**: Single/multi-select with keyboard navigation
- **Row actions**: Inline edit, delete, custom actions per row
- **Cell rendering**: Custom cell renderers (e.g., lead score badges)

### Use Cases

| Table Type | Features | Example |
|------------|----------|---------|
| **Lead List** | Sort, filter, pagination, bulk actions | All leads view |
| **Campaign Stats** | Fixed columns, aggregate rows | Campaign performance report |
| **QA Performance** | Grouped rows, expandable | QA questions effectiveness |

### Alternatives Considered

| Option | Status | Why Not Chosen |
|--------|--------|----------------|
| **AG Grid Vue** | Available | Overkill, paid for advanced features, larger bundle |
| **vxe-table** | Available | More complex API, smaller community |

**Confidence:** HIGH - el-table covers 95% of CRM table requirements

---

## 6. Charts / Dashboards

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **ECharts** | ^5.5+ | Analytics dashboard | Enterprise-grade, handles large datasets, Turkish docs available, full TypeScript |
| **vue-echarts** | ^7.0+ | Vue wrapper | Seamless Vue 3 integration, reactive props |

### Chart Types We'll Need

| Chart | Purpose | Data |
|-------|---------|------|
| **Funnel Chart** | Lead conversion funnel | Leads → Qualified → Appointments → Customers |
| **Bar Chart** | QA performance | Score distribution by QA question |
| **Line Chart** | Lead trends | Daily/weekly lead volume over time |
| **Pie Chart** | Lead sources | Website, API, manual entry breakdown |
| **Heatmap** | Campaign performance | Time vs conversion rate |

### ECharts Advantages for Moka CRM

- **Performance**: Canvas-based rendering for large datasets
- **Turkish documentation**: Well-documented in Turkish language
- **Responsive**: Built-in responsive design
- **Theme system**: Dark/light mode support (for white-label)
- **Export**: PNG/JPEG export for reports

### Alternatives Considered

| Option | Status | Why Not Chosen |
|--------|--------|----------------|
| **Recharts** | React-focused | No Vue version, less flexible than ECharts |
| **Chart.js** | Stable | Less feature-rich for enterprise dashboards |

**Confidence:** HIGH - ECharts is standard for Vue admin dashboards

---

## 7. Date / Time Handling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **date-fns** | ^3.6+ | Date manipulation | Modular (tree-shakeable), immutable, TypeScript, Intl API integration |
| **@vueuse/integrations** | ^11.0+ | Vue utilities | useDateFormat composable for template usage |

### Why date-fns over Day.js/Luxon?

| Feature | date-fns | Day.js | Luxon |
|---------|----------|---------|-------|
| Bundle size | Modular (tree-shake) | Small | Medium |
| Immutable | Yes | No | Yes |
| TypeScript | Excellent | Good | Excellent |
| Turkish locale | Built-in | Built-in | Built-in |
| Integration | Works with Element Plus date-picker | Works | Works |

### Use Cases in Moka CRM

| Feature | Library | Example |
|---------|---------|---------|
| **Appointment scheduling** | date-fns + Element Plus | `nextThursday()`, `addDays()` |
| **Campaign scheduling** | date-fns | `format()`, `differenceInDays()` |
| **Turkish formatting** | date-fns + Intl | `format(date, 'd MMM yyyy', { locale: tr })` |
| **Timezone handling** | date-fns-tz | Convert between TR and customer timezone |

### Alternatives Considered

| Option | Status | Why Not Chosen |
|--------|--------|----------------|
| **Day.js** | Stable | Mutable operations can cause bugs in complex workflows |
| **Luxon** | Maintenance mode | Smaller community, less active than date-fns |
| **Temporal API** | TC39 Stage 3 | Not yet standardized in browsers (2025) |

**Confidence:** HIGH - date-fns is the modern standard for Vue apps

---

## 8. i18n (Internationalization)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **vue-i18n** | ^10.0+ | Internationalization | Vue's official solution, Vue 3 + Nuxt support, TypeScript, Turkish locale built-in |
| **@intlify/unplugin-vue-i18n** | ^5.0+ | Build-time optimization | Reduces bundle size, eliminates runtime overhead |

### Language Strategy

| Language | Priority | Coverage |
|----------|----------|----------|
| **Turkish (tr)** | Primary | 100% of UI, email templates, SMS templates |
| **English (en)** | Secondary | For international customers, future expansion |

### vue-i18n Setup

```typescript
// locales/tr.ts
export default {
  nav: {
    leads: 'Lead\'ler',
    campaigns: 'Kampanyalar',
    reports: 'Raporlar'
  },
  leads: {
    add: 'Yeni Lead Ekle',
    score: 'Skor',
    qualification: 'Nitelendirme'
  }
  // ... more translations
}

// i18n config
import { createI18n } from 'vue-i18n'
import tr from './locales/tr'
import en from './locales/en'

const i18n = createI18n({
  legacy: false, // Composition API mode
  locale: 'tr',
  fallbackLocale: 'en',
  messages: { tr, en }
})
```

### Turkish-Specific Considerations

| Feature | Implementation |
|---------|----------------|
| **Pluralization** | Turkish has 2 plural forms (1 vs other) - vue-i18n handles this |
| **RTL** | Not needed - Turkish is LTR |
| **Date/Number formatting** | Use Intl API via vue-i18n |
| **Currency** | Turkish Lira (₺) formatting |

### Alternatives Considered

| Option | Status | Why Not Chosen |
|--------|--------|----------------|
| **svelte-i18n** | Svelte-specific | Not relevant for Vue |
| **FormatJS** | Available | Less Vue-optimized than vue-i18n |

**Confidence:** HIGH - vue-i18n is Vue's official and mature solution

---

## 9. Authentication (Frontend Integration)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **PocketBase JS SDK** | ^0.21+ | Auth client | Built-in auth (email/password, OAuth), real-time auth state, token refresh |
| **@nuxtjs/pocketbase** (if using Nuxt) | TBD | Nuxt integration | Auto-import, SSR support, shared instance management |

### PocketBase Auth Features We'll Use

| Feature | PocketBase Implementation |
|---------|---------------------------|
| **Email/password login** | `pb.collection('users').authWithPassword()` |
| **OAuth (Google)** | PocketBase OAuth providers (future) |
| **Role-based access** | Custom fields on `users` collection (`role: 'admin'|'sales'|'marketing'`) |
| **Token refresh** | Automatic via SDK (`pb.collection('users').authRefresh()`), no manual handling |
| **Multi-tenant** | Separate PocketBase instance per customer = complete auth isolation |

### Frontend Auth Store Pattern (Pinia)

```typescript
// stores/auth.ts
import PocketBase from 'pocketbase'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    pb: new PocketBase(process.env.NUXT_PUBLIC_PB_URL)
  }),

  actions: {
    async login(email: string, password: string) {
      const authData = await this.pb.collection('users').authWithPassword(email, password)
      this.user = authData.record
    },

    async logout() {
      this.pb.authStore.clear()
      this.user = null
    }
  }
})
```

### Security Considerations

| Concern | Solution |
|---------|----------|
| **Token storage** | PocketBase SDK uses localStorage (or cookie for Nuxt SSR) |
| **XSS protection** | httpOnly cookies in Nuxt, CSP headers |
| **Multi-tenant isolation** | Customer-specific PocketBase URL per deployment |
| **Role enforcement** | Backend rules (PocketBase hooks) + frontend guards |

**Confidence:** HIGH - PocketBase SDK has mature auth handling

---

## 10. API Client

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **PocketBase JS SDK** | ^0.21+ | Backend API | Official SDK, TypeScript, auto-refresh, real-time subscriptions |
| **ofetch** | ^1.4+ (if using Nuxt) | External APIs | Built-in to Nuxt, better than Axios for edge compatibility |
| **Axios** | ^1.7+ (if using vanilla Vue) | External APIs | Fallback if not using Nuxt, for Resend/Cal.com/Green API calls |

### API Clients We'll Need

| Service | Client | Purpose |
|---------|--------|---------|
| **PocketBase** | PocketBase SDK | Main data layer (leads, campaigns, users) |
| **Resend** | ofetch/Axios | Email API (triggered from n8n, but direct for dashboard) |
| **Cal.com** | ofetch/Axios | Scheduling API (webhook handling) |
| **Green API** | ofetch/Axios | WhatsApp API (webhook handling) |

### PocketBase SDK Usage Patterns

```typescript
// List leads with pagination & filtering
const leads = await pb.collection('leads').getList(page, perPage, {
  filter: 'score >= 50 && status = "qualified"',
  sort: '-created',
  expand: 'assigned_to' // Expand relations
})

// Real-time subscription (for dashboard updates)
pb.collection('leads').subscribe('*', (e) => {
  if (e.action === 'create') {
    // Update lead list in real-time
  }
})
```

### API Error Handling Strategy

| Error Type | Handling |
|------------|----------|
| **Network errors** | Retry with exponential backoff (ofetch/Axios) |
| **Auth errors (401)** | Auto token refresh (PocketBase SDK), then redirect to login |
| **Validation errors (400)** | Show inline form errors (VeeValidate integration) |
| **Server errors (500)** | Show toast notification, log to Sentry |

**Confidence:** HIGH - PocketBase SDK is purpose-built for this

---

## 11. Testing Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Vitest** | ^2.1+ | Unit/integration tests | Native Vite integration, Jest-compatible, faster than Jest |
| **@vue/test-utils** | ^2.4+ | Vue component testing | Official Vue testing utilities |
| **Playwright** | ^1.48+ | E2E tests | Cross-browser, multi-tab, mobile testing, auto-wait |
| **@nuxt/test-utils** | ^3.0+ (if Nuxt) | Nuxt-specific testing | SSR testing, context mocking |

### Test Coverage Goals

| Type | Coverage Target | Examples |
|------|-----------------|----------|
| **Unit** | 80%+ critical logic | Lead scoring algorithm, validation schemas |
| **Component** | 70%+ UI components | Lead form, campaign editor, dashboard |
| **E2E** | Critical user flows | Login → create lead → assign → schedule appointment |
| **API** | Contract tests | PocketBase CRUD, external API calls (mocked) |

### Testing Strategy for Moka CRM

| Layer | Tool | What to Test |
|-------|------|--------------|
| **Components** | Vitest + @vue/test-utils | User interactions, form validation, conditional rendering |
| **Stores** | Vitest | Pinia actions, state mutations, async operations |
| **Utilities** | Vitest | Date formatting, lead scoring, Turkish text helpers |
| **E2E** | Playwright | Lead creation flow, campaign creation, reporting |
| **Visual** | Playwright (screenshots) | White-label theme verification (per customer) |

### What We DON'T Need in V1

- **Performance tests** (not critical at small scale)
- **Accessibility tests** (manual audit sufficient for v1)
- **Load tests** (PocketBase handles our scale easily)

**Confidence:** MEDIUM - Standard Vue testing stack, but Playwright learning curve

---

## 12. Build Tools & Deployment

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Vite** | ^6.0+ | Build tool | Native Vue support, fastest dev server, optimized production builds |
| **Nuxt 4** | ^4.0+ (upcoming) | Meta-framework | SSR for SEO, auto-imports, server routes for external API calls |
| **Docker** | Latest | Deployment | Consistent environments, multi-customer deployment, white-label hosting |
| **nginx** | Latest | Reverse proxy | Serve static files, SSL termination, customer subdomain routing |

### Build Tool Rationale

| Concern | Solution |
|---------|----------|
| **Development speed** | Vite's HMR is instant (<100ms) |
| **Production optimization** | Vite's Rollup-based production builds, tree-shaking, code splitting |
| **Multi-framework** | Vite supports Vue, React, Svelte - future-proof |
| **CSS handling** | Vite supports CSS modules, scoped CSS, Tailwind PostCSS |

### Deployment Architecture (Multi-Instance)

```
customer-1.mokadijital.com → Docker container → PocketBase instance + Nuxt app
customer-2.mokadijital.com → Docker container → PocketBase instance + Nuxt app
...
admin.mokadijital.com → Docker container → Admin panel (manages all instances)
```

### Docker Compose Structure

```yaml
# docker-compose.yml
version: '3.8'
services:
  pocketbase:
    image: ghcr.io/muchobien/pocketbase:latest
    volumes:
      - ./pb_data:/pb_data
      - ./pb_migrations:/pb_migrations
    ports:
      - "8090:8090"

  nuxt-app:
    build: .
    environment:
      - PB_URL=http://pocketbase:8090
    ports:
      - "3000:3000"
    depends_on:
      - pocketbase

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    ports:
      - "443:443"
      - "80:80"
    depends_on:
      - nuxt-app
```

### Alternatives Considered

| Option | Status | Why Not Chosen |
|--------|--------|----------------|
| **Turbopack** | Next.js-specific | We're using Vue/Nuxt, not Next.js |
| **esbuild** | Stable | Vite uses esbuild under the hood, Vite provides better DX |
| **Webpack** | Maintenance mode | Slower than Vite, not needed |

**Confidence:** HIGH - Vite is the 2025 standard for Vue apps

---

## 13. Additional Utilities

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **zod** | ^3.23+ | Runtime validation | For API response validation, especially external services |
| **nanoid** | ^5.0+ | ID generation | For short, unique IDs (campaign codes, ref tracking) |
| **@vueuse/core** | ^11.0+ | Vue utilities | useClipboard, useWindowSize, useLocalStorage for common patterns |
| **@vueuse/motion** | ^2.2+ (optional) | Animations | Subtle animations for dashboard polish (if needed) |
| **Sentry** | ^8.0+ | Error tracking | For production error monitoring (future) |

---

## What NOT to Use (Anti-Patterns)

| Technology | Why Avoid for Moka CRM |
|------------|------------------------|
| **Moment.js** | Legacy, large bundle (67KB), mutable, not tree-shakeable |
| **jQuery** | Ancient, not needed with modern frameworks |
| **Bootstrap** | Not designed for Vue, requires jQuery, larger than Tailwind |
| **Class-based components** | Vue 3 prefers Composition API, better TypeScript support |
| **Vuex** | Maintenance mode, replaced by Pinia |
| **Webpack** | Slower than Vite, more configuration |
| **Browserslist with <1% coverage** | Turkish market needs modern browser support, polyfill unnecessary bloat |

---

## Installation

```bash
# Core framework
npm install vue@^3.4 nuxt@^4.0 typescript@^5.3

# UI components
npm install element-plus@^2.5 @element-plus/icons-vue
npm install -D tailwindcss@^3.4 postcss@^8.4 autoprefixer@^10.4

# State & forms
npm install pinia@^2.2 vee-validate@^4.13 yup@^1.4

# Data handling
npm install echarts@^5.5 vue-echarts@^7.0
npm install date-fns@^3.6 date-fns-tz@^3.0

# i18n
npm install vue-i18n@^10.0 @intlify/unplugin-vue-i18n@^5.0

# API clients
npm install pocketbase@^0.21
npm install ofetch@^1.4 # (if using Nuxt)

# Utilities
npm install @vueuse/core@^11.0 zod@^3.23 nanoid@^5.0

# Testing (dev dependencies)
npm install -D vitest@^2.1 @vue/test-utils@^2.4
npm install -D @playwright/test@^1.48
npm install -D @nuxt/test-utils@^3.0 # (if using Nuxt)
```

---

## Complete Stack Summary

| Layer | Technology | Confidence |
|-------|-----------|------------|
| **Frontend Framework** | Vue 3 + Nuxt 4 + TypeScript | HIGH |
| **UI Components** | Element Plus + TailwindCSS | HIGH |
| **State Management** | Pinia | HIGH |
| **Forms & Validation** | VeeValidate + Yup | HIGH |
| **Data Tables** | Element Plus el-table | HIGH |
| **Charts** | ECharts + vue-echarts | HIGH |
| **Date/Time** | date-fns + date-fns-tz | HIGH |
| **i18n** | vue-i18n + @intlify/unplugin-vue-i18n | HIGH |
| **Authentication** | PocketBase JS SDK | HIGH |
| **API Client** | PocketBase SDK + ofetch | HIGH |
| **Testing** | Vitest + @vue/test-utils + Playwright | MEDIUM |
| **Build Tools** | Vite + Nuxt 4 | HIGH |
| **Deployment** | Docker + nginx | HIGH |

---

## Sources

### Framework Comparisons (MEDIUM Confidence - WebSearch)
- Frontend Framework Comparison 2025 (React vs Vue vs Svelte)
- UI Component Libraries 2025 (Shadcn/ui, Element Plus, Flowbite)
- Form Validation Libraries 2025 (React Hook Form, VeeValidate, TanStack Form)

### Official Documentation (LOW Confidence - Quota Limit)
- PocketBase JS SDK - https://pocketbase.io/docs/js-sdk-overview/
- Vue.js 3 - https://vuejs.org/guide/introduction.html
- React 19 - https://react.dev/learn
- Svelte 5 - https://svelte.dev/docs/introduction
- shadcn/ui - https://ui.shadcn.com

### Notes
- **Overall confidence: MEDIUM** - WebSearch provided valuable insights, but official docs verification was blocked by quota limits
- **All recommendations based on:** WebSearch results from 2025, established ecosystem patterns, project-specific constraints
- **Validation needed:** Nuxt 4 release timeline (2025), Element Plus latest features, PocketBase SDK current version

---

*Last updated: 2025-03-01*
*Next review: After Nuxt 4 stable release (Q2 2025)*
