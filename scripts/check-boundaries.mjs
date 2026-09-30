import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const srcRoot = path.join(projectRoot, "src");

function ownerOf(file) {
  const relative = path.relative(srcRoot, file);
  return relative.split(path.sep)[0];
}

function targetOf(specifier, file) {
  if (specifier.startsWith("@/")) return path.join(srcRoot, specifier.slice(2));
  if (specifier.startsWith("."))
    return path.resolve(path.dirname(file), specifier);
  return null;
}

export function analyzeImports(source, file) {
  const problems = [];
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const owner = ownerOf(file);
  function check(specifier, node) {
    const target = targetOf(specifier, file);
    const targetOwner = target ? ownerOf(target) : null;
    let allowed = true;
    if (owner === "core")
      allowed = target ? targetOwner === "core" : specifier === "zod";
    if (owner === "modules")
      allowed = target
        ? ["core", "modules"].includes(targetOwner)
        : ["zod", "react", "@tabler/icons-react"].includes(specifier);
    if (owner === "adapters")
      allowed = target ? ["core", "adapters"].includes(targetOwner) : true;
    if (owner === "features")
      allowed = target
        ? ["core", "adapters", "features", "components", "modules"].includes(
            targetOwner,
          ) && !target.includes(`${path.sep}modules${path.sep}index`)
        : true;
    if (owner === "components")
      allowed = target ? targetOwner === "components" : true;
    if (!allowed)
      problems.push(
        `${file}:${sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1}: forbidden import ${specifier}`,
      );
  }
  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    )
      check(node.moduleSpecifier.text, node);
    if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteral(node.argument.literal)
    )
      check(node.argument.literal.text, node);
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      const arg = node.arguments[0];
      if (arg && ts.isStringLiteral(arg)) check(arg.text, node);
      else
        problems.push(
          `${file}:${sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1}: dynamic import must use a string literal`,
        );
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return problems;
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(file);
    return /\.[cm]?[jt]sx?$/.test(entry.name) ? [file] : [];
  });
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const problems = walk(srcRoot).flatMap((file) =>
    analyzeImports(readFileSync(file, "utf8"), file),
  );
  if (problems.length) {
    process.stderr.write(`${problems.join("\n")}\n`);
    process.exitCode = 1;
  } else process.stdout.write("Architecture boundaries pass.\n");
}
