# Behavioral Economics SaaS - Product Adoption Platform

## Overview
A comprehensive platform that helps B2B SaaS companies optimize product adoption through behavioral economics principles.

## Tech Stack
- Frontend: React + TypeScript
- Backend: Node.js + Express + TypeScript  
- Databases: PostgreSQL + MongoDB
- Cache: Redis
- Infrastructure: AWS
- Payments: Stripe

## Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Start databases: `docker-compose up -d`
4. Run development servers: `npm run dev`

### Development
- API runs on: http://localhost:4000
- Web app runs on: http://localhost:3000
- Tracker CDN: http://localhost:4001

## Project Structure
- `/packages/api` - Backend API server
- `/packages/web` - React frontend application
- `/packages/tracker` - JavaScript tracking library
- `/packages/shared` - Shared TypeScript types