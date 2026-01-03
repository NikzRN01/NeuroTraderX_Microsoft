# Backend (Flask)
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install Python dependencies
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend source
COPY . .

EXPOSE 5000

# Run Flask in a container-friendly way (bind to 0.0.0.0)
CMD ["flask", "--app", "app", "run", "--host=0.0.0.0", "--port=5000"]
