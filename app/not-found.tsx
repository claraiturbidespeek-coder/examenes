export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">
          S-Peak
        </p>

        <h1 className="mt-3 text-2xl font-semibold text-neutral-900">
          Página no encontrada
        </h1>

        {/* Sin detalles sobre qué combinación falló ni qué clientes existen: la
            página es pública y no debe servir para tantear slugs. */}
        <p className="mt-2 text-sm text-neutral-600">
          Este enlace no es válido. Comprueba la dirección que te enviaron o
          contacta con la persona responsable de tu formación.
        </p>
      </div>
    </main>
  );
}
