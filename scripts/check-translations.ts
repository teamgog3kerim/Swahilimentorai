import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const han = /\p{Script=Han}/u;
const literal = (node: ts.Node): node is ts.StringLiteral | ts.NoSubstitutionTemplateLiteral =>
  ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);

function location(source: ts.SourceFile, node: ts.Node) {
  const { line, character } = source.getLineAndCharacterOfPosition(node.getStart(source));
  return `${source.fileName}:${line + 1}:${character + 1}`;
}

/** Parse the raw dictionary before JSON.parse can silently discard duplicate keys. */
export function inspectDictionary(sourceText: string, fileName = "client/src/lib/i18n.tsx") {
  const source = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let raw: ts.NoSubstitutionTemplateLiteral | undefined;
  function find(node: ts.Node) {
    if (ts.isTaggedTemplateExpression(node) && node.tag.getText(source) === "String.raw" &&
        ts.isNoSubstitutionTemplateLiteral(node.template)) raw = node.template;
    ts.forEachChild(node, find);
  }
  find(source);
  if (!raw) throw new Error(`${fileName}: expected the String.raw translation dictionary`);
  const text = raw.getText(source).slice(1, -1);
  // JSON.parse still validates strict JSON; the AST preserves every property occurrence.
  const entries: Record<string, string> = JSON.parse(text);
  const json = ts.parseJsonText(fileName, text);
  const issues: string[] = [];
  const seen = new Map<string, string>();
  function visit(node: ts.Node) {
    if (ts.isPropertyAssignment(node) && ts.isStringLiteral(node.name)) {
      const key = node.name.text;
      const position = source.getLineAndCharacterOfPosition(raw!.getStart(source) + 1 + node.name.getStart(json));
      const at = `${fileName}:${position.line + 1}:${position.character + 1}`;
      if (seen.has(key)) issues.push(`${at}: duplicate English key ${JSON.stringify(key)} (first at ${seen.get(key)}); keep one explicit translation`);
      seen.set(key, at);
      if (!ts.isStringLiteral(node.initializer) || !node.initializer.text.trim()) {
        issues.push(`${at}: empty/non-string English translation for ${JSON.stringify(key)}`);
      } else if (han.test(node.initializer.text)) {
        issues.push(`${at}: English translation still contains Chinese for ${JSON.stringify(key)}`);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(json);
  return { entries, issues };
}

export function inspectTranslationCalls(text: string, fileName: string, entries: Record<string, string>) {
  const source = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const issues: string[] = [];
  function check(node: ts.Expression) {
    if (literal(node)) {
      if (han.test(node.text) && (!Object.hasOwn(entries, node.text) || !entries[node.text]?.trim())) {
        issues.push(`${location(source, node)}: missing English entry ${JSON.stringify(node.text)}; add it to client/src/lib/i18n.tsx`);
      }
    } else if (ts.isConditionalExpression(node)) {
      check(node.whenTrue);
      check(node.whenFalse);
    } else {
      issues.push(`${location(source, node)}: unchecked dynamic translation t(${node.getText(source)}); translate literal keys where the data is defined`);
    }
  }
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "t" && node.arguments[0]) {
      check(node.arguments[0]);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return issues;
}

export function checkTranslations(root = process.cwd()) {
  const dictionary = inspectDictionary(fs.readFileSync(path.join(root, "client/src/lib/i18n.tsx"), "utf8"));
  const issues = [...dictionary.issues];
  function scan(directory: string) {
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, item.name);
      if (item.isDirectory()) scan(file);
      else if (/\.[jt]sx?$/.test(item.name)) {
        issues.push(...inspectTranslationCalls(fs.readFileSync(file, "utf8"), path.relative(root, file), dictionary.entries));
      }
    }
  }
  scan(path.join(root, "client/src"));
  return issues;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const issues = checkTranslations();
  if (issues.length) {
    console.error(`Translation check failed (${issues.length} issues):\n${issues.join("\n")}`);
    process.exitCode = 1;
  } else {
    console.log("Translation check passed: no duplicate keys, empty English entries, Chinese English values or unchecked translation calls.");
  }
}
