import { LeadFormComponent } from './lead-form-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Moka CRM - Lead Formu',
  description: 'Bize katılın - İş birliği için başvuru formu',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LeadFormPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Başvuru Formu
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Bizimle iletişime geçin, en kısa sürede size dönüş yapalım.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl p-6 md:p-8">
          <LeadFormComponent />
        </div>

        <div className="text-center mt-6 text-sm text-slate-500 dark:text-slate-400">
          <p>© 2026 Moka CRM. Tüm hakları saklıdır.</p>
        </div>
      </div>
    </div>
  );
}
