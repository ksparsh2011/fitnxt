# Deployment Guide — FitAI

## Free-Tier Deployment Strategy

The goal: deploy a production-ready app spending $0/month until you have real users, then scale cost-efficiently.

---

## Option A: GCP (Recommended) — $0/month

### Why GCP over AWS for this stack

- Cloud Run free tier is **more generous** than AWS Lambda for containerized workloads
- GCP's Artifact Registry is free up to 500MB (stores Docker images)
- You already know GCP/GKE from NIQ — same console, same CLI
- Cloud Run cold starts are faster than Lambda for NestJS (~400ms vs ~800ms)

### Services used

| Service | Free tier | What it runs |
|---|---|---|
| Cloud Run | 2M requests/month, 360K CPU-seconds | NestJS API |
| Vercel (not GCP) | Unlimited for personal projects | Next.js frontend |
| Supabase | 500MB PostgreSQL, 50K MAU auth | Database + Auth |
| Upstash Redis | 10K commands/day free | Cache + BullMQ |
| Cloudflare R2 | 10GB storage, 1M Class A ops | Photo storage |
| Cloudflare Workers | 100K requests/day | Optional: Edge CDN |

**Total cost at 0–100 users: $0/month**

### Step-by-step GCP setup

```bash
# 1. Create GCP project
gcloud projects create fitai-prod --name="FitAI"
gcloud config set project fitai-prod

# 2. Enable required APIs
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com

# 3. Create Artifact Registry repo for Docker images
gcloud artifacts repositories create fitai \
  --repository-format=docker \
  --location=asia-south1 \      # Mumbai — lowest latency from Pune
  --description="FitAI Docker images"

# 4. Store secrets in Secret Manager (never in env files)
echo -n "your-anthropic-key" | gcloud secrets create ANTHROPIC_API_KEY \
  --data-file=-
echo -n "your-db-url" | gcloud secrets create DATABASE_URL \
  --data-file=-

# 5. Create Cloud Run service
gcloud run deploy fitai-api \
  --image asia-south1-docker.pkg.dev/fitai-prod/fitai/api:latest \
  --region asia-south1 \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 0 \           # scale to zero when no traffic
  --max-instances 5 \
  --memory 512Mi \
  --cpu 1 \
  --set-secrets "ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest,DATABASE_URL=DATABASE_URL:latest"
```

### GitHub Actions CI/CD pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with: { version: 9 }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter api run test:ci
      - run: pnpm --filter api run lint
      - uses: SonarSource/sonarcloud-github-action@master   # free for public repos
        env: { GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}', SONAR_TOKEN: '${{ secrets.SONAR_TOKEN }}' }

  deploy-api:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write                          # for GCP OIDC auth (no long-lived keys)
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: '${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}'
          service_account: '${{ secrets.GCP_SERVICE_ACCOUNT }}'
      - uses: google-github-actions/setup-gcloud@v2
      - name: Build and push Docker image
        run: |
          gcloud auth configure-docker asia-south1-docker.pkg.dev
          docker build -t asia-south1-docker.pkg.dev/fitai-prod/fitai/api:${{ github.sha }} \
            -f apps/api/Dockerfile .
          docker push asia-south1-docker.pkg.dev/fitai-prod/fitai/api:${{ github.sha }}
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy fitai-api \
            --image asia-south1-docker.pkg.dev/fitai-prod/fitai/api:${{ github.sha }} \
            --region asia-south1

  deploy-web:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: '${{ secrets.VERCEL_TOKEN }}'
          vercel-org-id: '${{ secrets.VERCEL_ORG_ID }}'
          vercel-project-id: '${{ secrets.VERCEL_PROJECT_ID }}'
          vercel-args: '--prod'
```

### Docker setup (multi-stage, optimized)

```dockerfile
# apps/api/Dockerfile
FROM node:20-alpine AS base
RUN corepack enable pnpm

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY libs/shared/package.json libs/shared/
RUN pnpm install --frozen-lockfile --prod

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter api run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json .

USER nestjs
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

---

## Option B: AWS Free Tier — $0 for 12 months

Good if you want to demonstrate AWS knowledge on your resume.

| Service | Free tier | Purpose |
|---|---|---|
| EC2 t2.micro | 750 hours/month (1 year) | Run both API + web |
| RDS PostgreSQL t2.micro | 750 hours/month (1 year) | Database |
| S3 | 5GB storage, 20K GET | Photo storage |
| ElastiCache | Not free | Use Upstash Redis instead |
| ECR | 500MB free | Docker images |
| Lambda | 1M requests/month forever | Optional: background jobs |

**Limitation:** After 12 months, EC2 t2.micro costs ~$8/month. Plan migration to GCP Cloud Run (scale-to-zero) before free tier expires.

### AWS deployment with ECS Fargate Spot

