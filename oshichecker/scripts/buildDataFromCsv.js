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
      if (ch === "\r" && next === "\n") {
        i += 1;
      }
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
  const filepath = path.join(SOURCE_DIR, filename);
  if (!fs.existsSync(filepath)) {
    throw new Error(`CSV file not found: ${filepath}`);
  }

  const raw = fs.readFileSync(filepath, "utf8").replace(/^\uFEFF/, "");
  const rows = parseCsv(raw).filter((r) => r.some((c) => c.trim() !== ""));
  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((cells, index) => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = (cells[i] ?? "").trim();
    });
    obj.__rowNumber = String(index + 2);
    return obj;
  });
}

function writeJson(filepath, value) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  fs.writeFileSync(filepath, text, "utf8");
}

function getOptional(value) {
  return value && value.trim() !== "" ? value.trim() : undefined;
}

function parseInteger(value, fallback) {
  if (value === undefined || value === null || String(value).trim() === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid number: ${value}`);
  }
  return parsed;
}

function parseJsonObject(value, fallback = {}) {
  if (!value || value.trim() === "") return fallback;
  const parsed = JSON.parse(value);
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Expected object JSON, got: ${value}`);
  }
  return parsed;
}

function ensureRequired(obj, keys, fileLabel) {
  keys.forEach((key) => {
    if (!obj[key] || obj[key].trim() === "") {
      throw new Error(`${fileLabel} row ${obj.__rowNumber}: missing required field '${key}'`);
    }
  });
}

function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error(
      `Source directory not found: ${SOURCE_DIR}\nCreate it and put CSV exports there.`
    );
  }

  const groupsRows = readCsvObjects("groups.csv");
  const membersRows = readCsvObjects("members.csv");
  const tagsRows = readCsvObjects("member_tags.csv");
  const memberScoresRows = readCsvObjects("member_scores.csv");
  const memberCoversRows = readCsvObjects("member_covers.csv");
  const artistsRows = readCsvObjects("jp_artists.csv");
  const questionsRows = readCsvObjects("questions.csv");
  const questionOptionsRows = readCsvObjects("question_options.csv");

  const groups = groupsRows.map((row) => {
    ensureRequired(row, ["id", "name"], "groups.csv");
    return {
      id: row.id,
      name: row.name,
      nameJa: getOptional(row.nameJa),
      nameKo: getOptional(row.nameKo),
      nameEn: getOptional(row.nameEn),
      color: getOptional(row.color),
      blogUrl: getOptional(row.blogUrl),
    };
  });

  const groupIdSet = new Set(groups.map((g) => g.id));
  const memberMap = new Map();
  membersRows.forEach((row) => {
    ensureRequired(
      row,
      ["id", "name", "groupId", "photoUrl", "jpSupport"],
      "members.csv"
    );
    if (!groupIdSet.has(row.groupId)) {
      throw new Error(
        `members.csv row ${row.__rowNumber}: groupId '${row.groupId}' does not exist in groups.csv`
      );
    }
    if (memberMap.has(row.id)) {
      throw new Error(`members.csv row ${row.__rowNumber}: duplicate member id '${row.id}'`);
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

  tagsRows.forEach((row) => {
    ensureRequired(row, ["memberId", "tag"], "member_tags.csv");
    const member = memberMap.get(row.memberId);
    if (!member) {
      throw new Error(
        `member_tags.csv row ${row.__rowNumber}: memberId '${row.memberId}' not found`
      );
    }
    member.tags.push(row.tag);
  });

  memberScoresRows.forEach((row) => {
    ensureRequired(row, ["memberId", "scoreKey", "score"], "member_scores.csv");
    const member = memberMap.get(row.memberId);
    if (!member) {
      throw new Error(
        `member_scores.csv row ${row.__rowNumber}: memberId '${row.memberId}' not found`
      );
    }
    member.scores[row.scoreKey] = parseInteger(row.score, 0);
  });

  memberCoversRows.forEach((row) => {
    ensureRequired(row, ["memberId", "artistKey", "score"], "member_covers.csv");
    const member = memberMap.get(row.memberId);
    if (!member) {
      throw new Error(
        `member_covers.csv row ${row.__rowNumber}: memberId '${row.memberId}' not found`
      );
    }
    member.covers[row.artistKey] = parseInteger(row.score, 0);
  });

  const members = Array.from(memberMap.values()).map((member) => {
    if (member.tags.length === 0) {
      member.tags = [];
    }
    if (Object.keys(member.covers).length === 0) {
      delete member.covers;
    }
    return member;
  });

  const jpArtists = artistsRows.map((row) => {
    ensureRequired(row, ["id", "label", "key"], "jp_artists.csv");
    return {
      id: row.id,
      label: row.label,
      key: row.key,
    };
  });

  const questionMap = new Map();
  questionsRows.forEach((row) => {
    ensureRequired(row, ["id", "text"], "questions.csv");
    const question = {
      id: row.id,
      type: getOptional(row.type) || undefined,
      minSelect: parseInteger(row.minSelect, undefined),
      maxSelect: parseInteger(row.maxSelect, undefined),
      text: row.text,
      textKo: getOptional(row.textKo),
      textEn: getOptional(row.textEn),
      sortOrder: parseInteger(row.sortOrder, Number.MAX_SAFE_INTEGER),
      options: [],
    };
    questionMap.set(row.id, question);
  });

  questionOptionsRows.forEach((row) => {
    ensureRequired(row, ["questionId", "text", "scoreKey"], "question_options.csv");
    const question = questionMap.get(row.questionId);
    if (!question) {
      throw new Error(
        `question_options.csv row ${row.__rowNumber}: questionId '${row.questionId}' not found`
      );
    }

    const explicitScoreValue = parseInteger(row.scoreValue, undefined);
    const scores = parseJsonObject(row.scoresJson, undefined);

    const option = {
      id: getOptional(row.optionId),
      text: row.text,
      textKo: getOptional(row.textKo),
      textEn: getOptional(row.textEn),
      scoreKey: row.scoreKey,
      scoreValue: explicitScoreValue,
      scores,
      sortOrder: parseInteger(row.sortOrder, Number.MAX_SAFE_INTEGER),
    };

    if (!option.id) delete option.id;
    if (option.scoreValue === undefined) delete option.scoreValue;
    if (option.scores === undefined || Object.keys(option.scores).length === 0) {
      delete option.scores;
    }

    question.options.push(option);
  });

  const questions = Array.from(questionMap.values())
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((q) => {
      q.options.sort((a, b) => a.sortOrder - b.sortOrder);
      q.options = q.options.map((o) => {
        const clean = { ...o };
        delete clean.sortOrder;
        return clean;
      });

      const clean = { ...q };
      delete clean.sortOrder;
      if (!clean.type) delete clean.type;
      if (clean.minSelect === undefined) delete clean.minSelect;
      if (clean.maxSelect === undefined) delete clean.maxSelect;
      return clean;
    });

  writeJson(path.join(DATA_DIR, "groups.json"), groups);
  writeJson(path.join(DATA_DIR, "members.json"), members);
  writeJson(path.join(DATA_DIR, "jpArtists.json"), jpArtists);
  writeJson(path.join(DATA_DIR, "questions.json"), questions);

  console.log("Generated data JSON from CSV:");
  console.log("- data/groups.json");
  console.log("- data/members.json");
  console.log("- data/jpArtists.json");
  console.log("- data/questions.json");
}

main();
