# Real-time Communication Architecture

<cite>
**Referenced Files in This Document**
- [pusher-server.ts](file://src/lib/pusher-server.ts)
- [pusher.ts](file://src/lib/pusher.ts)
- [route.ts](file://src/app/api/pedidos/route.ts)
- [page.tsx](file://src/app/painel-pedidos/page.tsx)
- [package.json](file://package.json)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document explains the real-time communication architecture built around Pusher for live updates in the restaurant ordering system. It covers WebSocket connection management, event-driven patterns, and message broadcasting strategies used to synchronize order status across the kitchen dashboard, service staff screens, and customer-facing pages. It also documents connection handling, error recovery, fallback mechanisms, event naming conventions, payload structures, security considerations, scalability patterns, and message queuing strategies.

## Project Structure
The real-time feature is implemented with a minimal set of modules:
- Server-side Pusher client for broadcasting events from API routes.
- Client-side Pusher client for subscribing to channels and listening to events.
- API route handlers that persist data and trigger real-time events.
- A Next.js page that subscribes to the channel and refreshes UI on events.

```mermaid
graph TB
subgraph "Client"
PNL["Painel Pedidos Page<br/>(subscribe + bind events)"]
end
subgraph "Server"
API["API Route /api/pedidos<br/>(POST/PATCH triggers)"]
PS["Pusher Server Client"]
end
subgraph "Pusher Cloud"
CH["Channel: canal-restaurante"]
end
PNL --> |WebSocket| CH
API --> PS
PS --> CH
```

**Diagram sources**
- [page.tsx:54-76](file://src/app/painel-pedidos/page.tsx#L54-L76)
- [route.ts:173-180](file://src/app/api/pedidos/route.ts#L173-L180)
- [route.ts:220-228](file://src/app/api/pedidos/route.ts#L220-L228)
- [pusher-server.ts:1-10](file://src/lib/pusher-server.ts#L1-L10)
- [pusher.ts:1-8](file://src/lib/pusher.ts#L1-L8)

**Section sources**
- [pusher-server.ts:1-10](file://src/lib/pusher-server.ts#L1-L10)
- [pusher.ts:1-8](file://src/lib/pusher.ts#L1-L8)
- [route.ts:1-253](file://src/app/api/pedidos/route.ts#L1-L253)
- [page.tsx:1-295](file://src/app/painel-pedidos/page.tsx#L1-L295)
- [package.json:25-26](file://package.json#L25-L26)

## Core Components
- Pusher server client: Initializes the Pusher SDK for Node with environment variables and exposes a singleton instance used by API routes to broadcast events.
- Pusher client: Initializes the browser-side Pusher SDK with public key and cluster; exported as a singleton for components to subscribe.
- API route (/api/pedidos): Persists orders and status changes to the database, then triggers Pusher events on the shared channel.
- Kitchen dashboard (Painel Pedidos): Subscribes to the channel and listens for new order and status update events, refreshing the UI accordingly.

Key responsibilities:
- Connection lifecycle managed by Pusher SDKs (server and client).
- Event-driven decoupling between persistence and UI updates.
- Broadcast to all subscribers on a single channel for simplicity.

**Section sources**
- [pusher-server.ts:1-10](file://src/lib/pusher-server.ts#L1-L10)
- [pusher.ts:1-8](file://src/lib/pusher.ts#L1-L8)
- [route.ts:165-190](file://src/app/api/pedidos/route.ts#L165-L190)
- [route.ts:192-235](file://src/app/api/pedidos/route.ts#L192-L235)
- [page.tsx:54-76](file://src/app/painel-pedidos/page.tsx#L54-L76)

## Architecture Overview
The system uses an event-driven pattern where the server persists state first and then broadcasts changes via Pusher. Clients subscribe to a single channel and react to specific events by refetching data or updating local state.

```mermaid
sequenceDiagram
participant C as "Kitchen Dashboard (Page)"
participant S as "Next.js API (/api/pedidos)"
participant DB as "Database"
participant PS as "Pusher Server"
participant PC as "Pusher Cloud"
C->>S : POST create order
S->>DB : Persist order + items
DB-->>S : Success
S->>PS : Trigger "novo-pedido" on "canal-restaurante"
PS-->>PC : Broadcast event
PC-->>C : WebSocket event "novo-pedido"
C->>C : Refresh orders list
C->>S : PATCH update status
S->>DB : Update status
DB-->>S : Success
S->>PS : Trigger "status-atualizado" on "canal-restaurante"
PS-->>PC : Broadcast event
PC-->>C : WebSocket event "status-atualizado"
C->>C : Refresh orders list
```

**Diagram sources**
- [route.ts:165-190](file://src/app/api/pedidos/route.ts#L165-L190)
- [route.ts:192-235](file://src/app/api/pedidos/route.ts#L192-L235)
- [page.tsx:54-76](file://src/app/painel-pedidos/page.tsx#L54-L76)

## Detailed Component Analysis

### Pusher Server Client
- Purpose: Provide a server-side Pusher instance configured with app credentials and TLS enabled.
- Behavior: Returns null if required environment variables are missing, allowing graceful degradation.
- Usage: Imported by API routes to trigger events after successful persistence.

```mermaid
classDiagram
class PusherServer {
+constructor(config)
+trigger(channel, event, data)
}
class pusher_server_ts {
+pusherServer : PusherServer?
}
pusher_server_ts --> PusherServer : "creates when env vars present"
```

**Diagram sources**
- [pusher-server.ts:1-10](file://src/lib/pusher-server.ts#L1-L10)

**Section sources**
- [pusher-server.ts:1-10](file://src/lib/pusher-server.ts#L1-L10)

### Pusher Client
- Purpose: Provide a browser-side Pusher instance configured with public key and cluster.
- Behavior: Returns null if required environment variables are missing, enabling safe conditional usage.
- Usage: Imported by pages to subscribe to channels and bind event listeners.

```mermaid
classDiagram
class PusherClient {
+constructor(key, options)
+subscribe(channel)
}
class pusher_client_ts {
+pusherClient : PusherClient?
}
pusher_client_ts --> PusherClient : "creates when env vars present"
```

**Diagram sources**
- [pusher.ts:1-8](file://src/lib/pusher.ts#L1-L8)

**Section sources**
- [pusher.ts:1-8](file://src/lib/pusher.ts#L1-L8)

### API Route: Order Creation and Status Updates
- POST /api/pedidos:
  - Validates input and business rules.
  - Persists order and items in a transaction.
  - Triggers "novo-pedido" on "canal-restaurante".
- PATCH /api/pedidos:
  - Authorizes kitchen role.
  - Validates allowed statuses.
  - Persists status change.
  - Triggers "status-atualizado" on "canal-restaurante".

```mermaid
flowchart TD
Start(["Request Received"]) --> Validate["Validate body and roles"]
Validate --> Persist{"Operation type?"}
Persist --> |POST| SaveOrder["Persist order + items"]
Persist --> |PATCH| UpdateStatus["Update status"]
SaveOrder --> TriggerNew["Trigger 'novo-pedido'"]
UpdateStatus --> TriggerStatus["Trigger 'status-atualizado'"]
TriggerNew --> Respond["Return success response"]
TriggerStatus --> Respond
```

**Diagram sources**
- [route.ts:65-190](file://src/app/api/pedidos/route.ts#L65-L190)
- [route.ts:192-235](file://src/app/api/pedidos/route.ts#L192-L235)

**Section sources**
- [route.ts:65-190](file://src/app/api/pedidos/route.ts#L65-L190)
- [route.ts:192-235](file://src/app/api/pedidos/route.ts#L192-L235)

### Kitchen Dashboard: Real-time Subscription and UI Sync
- Subscribes to "canal-restaurante" on mount.
- Binds listeners for "novo-pedido" and "status-atualizado".
- On event, refreshes the orders list from the API to ensure consistency.
- Unsubscribes on component unmount to avoid leaks.

```mermaid
sequenceDiagram
participant Page as "Painel Pedidos Page"
participant PC as "Pusher Client"
participant CH as "Channel : canal-restaurante"
participant API as "/api/pedidos"
Page->>PC : subscribe("canal-restaurante")
PC-->>CH : Channel subscribed
CH-->>Page : "novo-pedido"
Page->>API : GET /api/pedidos
API-->>Page : Orders list
Page->>Page : Update UI
CH-->>Page : "status-atualizado"
Page->>API : GET /api/pedidos
API-->>Page : Orders list
Page->>Page : Update UI
```

**Diagram sources**
- [page.tsx:54-76](file://src/app/painel-pedidos/page.tsx#L54-L76)
- [route.ts:15-63](file://src/app/api/pedidos/route.ts#L15-L63)

**Section sources**
- [page.tsx:54-76](file://src/app/painel-pedidos/page.tsx#L54-L76)

## Dependency Analysis
- External dependencies:
  - pusher (server SDK)
  - pusher-js (client SDK)
- Internal dependencies:
  - API routes depend on Pusher server client to broadcast events.
  - Pages depend on Pusher client to receive events.
  - Both clients rely on environment variables for configuration.

```mermaid
graph LR
PKG["package.json"]
PSrv["pusher-server.ts"]
PCli["pusher.ts"]
API["/api/pedidos/route.ts"]
PAGE["painel-pedidos/page.tsx"]
PKG --> PSrv
PKG --> PCli
API --> PSrv
PAGE --> PCli
```

**Diagram sources**
- [package.json:25-26](file://package.json#L25-L26)
- [pusher-server.ts:1-10](file://src/lib/pusher-server.ts#L1-L10)
- [pusher.ts:1-8](file://src/lib/pusher.ts#L1-L8)
- [route.ts:1-10](file://src/app/api/pedidos/route.ts#L1-L10)
- [page.tsx:1-10](file://src/app/painel-pedidos/page.tsx#L1-L10)

**Section sources**
- [package.json:25-26](file://package.json#L25-L26)

## Performance Considerations
- Event payload size: Keep payloads small (e.g., include only id and status for updates) to minimize bandwidth.
- Re-fetch strategy: The current approach re-fetches the full orders list on each event. For high traffic, consider optimistic updates or incremental diffs.
- Connection overhead: Single shared channel reduces complexity but may become a bottleneck under heavy load; consider sharding by restaurant or area.
- Polling fallback: Some pages use polling (e.g., atendimento) as a simple fallback; prefer Pusher where available and fall back gracefully.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and resolutions:
- Missing environment variables:
  - Symptom: pusherServer or pusherClient is null; no real-time updates.
  - Resolution: Ensure NEXT_PUBLIC_PUSHER_KEY, NEXT_PUBLIC_PUSHER_CLUSTER, PUSHER_APP_ID, and PUSHER_SECRET are set.
- Network connectivity:
  - Symptom: No WebSocket connections established.
  - Resolution: Verify firewall/proxy settings allow WebSocket traffic to Pusher clusters.
- Event not received:
  - Symptom: Events triggered but not received.
  - Resolution: Confirm channel name matches exactly ("canal-restaurante") and event names match ("novo-pedido", "status-atualizado").
- Error logging:
  - Use console logs around trigger calls and client bindings to identify failures.

**Section sources**
- [pusher-server.ts:1-10](file://src/lib/pusher-server.ts#L1-L10)
- [pusher.ts:1-8](file://src/lib/pusher.ts#L1-L8)
- [route.ts:173-180](file://src/app/api/pedidos/route.ts#L173-L180)
- [route.ts:220-228](file://src/app/api/pedidos/route.ts#L220-L228)
- [page.tsx:54-76](file://src/app/painel-pedidos/page.tsx#L54-L76)

## Conclusion
The real-time architecture leverages Pusher to decouple persistence from UI updates through a simple, robust event model. The server triggers events after successful database operations, and clients subscribe to a shared channel to stay synchronized. While the current implementation is straightforward and effective, future enhancements can include optimized payloads, optimistic UI updates, channel sharding, and more sophisticated fallback strategies for resilience at scale.

[No sources needed since this section summarizes without analyzing specific files]