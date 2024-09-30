FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /server

# Install system dependencies
RUN apt-get update -y && \
    apt-get upgrade -y && \
    apt-get install -y wget build-essential checkinstall software-properties-common \
    libreadline-dev libncursesw5-dev libssl-dev libsqlite3-dev tk-dev \
    libgdbm-dev libc6-dev libbz2-dev libffi-dev zlib1g-dev curl pkg-config \
    libcairo2-dev libgirepository1.0-dev \
    python3.10 python3.10-venv python3-pip python3-dev build-essential gcc \
    libglib2.0-0 libsm6 libxext6 libxrender-dev libopencv-dev libcairo2-dev \
    libpangocairo-1.0-0 gir1.2-gtk-3.0 libpango-1.0-0 libatk1.0-0 && \
    rm -rf /var/lib/apt/lists/*


# Install Node.js and npm
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    node -v && npm -v

# Set up Python virtual environment and install dependencies
RUN python3.10 -m venv venv
COPY movement_detection/requirements-detection.txt .
RUN ./venv/bin/pip install --upgrade pip && \
    ./venv/bin/pip install -r requirements-detection.txt

# Copy package.json and package-lock.json
COPY package*.json .

# Install Node.js dependencies
RUN npm install

# Copy application files
COPY . .

# Expose required ports
EXPOSE 3001

CMD ["npm", "run", "dev"]
