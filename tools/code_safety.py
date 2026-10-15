"""
AST-based static code safety scanner for custom Manim scenes, equations, and Python scripts.

Adapted from OpenMontage's math_animate.py security scanner.
Ensures caller-supplied scene code or math scripts execute safely without spawning
subprocesses, initiating network calls, or modifying runtime globals.
"""

from __future__ import annotations
import ast
from pathlib import Path
from typing import List, Tuple

_BLOCKED_IMPORTS = frozenset({
    "os", "sys", "subprocess", "socket", "shutil", "requests", "urllib",
    "http", "ftplib", "smtplib", "telnetlib", "ctypes", "pickle", "marshal",
    "importlib", "builtins", "multiprocessing", "threading", "pty", "glob",
    "resource", "signal", "tempfile", "webbrowser",
})

_BLOCKED_NAMES = frozenset({
    "eval", "exec", "compile", "__import__", "input", "breakpoint",
    "__builtins__", "__loader__", "globals", "locals", "vars",
})

_ALLOWED_DUNDER_ATTRS = frozenset({"__init__", "__name__", "__doc__"})


def _is_blocked_dunder(attr: str) -> bool:
    return (
        attr.startswith("__")
        and attr.endswith("__")
        and attr not in _ALLOWED_DUNDER_ATTRS
    )


def scan_python_safety(code: str, filename: str = "<source>") -> Tuple[bool, List[str]]:
    """Scan Python code for blocked imports, dangerous builtins, and dunder reflection.

    Args:
        code: Python source code string.
        filename: Optional filename label for error reporting.

    Returns:
        (is_safe, list_of_violations)
    """
    try:
        tree = ast.parse(code, filename=filename)
    except SyntaxError as e:
        return False, [f"SyntaxError at line {e.lineno}: {e.msg}"]

    violations = []
    for node in ast.walk(tree):
        # 1. Imports
        if isinstance(node, ast.Import):
            for alias in node.names:
                root_module = alias.name.split(".")[0]
                if root_module in _BLOCKED_IMPORTS:
                    violations.append(
                        f"Line {node.lineno}: Blocked import '{alias.name}'. Unsafe module in animation sandbox."
                    )
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                root_module = node.module.split(".")[0]
                if root_module in _BLOCKED_IMPORTS:
                    violations.append(
                        f"Line {node.lineno}: Blocked from-import '{node.module}'. Unsafe module in animation sandbox."
                    )

        # 2. Blocked identifiers (e.g. eval, exec, globals)
        elif isinstance(node, ast.Name):
            if node.id in _BLOCKED_NAMES:
                violations.append(
                    f"Line {node.lineno}: Dangerous built-in '{node.id}' is blocked."
                )

        # 3. Dunder attribute access reflection
        elif isinstance(node, ast.Attribute):
            if _is_blocked_dunder(node.attr):
                violations.append(
                    f"Line {node.lineno}: Reflection via dunder attribute '{node.attr}' is blocked."
                )

    is_safe = len(violations) == 0
    return is_safe, violations


def scan_file_safety(file_path: str | Path) -> Tuple[bool, List[str]]:
    """Scans a Python file for safety."""
    p = Path(file_path)
    if not p.exists():
        return False, [f"File not found: {p}"]
    return scan_python_safety(p.read_text(encoding="utf-8"), filename=p.name)
