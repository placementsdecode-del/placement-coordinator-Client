export type RoadmapNode = {
  label: string;
  summary: string;
};

export type RoadmapTrack = {
  id: string;
  title: string;
  family: "Engineering" | "Data & AI" | "Infrastructure" | "Specialist";
  promise: string;
  estimatedTime: string;
  difficulty: string;
  packageRange: string;
  roles: string[];
  companies: string[];
  nodes: RoadmapNode[];
  projects: string[];
  questions: string[];
};

export function conceptsOf(node: RoadmapNode) {
  return node.summary
    .split(", ")
    .map((item) => item.replace(" and ", ", "))
    .flatMap((item) => item.split(", "))
    .map((item) => item.trim())
    .filter(Boolean);
}

const track = (
  id: string,
  title: string,
  family: RoadmapTrack["family"],
  promise: string,
  estimatedTime: string,
  difficulty: string,
  packageRange: string,
  roles: string[],
  companies: string[],
  nodes: [string, string][],
  projects: string[],
  questions: string[],
): RoadmapTrack => ({
  id,
  title,
  family,
  promise,
  estimatedTime,
  difficulty,
  packageRange,
  roles,
  companies,
  nodes: nodes.map(([label, summary]) => ({ label, summary })),
  projects,
  questions,
});

