# CLAUDE.md - Starbidz Platform Development Guide

## Project Overview

Starbidz is a lightweight ad mediation platform that aggregates demand from multiple sources (GAM, Unity Ads, Fyber, OpenRTB DSPs) and serves ads through custom adapters for AppLovin MAX, AdMob, and LevelPlay.

### Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    STARBIDZ PLATFORM                             │
│                                                                  │
│  Dashboard (Next.js)     Server (Elysia/Bun)   Adapters          │
│  ├── Admin Portal        ├── Bid Engine       ├── Android       │
│  │   └── Demand Mgmt     ├── GAM Connector    │   ├── MAX       │
│  └── Publisher Portal    ├── Unity Connector  │   ├── AdMob     │
│      └── App/Unit Mgmt   ├── Fyber Connector  │   └── LevelPlay │
│                          └── OpenRTB          └── iOS           │
│                                                   ├── MAX       │
│                                                   ├── AdMob     │
│                                                   └── LevelPlay │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Timeline

### Phase 1: MVP Foundation (Dec 18 - Jan 8)

```
Week 1 (Dec 18-25):
├── [x] Project setup (monorepo, configs)
├── [ ] Dashboard: Next.js + Clerk + Prisma setup
├── [ ] Dashboard: Publisher CRUD (apps, ad units)
├── [ ] Bid Server: Elysia basic setup
└── [ ] Bid Server: POST /v1/bid endpoint (mock response)

Week 2 (Dec 26 - Jan 1):
├── [ ] Bid Server: GAM connector (first real demand)
├── [ ] Dashboard: Admin portal (demand source management)
├── [ ] Database: Seed data for testing
└── [ ] Integration: Dashboard ↔ Server connection

Week 3 (Jan 2-8):
├── [ ] Android: starbidz-core module
├── [ ] Android: starbidz-max adapter
├── [ ] Testing: End-to-end bid flow
└── [ ] Deploy: Vercel (dashboard) + Railway (server)
```

### Phase 2: Demand Expansion (Jan 9 - Jan 22)

```
├── [ ] Unity Ads connector
├── [ ] Fyber connector  
├── [ ] OpenRTB connector (generic DSP)
├── [ ] Android: AdMob adapter
├── [ ] Basic reporting (impressions, revenue)
└── [ ] iOS: Core SDK + MAX adapter
```

### Phase 3: Scale & Polish (Jan 23 - Feb 5)

```
├── [ ] Parallel bidding optimization
├── [ ] Redis caching (Upstash)
├── [ ] ClickHouse analytics (Tinybird)
├── [ ] iOS: AdMob + LevelPlay adapters
├── [ ] Documentation & sample apps
└── [ ] Production hardening
```

## Repository Structure

