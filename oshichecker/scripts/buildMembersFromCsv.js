const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const SOURCE_DIR = path.join(DATA_DIR, "sheet-csv");

function parseCsv(content) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const ch = content[i];
    const next = content[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === ",") {
      row.push(cell);
      cell = "";
      continue;
    }

    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && next === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += ch;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function readCsvObjects(filename) {
  const filePath = path.join(SOURCE_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV file not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const rows = parseCsv(raw).filter((r) => r.some((c) => c.trim() !== ""));
  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cells, idx) => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = (cells[i] ?? "").trim();
    });
    obj.__row = idx + 2;
    return obj;
  });
}

function getOptional(value) {
  return value && value.trim() !== "" ? value.trim() : undefined;
}

function parseNumber(value, label) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new Error(`${label} is not a valid number: ${value}`);
  }
  return num;
}

function assertRequired(row, keys, fileName) {
  keys.forEach((key) => {
    if (!row[key] || row[key].trim() === "") {
      throw new Error(`${fileName} row ${row.__row}: '${key}' is required`);
    }
  });
}

function getTagColumns(row) {
  return Object.keys(row)
    .filter((key) => /^tag\d+$/.test(key))
    .sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)));
}

function getDataColumns(row, ignoreKeys = []) {
  const ignores = new Set(["memberId", "__row", ...ignoreKeys]);
  return Object.keys(row).filter((key) => !ignores.has(key));
}

function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error(`Source directory not found: ${SOURCE_DIR}`);
  }

  const membersRows = readCsvObjects("members.csv");
  const tagsRows = readCsvObjects("member_tags.csv");
  const scoresRows = readCsvObjects("member_scores.csv");
  const coversRows = readCsvObjects("member_covers.csv");

  const memberMap = new Map();

  membersRows.forEach((row) => {
    assertRequired(
      row,
      ["id", "name", "groupId", "photoUrl", "jpSupport"],
      "members.csv"
    );
    if (memberMap.has(row.id)) {
      throw new Error(`members.csv row ${row.__row}: duplicate id '${row.id}'`);
    }

    memberMap.set(row.id, {
      id: row.id,
      name: row.name,
      nameKo: getOptional(row.nameKo),
      nameEn: getOptional(row.nameEn),
      groupId: row.groupId,
      xUrl: getOptional(row.xUrl),
      photoUrl: row.photoUrl,
      tags: [],
      scores: {},
      jpSupport: row.jpSupport,
      covers: {},
    });
  });

  const hasWideTagColumns =
    tagsRows.length > 0 && getTagColumns(tagsRows[0]).length > 0;
  const hasTallScores =
    scoresRows.length > 0 && "scoreKey" in scoresRows[0] && "score" in scoresRows[0];
  const hasTallCovers =
    coversRows.length > 0 && "artistKey" in coversRows[0] && "score" in coversRows[0];

  tagsRows.forEach((row) => {
    assertRequired(row, ["memberId"], "member_tags.csv");
    const member = memberMap.get(row.memberId);
    if (!member) {
      throw new Error(
        `member_tags.csv row ${row.__row}: memberId '${row.memberId}' not found`
      );
    }

    if (hasWideTagColumns) {
      const tagColumns = getTagColumns(row);
      tagColumns.forEach((column) => {
        const tag = (row[column] ?? "").trim();
        if (tag !== "") {
          member.tags.push(tag);
        }
      });
      return;
    }

    assertRequired(row, ["tag"], "member_tags.csv");
    member.tags.push(row.tag);
  });

  scoresRows.forEach((row) => {
    assertRequired(row, ["memberId"], "member_scores.csv");
    const member = memberMap.get(row.memberId);
    if (!member) {
      throw new Error(
        `member_scores.csv row ${row.__row}: memberId '${row.memberId}' not found`
      );
    }

    if (hasTallScores) {
      assertRequired(row, ["scoreKey", "score"], "member_scores.csv");
      member.scores[row.scoreKey] = parseNumber(
        row.score,
        `member_scores.csv row ${row.__row} score`
      );
      return;
    }

    const scoreColumns = getDataColumns(row);
    scoreColumns.forEach((column) => {
      const raw = (row[column] ?? "").trim();
      if (raw === "") return;
      member.scores[column] = parseNumber(
        raw,
        `member_scores.csv row ${row.__row} column ${column}`
      );
    });
  });

  coversRows.forEach((row) => {
    assertRequired(row, ["memberId"], "member_covers.csv");
    const member = memberMap.get(row.memberId);
    if (!member) {
      throw new Error(
        `member_covers.csv row ${row.__row}: memberId '${row.memberId}' not found`
      );
    }

    if (hasTallCovers) {
      assertRequired(row, ["artistKey", "score"], "member_covers.csv");
      member.covers[row.artistKey] = parseNumber(
        row.score,
        `member_covers.csv row ${row.__row} score`
      );
      return;
    }

    const coverColumns = getDataColumns(row);
    coverColumns.forEach((column) => {
      const raw = (row[column] ?? "").trim();
      if (raw === "") return;
      member.covers[column] = parseNumber(
        raw,
        `member_covers.csv row ${row.__row} column ${column}`
      );
    });
  });

  const members = Array.from(memberMap.values()).map((member) => {
    if (Object.keys(member.covers).length === 0) {
      delete member.covers;
    }
    return member;
  });

  const outputPath = path.join(DATA_DIR, "members.json");
  fs.writeFileSync(outputPath, `${JSON.stringify(members, null, 2)}\n`, "utf8");

  console.log("Updated data/members.json from CSV files:");
  console.log("- data/sheet-csv/members.csv");
  console.log("- data/sheet-csv/member_tags.csv");
  console.log("- data/sheet-csv/member_scores.csv");
  console.log("- data/sheet-csv/member_covers.csv");
}

main();
