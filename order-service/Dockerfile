FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && pip install --no-cache-dir -r requirements.txt \
    && apt-get purge -y --auto-remove build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY . .
EXPOSE 3003
CMD ["gunicorn", "-c", "gunicorn.conf.py", "--bind", "0.0.0.0:3003", "--log-level", "debug", "app:app"]
