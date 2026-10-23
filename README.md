# noon

Online shop built as microservices. Customer project for [Caelo](https://caelo.cloud): each service is
onboarded to Caelo, which builds, tests and scans it in our AWS account on every push.

## Services

| Service | Folder | What it does | Status |
| --- | --- | --- | --- |
| products | [`services/products`](services/products) | Product catalogue: list, search, view and add products | First service (MVP) |

Planned next: `orders`, `cart`, `payments`, `storefront` (each in its own folder under `services/`).

## Layout

```
noon/
├── catalog-info.yaml          # Backstage: the "noon" system and where its services are
├── services/
│   └── products/              # one folder per microservice, built and deployed on its own
│       ├── src/  test/
│       ├── openapi.yaml
│       ├── Dockerfile
│       └── catalog-info.yaml  # Backstage: the service and its API
└── .github/workflows/         # one CI workflow per service, triggered only by its folder
```

## Run a service locally

```bash
cd services/products
npm ci
npm test
npm start            # http://localhost:8080/products
```

With Docker:

```bash
docker build -t noon-products services/products
docker run --rm -p 8080:8080 noon-products
```

## Conventions

- Each service listens on `PORT` (default 8080) and exposes `/healthz` (liveness) and `/readyz` (readiness).
- Each service has an OpenAPI spec, tests, a non-root container image and its own `catalog-info.yaml`.
- Services do not share code or databases; they talk over HTTP APIs.
