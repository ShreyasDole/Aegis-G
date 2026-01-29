# 🛡️ Aegis-G Base Scaffold

This is the **Base Scaffold** for testing infrastructure. It contains **no AI logic, no Graph theory, and no complex security yet**.

It is strictly designed to test:

- ✅ **Docker Orchestration** (Backend + Frontend + DB starting together)
- ✅ **FastAPI Connectivity** (Can the API start?)
- ✅ **Frontend-Backend Communication** (Can Next.js fetch data from Python?)
- ✅ **Database Connection** (Can Python talk to Postgres?)

## 📂 Directory Structure

```
.
├── app/                    # FastAPI Backend
│   ├── main_base.py       # Simplified entry point
│   ├── Dockerfile         # Backend container
│   ├── requirements_base.txt
│   └── routers/
│       └── system.py      # Simple health check router
│
├── frontend/              # Next.js Frontend
│   ├── Dockerfile         # Frontend container
│   ├── package.json
│   └── src/
│       └── app/
│           ├── page.tsx   # Landing page with connectivity test
│           └── layout_base.tsx
│
├── docker-compose.yml     # Orchestrates all services
└── .env                   # Environment variables
```

## 🚀 How to Run the Base Scaffold

### Step 1: Prepare the Environment

Make sure you have the base files in place:

- `app/main_base.py` (or rename `main.py` temporarily)
- `app/requirements_base.txt` (or use simplified requirements)
- `docker-compose.yml` at root

### Step 2: Build the Containers

```bash
docker-compose build
```

### Step 3: Start the Systems

```bash
docker-compose up
```

### Step 4: Verify

1. Go to **http://localhost:3000**
2. You should see a dark screen that says **"Aegis-G Command Center"**
3. Wait 2 seconds
4. The **"Backend Connection"** text should turn **Green** and show **"Connected ✅"**
5. The **"RAW API RESPONSE"** box should show:
   ```json
   {
     "message": "Aegis-G API is Online",
     "status": "active"
   }
   ```

## ✅ Success Criteria

If you see the **Green Connected sign**, your Full-Stack architecture is valid and ready for AI logic implementation.

## 🔄 Switching Between Base and Full Version

### To Use Base Scaffold:
1. Rename `app/main.py` to `app/main_full.py`
2. Rename `app/main_base.py` to `app/main.py`
3. Update `app/requirements.txt` to use `requirements_base.txt` content
4. Use root `docker-compose.yml`

### To Use Full Version:
1. Restore `app/main.py` from `app/main_full.py`
2. Use `deployment/docker-compose.yml` with `make up`

## 📝 Notes

- This scaffold uses simplified Dockerfiles for faster builds
- No Neo4j or complex services - just Postgres, FastAPI, and Next.js
- Perfect for initial infrastructure validation before adding AI features

