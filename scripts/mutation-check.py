"""
Mini mutation test: are our tests meaningful?

A test suite is only worth something if it FAILS when the code is wrong.
This script puts one realistic bug ("mutant") into the app at a time, runs the
Vitest suite, and reports whether at least one test caught it. Every file is
restored byte-for-byte afterwards.

    python scripts/mutation-check.py        (about 3 minutes)

Each mutant is a bug that really happened in this project or is a classic
mistake (off-by-one, missing guard, wrong parent pointer).
"""
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

MUTANTS = [
    ("Merge commit loses its second parent", "src/utils/gitEngine.ts",
     "parents: [target.targetCommitId, source.targetCommitId],", "parents: [target.targetCommitId],"),
    ("Direct commits to protected main allowed", "src/hooks/useGitSimulator.ts",
     "if (isProtected(gitState.activeBranch)) {", "if (false && isProtected(gitState.activeBranch)) {"),
    ("Pipeline does not stop at a failing stage", "src/hooks/usePipelineSimulator.ts",
     "setPipelineRun({ ...run, stages: [...stages] })\n        break", "setPipelineRun({ ...run, stages: [...stages] })"),
    ("CI status read from the last run, not per commit (the old PR bypass)", "src/hooks/usePipelineSimulator.ts",
     "resultsByCommit[commitHash] ?? 'idle'", "Object.values(resultsByCommit).at(-1) ?? 'idle'"),
    ("Feature branches deploy to production", "src/utils/pipelineEngine.ts",
     "return branch === 'main'", "return true"),
    ("Off-by-one at a level boundary", "src/utils/trophies.ts",
     "findLastIndex((l) => xp >= l.from)", "findLastIndex((l) => xp > l.from)"),
    ("Terminal echoes commands twice", "src/App.tsx",
     "return git.commit(cmd.message, { echo: false })", "return git.commit(cmd.message)"),
    ("Tour choice only saved on 'Skip tour'", "src/components/TutorialModal.tsx",
     "setTutorialSeen(checked)", "void checked"),
    ("Branch names with spaces accepted", "src/utils/gitEngine.ts",
     "if (/\\s/.test(name)) return 'Branch names cannot contain spaces.'", ""),
    ("A trophy can be awarded twice", "src/utils/trophies.ts",
     "if (state.unlockedIds.includes(trophyId)) {", "if (false) {"),
]


def main() -> int:
    caught = 0
    for name, rel, old, new in MUTANTS:
        path = ROOT / rel
        original = path.read_bytes()  # bytes: keeps CRLF/LF exactly as it was
        text = original.decode("utf-8").replace("\r\n", "\n")
        if text.count(old) != 1:
            print(f"SETUP ERROR  {name}: pattern found {text.count(old)}x in {rel}")
            continue
        mutated = text.replace(old, new)
        if b"\r\n" in original:
            mutated = mutated.replace("\n", "\r\n")
        path.write_bytes(mutated.encode("utf-8"))
        try:
            out = subprocess.run("npx vitest run --reporter=dot", shell=True, cwd=ROOT,
                                 capture_output=True, text=True, encoding="utf-8", errors="replace").stdout
        finally:
            path.write_bytes(original)
        match = re.search(r"Tests\s+(\d+) failed", out)
        failed = int(match.group(1)) if match else 0
        caught += failed > 0
        print(f"{'CAUGHT' if failed else 'MISSED'}  {failed:>2} failing test(s)  {name}")
    print(f"\n{caught}/{len(MUTANTS)} bugs caught by the test suite")
    return 0 if caught == len(MUTANTS) else 1


if __name__ == "__main__":
    sys.exit(main())
