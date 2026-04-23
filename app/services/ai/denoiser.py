# app/services/ai/denoiser.py
"""Adversarial Denoising Shield

Provides a simple preprocessing step that normalises leetspeak, removes zero‑width characters
and any other trivial obfuscation before the text is fed to the classifier.

The class is deliberately lightweight – no external dependencies – so it works in air‑gap
environments.
"""

from __future__ import annotations

import re

class AdversarialDenoiser:
    """Normalize adversarial obfuscation in input text.

    - Leetspeak mapping (e.g. 0→o, 1→i, 3→e, ...)
    - Remove zero‑width spaces and BOM characters
    - Collapse repeated whitespace
    """

    _leet_map: dict[str, str] = {
        "0": "o",
        "1": "i",
        "2": "z",
        "3": "e",
        "4": "a",
        "5": "s",
        "6": "g",
        "7": "t",
        "8": "b",
        "9": "g",
        "@": "a",
        "$": "s",
        "!": "i",
        "%": "x",
    }

    _zero_width_regex = re.compile(r"[\u200b\ufeff]")

    def normalize(self, text: str) -> str:
        """Return a cleaned version of *text*.

        The method is deterministic and fast – suitable for high‑throughput pipelines.
        """
        # Lower‑case for case‑insensitive matching
        normalized = text.lower()
        # Replace leetspeak characters
        for leet, repl in self._leet_map.items():
            normalized = normalized.replace(leet, repl)
        # Strip zero‑width characters
        normalized = self._zero_width_regex.sub("", normalized)
        # Collapse whitespace
        normalized = re.sub(r"\s+", " ", normalized).strip()
        return normalized