```
starbidz/
│
├── apps/
│   ├── dashboard/                 # Next.js 14 Dashboard
│   │   ├── app/
│   │   │   ├── (auth)/           # Authentication pages
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (publisher)/      # Publisher portal (protected)
│   │   │   │   ├── dashboard/    # Publisher home
│   │   │   │   ├── apps/         # App management
│   │   │   │   │   ├── page.tsx          # List apps
│   │   │   │   │   ├── new/page.tsx      # Create app
│   │   │   │   │   └── [appId]/
│   │   │   │   │       ├── page.tsx      # App detail
│   │   │   │   │       ├── units/        # Ad units
│   │   │   │   │       └── integrate/    # Integration guide
│   │   │   │   ├── reports/      # Reporting
│   │   │   │   └── settings/     # Publisher settings
│   │   │   ├── (admin)/          # Admin portal (protected)
│   │   │   │   ├── dashboard/    # Admin home
│   │   │   │   ├── demand/       # Demand management
│   │   │   │   │   ├── page.tsx          # All demand sources
│   │   │   │   │   ├── gam/              # GAM/MCM config
│   │   │   │   │   │   ├── page.tsx      # List GAM accounts
│   │   │   │   │   │   ├── new/          # Add account
│   │   │   │   │   │   └── [id]/         # Account detail + ad units
│   │   │   │   │   ├── unity/            # Unity Ads config
│   │   │   │   │   ├── fyber/            # Fyber config
│   │   │   │   │   └── ortb/             # OpenRTB DSPs
│   │   │   │   │       ├── page.tsx      # List DSPs
│   │   │   │   │       ├── new/          # Add DSP
│   │   │   │   │       └── [id]/         # DSP detail
│   │   │   │   ├── publishers/   # Publisher oversight
│   │   │   │   ├── reports/      # Global reports
│   │   │   │   └── system/       # System health
│   │   │   ├── api/              # API routes
│   │   │   │   ├── auth/
│   │   │   │   ├── apps/
│   │   │   │   ├── units/
│   │   │   │   ├── demand/
│   │   │   │   └── reports/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/               # shadcn/ui components
│   │   │   ├── forms/            # Form components
│   │   │   ├── tables/           # Data tables
│   │   │   └── charts/           # Chart components
│   │   ├── lib/
│   │   │   ├── db.ts             # Prisma client
│   │   │   ├── auth.ts           # Auth utilities
│   │   │   └── utils.ts          # Helper functions
│   │   ├── prisma/
│   │   │   ├── schema.prisma     # Database schema
│   │   │   └── seed.ts           # Seed data
│   │   ├── public/
│   │   ├── tailwind.config.ts
│   │   ├── next.config.js
│   │   └── package.json
│   │
│   └── server/                    # Elysia Bid Server (Bun)
│       ├── src/
│       │   ├── index.ts          # Server entry
│       │   ├── routes/
│       │   │   ├── bid.ts        # POST /v1/bid
│       │   │   ├── health.ts     # GET /health
│       │   │   └── events.ts     # POST /v1/events (tracking)
│       │   ├── connectors/
│       │   │   ├── base.ts       # Base connector interface
│       │   │   ├── gam.ts        # GAM/MCM connector
│       │   │   ├── unity.ts      # Unity Ads connector
│       │   │   ├── fyber.ts      # Fyber connector
│       │   │   └── ortb.ts       # OpenRTB connector
│       │   ├── auction/
│       │   │   └── engine.ts     # Unified auction logic
│       │   ├── cache/
│       │   │   └── redis.ts      # Redis caching (Upstash)
│       │   ├── tracking/
│       │   │   └── events.ts     # Event tracking
│       │   └── types/
│       │       ├── bid.ts        # Bid types
│       │       └── ortb.ts       # OpenRTB types
│       ├── package.json
│       └── tsconfig.json
│
├── adapters/
│   ├── android/
│   │   ├── starbidz-core/        # Core SDK module
│   │   │   ├── src/main/kotlin/io/starbidz/core/
│   │   │   │   ├── Starbidz.kt           # Main SDK class
│   │   │   │   ├── StarbidzAd.kt         # Ad response model
│   │   │   │   ├── StarbidzClient.kt     # HTTP client
│   │   │   │   └── StarbidConfig.kt      # Configuration
│   │   │   └── build.gradle.kts
│   │   ├── starbidz-max/         # AppLovin MAX adapter
│   │   │   ├── src/main/kotlin/io/starbidz/max/
│   │   │   │   ├── StarbidMediationAdapter.kt
│   │   │   │   ├── StarbidBannerAd.kt
│   │   │   │   ├── StarbidInterstitialAd.kt
│   │   │   │   └── StarbidRewardedAd.kt
│   │   │   └── build.gradle.kts
│   │   ├── starbidz-admob/       # AdMob adapter
│   │   │   ├── src/main/kotlin/io/starbidz/admob/
│   │   │   │   ├── StarbidCustomEvent.kt
│   │   │   │   ├── StarbidBannerCustomEvent.kt
│   │   │   │   ├── StarbidInterstitialCustomEvent.kt
│   │   │   │   └── StarbidRewardedCustomEvent.kt
│   │   │   └── build.gradle.kts
│   │   ├── starbidz-levelplay/   # LevelPlay adapter
│   │   │   └── src/main/kotlin/io/starbidz/levelplay/
│   │   ├── build.gradle.kts      # Root build file
│   │   ├── settings.gradle.kts
│   │   └── gradle.properties
│   │
│   └── ios/
│       ├── StarbidCore/          # Core SDK
│       │   ├── Sources/
│       │   │   ├── Starbidz.swift
│       │   │   ├── StarbidAd.swift
│       │   │   ├── StarbidClient.swift
│       │   │   └── StarbidConfig.swift
│       │   └── Package.swift
│       ├── StarbidMAX/           # MAX adapter
│       │   ├── Sources/
│       │   │   ├── StarbidMediationAdapter.swift
│       │   │   ├── StarbidBannerAd.swift
│       │   │   ├── StarbidInterstitialAd.swift
│       │   │   └── StarbidRewardedAd.swift
│       │   └── Package.swift
│       ├── StarbidAdMob/         # AdMob adapter
│       ├── StarbidLevelPlay/     # LevelPlay adapter
│       ├── Package.swift         # Umbrella package
│       └── Starbidz.podspec
│
├── docs/                          # Documentation
│   ├── integration/
│   │   ├── android-max.md
│   │   ├── android-admob.md
│   │   ├── ios-max.md
│   │   └── ios-admob.md
│   └── api/
│       └── bid-api.md
│
├── packages/
│   └── shared/                    # Shared types
│       ├── src/
│       │   ├── types.ts
│       │   └── constants.ts
│       └── package.json
│
├── .github/
│   └── workflows/
│       ├── dashboard.yml
│       ├── server.yml
│       └── adapters.yml
│
├── docker-compose.yml            # Local development
├── turbo.json                    # Turborepo config
├── package.json                  # Root package
├── pnpm-workspace.yaml
└── CLAUDE.md                     # This file
```

