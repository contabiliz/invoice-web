import { getTranslations } from 'next-intl/server';

type TopNavBarProps = {
  children: React.ReactNode;
};

export async function TopNavBar({ children }: TopNavBarProps) {
  const t = await getTranslations('layout');

  return (
    <nav className="fixed top-0 w-full z-50 bg-white border-b border-outline flex justify-between items-center px-8 py-3 shadow-sm">
      <div className="flex items-center gap-8">
        <span className="text-xl font-extrabold tracking-tight text-primary">
          {t('brand.name')}
        </span>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-xl">
            search
          </span>
          <input
            className="bg-surface-variant border-none rounded-lg pl-10 pr-4 py-2 text-sm w-72 focus:ring-2 focus:ring-primary transition-all placeholder:text-on-surface-variant"
            placeholder={t('topbar.search_placeholder')}
            type="text"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-lg transition-all">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
        <div className="flex items-center gap-3 px-3 border-l border-outline">
          {children}
        </div>
      </div>
    </nav>
  );
}
