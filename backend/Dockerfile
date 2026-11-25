FROM python:3.11-slim

WORKDIR /app

# Install system build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Set Python environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Copy requirements and install
# Supports both root context (backend/requirements.txt) and subfolder context (requirements.txt)
COPY requirements.txt* backend/requirements.txt* ./
RUN if [ -f "requirements.txt" ]; then \
        pip install --no-cache-dir -r requirements.txt; \
    else \
        pip install --no-cache-dir -r backend/requirements.txt; \
    fi

# Copy application source code
# Creates /app/backend/ regardless of whether build context is repo root or /backend folder
COPY . /tmp/src/
RUN if [ -d "/tmp/src/backend" ]; then \
        cp -r /tmp/src/backend /app/backend; \
    else \
        mkdir -p /app/backend && cp -r /tmp/src/* /app/backend/; \
    fi && rm -rf /tmp/src

EXPOSE 8000

# Start Uvicorn bound to Railway dynamic PORT (default 8000)
CMD ["sh", "-c", "python /app/backend/seed.py || true; uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