## Tech Stack Details

### Dashboard (apps/dashboard)

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.x | React framework with App Router |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Styling |
| shadcn/ui | latest | UI components |
| Prisma | 5.x | ORM |
| Clerk | latest | Authentication |
| React Query | 5.x | Data fetching |
| Recharts | 2.x | Charts |
| Zod | 3.x | Validation |

### Bid Server (apps/server) - **UPDATED: Elysia + Bun**

| Technology | Version | Purpose |
|------------|---------|---------|
| **Bun** | 1.x | Runtime (3-4x faster than Node.js) |
| **Elysia** | 1.x | HTTP framework (end-to-end type safety) |
| TypeScript | 5.x | Type safety (native in Bun) |
| Redis | - | Caching (via Upstash) |
| ClickHouse | - | Analytics (via Tinybird) |
| Prisma | 5.x | Database access |

#### Why Elysia + Bun?

- **3-4x faster** than Node.js/Fastify (~200K req/sec vs ~60K)
- **50ms cold start** vs ~300ms for Node.js
- **Built-in validation** with TypeBox (no separate Zod needed)
- **End-to-end type safety** - types flow from route to response
- **Single binary deployment** - smaller Docker images
- **Native TypeScript** - no compile step needed

### Android Adapters (adapters/android)

| Technology | Version | Purpose |
|------------|---------|---------|
| Kotlin | 1.9.x | Language |
| minSdk | 23 | Android 6.0+ |
| targetSdk | 34 | Android 14 |
| OkHttp | 4.x | HTTP client |
| Moshi | 1.x | JSON parsing |
| AppLovin MAX | 12.x | MAX SDK |
| Google Mobile Ads | 23.x | AdMob SDK |
| ironSource | 8.x | LevelPlay SDK |

### iOS Adapters (adapters/ios)

| Technology | Version | Purpose |
|------------|---------|---------|
| Swift | 5.9 | Language |
| iOS Deployment | 12.0+ | Minimum iOS |
| URLSession | - | HTTP client |
| AppLovinSDK | 12.x | MAX SDK |
| Google-Mobile-Ads-SDK | 11.x | AdMob SDK |
| IronSourceSDK | 8.x | LevelPlay SDK |

## Database Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== AUTH & USERS ====================

model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  email     String   @unique
  name      String?
  role      UserRole @default(PUBLISHER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  publisher Publisher?
}

enum UserRole {
  ADMIN
  PUBLISHER
}

// ==================== PUBLISHER ENTITIES ====================

