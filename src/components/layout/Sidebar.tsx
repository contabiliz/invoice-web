import { getTranslations } from 'next-intl/server';

export async function Sidebar() {
  const t = await getTranslations('layout');

  return (
    <aside className="fixed left-0 top-0 h-full w-64 z-40 bg-surface border-r border-outline flex flex-col pt-20 pb-6 px-4">
      <div className="mb-10 px-4">
        <p className="font-bold text-on-surface">{t('brand.title')}</p>
        <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
          {t('brand.tagline')}
        </p>
      </div>
      <nav className="flex-1 space-y-1">
        <a
          href="/upload"
          className="bg-primary/10 text-primary font-bold rounded-lg flex items-center gap-3 px-4 py-3 transition-all"
        >
          <span className="material-symbols-outlined">upload_file</span>
          <span className="text-sm">{t('nav.upload')}</span>
        </a>
        <a
          href="#"
          className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-lg flex items-center gap-3 px-4 py-3 transition-all"
        >
          <span className="material-symbols-outlined">folder_zip</span>
          <span className="text-sm">{t('nav.batches')}</span>
        </a>
        <a
          href="#"
          className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-lg flex items-center gap-3 px-4 py-3 transition-all"
        >
          <span className="material-symbols-outlined">history</span>
          <span className="text-sm">{t('nav.history')}</span>
        </a>
        <a
          href="#"
          className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-lg flex items-center gap-3 px-4 py-3 transition-all"
        >
          <span className="material-symbols-outlined">settings_account_box</span>
          <span className="text-sm">{t('nav.settings')}</span>
        </a>
      </nav>
      <div className="mt-auto pt-6 space-y-1 border-t border-outline">
        <a
          href="#"
          className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-lg flex items-center gap-3 px-4 py-2 text-sm transition-all"
        >
          <span className="material-symbols-outlined text-lg">help_outline</span>
          <span>{t('bottom.support')}</span>
        </a>
        <a
          href="#"
          className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-lg flex items-center gap-3 px-4 py-2 text-sm transition-all"
        >
          <span className="material-symbols-outlined text-lg">code</span>
          <span>{t('bottom.api_docs')}</span>
        </a>
      </div>
    </aside>
  );
}
