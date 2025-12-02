"""
Generate a GitHub Actions step summary for backend test and coverage results.

Reads pytest JUnit XML and coverage XML from the backend directory and writes
markdown tables to the path given by --summary-path (defaults to GITHUB_STEP_SUMMARY).
"""

from __future__ import annotations

import argparse
import os
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from typing import List, Sequence, Tuple


@dataclass
class TestSummary:
    total: int
    passed: int
    failures: int
    errors: int
    skipped: int
    time: float
    slowest: List[Tuple[str, float, str]]  # status, time, test id


@dataclass
class CoverageSummary:
    line_rate: float
    branch_rate: float
    most_missed: List[Tuple[str, int, int, float, str]]  # file, stmts, miss, pct, ranges


def parse_junit(path: str) -> TestSummary | None:
    if not os.path.exists(path):
        return None
    root = ET.parse(path).getroot()
    suites = root.findall("testsuite") if root.tag == "testsuites" else [root]

    total = sum(int(s.attrib.get("tests", 0)) for s in suites)
    failures = sum(int(s.attrib.get("failures", 0)) for s in suites)
    errors = sum(int(s.attrib.get("errors", 0)) for s in suites)
    skipped = sum(int(s.attrib.get("skipped", 0)) for s in suites)
    time = sum(float(s.attrib.get("time", 0.0)) for s in suites)
    passed = total - failures - errors - skipped

    def status(tc: ET.Element) -> str:
        if tc.find("failure") is not None:
            return "FAIL"
        if tc.find("error") is not None:
            return "ERROR"
        if tc.find("skipped") is not None:
            return "SKIP"
        return "PASS"

    cases: List[Tuple[str, float, str]] = []
    for tc in root.findall(".//testcase"):
        case_time = float(tc.attrib.get("time", 0.0))
        name = tc.attrib.get("name", "unknown")
        cls = tc.attrib.get("classname", "")
        test_id = f"{cls}.{name}" if cls else name
        cases.append((status(tc), case_time, test_id))

    slowest = sorted(cases, key=lambda x: x[1], reverse=True)[:5]
    return TestSummary(total, passed, failures, errors, skipped, time, slowest)


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


def parse_coverage(path: str) -> CoverageSummary | None:
    if not os.path.exists(path):
        return None

    root = ET.parse(path).getroot()
    line_rate = float(root.attrib.get("line-rate", 0.0)) * 100
    branch_rate = float(root.attrib.get("branch-rate", 0.0)) * 100

    files: List[Tuple[str, int, int, float, str]] = []
    for cls in root.findall(".//class"):
        filename = cls.attrib.get("filename", "unknown")
        lines = cls.findall(".//line")
        stmts = len(lines)
        missed_lines = [int(l.attrib.get("number", 0)) for l in lines if int(l.attrib.get("hits", 0)) == 0]
        miss = len(missed_lines)
        if stmts == 0:
            continue
        cover_pct = (1 - miss / stmts) * 100
        if miss > 0:
            files.append((filename, stmts, miss, cover_pct, compress_ranges(missed_lines)))

    most_missed = sorted(files, key=lambda x: (-x[2], x[3]))[:8]
    return CoverageSummary(line_rate, branch_rate, most_missed)


def md_table(rows: List[List[str]]) -> str:
    header = rows[0]
    body = rows[1:]
    table = ["| " + " | ".join(header) + " |", "| " + " | ".join(["---"] * len(header)) + " |"]
    table.extend("| " + " | ".join(row) + " |" for row in body)
    return "\n".join(table)


def build_summary(tests: TestSummary | None, coverage: CoverageSummary | None) -> str:
    parts: List[str] = ["## Backend summary"]

    if tests:
        parts.append("### Backend tests")
        parts.append(
            md_table(
                [
                    ["Total", "Passed", "Failures", "Errors", "Skipped", "Time (s)"],
                    [
                        str(tests.total),
                        str(tests.passed),
                        str(tests.failures),
                        str(tests.errors),
                        str(tests.skipped),
                        f"{tests.time:.2f}",
                    ],
                ]
            )
        )
        if tests.slowest:
            parts.append("#### Slowest tests")
            parts.append(
                md_table(
                    [["Status", "Test", "Time (s)"]]
                    + [[status, test_id, f"{t:.3f}"] for status, t, test_id in tests.slowest]
                )
            )
    else:
        parts.append("Backend pytest report not found.")

    if coverage:
        parts.append("### Backend coverage")
        parts.append(md_table([["Metric", "%"], ["Lines", f"{coverage.line_rate:.1f}"], ["Branches", f"{coverage.branch_rate:.1f}"]]))
        if coverage.most_missed:
            parts.append("#### Most missed lines by file")
            parts.append(
                md_table(
                    [["File", "Stmts", "Miss", "Cover %", "Missing lines"]]
                    + [
                        [path, str(stmts), str(miss), f"{pct:.1f}", missing]
                        for path, stmts, miss, pct, missing in coverage.most_missed
                    ]
                )
            )
    else:
        parts.append("Backend coverage.xml not found.")

    return "\n\n".join(parts) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description="Render backend CI summary.")
    parser.add_argument("--summary-path", default=os.environ.get("GITHUB_STEP_SUMMARY"), help="Output markdown file for the summary.")
    parser.add_argument("--junit-path", default="pytest-report.xml", help="Path to pytest JUnit XML.")
    parser.add_argument("--coverage-path", default="coverage.xml", help="Path to coverage XML.")
    args = parser.parse_args()

    tests = parse_junit(args.junit_path)
    coverage = parse_coverage(args.coverage_path)
    summary = build_summary(tests, coverage)

    if args.summary_path:
        with open(args.summary_path, "a", encoding="utf-8") as fh:
            fh.write(summary)
    else:
        print(summary)


if __name__ == "__main__":
    main()
