const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const SOURCE_MEMBERS = path.join(DATA_DIR, "members.json");
const OUTPUT_DIR = path.join(DATA_DIR, "sheet-paste");

function escapeTsv(value) {
  const text = value === undefined || value === null ? "" : String(value);
  return text.replace(/\r?\n/g, " ");
}

function toTsv(rows) {
  return `${rows.map((row) => row.map(escapeTsv).join("\t")).join("\n")}\n`;
}

function main() {
  if (!fs.existsSync(SOURCE_MEMBERS)) {
    throw new Error(`members.json not found: ${SOURCE_MEMBERS}`);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const members = JSON.parse(fs.readFileSync(SOURCE_MEMBERS, "utf8"));
  if (!Array.isArray(members)) {
    throw new Error("data/members.json must be an array");
  }

  const tagColumnCount = Math.max(
    3,
    ...members.map((member) => (Array.isArray(member.tags) ? member.tags.length : 0))
  );
  const tagHeaders = ["memberId", ...Array.from({ length: tagColumnCount }, (_, i) => `tag${i + 1}`)];
  const scoreKeys = Array.from(
    new Set(
      members.flatMap((member) =>
        Object.keys(member && typeof member === "object" ? member.scores ?? {} : {})
      )
    )
  ).sort();
  const coverKeys = Array.from(
    new Set(
      members.flatMap((member) =>
        Object.keys(member && typeof member === "object" ? member.covers ?? {} : {})
      )
    )
  ).sort();

  const membersRows = [
    ["id", "name", "nameKo", "nameEn", "groupId", "xUrl", "photoUrl", "jpSupport"],
  ];
  const memberTagsRows = [tagHeaders];
  const memberScoresRows = [["memberId", ...scoreKeys]];
  const memberCoversRows = [["memberId", ...coverKeys]];

  members.forEach((member) => {
    const {
      id,
      name,
      nameKo,
      nameEn,
      groupId,
      xUrl,
      photoUrl,
      jpSupport,
      tags,
      scores,
      covers,
    } = member;

    membersRows.push([
      id ?? "",
      name ?? "",
      nameKo ?? "",
      nameEn ?? "",
      groupId ?? "",
      xUrl ?? "",
      photoUrl ?? "",
      jpSupport ?? "",
    ]);

    const tagCells = Array.from({ length: tagColumnCount }, (_, idx) => tags?.[idx] ?? "");
    memberTagsRows.push([id ?? "", ...tagCells]);

    const scoreCells = scoreKeys.map((key) => scores?.[key] ?? "");
    memberScoresRows.push([id ?? "", ...scoreCells]);

    const coverCells = coverKeys.map((key) => covers?.[key] ?? "");
    memberCoversRows.push([id ?? "", ...coverCells]);
  });

  fs.writeFileSync(path.join(OUTPUT_DIR, "members.tsv"), toTsv(membersRows), "utf8");
  fs.writeFileSync(path.join(OUTPUT_DIR, "member_tags.tsv"), toTsv(memberTagsRows), "utf8");
  fs.writeFileSync(path.join(OUTPUT_DIR, "member_scores.tsv"), toTsv(memberScoresRows), "utf8");
  fs.writeFileSync(path.join(OUTPUT_DIR, "member_covers.tsv"), toTsv(memberCoversRows), "utf8");

  console.log("Exported paste-ready TSV files from data/members.json:");
  console.log("- data/sheet-paste/members.tsv");
  console.log("- data/sheet-paste/member_tags.tsv");
  console.log("- data/sheet-paste/member_scores.tsv");
  console.log("- data/sheet-paste/member_covers.tsv");
}

main();
