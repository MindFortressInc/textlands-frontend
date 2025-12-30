#!/usr/bin/env npx tsx
/**
 * TextLands Frontend Error Scanner
 * Scans codebase for known error patterns from errors/errors.yaml
 *
 * Usage:
 *   npx tsx scripts/error-scanner.ts              # Full scan
 *   npx tsx scripts/error-scanner.ts --quick      # Critical/High only
 *   npx tsx scripts/error-scanner.ts --err TLF-001 # Check specific error
 *   npx tsx scripts/error-scanner.ts --list       # List all errors
 *   npx tsx scripts/error-scanner.ts --summary    # Just show counts
 *   npx tsx scripts/error-scanner.ts --type-check # Run tsc --noEmit
 *   npx tsx scripts/error-scanner.ts --orphans    # Find unused components
 *   npx tsx scripts/error-scanner.ts --links      # Check for dead links
 */

import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, relative } from "path";
import { execSync } from "child_process";
import { parse as parseYaml } from "yaml";

// Colors for terminal output
const Colors = {
  RED: "\x1b[91m",
  GREEN: "\x1b[92m",
  YELLOW: "\x1b[93m",
  BLUE: "\x1b[94m",
  CYAN: "\x1b[96m",
  BOLD: "\x1b[1m",
  DIM: "\x1b[2m",
  END: "\x1b[0m",
};

interface Finding {
  errorId: string;
  severity: string;
  file: string;
  line: number;
  code: string;
  description: string;
}

interface YamlError {
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "FIXED" | "OPEN";
  discovered: string;
  fixed?: string;
  affected_files: string[];
  patterns: string[];
  exclude_patterns: string[];
  search_paths: string[];
  what_to_look_for: string;
  fix: string;
}

interface ErrorPattern {
  id: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "FIXED" | "OPEN";
  patterns: RegExp[];
  excludePatterns: RegExp[];
  searchPaths: string[];
  description: string;
}

function loadErrorPatterns(basePath: string): Record<string, ErrorPattern> {
  const yamlPath = join(basePath, "errors", "errors.yaml");

  if (!existsSync(yamlPath)) {
    console.log(`${Colors.YELLOW}Warning: errors/errors.yaml not found${Colors.END}`);
    return {};
  }

  const content = readFileSync(yamlPath, "utf-8");
  const parsed = parseYaml(content) as Record<string, YamlError>;

  const patterns: Record<string, ErrorPattern> = {};

  for (const [id, error] of Object.entries(parsed)) {
    // Skip fixed errors - they shouldn't appear in scans
    // But we still want to list them

    patterns[id] = {
      id,
      title: error.title,
      severity: error.severity,
      status: error.status,
      patterns: (error.patterns || []).map((p) => new RegExp(p)),
      excludePatterns: (error.exclude_patterns || []).map((p) => new RegExp(p)),
      searchPaths: error.search_paths || [],
      description: error.what_to_look_for?.split("\n")[0] || error.title,
    };
  }

  return patterns;
}

function getAllFiles(dir: string, extensions: string[]): string[] {
  const files: string[] = [];

  try {
    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        if (!item.startsWith(".") && item !== "node_modules") {
          files.push(...getAllFiles(fullPath, extensions));
        }
      } else if (extensions.some((ext) => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist or not readable
  }

  return files;
}

function scanFile(filepath: string, pattern: ErrorPattern, basePath: string): Finding[] {
  const findings: Finding[] = [];

  // Skip scanning if pattern has no regex patterns defined
  if (pattern.patterns.length === 0) {
    return findings;
  }

  try {
    const content = readFileSync(filepath, "utf-8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      for (const regex of pattern.patterns) {
        if (regex.test(line)) {
          // Check exclusions in context (3 lines before and after)
          const contextStart = Math.max(0, i - 3);
          const contextEnd = Math.min(lines.length, i + 4);
          const context = lines.slice(contextStart, contextEnd).join("\n");
          const excluded = pattern.excludePatterns.some((excl) => excl.test(context));

          if (!excluded) {
            findings.push({
              errorId: pattern.id,
              severity: pattern.severity,
              file: relative(basePath, filepath),
              line: lineNum,
              code: line.trim().slice(0, 80),
              description: pattern.description,
            });
            break; // One finding per line
          }
        }
      }
    }
  } catch {
    // File not readable
  }

  return findings;
}

