FROM python:3.12-slim

WORKDIR /app

# Install dependencies first (Docker layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Cloud Run injects PORT env var (default 8080)
ENV PORT=8080

EXPOSE 8080

# Start uvicorn on Cloud Run's PORT
CMD exec uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1
