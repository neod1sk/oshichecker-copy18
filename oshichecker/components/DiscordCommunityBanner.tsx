"use client";

import Link from "next/link";
import { Locale } from "@/i18n.config";

const DISCORD_INVITE_URL = "https://discord.gg/J5jcQ5dHcY";
const DISCORD_BANNER_IMAGE_URL =
  "https://assets.st-note.com/img/1782065834-NTDfWl1u846FUpdSAnG9ev2m.jpg";

const COPY: Record<
  Locale,
  {
    heading: string;
    description: string;
    cta: string;
    imageAlt: string;
    imageAriaLabel: string;
    buttonAriaLabel: string;
  }
> = {
  ja: {
    heading: "KLICコミュニティはじめました！",
    description:
      "韓国・日本のライブアイドル好きが集まる交流コミュニティです。見る専でも大歓迎！気軽に遊びに来てください🙌",
    cta: "Discordに参加する",
    imageAlt: "KLIC Discordコミュニティ案内バナー",
    imageAriaLabel: "KLIC Discordコミュニティバナーを新しいタブで開く",
    buttonAriaLabel: "KLIC Discordコミュニティに参加するリンクを新しいタブで開く",
  },
  ko: {
    heading: "KLIC 커뮤니티가 생겼어요!",
    description:
      "한국과 일본 라이브 아이돌을 좋아하는 분들이 모이는 커뮤니티예요. 눈팅만 해도 대환영! 편하게 놀러 오세요 🙌",
    cta: "Discord 참여하기",
    imageAlt: "KLIC 디스코드 커뮤니티 안내 배너",
    imageAriaLabel: "KLIC 디스코드 커뮤니티 배너를 새 탭에서 열기",
    buttonAriaLabel: "KLIC 디스코드 커뮤니티 참여 링크를 새 탭에서 열기",
  },
  en: {
    heading: "KLIC Community is here!",
    description:
      "A community for fans of live idols in Korea and Japan. Lurkers are very welcome too. Come hang out with us 🙌",
    cta: "Join Discord",
    imageAlt: "KLIC Discord community banner",
    imageAriaLabel: "Open KLIC Discord community banner in a new tab",
    buttonAriaLabel: "Open KLIC Discord community join link in a new tab",
  },
};

interface DiscordCommunityBannerProps {
  locale: Locale;
}

export function DiscordCommunityBanner({ locale }: DiscordCommunityBannerProps) {
  const text = COPY[locale] || COPY.ja;

  return (
    <section className="mt-4 mb-6 w-full max-w-md mx-auto rounded-3xl bg-gradient-to-br from-pink-50 via-rose-50 to-amber-50 p-4 ring-1 ring-pink-100 shadow-md">
      <h3 className="text-sm font-semibold text-gray-700">{text.heading}</h3>
      <p className="mt-1 text-xs leading-relaxed text-gray-600">{text.description}</p>

      <Link
        href={DISCORD_INVITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 block group focus:outline-none"
        aria-label={text.imageAriaLabel}
      >
        <div className="overflow-hidden rounded-2xl ring-1 ring-pink-100 shadow-[0_8px_20px_rgba(244,114,182,0.18)] transition duration-200 group-hover:-translate-y-0.5 group-hover:brightness-[1.03] group-focus-visible:ring-2 group-focus-visible:ring-pink-300">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={DISCORD_BANNER_IMAGE_URL}
            alt={text.imageAlt}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </div>
      </Link>

      <Link
        href={DISCORD_INVITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={text.buttonAriaLabel}
        className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-orange-400 to-pink-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
      >
        {text.cta}
      </Link>
    </section>
  );
}
