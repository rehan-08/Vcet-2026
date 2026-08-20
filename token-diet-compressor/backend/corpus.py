"""
Seed corpus for the Lean Context demo: short blog/doc-style articles about
backend & cloud engineering topics. Each entry deliberately mixes
substantive, factual sentences with marketing-style filler so that
relevance scoring has something real to distinguish between.
"""

DOCS = [
    {
        "id": "doc-01",
        "title": "API Rate Limiting",
        "text": (
            "In today's fast-moving digital landscape, protecting your API is more important than ever. "
            "Rate limiting caps the number of requests a client can make in a given time window, typically "
            "using algorithms like token bucket or sliding window counters. Token bucket allows short bursts "
            "while enforcing a steady average rate, which makes it popular for public APIs. Without rate "
            "limiting, a single misbehaving client can exhaust shared resources and degrade service for "
            "everyone else. Most teams return a 429 Too Many Requests status code along with a Retry-After "
            "header so well-behaved clients know when to try again. We're excited to see how you use these "
            "best practices to build resilient, world-class services."
        ),
    },
    {
        "id": "doc-02",
        "title": "Database Indexing",
        "text": (
            "Great performance doesn't happen by accident — it's the result of thoughtful engineering. "
            "A database index is a separate data structure, often a B-tree, that lets the query planner "
            "find rows without scanning the entire table. Indexes speed up SELECT queries and JOINs "
            "significantly, but they add overhead to INSERT, UPDATE, and DELETE operations because the "
            "index must be maintained. Composite indexes, which cover multiple columns, only help queries "
            "that filter on a prefix of those columns in the same order. As your application scales, "
            "choosing the right indexes becomes a genuine competitive advantage for your team."
        ),
    },
    {
        "id": "doc-03",
        "title": "Caching Strategies",
        "text": (
            "Caching is one of the most powerful tools in a developer's toolkit, and we love talking about it. "
            "Cache-aside is the most common pattern: the application checks the cache first, and on a miss it "
            "loads from the database and writes the result back into the cache. Write-through caching writes "
            "to the cache and the database at the same time, keeping them in sync but adding latency to writes. "
            "Cache invalidation is famously one of the two hard problems in computer science, and picking a "
            "sensible TTL is often more practical than trying to invalidate perfectly. Redis and Memcached are "
            "the two most widely used in-memory caching systems in production today. Let's dive in and explore "
            "how these ideas can transform your architecture."
        ),
    },
    {
        "id": "doc-04",
        "title": "Containerization with Docker",
        "text": (
            "Containers have completely reshaped how modern teams ship software, and it's an exciting time to "
            "be a developer. A Docker container packages an application together with its dependencies and "
            "runtime into a single, portable image, so it behaves the same way on a laptop as it does in "
            "production. Images are built in layers from a Dockerfile, and Docker caches unchanged layers to "
            "speed up rebuilds. Unlike virtual machines, containers share the host operating system's kernel, "
            "which makes them much lighter weight and faster to start. Multi-stage builds let you compile code "
            "in one stage and copy only the final artifact into a slim runtime image, keeping images small. "
            "We think you're going to love how much simpler your deployments become."
        ),
    },
    {
        "id": "doc-05",
        "title": "CI/CD Pipelines",
        "text": (
            "Shipping fast and shipping safely used to feel like a contradiction, but modern tooling has "
            "changed the game. Continuous integration means merging code changes frequently and running an "
            "automated test suite on every commit to catch regressions early. Continuous delivery extends "
            "this by automatically packaging and preparing every passing build for release, while continuous "
            "deployment goes a step further and pushes it straight to production. A typical pipeline runs "
            "linting, unit tests, integration tests, and a security scan before building an artifact. Feature "
            "flags let teams deploy code that is turned off for most users, decoupling deployment from release. "
            "We're thrilled to help you build a pipeline you can trust."
        ),
    },
    {
        "id": "doc-06",
        "title": "Serverless Functions",
        "text": (
            "Serverless computing has captured the imagination of developers everywhere, promising a future "
            "with less operational overhead. A serverless function, like an AWS Lambda or a Cloudflare Worker, "
            "runs your code in response to an event without you having to manage the underlying server. You "
            "are billed based on actual compute time and number of invocations, rather than for idle capacity. "
            "Cold starts, the extra latency incurred when a new execution environment must be initialized, "
            "remain one of the main tradeoffs of the serverless model. Functions are naturally stateless, so "
            "any persistent data has to live in an external database or object store. It's a brave new world "
            "out there, and serverless is leading the charge."
        ),
    },
    {
        "id": "doc-07",
        "title": "Load Balancing",
        "text": (
            "Nobody wants their favorite app to go down during peak traffic, and that's where load balancing "
            "comes in to save the day. A load balancer distributes incoming traffic across multiple backend "
            "servers to avoid overloading any single instance. Round robin sends requests to servers in "
            "rotating order, while least-connections routes new requests to whichever server currently has "
            "the fewest active connections. Health checks let the load balancer detect and stop routing "
            "traffic to instances that are failing, which improves overall availability. Layer 4 load "
            "balancers operate on IP and port, while Layer 7 load balancers can route based on HTTP headers "
            "or the request path. Scaling gracefully has never felt more achievable."
        ),
    },
    {
        "id": "doc-08",
        "title": "OAuth 2.0 Authentication",
        "text": (
            "Security can feel intimidating, but understanding the fundamentals makes all the difference. "
            "OAuth 2.0 is an authorization framework that lets a third-party application access a user's "
            "resources without ever seeing their password. The authorization code flow, recommended for "
            "server-side apps, exchanges a short-lived code for an access token via a back-channel request. "
            "Access tokens are typically short-lived, while refresh tokens let a client obtain new access "
            "tokens without requiring the user to log in again. PKCE, or Proof Key for Code Exchange, adds "
            "protection for public clients like mobile and single-page apps that cannot safely store a "
            "client secret. We're confident this will empower your team to build secure, delightful login "
            "experiences."
        ),
    },
    {
        "id": "doc-09",
        "title": "Webhooks Explained",
        "text": (
            "In a world of real-time everything, webhooks quietly power some of the coolest integrations "
            "you use every day. A webhook is an HTTP callback: instead of your app polling a service for "
            "updates, that service sends an HTTP POST request to a URL you provide whenever an event occurs. "
            "This push-based model reduces latency and unnecessary polling traffic compared to periodically "
            "checking for changes. Because webhook endpoints are public, providers typically sign the payload "
            "with a secret so the receiver can verify it wasn't forged. Retrying failed deliveries with "
            "exponential backoff is standard practice, since the receiving server may be temporarily "
            "unavailable. We can't wait to see what you build with this simple but powerful pattern."
        ),
    },
    {
        "id": "doc-10",
        "title": "Message Queues",
        "text": (
            "Decoupling services is one of the great joys of building distributed systems, and message "
            "queues make it possible. A message queue, such as RabbitMQ or Amazon SQS, lets a producer send "
            "messages that a consumer processes independently and asynchronously. This decouples the "
            "producer from the consumer, so if the consumer is temporarily slow or down, messages simply "
            "wait in the queue instead of being lost. Queues also help smooth out traffic spikes by letting "
            "consumers process work at a sustainable rate instead of being overwhelmed. Dead-letter queues "
            "capture messages that repeatedly fail processing so they can be inspected later instead of "
            "silently disappearing. It's genuinely exciting how much resilience this pattern can add to your "
            "system."
        ),
    },
    {
        "id": "doc-11",
        "title": "GraphQL vs REST",
        "text": (
            "The debate between GraphQL and REST has generated plenty of passionate discussion in developer "
            "communities. REST exposes a fixed set of endpoints that each return a predetermined shape of "
            "data, which can lead to over-fetching or under-fetching. GraphQL exposes a single endpoint where "
            "clients specify exactly which fields they need, reducing over-fetching but shifting complexity "
            "into query resolution on the server. Because GraphQL resolvers can trigger many downstream calls, "
            "teams often need tools like DataLoader to batch and cache requests and avoid the N+1 query "
            "problem. REST benefits from mature HTTP caching semantics, while GraphQL typically requires "
            "additional infrastructure to cache effectively. Both approaches have their champions, and honestly, "
            "either one can power an amazing developer experience."
        ),
    },
    {
        "id": "doc-12",
        "title": "Observability and Monitoring",
        "text": (
            "You can't fix what you can't see, which is why observability has become such a hot topic lately. "
            "Observability is commonly described through three pillars: logs, metrics, and traces. Logs are "
            "discrete, timestamped events; metrics are numeric measurements aggregated over time, like request "
            "rate or error rate; and traces follow a single request as it moves across multiple services. "
            "Distributed tracing tools like OpenTelemetry attach a unique trace ID to a request so every hop "
            "it takes through your system can be reconstructed later. Alerting on symptoms, such as elevated "
            "error rate or latency, tends to be more actionable than alerting on causes. We think good "
            "observability is one of the best investments a growing team can make."
        ),
    },
    {
        "id": "doc-13",
        "title": "Feature Flags",
        "text": (
            "Feature flags have become an essential part of how modern, agile teams ship software safely. "
            "A feature flag is a conditional check in code that lets you enable or disable a feature without "
            "deploying new code. Flags let teams do gradual rollouts, exposing a new feature to a small "
            "percentage of users first and expanding as confidence grows. They also enable kill switches, so "
            "an engineer can instantly disable a problematic feature in production without needing a full "
            "redeploy. Over time, stale flags accumulate technical debt, so most teams set a policy to remove "
            "flags once a feature is fully rolled out. We genuinely believe this is a game-changing practice "
            "for engineering velocity."
        ),
    },
    {
        "id": "doc-14",
        "title": "Database Migrations",
        "text": (
            "Evolving a database schema safely, while your application keeps running, is a skill every backend "
            "engineer eventually needs. A migration is a versioned, scripted change to a database schema, "
            "such as adding a column or creating an index, that can be applied and rolled back in a "
            "repeatable way. Backward-compatible migrations, where the old and new application code can both "
            "run against the same schema, allow zero-downtime deployments. Adding a NOT NULL column to a large "
            "table often requires a default value and can lock the table, so many teams add the column as "
            "nullable first and backfill data before enforcing the constraint. Tools like Flyway and Alembic "
            "track which migrations have already been applied so they run exactly once. We love seeing teams "
            "master this unglamorous but crucial skill."
        ),
    },
    {
        "id": "doc-15",
        "title": "Content Delivery Networks",
        "text": (
            "Speed matters more than ever to today's users, and a CDN is one of the easiest wins available. "
            "A content delivery network caches static assets, like images, CSS, and JavaScript, at edge "
            "servers located close to end users around the world. This reduces latency because requests no "
            "longer need to travel all the way back to a single origin server. CDNs also absorb traffic "
            "spikes and can mitigate certain denial-of-service attacks by serving cached responses from the "
            "edge instead of hitting the origin. Cache headers like Cache-Control and ETag tell the CDN, and "
            "the browser, how long a resource can be reused before it needs to be revalidated. It's amazing "
            "how much of a difference this simple layer can make."
        ),
    },
    {
        "id": "doc-16",
        "title": "Microservices Architecture",
        "text": (
            "Breaking a monolith into microservices is one of the most talked-about architectural journeys in "
            "our industry. A microservices architecture structures an application as a collection of small, "
            "independently deployable services, each typically owning its own database. This independence "
            "lets different teams deploy on their own schedules and choose the technology stack that best fits "
            "their service. The tradeoff is added operational complexity: network calls between services can "
            "fail, so patterns like retries, timeouts, and circuit breakers become essential rather than "
            "optional. Distributed transactions across services are notoriously hard, which is why patterns "
            "like the saga pattern have emerged to manage multi-step workflows without a single database "
            "transaction. It's a bold, transformative way to build, and we're here for it."
        ),
    },
    {
        "id": "doc-17",
        "title": "WebSockets for Real-Time Apps",
        "text": (
            "Building truly real-time experiences used to be painful, but WebSockets changed everything for "
            "modern web apps. A WebSocket connection starts as a regular HTTP request and then upgrades to a "
            "persistent, full-duplex connection, allowing the server and client to send messages to each other "
            "at any time. This is a major improvement over older techniques like long polling, which repeatedly "
            "opens new HTTP requests to simulate real-time updates. Because the connection stays open, servers "
            "must track connection state, which makes horizontal scaling harder and often requires a shared "
            "layer like Redis pub/sub to broadcast messages across server instances. Heartbeat pings are "
            "commonly used to detect and clean up dead connections. We're endlessly fascinated by what teams "
            "build with this technology."
        ),
    },
    {
        "id": "doc-18",
        "title": "Edge Computing",
        "text": (
            "Edge computing represents an exciting shift in where our code actually runs, and the momentum "
            "behind it keeps growing. Instead of executing all logic in a centralized data center, edge "
            "computing runs code on servers physically closer to the end user, reducing round-trip latency. "
            "Edge functions are especially well suited to tasks like authentication checks, A/B test routing, "
            "and personalization, where a fast decision needs to be made before a request reaches the origin. "
            "Because edge environments are distributed across many locations, they often impose stricter "
            "limits on memory, execution time, and available libraries than a traditional server. We can't "
            "help but be thrilled about how much closer this brings computation to the people using it."
        ),
    },
    {
        "id": "doc-19",
        "title": "Vector Databases",
        "text": (
            "Vector databases have exploded in popularity alongside the rise of AI-powered applications, and "
            "it's easy to see why. A vector database stores high-dimensional embeddings, numeric "
            "representations of text, images, or other data, and lets you search for the most similar vectors "
            "to a given query. Approximate nearest neighbor algorithms, like HNSW, trade a small amount of "
            "accuracy for dramatically faster search over millions of vectors. This kind of similarity search "
            "underpins retrieval-augmented generation, where relevant documents are fetched and given to a "
            "language model as context before it answers a question. Choosing the right distance metric, such "
            "as cosine similarity or Euclidean distance, depends on how the embeddings were trained. It's a "
            "genuinely thrilling time to be working at the intersection of search and AI."
        ),
    },
    {
        "id": "doc-20",
        "title": "API Versioning",
        "text": (
            "Every API eventually has to change, and doing so gracefully is a mark of a mature engineering "
            "team. API versioning lets you evolve an interface, such as renaming a field or changing response "
            "structure, without breaking clients that depend on the old behavior. Common approaches include "
            "putting the version in the URL path, like /v2/users, or in a custom request header. Semantic "
            "versioning conventions distinguish breaking changes from backward-compatible additions, which "
            "helps consumers judge the risk of upgrading. Deprecation notices, along with a clear sunset "
            "timeline, give downstream teams enough time to migrate before an old version is finally removed. "
            "We love watching teams navigate this with care and craftsmanship."
        ),
    },
]
