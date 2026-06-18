import { MetadataRoute } from "next";

export default function sitemap():
MetadataRoute.Sitemap {

  return [
    {
      url: "https://commute-map-ochre.vercel.app",
      priority: 1,
    },

    {
      url: "https://commute-map-ochre.vercel.app/contact",
      priority: 0.8,
    },
  ];
}