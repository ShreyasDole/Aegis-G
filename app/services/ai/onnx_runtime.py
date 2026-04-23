# app/services/ai/onnx_runtime.py
"""ONNX Runtime wrapper for the DeBERTa attribution model.

The model is exported to ONNX by ``scripts/convert_to_onnx.py`` and stored as
``models/deberta-attribution/model.onnx``. This wrapper loads the ONNX model once
and provides a fast ``predict`` method that returns class probabilities.
"""

import os
from pathlib import Path
import numpy as np

# Optional heavy deps – wrap in try/except
try:
    import onnxruntime as ort
    _ORT_AVAILABLE = True
except ImportError:  # pragma: no cover
    _ORT_AVAILABLE = False
    ort = None  # type: ignore

try:
    from transformers import AutoTokenizer
    _TOKENIZER_AVAILABLE = True
except ImportError:  # pragma: no cover
    _TOKENIZER_AVAILABLE = False
    class AutoTokenizer:  # type: ignore
        @staticmethod
        def from_pretrained(*_args, **_kwargs):
            raise ImportError("transformers not installed – tokenizer unavailable")

class ONNXAttributor:
    """Lightweight inference using ONNX Runtime.

    The class is thread‑safe and can be instantiated as a singleton.
    """

    _model_path: Path = Path(__file__).resolve().parents[2] / "models" / "deberta-attribution" / "model.onnx"
    _session: object | None = None  # ort.InferenceSession when available
    _tokenizer: object | None = None  # AutoTokenizer when available

    def __init__(self):
        if not self._model_path.is_file():
            raise FileNotFoundError(f"ONNX model not found at {self._model_path}")
        if not _ORT_AVAILABLE:
            raise ImportError("onnxruntime not installed – ONNX inference unavailable")
        # Load ONNX session with CPU execution provider (air‑gap safe)
        self._session = ort.InferenceSession(str(self._model_path), providers=["CPUExecutionProvider"])
        if not _TOKENIZER_AVAILABLE:
            raise ImportError("transformers not installed – tokenizer unavailable for ONNX path")
        # Load the same tokenizer used during training
        self._tokenizer = AutoTokenizer.from_pretrained(str(self._model_path.parent))

    def _prepare_input(self, text: str) -> dict:
        inputs = self._tokenizer(text, return_tensors="np", truncation=True, max_length=512)
        # Convert torch tensors to numpy arrays for ONNX
        return {k: v.astype(np.int64) for k, v in inputs.items()}

    def predict(self, text: str) -> dict:
        """Return class probabilities for *text* using the ONNX model.

        If the heavy dependencies are missing, return a neutral distribution.
        """
        if not _ORT_AVAILABLE or not _TOKENIZER_AVAILABLE:
            # Neutral fallback – all classes equally likely
            return {"gpt-4": 0.25, "claude-3": 0.25, "llama-3": 0.25, "human": 0.25}
        if self._session is None or self._tokenizer is None:
            raise RuntimeError("ONNX session not initialized")
        ort_inputs = self._prepare_input(text)
        logits = self._session.run(["logits"], ort_inputs)[0]
        # Softmax implementation (numerically stable)
        probs = np.exp(logits - np.max(logits, axis=1, keepdims=True))
        probs = probs / probs.sum(axis=1, keepdims=True)
        class_names = ["gpt-4", "claude-3", "llama-3", "human"]
        return {name: float(probs[0, i]) for i, name in enumerate(class_names)}