model Publisher {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])
  company   String?
  apps      App[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model App {
  id           String    @id @default(cuid())
  publisherId  String
  publisher    Publisher @relation(fields: [publisherId], references: [id], onDelete: Cascade)
  name         String
  bundleId     String
  platform     Platform
  storeUrl     String?
  appKey       String    @unique @default(cuid()) // sbz_app_xxx
  mediation    MediationType
  isActive     Boolean   @default(true)
  adUnits      AdUnit[]
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  @@unique([publisherId, bundleId, platform])
}

model AdUnit {
  id           String   @id @default(cuid())
  appId        String
  app          App      @relation(fields: [appId], references: [id], onDelete: Cascade)
  name         String
  format       AdFormat
  placementId  String   @unique @default(cuid()) // sbz_plc_xxx
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // For banner ads
  width        Int?
  height       Int?
}

enum Platform {
  ANDROID
  IOS
  BOTH
}

enum MediationType {
  MAX
  ADMOB
  LEVELPLAY
}

enum AdFormat {
  BANNER
  INTERSTITIAL
  REWARDED
}

// ==================== DEMAND SOURCES (Admin) ====================

model DemandSource {
  id          String       @id @default(cuid())
  type        DemandType
  name        String
  isActive    Boolean      @default(true)
  priority    Int          @default(1)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  // Polymorphic relations
  gamConfig    GamConfig?
  unityConfig  UnityConfig?
  fyberConfig  FyberConfig?
  ortbConfig   OrtbConfig?
  
  adUnits      DemandAdUnit[]
}

enum DemandType {
  GAM
  UNITY
  FYBER
  ORTB
}

// GAM/MCM Configuration
model GamConfig {
  id              String       @id @default(cuid())
  demandSourceId  String       @unique
  demandSource    DemandSource @relation(fields: [demandSourceId], references: [id], onDelete: Cascade)
  networkCode     String
  credentials     Json?        // Service account JSON
}

// Unity Ads Configuration
model UnityConfig {
  id              String       @id @default(cuid())
  demandSourceId  String       @unique
  demandSource    DemandSource @relation(fields: [demandSourceId], references: [id], onDelete: Cascade)
  organizationId  String
  gameIdAndroid   String
  gameIdIos       String
  apiKey          String?
}

// Fyber Configuration
model FyberConfig {
  id              String       @id @default(cuid())
  demandSourceId  String       @unique
  demandSource    DemandSource @relation(fields: [demandSourceId], references: [id], onDelete: Cascade)
  appId           String
  securityToken   String
}

// OpenRTB DSP Configuration
model OrtbConfig {
  id              String       @id @default(cuid())
  demandSourceId  String       @unique
  demandSource    DemandSource @relation(fields: [demandSourceId], references: [id], onDelete: Cascade)
  endpoint        String
  seatId          String?
  authHeader      String?
  authValue       String?
  timeout         Int          @default(200)
  
  // Format-based configuration
  bannerEnabled   Boolean      @default(true)
  bannerFloor     Float        @default(1.0)
  interstitialEnabled Boolean  @default(true)
  interstitialFloor   Float    @default(5.0)
  rewardedEnabled Boolean      @default(true)
  rewardedFloor   Float        @default(8.0)
}

// Individual ad units for GAM/Unity/Fyber
model DemandAdUnit {
  id              String       @id @default(cuid())
  demandSourceId  String
  demandSource    DemandSource @relation(fields: [demandSourceId], references: [id], onDelete: Cascade)
  
  externalId      String       // GAM path, Unity placement ID, Fyber spot ID
  format          AdFormat
  bidFloor        Float
  
  // Banner specific
  width           Int?
  height          Int?
  
  isActive        Boolean      @default(true)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  @@unique([demandSourceId, externalId])
}

// ==================== EVENTS & REPORTING ====================

model AdEvent {
  id            String    @id @default(cuid())
  eventType     EventType
  placementId   String
  demandSource  String?
  bidPrice      Float?
  winPrice      Float?
  country       String?
  deviceType    String?
  osVersion     String?
  appVersion    String?
  createdAt     DateTime  @default(now())
  
  @@index([placementId, createdAt])
  @@index([demandSource, createdAt])
}

enum EventType {
  BID_REQUEST
  BID_RESPONSE
  WIN
  IMPRESSION
  CLICK
  COMPLETE  // For rewarded
}
```

## Elysia Server Implementation

### Basic Server Setup (apps/server/src/index.ts)

```typescript
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { bidRoutes } from './routes/bid'
import { healthRoutes } from './routes/health'
import { eventRoutes } from './routes/events'

const app = new Elysia()
  .use(cors())
  .use(swagger({
    documentation: {
      info: {
        title: 'Starbidz Bid Server',
        version: '1.0.0'
      }
    }
  }))
  .use(healthRoutes)
  .use(bidRoutes)
  .use(eventRoutes)
  .listen(process.env.PORT || 8080)

console.log(`🚀 Starbidz server running at ${app.server?.hostname}:${app.server?.port}`)

export type App = typeof app
```

### Bid Route (apps/server/src/routes/bid.ts)

```typescript
import { Elysia, t } from 'elysia'
import { auctionEngine } from '../auction/engine'

// Request/Response schemas with built-in validation
const BidRequestSchema = t.Object({
  app_key: t.String(),
  placement_id: t.String(),
  format: t.Union([
    t.Literal('banner'),
    t.Literal('interstitial'),
    t.Literal('rewarded')
  ]),
  width: t.Optional(t.Number()),
  height: t.Optional(t.Number()),
  device: t.Object({
    os: t.Union([t.Literal('android'), t.Literal('ios')]),
    osv: t.String(),
    make: t.String(),
    model: t.String(),
    ifa: t.String(),
    lmt: t.Boolean(),
    connectionType: t.String()
  }),
  geo: t.Optional(t.Object({
    country: t.String(),
    region: t.Optional(t.String()),
    city: t.Optional(t.String())
  })),
  app: t.Object({
    bundle: t.String(),
    version: t.String(),
    name: t.String()
  }),
  user: t.Optional(t.Object({
    consent: t.Optional(t.String())
  })),
  test: t.Optional(t.Boolean())
})

const BidResponseSchema = t.Object({
  success: t.Boolean(),
  bid: t.Optional(t.Object({
    id: t.String(),
    price: t.Number(),
    currency: t.String(),
    demand_source: t.String(),
    creative: t.Object({
      type: t.Union([t.Literal('html'), t.Literal('vast'), t.Literal('image')]),
      content: t.String(),
      width: t.Optional(t.Number()),
      height: t.Optional(t.Number())
    }),
    nurl: t.Optional(t.String()),
    burl: t.Optional(t.String())
  })),
  error: t.Optional(t.String())
})

export const bidRoutes = new Elysia({ prefix: '/v1' })
  .post('/bid', async ({ body }) => {
    try {
      // Run unified auction
      const result = await auctionEngine.runAuction(body)
      
      if (result.winner) {
        return {
          success: true,
          bid: {
            id: result.winner.bidId,
            price: result.winner.price,
            currency: 'USD',
            demand_source: result.winner.source,
            creative: result.winner.creative,
            nurl: result.winner.nurl,
            burl: result.winner.burl
          }
        }
      }
      
      return { success: false, error: 'No bid' }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }, {
    body: BidRequestSchema,
    response: BidResponseSchema
  })
```

### Auction Engine (apps/server/src/auction/engine.ts)

```typescript
import { gamConnector } from '../connectors/gam'
import { unityConnector } from '../connectors/unity'
import { fyberConnector } from '../connectors/fyber'
import { ortbConnector } from '../connectors/ortb'

interface AuctionResult {
  winner: {
    bidId: string
    price: number
    source: string
    creative: {
      type: 'html' | 'vast' | 'image'
      content: string
      width?: number
      height?: number
    }
    nurl?: string
    burl?: string
  } | null
  allBids: Array<{ source: string; price: number }>
  latency: number
}

class AuctionEngine {
  private readonly TIMEOUT_MS = 200

  async runAuction(request: any): Promise<AuctionResult> {
    const startTime = Date.now()
    
    // Query all demand sources in parallel with timeout
    const bidPromises = [
      this.withTimeout(gamConnector.getBid(request), 'gam'),
      this.withTimeout(unityConnector.getBid(request), 'unity'),
      this.withTimeout(fyberConnector.getBid(request), 'fyber'),
      this.withTimeout(ortbConnector.getBid(request), 'ortb')
    ]

    const results = await Promise.allSettled(bidPromises)
    
    // Collect successful bids
    const bids = results
      .filter((r): r is PromiseFulfilledResult<any> => 
        r.status === 'fulfilled' && r.value !== null
      )
      .map(r => r.value)
      .filter(bid => bid.price > 0)

    // Sort by price descending
    bids.sort((a, b) => b.price - a.price)

    const latency = Date.now() - startTime

    if (bids.length === 0) {
      return { winner: null, allBids: [], latency }
    }

    return {
      winner: bids[0],
      allBids: bids.map(b => ({ source: b.source, price: b.price })),
      latency
    }
  }

  private async withTimeout<T>(
    promise: Promise<T>, 
    source: string
  ): Promise<T | null> {
    try {
      return await Promise.race([
        promise,
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error(`${source} timeout`)), this.TIMEOUT_MS)
        )
      ])
    } catch {
      return null
    }
  }
}

