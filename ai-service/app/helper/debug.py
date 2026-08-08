from __future__ import annotations

import pprint

def debug_log(label: str, data: str | dict | list) -> None:
    """Pretty prints structured objects for debugging"""
    print(f"\n==== {label} ====")
    pprint.pprint(data, indent=2, width=120)