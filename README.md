# Redis OTP Service

A small Node.js service for generating and verifying one-time passwords (OTPs). It uses Express for the HTTP API, Redis for short-lived OTP storage and rate limiting, and BullMQ workers for background delivery jobs.

## Features

- Generate 6-digit OTPs for email or phone identifiers.
- Store OTPs in Redis with a 3-minute expiry.
- Limit OTP generation attempts per identifier.
- Limit verification attempts per identifier.
- Send email OTPs through Gmail SMTP using Nodemailer.
- Queue email and SMS delivery work with BullMQ.

> SMS delivery is currently a placeholder in `server/worker.js`; phone OTPs are queued, but no SMS provider is wired up yet.

## Project Structure

```text
.
|-- client/
|-- server/
|   |-- config/
|   |   `-- redis.config.js
|   |-- controllers/
|   |   `-- otp.controllers.js
|   |-- routes/
|   |   `-- otp.routes.js
|   |-- utils/
|   |   |-- email.util.js
|   |   `-- otp.util.js
|   |-- docker-compose.yml
|   |-- index.js
|   |-- producer.js
|   |-- worker.js
|   `-- package.json
`-- README.md
```

## Requirements

- Node.js 18 or newer
- npm
- Docker, if you want to run Redis through Docker Compose
- A Gmail account with an app password for email delivery

## Environment Variables

Create `server/.env.local`:

```env
PORT=3000
SERVER_URI=http://localhost:

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URI=redis://localhost:

ATTEMPTS_ALLOWED=5
GENERATIONS_ALLOWED=3

GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
```

Notes:

- `REDIS_URI` is used by the direct Redis client.
- `REDIS_HOST` and `REDIS_PORT` are used by BullMQ queues and workers.
- `ATTEMPTS_ALLOWED` controls verification attempts per identifier.
- `GENERATIONS_ALLOWED` controls OTP generation requests per identifier.

## Setup

Install server dependencies:

```bash
cd server
npm install
```

Start Redis:

```bash
docker compose up -d redis
```

Start the API server:

```bash
npm run dev
```

In a second terminal, start the BullMQ worker:

```bash
cd server
node worker.js
```

The API will run at:

```text
http://localhost:3000
```

## API

### Send OTP

```http
POST /api/v1/otp
Content-Type: application/json
```

Email request:

```json
{
  "identifier": "user@example.com",
  "method": "email"
}
```

Phone request:

```json
{
  "identifier": "9876543210",
  "method": "phone"
}
```

Success response:

```json
{
  "message": "OTP sent!",
  "success": true
}
```

### Verify OTP

```http
POST /api/v1/otp/verify
Content-Type: application/json
```

Request:

```json
{
  "identifier": "user@example.com",
  "otp": "123456"
}
```

Success response:

```json
{
  "message": "Correct OTP, you can enter.",
  "success": true
}
```

## Example curl Commands

Send an email OTP:

```bash
curl -X POST http://localhost:3000/api/v1/otp \
  -H "Content-Type: application/json" \
  -d "{\"identifier\":\"user@example.com\",\"method\":\"email\"}"
```

Verify an OTP:

```bash
curl -X POST http://localhost:3000/api/v1/otp/verify \
  -H "Content-Type: application/json" \
  -d "{\"identifier\":\"user@example.com\",\"otp\":\"123456\"}"
```

## Redis Keys

The service uses these Redis key patterns:

- `otp:{identifier}` stores the OTP for 180 seconds.
- `otp:{identifier}:generated` counts OTP generation requests.
- `otp:{identifier}:attempts` counts verification attempts.
- `otp:{identifier}:blocked:generated` blocks excessive generation.
- `otp:{identifier}:blocked:attempts` blocks excessive verification attempts.

## Development Notes

- Email delivery is handled in `server/worker.js` through `email_queue`.
- SMS jobs are added to `sms_queue`, but the worker does not send SMS yet.
- `server/docker-compose.yml` also defines MongoDB, but the current API does not use MongoDB.
- There are no tests configured yet.
