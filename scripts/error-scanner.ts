#!/usr/bin/env npx tsx
/**
 * TextLands Frontend Error Scanner
 * Scans codebase for known error patterns from ERROR_LOG.md
 *
 * Usage:
 *   npx tsx scripts/error-scanner.ts              # Full scan
 *   npx tsx scripts/error-scanner.ts --quick      # Critical/High only
 *   npx tsx scripts/error-scanner.ts --err TLF-001 # Check specific error
 *   npx tsx scripts/error-scanner.ts --summary    # Just show counts
 *   npx tsx scripts/error-scanner.ts --type-check # Run tsc --noEmit
 *   npx tsx scripts/error-scanner.ts --orphans    # Find unused components
 *   npx tsx scripts/error-scanner.ts --links      # Check for dead links
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { execSync } from "child_process";

// Colors for terminal output
const Colors = {
  RED: "\x1b[91m",
  GREEN: "\x1b[92m",
  YELLOW: "\x1b[93m",
  BLUE: "\x1b[94m",
  CYAN: "\x1b[96m",
  BOLD: "\x1b[1m",
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

interface ErrorPattern {
  id: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  patterns: RegExp[];
  excludePatterns: RegExp[];
  searchPaths: string[];
  description: string;
  wholeFileExclude?: boolean;  // Check entire file for exclusions, not just context
}

// Define error patterns with their search regex
const ERROR_PATTERNS: Record<string, ErrorPattern> = {
  "TLF-001": {
    id: "TLF-001",
    title: "Swallowed Promise Rejections",
    severity: "HIGH",
    patterns: [
      /\.catch\s*\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)/,
      /\.catch\s*\(\s*\(\s*\)\s*=>\s*null\s*\)/,
      /\.catch\s*\(\s*\(\s*\)\s*=>\s*undefined\s*\)/,
    ],
    excludePatterns: [
      /console\.(log|error|warn)/,
      /logger\./,
    ],
    searchPaths: ["app/", "components/", "lib/"],
    description: "Empty catch blocks hide errors - add logging",
  },
  "TLF-002": {
    id: "TLF-002",
    title: "Missing ErrorBoundary",
    severity: "HIGH",
    patterns: [
      /export\s+default\s+function\s+RootLayout/,
    ],
    excludePatterns: [
      /ErrorBoundary/,
    ],
    searchPaths: ["app/layout.tsx"],
    description: "Root layout should have ErrorBoundary to catch React errors",
    wholeFileExclude: true,  // Check entire file for exclusions, not just context
  },
  "TLF-003": {
    id: "TLF-003",
    title: "Unguarded localStorage Access",
    severity: "HIGH",
    patterns: [
      /localStorage\.(get|set|remove)Item/,
    ],
    excludePatterns: [
      /try\s*\{/,
      /safeLocalStorage/,
      /catch/,
    ],
    searchPaths: ["app/", "components/", "lib/"],
    description: "localStorage throws in private browsing - wrap in try/catch",
  },
  "TLF-004": {
    id: "TLF-004",
    title: "Empty Catch Blocks",
    severity: "MEDIUM",
    patterns: [
      /\}\s*catch\s*\{\s*\n\s*[^}]*\}/,
      /\}\s*catch\s*\(\s*\)\s*\{/,
    ],
    excludePatterns: [
      /console\.(log|error|warn)/,
      /logger\./,
      /\/\/ (ignore|expected|ok|intentional)/i,
    ],
    searchPaths: ["app/", "components/", "lib/"],
    description: "Catch blocks should at minimum log the error",
  },
  "TLF-005": {
    id: "TLF-005",
    title: "Unhandled Async in useEffect",
    severity: "MEDIUM",
    patterns: [
      /useEffect\s*\(\s*async/,
    ],
    excludePatterns: [],
    searchPaths: ["app/", "components/"],
    description: "async useEffect callbacks are not awaited - use IIFE pattern",
  },
  // TLF-006: DISABLED - Too many false positives
  // Pattern useState<T>(null) catches UI selection states, not just async data
  // Keeping for reference but not scanning
  // "TLF-006": {
  //   id: "TLF-006",
  //   title: "Missing Loading State",
  //   severity: "MEDIUM",
  //   patterns: [/useState<.*>\(null\)/],
  //   excludePatterns: [/loading/i, /isLoading/, /setLoading/],
  //   searchPaths: ["app/", "components/"],
  //   description: "Async data without loading state shows stale/empty UI",
  // },
  "TLF-007": {
    id: "TLF-007",
    title: "Hardcoded API URL",
    severity: "MEDIUM",
    patterns: [
      /fetch\s*\(\s*["'`]https?:\/\//,
      /fetch\s*\(\s*["'`]\/api\//,
    ],
    excludePatterns: [
      /process\.env/,
      /API_BASE/,
      /import\.meta/,
    ],
    searchPaths: ["app/", "components/"],
    description: "API URLs should use environment variables",
  },
  "TLF-008": {
    id: "TLF-008",
    title: "Console.log in Production Code",
    severity: "LOW",
    patterns: [
      /console\.log\s*\(/,
    ],
    excludePatterns: [
      /\/\/ DEBUG/,
      /\/\/ TODO: remove/,
      /console\.error/,
      /console\.warn/,
    ],
    searchPaths: ["app/", "components/", "lib/"],
    description: "Remove console.log before production",
  },
  "TLF-009": {
    id: "TLF-009",
    title: "any Type Usage",
    severity: "LOW",
    patterns: [
      /:\s*any\b/,
      /as\s+any\b/,
    ],
    excludePatterns: [
      /\/\/ eslint-disable/,
      /\/\/ @ts-/,
      /Record<string,\s*any>/,  // Sometimes needed for dynamic objects
    ],
    searchPaths: ["app/", "components/", "lib/", "types/"],
    description: "Avoid 'any' - use proper types or 'unknown'",
  },
};

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

  try {
    const content = readFileSync(filepath, "utf-8");
    const lines = content.split("\n");

    // For wholeFileExclude, check entire file first
    if (pattern.wholeFileExclude) {
      const wholeFileExcluded = pattern.excludePatterns.some((excl) => excl.test(content));
      if (wholeFileExcluded) {
        return findings; // Skip this file entirely
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      for (const regex of pattern.patterns) {
        if (regex.test(line)) {
          // Check exclusions in context (3 lines before and after) unless wholeFileExclude
          let excluded = false;
          if (!pattern.wholeFileExclude) {
            const contextStart = Math.max(0, i - 3);
            const contextEnd = Math.min(lines.length, i + 4);
            const context = lines.slice(contextStart, contextEnd).join("\n");
            excluded = pattern.excludePatterns.some((excl) => excl.test(context));
          }

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
      // Match various import patterns
      const importMatches = content.matchAll(
        /(?:import|from)\s+["'](@\/[^"']+|\.\.?\/[^"']+)["']/g
      );
      for (const match of importMatches) {
        let importPath = match[1];
        // Normalize path aliases
        if (importPath.startsWith("@/")) {
          importPath = importPath.replace("@/", "");
        }
        // Remove leading ./ or ../
        importPath = importPath.replace(/^\.\.?\//, "");
        // Extract just the component/module name
        const parts = importPath.split("/");
        const lastName = parts[parts.length - 1];
        allImports.add(lastName);
        allImports.add(importPath);
        // Also add without extension
        allImports.add(lastName.replace(/\.(tsx?|js)$/, ""));
      }
    } catch {
      // File not readable
    }
  }

  // Check each source file
  for (const file of sourceFiles) {
    const relPath = relative(basePath, file);
    const fileName = relPath.split("/").pop() || "";
    const fileNameNoExt = fileName.replace(/\.(tsx?|js)$/, "");

    // Skip index files (they're re-exports)
    if (fileNameNoExt === "index") continue;

    // Skip ThemeProvider (used in layout)
    if (fileNameNoExt === "ThemeProvider") continue;

    // Check if this file is imported anywhere
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

// Check for dead links (internal routes and external URLs)
async function checkLinks(basePath: string): Promise<{ file: string; line: number; link: string; status: string }[]> {
  console.log(`\n${Colors.CYAN}Checking for dead links...${Colors.END}`);

  const deadLinks: { file: string; line: number; link: string; status: string }[] = [];
  const allFiles = [
    ...getAllFiles(join(basePath, "app"), [".tsx", ".ts"]),
    ...getAllFiles(join(basePath, "components"), [".tsx", ".ts"]),
  ];

  // Collect app routes
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

  // Pattern for href and Link
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

          // Skip dynamic routes, anchors, and external links for now
          if (link.startsWith("#") || link.includes("{") || link.includes("$")) continue;

          // Check internal routes
          if (link.startsWith("/") && !link.startsWith("//")) {
            // Normalize the link
            const normalizedLink = link.split("?")[0].split("#")[0];

            // Check against known routes
            if (!appRoutes.has(normalizedLink) && normalizedLink !== "/") {
              // Check if it's a dynamic route pattern
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

          // Check external links (only in --links-external mode for speed)
          // Skipping external checks by default since they're slow
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
  const errIndex = args.indexOf("--err");
  const specificError = errIndex !== -1 ? args[errIndex + 1] : null;

  // Find project root (where package.json is)
  const basePath = process.cwd();

  console.log(`${Colors.BOLD}TextLands Frontend Error Scanner${Colors.END}`);
  console.log(`Scanning: ${basePath}`);

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
      console.log(`\n${Colors.YELLOW}WARNING: These files are not imported anywhere${Colors.END}`);
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

  // Select patterns to scan
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
        ([, v]) => v.severity === "CRITICAL" || v.severity === "HIGH"
      )
    );
  } else {
    patternsToScan = ERROR_PATTERNS;
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

      // Group by severity
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