function scanForPattern(pattern: ErrorPattern, basePath: string): Finding[] {
  const findings: Finding[] = [];

  // Skip if no search paths defined
  if (pattern.searchPaths.length === 0) {
    return findings;
  }

  for (const searchPath of pattern.searchPaths) {
    const fullPath = join(basePath, searchPath);

    try {
      const stat = statSync(fullPath);
      if (stat.isFile()) {
        findings.push(...scanFile(fullPath, pattern, basePath));
      } else if (stat.isDirectory()) {
        const files = getAllFiles(fullPath, [".ts", ".tsx"]);
        for (const file of files) {
          findings.push(...scanFile(file, pattern, basePath));
        }
      }
    } catch {
      // Path doesn't exist
    }
  }

  return findings;
}

function runTypeCheck(basePath: string): boolean {
  console.log(`\n${Colors.CYAN}Running TypeScript check...${Colors.END}`);

  try {
    execSync("npx tsc --noEmit", { cwd: basePath, stdio: "pipe" });
    console.log(`${Colors.GREEN}TypeScript check passed${Colors.END}`);
    return true;
  } catch (err: unknown) {
    console.log(`${Colors.RED}TypeScript check failed:${Colors.END}`);
    if (err && typeof err === "object" && "stdout" in err) {
      console.log((err as { stdout: Buffer }).stdout?.toString() || "");
    }
    return false;
  }
}

function printFinding(finding: Finding): void {
  const severityColors: Record<string, string> = {
    CRITICAL: Colors.RED + Colors.BOLD,
    HIGH: Colors.RED,
    MEDIUM: Colors.YELLOW,
    LOW: Colors.BLUE,
  };
  const color = severityColors[finding.severity] || Colors.END;

  console.log(`\n${color}[${finding.errorId}] ${finding.severity}${Colors.END}`);
  console.log(`  File: ${finding.file}:${finding.line}`);
  console.log(`  Code: ${finding.code}`);
  console.log(`  Issue: ${finding.description}`);
}

function listErrors(patterns: Record<string, ErrorPattern>): void {
  console.log(`\n${Colors.BOLD}All Errors (${Object.keys(patterns).length} total):${Colors.END}\n`);

  const severityOrder = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

  for (const severity of severityOrder) {
    const errors = Object.values(patterns).filter((p) => p.severity === severity);
    if (errors.length === 0) continue;

    const color = severity === "CRITICAL" || severity === "HIGH"
      ? Colors.RED
      : severity === "MEDIUM"
        ? Colors.YELLOW
        : Colors.BLUE;

    console.log(`${color}${severity}:${Colors.END}`);

    for (const error of errors) {
      const status = error.status === "FIXED"
        ? `${Colors.GREEN}FIXED${Colors.END}`
        : `${Colors.YELLOW}OPEN${Colors.END}`;
      console.log(`  ${error.id}: ${error.title} [${status}]`);
    }
    console.log();
  }
}

