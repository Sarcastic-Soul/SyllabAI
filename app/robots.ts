import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://syllabai.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/shared/"],
        disallow: ["/dashboard/", "/profile/", "/subscription/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
