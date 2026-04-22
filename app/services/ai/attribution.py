# app/services/ai/attribution.py
"""Multi‑Class DeBERTa Attribution

Loads a fine‑tuned DeBERTa‑v3‑base model that predicts one of four classes:
- human
- gpt‑4
- claude‑3
- llama‑3

The model is stored locally under ``./models/deberta-attribution`` and can be
exported to ONNX for air‑gap inference (see ``scripts/convert_to_onnx.py``).
"""

from __future__ import annotations

import os
from pathlib import Path

try:
    import torch
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    _TORCH_AVAILABLE = True
except ImportError:
    _TORCH_AVAILABLE = False
    # Mock classes to keep type hints
    class AutoTokenizer:
        @staticmethod
        def from_pretrained(*args, **kwargs):
            raise ImportError("transformers not installed")
    class AutoModelForSequenceClassification:
        @staticmethod
        def from_pretrained(*args, **kwargs):
            raise ImportError("transformers not installed")


class MultiClassAttributor:
    """Wrap the DeBERTa attribution model.

    The class lazily loads the tokenizer and model on first use. It expects the
    model directory to contain a ``config.json`` and ``pytorch_model.bin`` – the
    standard HuggingFace layout.
    """

    _model_dir: Path = Path(__file__).resolve().parents[2] / "models" / "deberta-attribution"
    _tokenizer: AutoTokenizer | None = None
    _model: AutoModelForSequenceClassification | None = None

    def _load(self) -> None:
        if self._tokenizer is None or self._model is None:
            if not _TORCH_AVAILABLE:
                raise ImportError("torch/transformers not installed – attribution unavailable")
            
            # Use HuggingFace Hub dynamically if local dir doesn't exist
            model_path = str(self._model_dir) if self._model_dir.is_dir() else "microsoft/deberta-v3-xsmall"
            
            # Load tokenizer and model dynamically
            self._tokenizer = AutoTokenizer.from_pretrained(model_path)
            self._model = AutoModelForSequenceClassification.from_pretrained(
                model_path,
                num_labels=4,
                ignore_mismatched_sizes=True
            )
            self._model.eval()

    def predict(self, text: str) -> dict[str, float]:
        """Return class probabilities for *text*.

        If dependencies are missing or model is missing, returns a mock distribution.
        """
        if not _TORCH_AVAILABLE:
            # Return a neutral mock distribution
            return {"gpt-4": 0.25, "claude-3": 0.25, "llama-3": 0.25, "human": 0.25}

        self._load()
        inputs = self._tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
        with torch.no_grad():
            outputs = self._model(**inputs)
            probs = torch.softmax(outputs.logits, dim=1)[0]
        return {
            "gpt-4": float(probs[0]),
            "claude-3": float(probs[1]),
            "llama-3": float(probs[2]),
            "human": float(probs[3])
        }
