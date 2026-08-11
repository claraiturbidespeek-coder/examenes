import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // La raíz del subdominio manda al sitio principal: aquí no hay nada que
        // enseñar, los alumnos llegan siempre a /{cliente}/{idioma}.
        //
        // `source: "/"` casa con la raíz exacta y con nada más, así que las
        // páginas de alumno, /admin y su login siguen igual, y una ruta que no
        // existe sigue cayendo en el 404 propio en vez de acabar en s-peak.com.
        source: "/",
        destination: "https://s-peak.com",
        // Temporal a propósito: `permanent: true` daría un 308, que el navegador
        // cachea indefinidamente y dejaría la raíz atada a s-peak.com en cada
        // máquina que la haya visitado. Con `false` es un 307, que no se cachea,
        // y poner algo en la raíz el día de mañana es borrar estas líneas.
        permanent: false,
      },
    ];
  },

  async headers() {
    return [
      {
        // Nada de este sitio debe aparecer en buscadores: son enlaces operativos
        // para alumnos, no contenido público. La cabecera cubre el caso que el
        // meta tag no cubre — crawlers que no ejecutan ni parsean el HTML — y se
        // aplica también a las preview deployments.
        source: "/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
