# Challenges & Limitations

## Problems faced during development
- Integrating heavy PyTorch dependencies into a lean Docker container.
- Getting type-safeties to align across the React UI and the Python schema.

## Limitations of the system
- Highly obfuscated inputs might still bypass the local tokenizer if not strictly matched.
- SHAP explanations are computationally expensive for very long documents.