```bash
# Creates a Fargate task with Spot pricing (70% cheaper than on-demand)
# Recommended over EC2 for containerized workloads

aws ecs create-cluster --cluster-name fitai-prod

aws ecs register-task-definition \
  --family fitai-api \
  --requires-compatibilities FARGATE \
  --network-mode awsvpc \
  --cpu 256 --memory 512 \
  --container-definitions '[{
    "name": "fitai-api",
    "image": "<ECR_URI>:latest",
    "portMappings": [{ "containerPort": 3001 }],
    "secrets": [
      { "name": "ANTHROPIC_API_KEY", "valueFrom": "arn:aws:ssm:..." },
      { "name": "DATABASE_URL", "valueFrom": "arn:aws:ssm:..." }
    ]
  }]'
```

---

## Option C: Budget Production Stack — ~$10/month

When you want more reliability and predictability than free tiers:

| Service | Cost |
|---|---|
| Railway (API + worker) | $5/month |
| Supabase Pro | $25/month (or stay on free) |
| Upstash Redis | $0–5/month |
| Cloudflare R2 | $0–2/month |
| Vercel (web) | $0 |

Railway gives you: zero-config Docker deployment, built-in PostgreSQL option, private networking between services, automatic SSL, no cold starts. Best developer experience of any platform.

---

## Play Store Deployment (TWA)

Trusted Web Activity lets you publish your PWA to Google Play with no extra code.

### Prerequisites
1. PWA must score 100 on Lighthouse PWA audit
2. Must have a valid HTTPS domain
3. `assetlinks.json` must be hosted at `https://yourdomain.com/.well-known/assetlinks.json`

### Step-by-step

```bash
# Install Bubblewrap CLI (Google's official TWA tool)
npm install -g @bubblewrap/cli

# Initialize TWA project from your PWA manifest
bubblewrap init --manifest https://fitai.app/manifest.json

# This generates:
# - Android Studio project
# - build.gradle with your app config
# - signing key setup wizard

# Build signed APK
bubblewrap build
# Output: app/build/outputs/apk/release/app-release.apk

# Or build AAB (required by Play Store for new apps)
bubblewrap build --skipPwaValidation
```

### PWA requirements for Play Store

```typescript
// apps/web/public/manifest.json
{
  "name": "FitAI — AI Personal Trainer",
  "short_name": "FitAI",
  "description": "AI-powered fitness coach that learns your body",
  "start_url": "/",
  "display": "standalone",         // hides browser chrome — feels native
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#0F172A",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable.png", "sizes": "512x512", "type": "image/png",
      "purpose": "maskable" }
  ],
  "shortcuts": [
    {
      "name": "Today's Workout",
      "url": "/today",
      "icons": [{ "src": "/icons/workout-96.png", "sizes": "96x96" }]
    },
    {
      "name": "Log Meal",
      "url": "/nutrition/log",
      "icons": [{ "src": "/icons/meal-96.png", "sizes": "96x96" }]
    }
  ]
}
```

### Google Play Console setup

1. Create developer account ($25 one-time fee)
2. Create new app → Android → Free
3. Upload AAB (App Bundle)
4. Fill store listing: description, screenshots (at least 2), feature graphic
5. Set content rating (everyone)
6. Submit for review (~3–7 days)

**App ID:** `com.fitai.app`
**Min Android version:** 8.0 (API 26) — covers 95%+ of Android devices

---

## Environment Variables

```bash
# apps/api/.env.example

# App
NODE_ENV=production
PORT=3001
API_BASE_URL=https://api.fitai.app

# Database
DATABASE_URL=postgresql://user:pass@host:5432/fitai
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL=redis://default:pass@host:6379

# Auth
JWT_SECRET=<min-64-char-random-string>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d
JWKS_URI=https://fitai.app/.well-known/jwks.json

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-5-sonnet-20241022
CLAUDE_MAX_TOKENS=4096

# Storage
STORAGE_PROVIDER=gcs           # 'gcs' | 's3' | 'r2'
GCS_BUCKET=fitai-media-prod
GCS_PROJECT=fitai-prod

# Monitoring
SENTRY_DSN=https://...
OTEL_ENDPOINT=https://...

# CORS
CORS_ORIGINS=https://fitai.app,https://www.fitai.app
```

---

## Monitoring and Observability

### What to monitor (same as your NIQ setup)

```typescript
// Prometheus metrics exposed at GET /metrics
// Key metrics to track:

// 1. API latency by route
http_request_duration_ms{method, route, status_code}

// 2. Claude API calls — cost control
claude_api_calls_total{type}          // 'chat' | 'ocr' | 'plan_generation'
claude_tokens_used_total{layer}       // which context layer is consuming tokens
claude_prompt_cache_hits_total        // cache hit rate — should be >80%

// 3. BullMQ job queue depth
bullmq_queue_depth{queue}             // 'ocr' | 'plan-generation'
bullmq_job_duration_ms{queue, status}

// 4. Database connection pool
db_pool_size, db_pool_pending, db_query_duration_ms{operation}

// 5. Business metrics (custom)
fitai_active_sessions_total           // users currently in gym
fitai_workouts_completed_total        // daily completions
fitai_prs_achieved_total              // engagement signal
```

### Alerting (GCP Cloud Monitoring — free tier)

Alert on:
- API error rate > 1% for 5 minutes
- Claude API latency p95 > 3s
- OCR queue depth > 50 jobs
- Database connection pool utilization > 80%
