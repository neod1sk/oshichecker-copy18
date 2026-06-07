import {
  Member,
  CandidateMember,
  BattleRecord,
  CANDIDATE_COUNT,
  RESULT_COUNT,
  JpSupportLevel,
  KoreanLevel,
} from "./types";

const LANGUAGE_BONUS_TABLE: Record<
  KoreanLevel,
  Record<JpSupportLevel, number>
> = {
  none: { ok: 1, some: 0.5, unknown: 0, no: 0 },
  beginner: { ok: 1, some: 0.5, unknown: 0, no: 0 },
  intermediate: { ok: 0.5, some: 0.3, unknown: 0, no: 0 },
  advanced: { ok: 0, some: 0, unknown: 0, no: 0 },
  native: { ok: 0, some: 0, unknown: 0, no: 0 },
};

const TOP_FIXED_COUNT = 7;
const CLOSE_DELTA = 1.5;

function tieBreakByMemberId(a: CandidateMember, b: CandidateMember): number {
  if (b.surveyScore !== a.surveyScore) {
    return b.surveyScore - a.surveyScore;
  }
  return a.member.id.localeCompare(b.member.id);
}

function sampleRandom<T>(items: T[], pickCount: number): T[] {
  const pool = [...items];

  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, pickCount);
}

export function getLanguageBonus(
  koreanLevel: KoreanLevel,
  jpSupport: JpSupportLevel
): number {
  const levelTable = LANGUAGE_BONUS_TABLE[koreanLevel] ?? LANGUAGE_BONUS_TABLE.none;
  return levelTable[jpSupport] ?? 0;
}

/**
 * アンケートスコアに基づいてメンバーをスコアリング
 * @param members 全メンバーリスト
 * @param surveyScores ユーザーのアンケート回答スコア（属性ごと）
 * @returns スコア順にソートされた候補メンバー
 */
export function scoreMembersBySurvey(
  members: Member[],
  surveyScores: Record<string, number>
): CandidateMember[] {
  const scored = members.map((member) => {
    let surveyScore = 0;
    for (const [key, userScore] of Object.entries(surveyScores)) {
      // 通常属性 + artist系（covers）を同様に加点する
      const memberScore = (member.scores[key] ?? member.covers?.[key]) || 0;
      surveyScore += memberScore * userScore;
    }

    return {
      member,
      surveyScore,
      appearanceCount: 0,
      winCount: 0,
      preferenceScore: 0,
      languageBonus: 0,
      finalScore: 0,
    };
  });

  scored.sort((a, b) => b.surveyScore - a.surveyScore);

  return scored;
}

/**
 * 上位N名の候補を取得
 */
export function getTopCandidates(
  scoredMembers: CandidateMember[],
  count: number = CANDIDATE_COUNT
): CandidateMember[] {
  const sorted = [...scoredMembers].sort(tieBreakByMemberId);
  if (sorted.length <= count) {
    return sorted.slice(0, count);
  }

  const fixedCount = Math.min(TOP_FIXED_COUNT, count, sorted.length);
  const randomCount = Math.max(0, count - fixedCount);
  const fixedTop = sorted.slice(0, fixedCount);
  if (randomCount === 0) {
    return fixedTop;
  }

  const borderlineScore = fixedTop[fixedTop.length - 1]?.surveyScore ?? Number.NEGATIVE_INFINITY;
  const rest = sorted.slice(fixedCount);
  const closePool = rest.filter((candidate) => borderlineScore - candidate.surveyScore <= CLOSE_DELTA);

  const sampledFromClose = sampleRandom(closePool, Math.min(randomCount, closePool.length));
  const sampledIds = new Set(sampledFromClose.map((c) => c.member.id));

  const fallback = rest.filter((candidate) => !sampledIds.has(candidate.member.id));
  const neededFallbackCount = randomCount - sampledFromClose.length;
  const supplemented = neededFallbackCount > 0
    ? [...sampledFromClose, ...fallback.slice(0, neededFallbackCount)]
    : sampledFromClose;

  // 8〜14位は抽出後にスコア順で整列（同点は memberId で安定化）
  const tail = supplemented.sort(tieBreakByMemberId);
  return [...fixedTop, ...tail].slice(0, count);
}

/**
 * 最終ランキングを計算（ハイブリッド言語ボーナス込み）
 *
 * タイブレーク順序:
 * 1) finalScore（preference + languageBonus）
 * 2) winCount
 * 3) surveyScore
 * 4) 直接対決
 * 5) memberId 昇順
 */
export function calculateFinalRanking(
  candidates: CandidateMember[],
  battleRecords: BattleRecord[],
  userKoreanLevel: KoreanLevel = "none",
  preferJapaneseSupport: boolean = true
): CandidateMember[] {
  const withScores = candidates.map((candidate) => {
    const preferenceScore = candidate.surveyScore + candidate.winCount;
    const languageBonus = preferJapaneseSupport
      ? getLanguageBonus(userKoreanLevel, candidate.member.jpSupport)
      : 0;
    const finalScore = preferenceScore + languageBonus;

    return {
      ...candidate,
      preferenceScore,
      languageBonus,
      finalScore,
    };
  });

  const sorted = withScores.sort((a, b) => {
    const aFinal = a.finalScore ?? 0;
    const bFinal = b.finalScore ?? 0;
    if (bFinal !== aFinal) {
      return bFinal - aFinal;
    }

    if (b.winCount !== a.winCount) {
      return b.winCount - a.winCount;
    }

    if (b.surveyScore !== a.surveyScore) {
      return b.surveyScore - a.surveyScore;
    }

    const directBattle = battleRecords.find(
      (record) =>
        (record.memberA === a.member.id && record.memberB === b.member.id) ||
        (record.memberA === b.member.id && record.memberB === a.member.id)
    );
    if (directBattle) {
      if (directBattle.winnerId === a.member.id) return -1;
      if (directBattle.winnerId === b.member.id) return 1;
    }

    return a.member.id.localeCompare(b.member.id);
  });

  // バトル候補は CANDIDATE_COUNT 名なのでその範囲で返す（表示は別途上位3と残りで分割）
  return sorted.slice(0, CANDIDATE_COUNT);
}
