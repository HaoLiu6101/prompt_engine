"""
Generate a GitHub Actions step summary for frontend coverage results.

Reads LCOV output (coverage/lcov.info) and writes markdown tables to the path
given by --summary-path (defaults to GITHUB_STEP_SUMMARY).
"""

from __future__ import annotations

import argparse
import os
from dataclasses import dataclass
from typing import List, Sequence, Tuple


@dataclass
class FileCoverage:
    path: str
    lines_found: int
    lines_hit: int
    branches_found: int
    branches_hit: int
    funcs_found: int
    funcs_hit: int
    missing_lines: List[int]


@dataclass
class CoverageTotals:
    lines_found: int = 0
    lines_hit: int = 0
    branches_found: int = 0
    branches_hit: int = 0
    funcs_found: int = 0
    funcs_hit: int = 0


def pct(hit: int, found: int) -> float:
    return (hit / found * 100) if found else 0.0


def compress_ranges(numbers: Sequence[int]) -> str:
    if not numbers:
        return "-"
    numbers = sorted(numbers)
    ranges: List[str] = []
    start = prev = numbers[0]
    for n in numbers[1:]:
        if n == prev + 1:
            prev = n
            continue
        ranges.append(f"{start}" if start == prev else f"{start}-{prev}")
        start = prev = n
    ranges.append(f"{start}" if start == prev else f"{start}-{prev}")
    return ", ".join(ranges)


def parse_lcov(path: str) -> Tuple[CoverageTotals, List[FileCoverage]] | None:
    if not os.path.exists(path):
        return None

    totals = CoverageTotals()
    files: List[FileCoverage] = []

    current_path = ""
    lines_found = lines_hit = 0
    branches_found = branches_hit = 0
    funcs_found = funcs_hit = 0
    missing_lines: List[int] = []

    def flush_current() -> None:
        nonlocal lines_found, lines_hit, branches_found, branches_hit, funcs_found, funcs_hit, missing_lines, current_path
        if not current_path:
            return
        files.append(
            FileCoverage(
                path=current_path,
                lines_found=lines_found,
                lines_hit=lines_hit,
                branches_found=branches_found,
                branches_hit=branches_hit,
                funcs_found=funcs_found,
                funcs_hit=funcs_hit,
                missing_lines=missing_lines,
            )
        )
        totals.lines_found += lines_found
        totals.lines_hit += lines_hit
        totals.branches_found += branches_found
        totals.branches_hit += branches_hit
        totals.funcs_found += funcs_found
        totals.funcs_hit += funcs_hit
        current_path = ""
        lines_found = lines_hit = branches_found = branches_hit = funcs_found = funcs_hit = 0
        missing_lines = []

    with open(path, "r", encoding="utf-8") as fh:
        for raw_line in fh:
            line = raw_line.strip()
            if line.startswith("SF:"):
                flush_current()
                current_path = line[3:]
            elif line.startswith("DA:"):
                # DA:<line number>,<execution count>
                parts = line[3:].split(",")
                if len(parts) == 2:
                    line_no = int(parts[0])
                    hits = int(parts[1])
                    lines_found += 1
                    if hits > 0:
                        lines_hit += 1
                    else:
                        missing_lines.append(line_no)
            elif line.startswith("BRDA:"):
                # BRDA:<line>,<block>,<branch>,<taken>
                parts = line[5:].split(",")
                if len(parts) == 4:
                    taken = parts[3]
                    branches_found += 1
                    if taken != "-" and int(taken) > 0:
                        branches_hit += 1
            elif line.startswith("FNF:"):
                funcs_found += int(line[4:])
            elif line.startswith("FNH:"):
                funcs_hit += int(line[4:])
            elif line == "end_of_record":
                flush_current()

    flush_current()
    return totals, files


def md_table(rows: List[List[str]]) -> str:
    header = rows[0]
    body = rows[1:]
    table = ["| " + " | ".join(header) + " |", "| " + " | ".join(["---"] * len(header)) + " |"]
    table.extend("| " + " | ".join(row) + " |" for row in body)
    return "\n".join(table)


def build_summary(result: Tuple[CoverageTotals, List[FileCoverage]] | None, top_n: int) -> str:
    parts: List[str] = ["## Frontend summary"]
    if not result:
        parts.append("Frontend coverage data not found.")
        return "\n\n".join(parts) + "\n"

    totals, files = result
    parts.append("### Frontend coverage")
    parts.append(
        md_table(
            [
                ["Metric", "%"],
                ["Lines", f"{pct(totals.lines_hit, totals.lines_found):.1f}"],
                ["Branches", f"{pct(totals.branches_hit, totals.branches_found):.1f}"],
                ["Functions", f"{pct(totals.funcs_hit, totals.funcs_found):.1f}"],
            ]
        )
    )

    if files:
        files_with_miss = [f for f in files if f.missing_lines]
        if files_with_miss:
            top = sorted(files_with_miss, key=lambda f: len(f.missing_lines), reverse=True)[:top_n]
            parts.append("#### Most missed lines by file")
            parts.append(
                md_table(
                    [["File", "Lines %", "Branches %", "Functions %", "Missing lines"]]
                    + [
                        [
                            f.path,
                            f"{pct(f.lines_hit, f.lines_found):.1f}",
                            f"{pct(f.branches_hit, f.branches_found):.1f}",
                            f"{pct(f.funcs_hit, f.funcs_found):.1f}",
                            compress_ranges(f.missing_lines),
                        ]
                        for f in top
                    ]
                )
            )

    return "\n\n".join(parts) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description="Render frontend coverage summary.")
    parser.add_argument("--summary-path", default=os.environ.get("GITHUB_STEP_SUMMARY"), help="Output markdown file for the summary.")
    parser.add_argument("--lcov", default="coverage/lcov.info", help="Path to LCOV report.")
    parser.add_argument("--top-n", type=int, default=8, help="Number of files to list in missing-lines table.")
    args = parser.parse_args()

    result = parse_lcov(args.lcov)
    summary = build_summary(result, args.top_n)

    if args.summary_path:
        with open(args.summary_path, "a", encoding="utf-8") as fh:
            fh.write(summary)
    else:
        print(summary)


if __name__ == "__main__":
    main()
