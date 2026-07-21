import { LoginForm } from "@/app/admin/login/login-form";

type PageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const { next } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-600">
          S-Peak
        </p>
        <h1 className="mt-3 text-xl font-semibold text-neutral-900">
          Panel de administración
        </h1>

        {/* No hay enlace de registro: las cuentas del equipo se crean a mano
            desde el dashboard de Supabase. */}
        <LoginForm next={next?.startsWith("/admin") ? next : "/admin"} />
      </div>
    </main>
  );
}