export const roadmapTracks: RoadmapTrack[] = [
  track("software", "Software Engineer", "Engineering", "Build strong programming, DSA, database and system-design foundations.", "6 months", "Intermediate", "6-18 LPA", ["Software Engineer", "Associate Developer", "SDE I"], ["Amazon", "Microsoft", "Oracle", "Zoho"], [
    ["Programming foundations", "Language syntax, debugging, memory and clean functions"], ["Object-oriented design", "Objects, contracts, composition, SOLID and testing"], ["Data structures", "Arrays, hashing, trees, heaps, graphs and complexity"], ["Algorithms", "Search, sorting, greedy, backtracking and dynamic programming"], ["Databases", "SQL, schema design, indexes and transactions"], ["Backend foundations", "HTTP, REST, authentication and service architecture"], ["System design", "Scale, cache, queues, partitioning and reliability"], ["Interview loop", "Coding, CS fundamentals, design and behavioral rounds"],
  ], ["Placement tracker CLI", "Assessment API", "URL shortener", "Distributed notification service"], ["Explain HashMap collision handling.", "When would you choose composition over inheritance?", "Design a scalable assessment platform."]),
  track("fullstack", "Full Stack Developer", "Engineering", "Own responsive interfaces, APIs, data and deployment end to end.", "7 months", "Intermediate", "5-16 LPA", ["Full Stack Developer", "Web Engineer", "Product Engineer"], ["Freshworks", "Razorpay", "Zoho", "Deloitte"], [
    ["Web foundations", "Semantic HTML, CSS layout, accessibility and browser basics"], ["JavaScript", "Language internals, DOM, async flow and modules"], ["Frontend framework", "React components, state, forms and routing"], ["Backend APIs", "Node services, validation, errors and authentication"], ["Databases", "Relational modeling, queries, indexes and caching"], ["Testing", "Unit, integration and end-to-end confidence"], ["Deployment", "Containers, CI/CD, cloud runtime and observability"], ["Portfolio and interviews", "Production project evidence and full-stack rounds"],
  ], ["Collaborative study planner", "Placement portal", "Realtime interview room", "E-commerce platform"], ["Trace a browser request end to end.", "How do you secure token authentication?", "How would you structure a growing full-stack repository?"]),
  track("frontend", "Frontend Developer", "Engineering", "Create fast, accessible and maintainable product interfaces.", "5 months", "Beginner to intermediate", "5-15 LPA", ["Frontend Developer", "React Developer", "UI Engineer"], ["Atlassian", "Postman", "Razorpay", "Publicis Sapient"], [
    ["HTML and accessibility", "Semantic structure, forms, keyboard and screen readers"], ["CSS and responsive UI", "Cascade, layout, design tokens and stable responsive behavior"], ["JavaScript", "Scope, closures, prototypes, async and the event loop"], ["TypeScript", "Safe application contracts, narrowing and generics"], ["React", "Components, state, effects, routing and data fetching"], ["Quality", "Testing, accessibility audits and error states"], ["Performance", "Rendering, network, bundles and Core Web Vitals"], ["Frontend system design", "Component architecture, caching and interview exercises"],
  ], ["Accessible portfolio", "Analytics dashboard", "Kanban board", "Component library"], ["How does the event loop schedule promises?", "What causes a React component to render?", "How do you diagnose layout overflow?"]),
  track("backend", "Backend Developer", "Engineering", "Design secure APIs, data models and reliable services.", "6 months", "Intermediate", "6-18 LPA", ["Backend Developer", "API Engineer", "Platform Engineer"], ["Amazon", "PhonePe", "Oracle", "Paytm"], [
    ["Programming language", "Java, Node.js or Python with testing and debugging"], ["HTTP and API design", "REST contracts, validation, pagination and errors"], ["Relational databases", "Modeling, SQL, indexes, isolation and migrations"], ["Authentication", "Sessions, tokens, OAuth and authorization"], ["Caching and queues", "Redis, background work, events and idempotency"], ["Service architecture", "Boundaries, dependencies and maintainable code"], ["Reliability", "Logs, metrics, tracing, resilience and deployment"], ["System design", "Capacity, partitioning, consistency and interview cases"],
  ], ["Authentication service", "URL shortener", "Notification queue", "Assessment platform API"], ["JWT or server session: how do you choose?", "How do database indexes affect writes?", "Design an idempotent payment endpoint."]),
  track("java", "Java Developer", "Engineering", "Move from core Java and DSA to Spring services and JVM production skills.", "6 months", "Intermediate", "6-18 LPA", ["Java Developer", "Spring Boot Developer", "Backend Engineer"], ["Oracle", "Infosys", "TCS", "Walmart Global Tech"], [
    ["Core Java", "JVM, types, control flow, methods, strings and arrays"], ["OOP", "Classes, interfaces, composition, SOLID and object contracts"], ["Collections and generics", "List, Set, Map, comparators, streams and complexity"], ["Exceptions and testing", "Failure boundaries, JUnit, mocking and build tools"], ["Concurrency", "Threads, executors, synchronization and virtual threads"], ["Spring Boot", "Web, validation, persistence, security and configuration"], ["Data and messaging", "JPA, transactions, Redis, Kafka and migrations"], ["JVM production", "Profiling, GC, observability, deployment and interviews"],
  ], ["Library manager", "Placement REST API", "Order service", "Event-driven notification system"], ["How does HashMap work?", "Explain transaction propagation.", "How would you diagnose high JVM memory usage?"]),
  track("python", "Python Developer", "Engineering", "Build tested Python applications, Django/FastAPI services and automation.", "5 months", "Beginner to intermediate", "5-15 LPA", ["Python Developer", "Django Developer", "FastAPI Developer"], ["Deloitte", "TCS", "Infosys", "Fractal"], [
    ["Python foundations", "Types, collections, functions, modules and environments"], ["Python data model", "Classes, protocols, iterators, generators and decorators"], ["Quality", "Type hints, pytest, linting and package structure"], ["Django", "Models, views, forms, auth, admin and REST APIs"], ["FastAPI", "Schemas, dependencies, async routes and OpenAPI"], ["Databases", "SQL, ORM sessions, transactions and migrations"], ["Async and background work", "Asyncio, task queues, caching and integrations"], ["Production", "Security, deployment, observability and interviews"],
  ], ["Automation CLI", "Django placement portal", "FastAPI assessment service", "Async data collector"], ["What does the GIL protect?", "Generator vs list: when and why?", "How do Django and FastAPI request lifecycles differ?"]),
  track("data-engineer", "Data Engineer", "Data & AI", "Build trustworthy batch and streaming data platforms.", "7 months", "Intermediate", "7-20 LPA", ["Data Engineer", "ETL Developer", "Analytics Engineer"], ["Fractal", "Tiger Analytics", "Amazon", "Deloitte"], [
    ["Python and SQL", "Data manipulation, testing, advanced queries and performance"], ["Data modeling", "Operational, analytical, star and dimensional models"], ["ETL and orchestration", "Reliable pipelines, scheduling, retries and lineage"], ["Warehouses and lakes", "Columnar formats, partitions and table layouts"], ["Distributed processing", "Spark execution, shuffles and optimization"], ["Streaming", "Kafka, event time, windows and delivery semantics"], ["Cloud data platform", "Storage, compute, IAM and infrastructure automation"], ["Data quality", "Contracts, observability, governance and interviews"],
  ], ["Batch placement report pipeline", "Streaming activity analytics", "Lakehouse model", "Data-quality monitoring service"], ["How do you make a pipeline idempotent?", "Partitioning vs bucketing?", "What causes a Spark shuffle?"]),
  track("ml", "Machine Learning Engineer", "Data & AI", "Build, evaluate and operate predictive systems from data to serving.", "8 months", "Advanced", "8-24 LPA", ["ML Engineer", "Applied Scientist", "MLOps Engineer"], ["Google", "Microsoft", "Fractal", "Tiger Analytics"], [
    ["Math and Python", "Probability, linear algebra, calculus and numerical Python"], ["Data preparation", "Exploration, leakage prevention, features and splits"], ["Classical ML", "Regression, trees, ensembles, clustering and metrics"], ["Deep learning", "Neural networks, optimization, CNNs and transformers"], ["Experimentation", "Baselines, validation, tracking and error analysis"], ["Serving", "Inference APIs, batch prediction and feature consistency"], ["MLOps", "Versioning, pipelines, monitoring and retraining"], ["ML system design", "Scale, safety, fairness and interviews"],
  ], ["Placement prediction model", "Resume classifier", "Recommendation service", "Monitored inference platform"], ["How do you detect data leakage?", "Precision vs recall: how do you choose?", "What causes training-serving skew?"]),
  track("ai", "AI Engineer", "Data & AI", "Build evaluated LLM, RAG and agent products with production controls.", "6 months", "Advanced", "8-22 LPA", ["AI Engineer", "LLM Engineer", "RAG Engineer"], ["Microsoft", "Accenture", "Deloitte", "Fractal"], [
    ["Python and APIs", "Typed Python, async I/O, HTTP and data handling"], ["Language models", "Tokens, context, generation and model limitations"], ["Prompt engineering", "Clear instructions, examples, structured output and evals"], ["Embeddings and retrieval", "Chunking, vector search, hybrid search and reranking"], ["RAG systems", "Grounding, citations, access control and evaluation"], ["Tool-using workflows", "Function calls, state graphs, MCP and approvals"], ["Agents", "Planning, memory, loop limits and human escalation"], ["Production AI", "Safety, tracing, quality, cost and latency"],
  ], ["Resume feedback assistant", "Cited study-material search", "Interview coach", "Placement workflow agent"], ["RAG vs fine-tuning?", "How do you evaluate answer faithfulness?", "What controls keep an agent from looping or misusing tools?"]),
  track("devops", "DevOps Engineer", "Infrastructure", "Automate delivery and operate reliable software platforms.", "6 months", "Intermediate", "6-18 LPA", ["DevOps Engineer", "Build Engineer", "Platform Engineer"], ["Amazon", "IBM", "Accenture", "Deloitte"], [
    ["Linux and networking", "Processes, permissions, shell, DNS, TCP and HTTP"], ["Git and automation", "Branching, scripting and repeatable workflows"], ["CI/CD", "Build, test, scan, release and rollback pipelines"], ["Containers", "Images, Dockerfiles, Compose, security and registries"], ["Kubernetes", "Workloads, networking, storage, configuration and probes"], ["Infrastructure as code", "Terraform state, modules and environment strategy"], ["Observability", "Metrics, logs, traces, alerts and incident response"], ["Reliability", "SLOs, capacity, resilience, cost and interviews"],
  ], ["CI pipeline", "Containerized application stack", "Kubernetes deployment", "Observable cloud platform"], ["What makes a deployment safe?", "Readiness vs liveness probe?", "How do you manage Terraform state?"]),
  track("cloud", "Cloud Engineer", "Infrastructure", "Design secure, resilient and cost-aware cloud infrastructure.", "6 months", "Intermediate", "6-20 LPA", ["Cloud Engineer", "Cloud Support Engineer", "Solutions Engineer"], ["AWS", "Microsoft", "IBM", "Oracle"], [
    ["Cloud foundations", "Regions, availability zones, shared responsibility and IAM"], ["Networking", "VPC, subnets, routes, gateways, DNS and load balancers"], ["Compute", "Virtual machines, autoscaling, containers and serverless"], ["Storage and databases", "Object, block, relational and NoSQL services"], ["Security", "Identity, encryption, secrets, audit and network controls"], ["Infrastructure as code", "Repeatable environments, policy and drift"], ["Reliability and cost", "Backups, multi-zone design, budgets and optimization"], ["Cloud architecture", "Migration, disaster recovery and interviews"],
  ], ["Highly available web stack", "Serverless assessment API", "Secure multi-tier VPC", "Disaster-recovery environment"], ["Security group vs network ACL?", "When is serverless a poor fit?", "How do RTO and RPO shape a design?"]),
  track("cyber", "Cyber Security", "Specialist", "Protect applications and infrastructure through practical defensive engineering.", "7 months", "Intermediate", "6-20 LPA", ["Security Analyst", "Application Security Engineer", "SOC Analyst"], ["Cisco", "IBM", "Deloitte", "Palo Alto Networks"], [
    ["Security foundations", "Threats, risk, controls, CIA and security models"], ["Networking and Linux", "Protocols, traffic analysis, processes and permissions"], ["Web security", "OWASP risks, sessions, injection and browser attacks"], ["Identity and cryptography", "Authentication, authorization, hashing, TLS and keys"], ["Detection and response", "Logs, SIEM, triage, containment and forensics"], ["Application security", "Threat modeling, secure review and dependency risk"], ["Cloud security", "IAM, secrets, posture, audit and incident readiness"], ["Security interviews", "Scenarios, reports, ethics and communication"],
  ], ["Secure web-app lab", "Threat model", "Detection rules", "Incident response playbook"], ["Hashing vs encryption?", "How would you investigate suspicious login activity?", "Explain one OWASP risk and its defense."]),
  track("mobile", "Mobile Developer", "Engineering", "Build reliable Android and cross-platform mobile applications.", "6 months", "Intermediate", "5-16 LPA", ["Android Developer", "Mobile Engineer", "React Native Developer"], ["Google", "PhonePe", "Swiggy", "Zoho"], [
    ["Language foundations", "Kotlin or Dart types, functions, OOP and async code"], ["Mobile UI", "Layouts, components, navigation and accessibility"], ["State and lifecycle", "Screen lifecycle, state holders and configuration changes"], ["Networking and storage", "HTTP clients, caching, local databases and offline flow"], ["Architecture", "Presentation, domain, data layers and dependency injection"], ["Device capabilities", "Permissions, notifications, background tasks and sensors"], ["Quality and release", "Testing, performance, security, signing and stores"], ["Mobile interviews", "Platform internals, architecture and coding rounds"],
  ], ["Habit tracker", "Offline study reader", "Placement alerts app", "Realtime mock interview app"], ["How do you preserve UI state?", "How would you design offline sync?", "What causes poor scrolling performance?"]),
  track("qa", "QA Automation Engineer", "Specialist", "Design confidence through risk-based testing and reliable automation.", "4 months", "Beginner to intermediate", "4-13 LPA", ["QA Engineer", "Automation Engineer", "SDET"], ["Accenture", "Cognizant", "TCS", "BrowserStack"], [
    ["Testing foundations", "Quality risks, test levels, cases and defect reports"], ["Web and API basics", "HTML, browser behavior, HTTP, JSON and SQL"], ["Programming", "Java, Python or TypeScript for maintainable automation"], ["UI automation", "Locators, waits, page objects and stable assertions"], ["API automation", "Contracts, authentication, data setup and negative tests"], ["Test architecture", "Fixtures, parallelism, reporting and flake control"], ["CI and performance", "Pipeline gates, load tests and observability"], ["SDET interviews", "Scenarios, coding, framework design and debugging"],
  ], ["Web test suite", "API contract suite", "Cross-browser pipeline", "Quality dashboard"], ["How do you diagnose a flaky test?", "What should not be automated?", "How do you test an idempotent API?"]),
  track("product", "Product Engineer", "Engineering", "Combine product judgment with broad implementation and operational ownership.", "7 months", "Intermediate", "7-20 LPA", ["Product Engineer", "Full Stack Engineer", "Founding Engineer"], ["Freshworks", "Postman", "Razorpay", "Chargebee"], [
    ["Product thinking", "User problems, outcomes, constraints and prioritization"], ["Frontend delivery", "Accessible UI, state, analytics and experimentation"], ["Backend delivery", "APIs, data models, auth and integrations"], ["End-to-end quality", "Testing, instrumentation and supportability"], ["Architecture", "Boundaries, build-vs-buy and evolutionary design"], ["Growth and experimentation", "Funnels, metrics, flags and trustworthy experiments"], ["Operations", "Release, observability, incidents and customer feedback"], ["Product interviews", "Execution stories, coding, design and tradeoffs"],
  ], ["User onboarding experiment", "Placement preparation product", "Feedback analytics loop", "Multi-tenant SaaS feature"], ["How do you turn a vague request into a small release?", "Which metric proves this feature worked?", "When would you accept technical debt?"]),
];

export const roadmapFamilies = ["All", "Engineering", "Data & AI", "Infrastructure", "Specialist"] as const;
