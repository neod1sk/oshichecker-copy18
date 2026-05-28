const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const SOURCE_MEMBERS = path.join(DATA_DIR, "members.json");
const OUTPUT_DIR = path.join(DATA_DIR, "sheet-csv");

function escapeCsv(value) {
  const text = value === undefined || value === null ? "" : String(value);
  if (text.includes('"') || text.includes(",") || text.includes("\n") || text.includes("\r")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(rows) {
  return `${rows.map((row) => row.map(escapeCsv).join(",")).join("\n")}\n`;
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

  fs.writeFileSync(path.join(OUTPUT_DIR, "members.csv"), toCsv(membersRows), "utf8");
  fs.writeFileSync(path.join(OUTPUT_DIR, "member_tags.csv"), toCsv(memberTagsRows), "utf8");
  fs.writeFileSync(path.join(OUTPUT_DIR, "member_scores.csv"), toCsv(memberScoresRows), "utf8");
  fs.writeFileSync(path.join(OUTPUT_DIR, "member_covers.csv"), toCsv(memberCoversRows), "utf8");

  console.log("Exported CSV files from data/members.json:");
  console.log("- data/sheet-csv/members.csv");
  console.log("- data/sheet-csv/member_tags.csv");
  console.log("- data/sheet-csv/member_scores.csv");
  console.log("- data/sheet-csv/member_covers.csv");
}

main();