// Find orphaned components (files not imported anywhere)
function findOrphans(basePath: string): string[] {
  console.log(`\n${Colors.CYAN}Scanning for orphaned files...${Colors.END}`);

  const orphans: string[] = [];
  const sourceFiles = [
    ...getAllFiles(join(basePath, "components"), [".tsx", ".ts"]),
    ...getAllFiles(join(basePath, "lib"), [".tsx", ".ts"]),
  ];

  // Build a map of all imports across the codebase
  const allFiles = [
    ...getAllFiles(join(basePath, "app"), [".tsx", ".ts"]),
    ...getAllFiles(join(basePath, "components"), [".tsx", ".ts"]),
    ...getAllFiles(join(basePath, "lib"), [".tsx", ".ts"]),
    ...getAllFiles(join(basePath, "contexts"), [".tsx", ".ts"]),
  ];

  const allImports = new Set<string>();

  for (const file of allFiles) {
    try {
      const content = readFileSync(file, "utf-8");
      const importMatches = content.matchAll(
        /(?:import|from)\s+["'](@\/[^"']+|\.\.?\/[^"']+)["']/g
      );
      for (const match of importMatches) {
        let importPath = match[1];
        if (importPath.startsWith("@/")) {
          importPath = importPath.replace("@/", "");
        }
        importPath = importPath.replace(/^\.\.?\//, "");
        const parts = importPath.split("/");
        const lastName = parts[parts.length - 1];
        allImports.add(lastName);
        allImports.add(importPath);
        allImports.add(lastName.replace(/\.(tsx?|js)$/, ""));
      }
    } catch {
      // File not readable
    }
  }

  for (const file of sourceFiles) {
    const relPath = relative(basePath, file);
    const fileName = relPath.split("/").pop() || "";
    const fileNameNoExt = fileName.replace(/\.(tsx?|js)$/, "");

    if (fileNameNoExt === "index") continue;
    if (fileNameNoExt === "ThemeProvider") continue;

    const isImported =
      allImports.has(fileName) ||
      allImports.has(fileNameNoExt) ||
      allImports.has(relPath) ||
      allImports.has(relPath.replace(/\.(tsx?|js)$/, ""));

    if (!isImported) {
      orphans.push(relPath);
    }
  }

  return orphans;
}

// Check for dead links
async function checkLinks(basePath: string): Promise<{ file: string; line: number; link: string; status: string }[]> {
  console.log(`\n${Colors.CYAN}Checking for dead links...${Colors.END}`);

  const deadLinks: { file: string; line: number; link: string; status: string }[] = [];
  const allFiles = [
    ...getAllFiles(join(basePath, "app"), [".tsx", ".ts"]),
    ...getAllFiles(join(basePath, "components"), [".tsx", ".ts"]),
  ];

  const appRoutes = new Set<string>();
  const appDir = join(basePath, "app");
  const routeFiles = getAllFiles(appDir, [".tsx"]);
  for (const file of routeFiles) {
    if (file.includes("page.tsx")) {
      let route = relative(appDir, file)
        .replace(/\/page\.tsx$/, "")
        .replace(/page\.tsx$/, "");
      route = "/" + route;
      appRoutes.add(route);
    }
  }

  const linkPattern = /(?:href|to)=["'`]([^"'`]+)["'`]/g;

  for (const file of allFiles) {
    try {
      const content = readFileSync(file, "utf-8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const matches = [...line.matchAll(linkPattern)];

        for (const match of matches) {
          const link = match[1];

          if (link.startsWith("#") || link.includes("{") || link.includes("$")) continue;

          if (link.startsWith("/") && !link.startsWith("//")) {
            const normalizedLink = link.split("?")[0].split("#")[0];

            if (!appRoutes.has(normalizedLink) && normalizedLink !== "/") {
              const isDynamicMatch = [...appRoutes].some((route) => {
                const routeParts = route.split("/");
                const linkParts = normalizedLink.split("/");
                if (routeParts.length !== linkParts.length) return false;
                return routeParts.every((part, idx) =>
                  part.startsWith("[") || part === linkParts[idx]
                );
              });

              if (!isDynamicMatch) {
                deadLinks.push({
                  file: relative(basePath, file),
                  line: i + 1,
                  link,
                  status: "Route not found in app/",
                });
              }
            }
          }
        }
      }
    } catch {
      // File not readable
    }
  }

  return deadLinks;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const quick = args.includes("--quick");
  const summary = args.includes("--summary");
  const typeCheck = args.includes("--type-check");
  const checkOrphans = args.includes("--orphans");
  const checkDeadLinks = args.includes("--links");
  const listAll = args.includes("--list");
  const errIndex = args.indexOf("--err");
  const specificError = errIndex !== -1 ? args[errIndex + 1] : null;

  const basePath = process.cwd();

  console.log(`${Colors.BOLD}TextLands Frontend Error Scanner${Colors.END}`);
  console.log(`${Colors.DIM}Source: errors/errors.yaml${Colors.END}`);
  console.log(`Scanning: ${basePath}`);

  // Load patterns from YAML
  const ERROR_PATTERNS = loadErrorPatterns(basePath);

  if (Object.keys(ERROR_PATTERNS).length === 0) {
    console.log(`${Colors.RED}No error patterns loaded${Colors.END}`);
    process.exit(1);
  }

  // List mode
  if (listAll) {
    listErrors(ERROR_PATTERNS);
    process.exit(0);
  }

  // Type check only mode
  if (typeCheck) {
    const success = runTypeCheck(basePath);
    process.exit(success ? 0 : 1);
  }

  // Orphan check mode
  if (checkOrphans) {
    const orphans = findOrphans(basePath);
    if (orphans.length > 0) {
      console.log(`\n${Colors.YELLOW}Found ${orphans.length} orphaned files:${Colors.END}`);
      for (const orphan of orphans) {
        console.log(`  ${Colors.YELLOW}${orphan}${Colors.END}`);
      }
    } else {
      console.log(`\n${Colors.GREEN}No orphaned files found${Colors.END}`);
    }
    process.exit(0);
  }

  // Dead link check mode
  if (checkDeadLinks) {
    const deadLinks = await checkLinks(basePath);
    if (deadLinks.length > 0) {
      console.log(`\n${Colors.YELLOW}Found ${deadLinks.length} dead links:${Colors.END}`);
      for (const { file, line, link, status } of deadLinks) {
        console.log(`  ${Colors.YELLOW}${file}:${line}${Colors.END}`);
        console.log(`    Link: ${link}`);
        console.log(`    Issue: ${status}`);
      }
      process.exit(1);
    } else {
      console.log(`\n${Colors.GREEN}No dead links found${Colors.END}`);
    }
    process.exit(0);
  }

  // Select patterns to scan (only OPEN errors)
  let patternsToScan: Record<string, ErrorPattern>;

  if (specificError) {
    if (!(specificError in ERROR_PATTERNS)) {
      console.log(`${Colors.RED}Unknown error: ${specificError}${Colors.END}`);
      console.log(`Available: ${Object.keys(ERROR_PATTERNS).join(", ")}`);
      process.exit(1);
    }
    patternsToScan = { [specificError]: ERROR_PATTERNS[specificError] };
  } else if (quick) {
    patternsToScan = Object.fromEntries(
      Object.entries(ERROR_PATTERNS).filter(
        ([, v]) => v.status === "OPEN" && (v.severity === "CRITICAL" || v.severity === "HIGH")
      )
    );
  } else {
    // Only scan OPEN errors by default
    patternsToScan = Object.fromEntries(
      Object.entries(ERROR_PATTERNS).filter(([, v]) => v.status === "OPEN")
    );
  }

  // Run scan
  const allFindings: Finding[] = [];
  for (const pattern of Object.values(patternsToScan)) {
    const findings = scanForPattern(pattern, basePath);
    allFindings.push(...findings);
  }

  // Print results
  if (summary) {
    const critical = allFindings.filter((f) => f.severity === "CRITICAL").length;
    const high = allFindings.filter((f) => f.severity === "HIGH").length;
    const medium = allFindings.filter((f) => f.severity === "MEDIUM").length;
    const low = allFindings.filter((f) => f.severity === "LOW").length;

    console.log(`\n${Colors.BOLD}Summary:${Colors.END}`);
    console.log(`  ${Colors.RED}CRITICAL: ${critical}${Colors.END}`);
    console.log(`  ${Colors.RED}HIGH: ${high}${Colors.END}`);
    console.log(`  ${Colors.YELLOW}MEDIUM: ${medium}${Colors.END}`);
    console.log(`  ${Colors.BLUE}LOW: ${low}${Colors.END}`);
  } else {
    if (allFindings.length > 0) {
      console.log(`\n${Colors.BOLD}Found ${allFindings.length} issues:${Colors.END}`);

      for (const severity of ["CRITICAL", "HIGH", "MEDIUM", "LOW"]) {
        const severityFindings = allFindings.filter((f) => f.severity === severity);
        for (const finding of severityFindings) {
          printFinding(finding);
        }
      }
    } else {
      console.log(`\n${Colors.GREEN}No issues found!${Colors.END}`);
    }
  }

  // Exit code
  const criticalCount = allFindings.filter(
    (f) => f.severity === "CRITICAL" || f.severity === "HIGH"
  ).length;

  if (criticalCount > 0) {
    console.log(`\n${Colors.RED}FAILED: ${criticalCount} critical/high issues${Colors.END}`);
    process.exit(1);
  } else {
    console.log(`\n${Colors.GREEN}PASSED${Colors.END}`);
    process.exit(0);
  }
}

main().catch(console.error);