export const auctionEngine = new AuctionEngine()
```

### Base Connector Interface (apps/server/src/connectors/base.ts)

```typescript
export interface BidResult {
  bidId: string
  price: number
  source: string
  creative: {
    type: 'html' | 'vast' | 'image'
    content: string
    width?: number
    height?: number
  }
  nurl?: string
  burl?: string
}

export interface Connector {
  getBid(request: any): Promise<BidResult | null>
}
```

## API Endpoints

### Bid Server API

```typescript
// POST /v1/bid
// Request from mobile adapter
interface BidRequest {
  app_key: string;           // sbz_app_xxx
  placement_id: string;      // sbz_plc_xxx
  format: 'banner' | 'interstitial' | 'rewarded';
  
  // Banner specific
  width?: number;
  height?: number;
  
  // Device info
  device: {
    os: 'android' | 'ios';
    osv: string;
    make: string;
    model: string;
    ifa: string;            // Advertising ID
    lmt: boolean;           // Limit Ad Tracking
    connectionType: string;
  };
  
  // Geo info
  geo?: {
    country: string;
    region?: string;
    city?: string;
  };
  
  // App info
  app: {
    bundle: string;
    version: string;
    name: string;
  };
  
  // User info
  user?: {
    consent?: string;       // TCF consent string
  };
  
  // Test mode
  test?: boolean;
}

