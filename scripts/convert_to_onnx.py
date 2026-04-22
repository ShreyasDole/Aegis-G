# convert_to_onnx.py
# This script converts the local DeBERTa attribution model to ONNX format for air‑gap inference.
# It assumes the fine‑tuned model is located at ./models/deberta-attribution (a HuggingFace directory).

import os
import torch
from transformers import AutoModelForSequenceClassification

def main():
    model_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models", "deberta-attribution"))
    if not os.path.isdir(model_dir):
        raise FileNotFoundError(f"Model directory not found: {model_dir}")
    model = AutoModelForSequenceClassification.from_pretrained(model_dir)
    dummy_input = torch.randn(1, model.config.max_position_embeddings, dtype=torch.float32)
    # Use torch.onnx.export
    onnx_path = os.path.join(model_dir, "model.onnx")
    torch.onnx.export(
        model,
        (dummy_input,),
        onnx_path,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["logits"],
        dynamic_axes={"input": {0: "batch_size"}, "logits": {0: "batch_size"}},
    )
    print(f"ONNX model saved to {onnx_path}")

if __name__ == "__main__":
    main()
