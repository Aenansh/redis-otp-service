# Redis OTP Service

A small Node.js service for generating and verifying one-time passwords (OTPs). It uses Express for the HTTP API, Redis for short-lived OTP storage and rate limiting, and BullMQ workers for background delivery jobs.

## Features

- Generate 6-digit OTPs for email or phone identifiers.
- Store OTPs in Redis with a 3-minute expiry.
- Limit OTP generation attempts per identifier.
- Limit verification attempts per identifier.
- Send email OTPs through Gmail SMTP using Nodemailer.
- Send phone OTPs through Fast2SMS.
- Queue email and SMS delivery work with BullMQ workers.

> MongoDB is not used by the current API. OTPs, generation counts, verification attempts, and temporary blocks are all stored in Redis.

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
|   |   |-- otp.util.js
|   |   `-- sms.util.js
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
- A Fast2SMS API key for phone OTP delivery

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

FAST_SMS_API_KEY=your-fast2sms-api-key
FAST_SMS_URL=https://www.fast2sms.com/dev/bulkV2
```

Notes:

- `REDIS_URI` is used by the direct Redis client.
- `REDIS_HOST` and `REDIS_PORT` are used by BullMQ queues and workers.
- `ATTEMPTS_ALLOWED` controls verification attempts per identifier.
- `GENERATIONS_ALLOWED` controls OTP generation requests per identifier.
- `GMAIL_USER` and `GMAIL_APP_PASSWORD` are required for email OTPs.
- `FAST_SMS_API_KEY` and `FAST_SMS_URL` are required for phone OTPs.
- MongoDB-related environment variables are not required because the service does not connect to MongoDB.

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

## SMS Delivery

Phone OTPs use the `phone` method and are sent through the `sms_queue` BullMQ worker. The worker calls `otpSms` in `server/utils/sms.util.js`, which posts to Fast2SMS with this payload:

```json
{
  "route": "q",
  "message": "Your verification code is <otp>. Do not share this code.",
  "numbers": "<phone-number>"
}
```

The phone number must be a valid 10-digit Indian mobile number starting with `6`, `7`, `8`, or `9`.

Send a phone OTP:

```bash
curl -X POST http://localhost:3000/api/v1/otp \
  -H "Content-Type: application/json" \
  -d "{\"identifier\":\"9876543210\",\"method\":\"phone\"}"
```

## MongoDB

MongoDB is not part of the active runtime for this service. The current `server/docker-compose.yml` starts Redis only, and the server code has no MongoDB client, Mongoose models, or MongoDB connection setup.

If persistence is added later, MongoDB could be used for audit logs, user records, or OTP delivery history, but short-lived OTP verification currently depends on Redis expiry semantics.

## Development Notes

- Email delivery is handled in `server/worker.js` through `email_queue`.
- SMS delivery is handled in `server/worker.js` through `sms_queue` and `server/utils/sms.util.js`.
- `server/docker-compose.yml` defines Redis only.
- There are no tests configured yet.
