/** Brand settings. The brand name lives only here, so renaming the platform is a one-line change. */
export const SITE = {
  name: "GuIA",
  /** Public address, for absolute URLs (sitemap, Open Graph, canonical links). */
  url: "https://sello-aptis.vercel.app",
  /** The person responsible for the site (legal notice, privacy). */
  owner: {
    name: "Ruben Perez Dominguez",
    taxId: "04657271R",
    address:
      "Avenida Huerta Abajo 39B, 16770 San Lorenzo de la Parrilla (Cuenca), España",
    email: "rubenpd66@gmail.com",
  },
} as const;
