"use client";

import { usePathname } from "next/navigation";
import { BlogBannerRotator } from "@/components/BlogBannerRotator";
import { DiscordCommunityBanner } from "@/components/DiscordCommunityBanner";
import { Locale } from "@/i18n.config";

export function GlobalBlogBanner() {
  const pathname = usePathname();

  // バトル中は非表示
  if (pathname && /\/battle(\/|$)/.test(pathname)) {
    return null;
  }

  const locale = pathname ? pathname.split("/")[1] : "ja";
  const currentLocale: Locale =
    locale === "ko" || locale === "en" ? locale : "ja";
  const headingMap: Record<string, string> = {
    ja: "おすすめブログ",
    ko: "추천 블로그",
    en: "Recommended Blogs",
  };
  const label = headingMap[currentLocale] || headingMap.ja;

  return (
    <>
      <DiscordCommunityBanner locale={currentLocale} />
      <BlogBannerRotator label={label} />
    </>
  );
}
