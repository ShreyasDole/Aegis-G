# Implementation

## Project setup steps
1. Clone the repository.
2. Ensure Docker Desktop is running.
3. Execute `docker-compose up --build`.
4. Open `localhost:3000` to view the UI.

## Code structure
- `app/`: FastAPI Backend
- `frontend/`: Next.js Web UI
- `app/services/`: Agent logic & NLP

## Key code snippets 
```python
probabilities = torch.softmax(logits, dim=1)
max_prob = torch.max(probabilities, dim=1)[0].item()
```

## Repository Link
[Aegis-G Repository](https://github.com/ShreyasDole/Aegis-G)