// Response
interface BidResponse {
  success: boolean;
  bid?: {
    id: string;
    price: number;          // CPM in USD
    currency: string;
    demand_source: string;  // 'gam' | 'unity' | 'fyber' | 'ortb_xxx'
    creative: {
      type: 'html' | 'vast' | 'image';
      content: string;      // HTML, VAST URL, or image URL
      width?: number;
      height?: number;
    };
    nurl?: string;          // Win notification URL
    burl?: string;          // Billing URL
  };
  error?: string;
}

// POST /v1/events
// Event tracking from adapter
interface EventRequest {
  event_type: 'impression' | 'click' | 'complete';
  bid_id: string;
  placement_id: string;
  timestamp: number;
}
```

## Development Commands

### Initial Setup

```bash
# Clone repository
git clone https://github.com/starbidz/starbidz.git
cd starbidz

# Install Bun (if not installed)
curl -fsSL https://bun.sh/install | bash

# Install dependencies
pnpm install

# Setup environment variables
cp apps/dashboard/.env.example apps/dashboard/.env.local
cp apps/server/.env.example apps/server/.env

# Setup database
cd apps/dashboard
pnpm prisma generate
pnpm prisma db push
pnpm prisma db seed

# Start development
cd ../..
pnpm dev
```

### Dashboard Commands

```bash
cd apps/dashboard

# Development
pnpm dev                    # Start dev server on :3000

# Database
pnpm prisma studio          # Open Prisma Studio
pnpm prisma generate        # Generate Prisma Client
pnpm prisma db push         # Push schema to database
pnpm prisma migrate dev     # Create migration
pnpm prisma db seed         # Seed database

# Build
pnpm build                  # Production build
pnpm start                  # Start production server

# Linting
pnpm lint                   # ESLint
pnpm type-check            # TypeScript check
```

### Server Commands (Bun/Elysia)

```bash
cd apps/server

# Development
bun run dev                 # Start dev server on :8080 (hot reload)

# Production
bun run src/index.ts        # Direct run (no build needed)

# Or with build
bun build src/index.ts --outfile dist/server.js --target bun
bun run dist/server.js

# Testing
bun test                    # Run tests

# Type checking
bun run typecheck           # TypeScript check
```

### Android Commands

```bash
cd adapters/android

# Build all modules
./gradlew build

# Build specific adapter
./gradlew :starbidz-max:assembleRelease

# Publish to Maven Local (for testing)
./gradlew publishToMavenLocal

# Run lint
./gradlew lint
```

### iOS Commands

```bash
cd adapters/ios

# Build
swift build

# Run tests
swift test

# Update CocoaPods spec
pod lib lint Starbidz.podspec
```

## Environment Variables

### Dashboard (.env.local)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/starbidz"

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register

# Server
NEXT_PUBLIC_BID_SERVER_URL=http://localhost:8080

# Analytics (optional)
TINYBIRD_API_KEY=xxx
```

### Server (.env) - Updated for Bun

```env
# Server
PORT=8080
NODE_ENV=development

# Database (Prisma works with Bun)
DATABASE_URL="postgresql://user:password@localhost:5432/starbidz"

# Redis (Upstash - works great with Bun)
UPSTASH_REDIS_REST_URL=xxx
UPSTASH_REDIS_REST_TOKEN=xxx

# GAM (optional - for testing)
GAM_NETWORK_CODE=123456789

# Analytics
TINYBIRD_API_KEY=xxx
TINYBIRD_API_URL=https://api.tinybird.co
```

## Coding Standards

### TypeScript/Elysia

- Use Elysia's built-in TypeBox for validation (no separate Zod needed)
- Leverage end-to-end type inference
- Use async/await
- Use descriptive variable names

```typescript
// Good - Elysia style with built-in validation
import { Elysia, t } from 'elysia'

const app = new Elysia()
  .post('/bid', async ({ body }) => {
    // body is fully typed from schema
    const result = await processRequest(body)
    return result
  }, {
    body: t.Object({
      app_key: t.String(),
      format: t.Union([t.Literal('banner'), t.Literal('interstitial')])
    })
  })

// Bad - manual validation
app.post('/bid', async ({ body }) => {
  if (!body.app_key) throw new Error('Missing app_key') // Don't do this
})
```

### React/Next.js

- Use functional components with hooks
- Use server components where possible (Next.js 14)
- Use `use client` directive only when needed
- Colocate components with their routes
- Use shadcn/ui components as base

```tsx
// Good - Server Component
export default async function AppsPage() {
  const apps = await getApps();
  return <AppList apps={apps} />;
}

// Good - Client Component when needed
'use client';
export function AppForm() {
  const [isLoading, setIsLoading] = useState(false);
  // ...
}
```

### Kotlin (Android)

