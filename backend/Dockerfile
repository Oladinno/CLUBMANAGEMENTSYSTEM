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
COPY requirements.txt* ./
COPY . /tmp/src/
RUN if [ -f "requirements.txt" ]; then \
        pip install --no-cache-dir -r requirements.txt; \
    elif [ -f "/tmp/src/backend/requirements.txt" ]; then \
        pip install --no-cache-dir -r /tmp/src/backend/requirements.txt; \
    fi && \
    if [ -d "/tmp/src/backend" ]; then \
        cp -r /tmp/src/backend /app/backend; \
    else \
        mkdir -p /app/backend && cp -r /tmp/src/* /app/backend/; \
    fi && rm -rf /tmp/src

EXPOSE 8000

# Wait for MySQL to be ready, then seed and start the server
CMD ["sh", "-c", "\
    echo 'Waiting for database...' && \
    python -c \"\
import os, time, sys;\
url = os.environ.get('DATABASE_URL','');\
if not url: sys.exit(0);\
import re;\
m = re.match(r'mysql[+a-z]*://([^:]+):([^@]+)@([^:/]+):?(\\d*)/.*', url);\
if not m: sys.exit(0);\
user,pw,host,port = m.groups(); port = port or '3306';\
import socket;\
deadline = time.time()+60;\
while time.time()<deadline:\
    try: s=socket.create_connection((host,int(port)),3); s.close(); print('DB reachable'); break\
    except: print('DB not ready, retrying...'); time.sleep(3)\
\" && \
    python /app/backend/seed.py || true && \
    uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
