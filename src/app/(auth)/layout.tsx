import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-white border-b border-outline flex justify-between items-center px-8 py-3 shadow-sm">
        <div className="flex items-center gap-8">
          <span className="text-xl font-extrabold tracking-tight text-primary">Contabiliz</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-xl">search</span>
            <input 
              className="bg-surface-variant border-none rounded-lg pl-10 pr-4 py-2 text-sm w-72 focus:ring-2 focus:ring-primary transition-all placeholder:text-on-surface-variant" 
              placeholder="Search hash or document..." 
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
          <div className="flex items-center gap-2 px-3 border-l border-outline">
            <span className="material-symbols-outlined text-on-surface-variant text-lg">language</span>
            <div className="flex items-center text-[11px] font-bold tracking-wider text-on-surface-variant">
              <button className="text-primary hover:text-primary-dark transition-colors">EN</button>
              <span className="mx-1 text-outline select-none">|</span>
              <button className="hover:text-on-surface transition-colors">PT</button>
            </div>
          </div>
          {/* Default avatar since we don't have the user's avatar URL immediately available */}
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-outline flex items-center justify-center text-primary font-bold text-xs uppercase">
            {user.email?.charAt(0) || 'U'}
          </div>
        </div>
      </nav>

      <div className="flex flex-1 pt-14">
        {/* SideNavBar */}
        <aside className="fixed left-0 top-0 h-full w-64 z-40 bg-surface border-r border-outline flex flex-col pt-20 pb-6 px-4">
          <div className="mb-10 px-4">
            <p className="font-bold text-on-surface">Fiscal Core</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">Precision Ledger</p>
          </div>
          <nav className="flex-1 space-y-1">
            <a href="/upload" className="bg-primary/10 text-primary font-bold rounded-lg flex items-center gap-3 px-4 py-3 transition-all">
              <span className="material-symbols-outlined">upload_file</span>
              <span className="text-sm">Upload</span>
            </a>
            <a href="#" className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-lg flex items-center gap-3 px-4 py-3 transition-all">
              <span className="material-symbols-outlined">folder_zip</span>
              <span className="text-sm">Batches</span>
            </a>
            <a href="#" className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-lg flex items-center gap-3 px-4 py-3 transition-all">
              <span className="material-symbols-outlined">history</span>
              <span className="text-sm">History</span>
            </a>
            <a href="#" className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-lg flex items-center gap-3 px-4 py-3 transition-all">
              <span className="material-symbols-outlined">settings_account_box</span>
              <span className="text-sm">Settings</span>
            </a>
          </nav>
          <div className="mt-auto pt-6 space-y-1 border-t border-outline">
            <a href="#" className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-lg flex items-center gap-3 px-4 py-2 text-sm transition-all">
              <span className="material-symbols-outlined text-lg">help_outline</span>
              <span>Support</span>
            </a>
            <a href="#" className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-lg flex items-center gap-3 px-4 py-2 text-sm transition-all">
              <span className="material-symbols-outlined text-lg">code</span>
              <span>API Docs</span>
            </a>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 ml-64 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