- Use Kotlin idioms (apply, let, also)
- Use coroutines for async operations
- Use sealed classes for state
- Follow Android naming conventions

```kotlin
// Good
sealed class AdState {
    object Loading : AdState()
    data class Loaded(val ad: StarbidAd) : AdState()
    data class Error(val message: String) : AdState()
}

suspend fun loadAd(placementId: String): AdState {
    return try {
        val ad = starbidClient.fetchAd(placementId)
        AdState.Loaded(ad)
    } catch (e: Exception) {
        AdState.Error(e.message ?: "Unknown error")
    }
}
```

### Swift (iOS)

- Use Swift concurrency (async/await)
- Use Result type for error handling
- Follow Apple naming conventions
- Use structs for data models

```swift
// Good
enum AdState {
    case loading
    case loaded(StarbidAd)
    case error(Error)
}

func loadAd(placementId: String) async -> AdState {
    do {
        let ad = try await starbidClient.fetchAd(placementId: placementId)
        return .loaded(ad)
    } catch {
        return .error(error)
    }
}
```

## Testing Strategy

### Dashboard Tests

```typescript
// Unit tests with Vitest
// apps/dashboard/__tests__/utils.test.ts
import { generatePlacementId } from '@/lib/utils';

describe('generatePlacementId', () => {
  it('should generate valid placement ID', () => {
    const id = generatePlacementId();
    expect(id).toMatch(/^sbz_plc_[a-z0-9]+$/);
  });
});

// E2E tests with Playwright
// apps/dashboard/e2e/apps.spec.ts
test('create new app', async ({ page }) => {
  await page.goto('/apps/new');
  await page.fill('[name="name"]', 'Test App');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/apps\/[a-z0-9]+/);
});
```

### Server Tests (Bun)

```typescript
// apps/server/src/__tests__/bid.test.ts
import { describe, it, expect } from 'bun:test'
import { app } from '../index'

describe('POST /v1/bid', () => {
  it('should return bid for valid request', async () => {
    const response = await app.handle(
      new Request('http://localhost/v1/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_key: 'sbz_app_test',
          placement_id: 'sbz_plc_test',
          format: 'banner',
          device: {
            os: 'android',
            osv: '14',
            make: 'Google',
            model: 'Pixel 8',
            ifa: 'test-ifa',
            lmt: false,
            connectionType: 'wifi'
          },
          app: {
            bundle: 'com.test.app',
            version: '1.0.0',
            name: 'Test App'
          }
        })
      })
    )
    
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
  })
})
```

## Deployment

### Dashboard (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd apps/dashboard
vercel --prod
```

### Server (Railway) - Bun Support

Railway has native Bun support. Create a `railway.json`:

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "runtime": "bun",
    "startCommand": "bun run src/index.ts"
  }
}
```

Or use Dockerfile:

```dockerfile
FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .

EXPOSE 8080

CMD ["bun", "run", "src/index.ts"]
```

### Alternative: Fly.io (Great for Bun)

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Deploy
cd apps/server
fly launch
fly deploy
```

### Android (Maven Central)

1. Configure `~/.gradle/gradle.properties` with signing keys
2. Run `./gradlew publishReleasePublicationToMavenCentralRepository`

### iOS (CocoaPods)

1. Update version in `Starbidz.podspec`
2. Run `pod trunk push Starbidz.podspec`

## Common Tasks

### Adding a New Demand Source Type

1. Add type to `DemandType` enum in Prisma schema
2. Create config model (e.g., `NewSourceConfig`)
3. Create connector in `apps/server/src/connectors/`
4. Add UI in `apps/dashboard/app/(admin)/demand/`
5. Update auction engine to include new source

### Adding a New Ad Format

1. Add format to `AdFormat` enum
2. Update adapter classes for each platform
3. Update bid request/response types
4. Add UI support in dashboard

### Debugging Bid Requests

```bash
# Start server with verbose logging
DEBUG=* bun run dev

# Test bid endpoint
curl -X POST http://localhost:8080/v1/bid \
  -H "Content-Type: application/json" \
  -d '{
    "app_key": "test",
    "placement_id": "test",
    "format": "banner",
    "device": {
      "os": "android",
      "osv": "14",
      "make": "Google",
      "model": "Pixel",
      "ifa": "test",
      "lmt": false,
      "connectionType": "wifi"
    },
    "app": {
      "bundle": "com.test",
      "version": "1.0",
      "name": "Test"
    }
  }'
