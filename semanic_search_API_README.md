# Plantstore Search API

## Overview

This service powers hybrid search, embedding, and autocomplete for Plantstore product data. It exposes RESTful endpoints to:

- Ingest or re-ingest product documents with generated embeddings and autocomplete tokens.
- Run hybrid kNN + keyword search with structured filters.
- Offer prefix-based autocomplete suggestions while a user types.

Base URL (local development): `http://localhost:8000`

All endpoints are versioned under `/api/v1`.

Authentication: Not required (add at gateway layer if needed).

---

## Common Concepts

| Term | Description |
|------|-------------|
| **ProductDocument** | Canonical product payload you POST for indexing. Mirrors the e-commerce catalog fields. |
| **Embedding Payload** | Service-generated `text` + `embedding` vector plus autocomplete fields derived from the document. |
| **Structured Filters** | Supported filters in `/search`: price range, categoryPath, tags, attributes.size, attributes.color, inStock. |
| **Autocomplete Fields** | `title_autocomplete`, `tags_autocomplete`, `sku_autocomplete` indexed with edge n-gram analyzers for prefix match. |
| **Media Fields** | `media` array (image metadata) plus denormalized `primaryImageUrl`, `primaryImageAlt` for quick rendering. |

---

## POST `/api/v1/embed-and-index`

Batch or single ingest endpoint. Generates embeddings and autocomplete tokens for each product, then indexes into OpenSearch (`products_v1`).

### Request Body

Accepts either a single object or an array of objects matching `ProductDocument`:

```jsonc
{
  "documentId": 11,
  "productId": 7,
  "variantId": 8,
  "compositeId": null,
  "title": "Monstera Deliciosa Green Small Terracotta Pot",
  "description": "Stunning tropical houseplant...",
  "categoryPath": ["indoor", "tropical-plants"],
  "tags": ["indoor plants", "green"],
  "attributes": {
    "sku": "MON-001-SML",
    "size": "Small",
    "color": "Green",
    "type": "variant"
  },
  "media": [
    {
      "mediaType": "IMAGE",
      "url": "https://example.com/img/fern-small.jpg",
      "altText": "Small indoor fern",
      "primary": true,
      "sortOrder": 0,
      "metadata": {}
    }
  ],
  "primaryImageUrl": "https://example.com/img/fern-small.jpg",
  "primaryImageAlt": "Small indoor fern",
  "price": 799.0,
  "inStock": true
}
```

### Response Body

```json
{
  "status": "indexed",        // or "partial_failure"
  "ids": ["11", "10"],        // documentIds successfully indexed
  "failed": [                   // only present when status == partial_failure
    { "id": "9", "error": "<error message>" }
  ]
}
```

### Status Codes

| Code | Meaning |
|------|---------|
| 200  | All documents processed (with or without partial failures). |
| 422  | Validation error on request payload. |
| 500  | Unexpected error indexing into OpenSearch. |

### Example

```bash
curl --location 'http://localhost:8000/api/v1/embed-and-index' \
  --header 'Content-Type: application/json' \
  --data @products.json
```

---

## POST `/api/v1/search`

Performs hybrid search combining semantic kNN, keyword multi-match, and structured filters.

### Request Body (`SearchRequest`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `query` | string | No | Natural language or keywords. Embeddings generated automatically. |
| `filters` | object | No | Structured filters (see below). |
| `size` | integer | No | Number of hits (default `10`, max `50`). |
| `from` | integer | No | Pagination offset (default `0`). |

Supported `filters` keys:
- `price`: object with `gte`, `lte`, etc.
- `categoryPath`: string or array of strings.
- `tags`: string or array of strings.
- `attributes.color`, `attributes.size`: string.
- `inStock`: boolean.

### Response Body (`SearchResponse`)

```jsonc
{
  "total": 3,
  "hits": [
    {
      "id": "11",
      "score": 8.73,
      "source": {
        "documentId": 11,
        "title": "Monstera Deliciosa Green Small Terracotta Pot",
        "categoryPath": ["indoor", "tropical-plants"],
        "tags": ["indoor plants", "green"],
        "media": [
          {
            "mediaType": "IMAGE",
            "url": "https://example.com/img/fern-small.jpg",
            "altText": "Small indoor fern",
            "primary": true
          }
        ],
        "primaryImageUrl": "https://example.com/img/fern-small.jpg",
        "primaryImageAlt": "Small indoor fern",
        "price": 799.0,
        "inStock": true,
        "attributes": { "sku": "MON-001-SML", "color": "Green" }
      }
    }
  ]
}
```

### Status Codes

| Code | Meaning |
|------|---------|
| 200  | Search succeeded. |
| 400  | `size` exceeds configured max or invalid filter value. |
| 500  | Downstream OpenSearch error. |

### Example

```bash
curl --location 'http://localhost:8000/api/v1/search' \
  --header 'Content-Type: application/json' \
  --data '{
    "query": "indoor tropical plant",
    "filters": {
      "attributes.color": "Green",
      "inStock": true
    },
    "size": 10
  }'
```

---

## GET `/api/v1/autocomplete`

Returns prefix-based suggestions while a user types. Uses edge n-gram analyzers across title, tags, and SKU fields.

### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `query` | string | Yes | User input to match; must be at least 1 character. |
| `size` | integer | No | Number of suggestions (default `10`, max `50`). |

### Response Body

```jsonc
{
  "query": "ind",
  "suggestions": [
    {
      "text": "Indoor Fern Green Large Floor",
      "source": "title_autocomplete",
      "id": "5",
      "score": 4.21,
      "primaryImageUrl": "https://example.com/img/fern-large.jpg",
      "primaryImageAlt": "Large indoor fern"
    },
    {
      "text": "indoor plants",
      "source": "tags_autocomplete",
      "id": "5",
      "score": 3.89
    }
  ]
}
```

- `text`: Suggested string to display.
- `source`: Field that produced the match (`title_autocomplete`, `tags_autocomplete`, or `sku_autocomplete`).
- `id`: OpenSearch document `_id` (matches `documentId`).
- `score`: OpenSearch relevance score.

### Status Codes

| Code | Meaning |
|------|---------|
| 200  | Suggestions returned. Empty `suggestions` when no match. |
| 400  | Invalid query (e.g., missing or too short). |
| 500  | Downstream OpenSearch error. |

### Example

```bash
curl 'http://localhost:8000/api/v1/autocomplete?query=ind&size=5'
```

---

## Operational Notes

- **Index Setup**: The service creates `products_v1` on startup with kNN enabled, autocomplete analyzers, and media storage. Drop/recreate the index when mappings change.
- **Reindexing**: After deleting `products_v1`, restart the service (or rerun `ensure_index()`), then POST products via `/api/v1/embed-and-index` so vectors, autocomplete fields, and media are repopulated.
- **Timeouts**: OpenSearch client defaults to 30s with retry-on-timeout enabled.
- **Logging**: Each endpoint logs timing metrics (`build_search_body`, `/search` duration, `/autocomplete` query time) for quick performance checks.
- **Pagination**: Combine `from` + `size` in `/search` for offsets; note large offsets can impact latency.

---

## Change Log (API)

| Version | Changes |
|---------|---------|
| `v0.1.0` | Initial contract for `/embed-and-index`, `/search`, `/autocomplete`. |
