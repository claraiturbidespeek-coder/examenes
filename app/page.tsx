/**
 * Raíz del dominio. Deliberadamente vacía de contenido y de enlaces: los alumnos
 * siempre llegan por una URL /{cliente}/{idioma} concreta, y el panel de admin no
 * se anuncia desde aquí.
 */
export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">
        S-Peak
      </p>
    </main>
  );
}
