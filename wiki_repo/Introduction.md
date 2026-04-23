# Introduction

## Background of the project
Disinformation campaigns and botnets have evolved to use Large Language Models (LLMs) to automatically generate highly convincing narratives at scale.

## Motivation
Traditional network-packet SIEMs are ineffective against semantic threats. There's a need for a deep learning approach to analyze the text itself.

## Existing system (if any)
Current systems rely on binary classifiers (AI vs. Human) which lack explainability or the ability to attribute the exact model (e.g. GPT-4, Claude).

## Limitations of existing systems
- Black box nature (lack of explainability)
- Inability to remember past campaigns
- Easily bypassed using adversarial obfuscation

## Proposed solution
Aegis-G: A multi-agent framework utilizing locally run fine-tuned Transformers, SHAP explainability, and vector-database institutional memory.
