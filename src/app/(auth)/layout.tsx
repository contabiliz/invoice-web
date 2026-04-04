import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopNavBar } from '@/components/layout/TopNavBar';
import { LanguageToggle } from '@/components/layout/LanguageToggle';

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

  const rawLocale = await getLocale();
  const locale = (rawLocale === 'en' ? 'en' : 'pt-BR') as 'en' | 'pt-BR';
  const userInitial = user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col">
      <TopNavBar>
        <LanguageToggle currentLocale={locale} />
        <div className="w-8 h-8 rounded-full bg-primary/20 border border-outline flex items-center justify-center text-primary font-bold text-xs uppercase">
          {userInitial}
        </div>
      </TopNavBar>

      <div className="flex flex-1 pt-14">
        <Sidebar />
        <main className="flex-1 ml-64 bg-background">{children}</main>
      </div>
    </div>
  );
}
