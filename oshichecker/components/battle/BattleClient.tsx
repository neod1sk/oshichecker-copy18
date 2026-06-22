"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDiagnosis } from "@/context/DiagnosisContext";
import { CandidateMember, BATTLE_ROUNDS } from "@/lib/types";
import { Locale } from "@/i18n.config";
import { selectBattlePair } from "@/lib/battleLogic";
import ProgressBar from "@/components/ui/ProgressBar";
import MemberBattleCard from "./MemberBattleCard";

interface BattleClientProps {
  locale: Locale;
  dict: {
    subtitle: string;
    vs: string;
    calculating: string;
    noCandidates: string;
    restart: string;
  };
}

export default function BattleClient({ locale, dict }: BattleClientProps) {
  const router = useRouter();
  const { state, recordBattle, isBattleComplete } = useDiagnosis();
  const [currentPair, setCurrentPair] = useState<[CandidateMember, CandidateMember] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // 次のペアを選択
  const selectNextPair = useCallback(() => {
    if (state.candidates.length < 2) return;
    const pair = selectBattlePair(state.candidates, state.battleRecords);
    setCurrentPair(pair);
    setSelectedId(null);
  }, [state.candidates, state.battleRecords]);

  // 初回とバトル後にペアを選択
  useEffect(() => {
    if (!isBattleComplete && state.candidates.length >= 2 && !isAnimating) {
      selectNextPair();
    }
  }, [state.currentBattleRound, isBattleComplete, state.candidates.length, isAnimating, selectNextPair]);

  // バトル完了時に結果ページへ
  useEffect(() => {
    if (isBattleComplete) {
      setTimeout(() => {
        router.push(`/${locale}/result`);
      }, 800);
    }
  }, [isBattleComplete, router, locale]);

  // メンバー選択
  const handleSelect = (winnerId: string) => {
    if (!currentPair || isAnimating) return;

    setSelectedId(winnerId);
    setIsAnimating(true);

    const [memberA, memberB] = currentPair;
    
    // アニメーション後にバトル結果を記録
    setTimeout(() => {
      recordBattle(memberA.member.id, memberB.member.id, winnerId);
      setIsAnimating(false);
    }, 600);
  };

  // 候補がない場合
  if (state.candidates.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <div className="card p-8 w-full max-w-sm">
          <p className="text-gray-600 mb-4">{dict.noCandidates}</p>
          <button
            onClick={() => router.push(`/${locale}`)}
            className="btn-primary"
          >
            {dict.restart}
          </button>
        </div>
      </div>
    );
  }

  // 計算中（バトル完了時）
  if (isBattleComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <div className="card p-8 w-full max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-100 to-pink-100 
            flex items-center justify-center animate-pulse">
            <span className="text-2xl">🏆</span>
          </div>
          <p className="text-gray-600 font-medium">{dict.calculating}</p>
        </div>
      </div>
    );
  }

  // ペアがまだない場合
  if (!currentPair) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const [memberA, memberB] = currentPair;

  return (
    <div className="flex flex-col items-center min-h-[75vh] py-4">
      {/* プログレスバー */}
      <div className="w-full max-w-sm mb-4">
        <ProgressBar
          current={state.currentBattleRound + 1}
          total={BATTLE_ROUNDS}
          locale={locale}
        />
      </div>

      {/* サブタイトル */}
      <p className="text-gray-500 text-sm mb-6">{dict.subtitle}</p>

      {/* バトルエリア */}
      <div className="w-full max-w-4xl px-2 sm:px-4" key={state.currentBattleRound}>
        <div className="flex flex-col items-center gap-6 animate-scale-in">
          {/* 左のメンバー */}
          <div className="w-full">
            <MemberBattleCard
              member={memberA.member}
              locale={locale}
              onSelect={() => handleSelect(memberA.member.id)}
              isSelected={selectedId === memberA.member.id}
              isLoser={selectedId !== null && selectedId !== memberA.member.id}
              position="left"
            />
          </div>

          {/* VS */}
          <div className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/80 backdrop-blur 
            flex items-center justify-center shadow-lg border border-gray-100">
            <span className="text-sm md:text-base font-bold text-gray-500">or</span>
          </div>

          {/* 右のメンバー */}
          <div className="w-full">
            <MemberBattleCard
              member={memberB.member}
              locale={locale}
              onSelect={() => handleSelect(memberB.member.id)}
              isSelected={selectedId === memberB.member.id}
              isLoser={selectedId !== null && selectedId !== memberB.member.id}
              position="right"
            />
          </div>
        </div>
      </div>

      {/* ラウンド表示 */}
      <div className="mt-6 px-4 py-2 rounded-full bg-white/60 backdrop-blur">
        <span className="text-sm font-medium text-gray-600">
          Round {state.currentBattleRound + 1} / {BATTLE_ROUNDS}
        </span>
      </div>
    </div>
  );
}