```

## Important Notes

### Ad Formats

- **Banner**: 320x50, 300x250 (MREC), 728x90
- **Interstitial**: Fullscreen static or video
- **Rewarded**: Video with reward callback

### Demand Source Ad Unit Management

| Source | Ad Unit Origin | Floor Setting |
|--------|---------------|---------------|
| GAM | Create in GAM → Add path + floor to Starbidz | Per ad unit |
| Unity | Create in Unity Dashboard → Add placement ID + floor | Per placement |
| Fyber | Create in Fyber Dashboard → Add spot ID + floor | Per spot |
| OpenRTB | Just endpoint | Per format (Banner/Inter/Rewarded) |

### Placement ID Format

- App Key: `sbz_app_[cuid]`
- Placement ID: `sbz_plc_[cuid]`

### Auction Logic

1. Receive bid request with placement_id
2. Look up ad unit format from placement_id
3. Query all active demand sources in parallel (with 200ms timeout)
4. Filter bids above floor price
5. Select highest bid
6. Return creative to adapter

### Bun Compatibility Notes

- ✅ Prisma works with Bun
- ✅ Upstash Redis works with Bun
- ✅ Most npm packages work
- ⚠️ Some Node.js native modules may need alternatives
- ✅ GAM API (googleapis) works with Bun

## Security

### 1. API Key Validation (Kritik)

Her bid request'te app_key doğrulaması yapılmalı:

```typescript
// apps/server/src/middleware/auth.ts
import { Elysia } from 'elysia'
import { prisma } from '../lib/db'

export const authMiddleware = new Elysia()
  .derive(async ({ body, set }) => {
    const appKey = (body as any)?.app_key
    
    if (!appKey) {
      set.status = 401
      return { error: 'Missing app_key' }
    }
    
    // Cache this in Redis for performance
    const app = await prisma.app.findUnique({
      where: { appKey, isActive: true },
      select: { id: true, publisherId: true, bundleId: true }
    })
    
    if (!app) {
      set.status = 401
      return { error: 'Invalid app_key' }
    }
    
    return { app }
  })
```

### 2. Rate Limiting (Kritik)

DDoS ve abuse prevention için rate limiting şart:

```typescript
// apps/server/src/middleware/rateLimit.ts
import { Elysia } from 'elysia'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

export const rateLimitMiddleware = new Elysia()
  .derive(async ({ request, set }) => {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const key = `ratelimit:${ip}`
    
    const current = await redis.incr(key)
    if (current === 1) {
      await redis.expire(key, 60) // 1 minute window
    }
    
    // 1000 requests per minute per IP
    if (current > 1000) {
      set.status = 429
      return { error: 'Too many requests' }
    }
  })
```

### 3. Credential Encryption (Kritik)

GAM credentials ve API key'ler encrypt edilmeli:

```typescript
// apps/dashboard/lib/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const SECRET_KEY = process.env.ENCRYPTION_KEY! // 32 bytes

export function encrypt(text: string): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY, 'hex'), iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encryptedHex] = encryptedText.split(':')
  const decipher = createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY, 'hex'), Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))
  return decipher.update(Buffer.from(encryptedHex, 'hex')) + decipher.final('utf8')
}

// Usage: Store GAM credentials encrypted
// const encrypted = encrypt(JSON.stringify(serviceAccountJson))
```

### 4. HTTPS & CORS

```typescript
// apps/server/src/index.ts
import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'

const app = new Elysia()
  .use(cors({
    origin: [
      'https://dashboard.starbidz.io',
      'https://starbidz.io'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }))
  // In production, always behind HTTPS (Railway/Fly.io handles this)
```

### 5. Input Sanitization

Elysia's TypeBox handles most validation, but extra checks for ad content:

```typescript
// Prevent XSS in creative content
function sanitizeCreative(content: string): string {
  // For HTML creatives from DSPs, run through DOMPurify or similar
  // For VAST URLs, validate URL format
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
}
```

### 6. Environment Variables

```env
# .env (NEVER commit this file)

# Encryption
ENCRYPTION_KEY=your-32-byte-hex-key-here

# Add to .gitignore
# .env
# .env.local
# .env.production
```

### Security Checklist

| Item | Priority | Status |
|------|----------|--------|
| API key validation | 🔴 Critical | Required for MVP |
| Rate limiting | 🔴 Critical | Required for MVP |
| HTTPS only | 🔴 Critical | Railway/Fly handles |
| Credential encryption | 🟡 High | Before adding real demand |
| CORS configuration | 🟡 High | Required for MVP |
| Input validation | 🟡 High | Elysia TypeBox handles |
| Request logging | 🟢 Medium | For debugging |
| IP whitelisting | 🟢 Medium | Optional |
| Bot detection | 🟢 Medium | Phase 2 |

## Support

- **Documentation**: `/docs`
- **API Reference**: `/docs/api`
- **Issues**: GitHub Issues
