import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
