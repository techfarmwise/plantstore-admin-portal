# Admin Dashboard Backend Reference

This document summarizes the context and REST APIs that the admin dashboard (React) must consume for product onboarding and inventory management. It is meant to be handed off to the frontend team or another LLM so it can build the UI against the existing Spring Boot backend.

---

## 1. System Context

- **Platform:** PlantStore multi-module Spring Boot monolith, backed by PostgreSQL.
- **Primary Admin Roles:** `ADMIN`, `PRODUCT`, `INVENTORY` (JWT-based auth).
- **Modules exposed here:**
  - `auth`: authentication, token management.
  - `catalog`: product & composite onboarding.
  - `inventory`: warehouse management, stock tracking, adjustments, reservations.
  - `product-search-engine`: customer-facing product discovery & suggestion APIs.
- **Current Scope:** Payments are not yet integrated into the admin UI; focus on catalog + inventory workflows.

### 1.1 Authentication Overview

- Admin users log in with email or phone + password using `/api/v1/auth/login/password`.
- Backend returns `{ accessToken, refreshToken }`; access token is a JWT containing role claims.
- Refresh tokens are rotated on refresh.
- All subsequent API calls must send `Authorization: Bearer <accessToken>`.

### 1.2 Error Handling

- API errors follow a common shape:

```jsonc
{
  "timestamp": "2025-12-15T17:45:58.064348+05:30",
  "status": 404,
  "error": "Not Found",
  "code": "INVENTORY_STOCK_NOT_FOUND",
  "message": "Stock not found for variant 2 in warehouse 1",
  "details": null,
  "path": "/api/v1/orders",
  "traceId": "...",
  "spanId": "..."
}
```

- `message` is human-readable; `code` maps to a centralized bundle for UI localization.

---

## 2. Authentication APIs

| Purpose | Method & Path | Request Body | Success Response |
|---------|---------------|--------------|------------------|
| Login with password | `POST /api/v1/auth/login/password` | `{ "identifier": "admin@example.com", "password": "secret" }` | `{ "accessToken": "…", "refreshToken": "…" }` |
| Refresh token | `POST /api/v1/auth/token/refresh` | `{ "userId": 12, "refreshToken": "…" }` | `{ "accessToken": "…", "refreshToken": "…" }` |
| Logout (invalidate refresh token) | `POST /api/v1/auth/logout` | `{ "userId": 12, "refreshToken": "…" }` | HTTP `204 No Content` |
| OTP login (optional) | `POST /api/v1/auth/login/otp/initiate` & `POST /api/v1/auth/login/otp/verify` | Phone number, OTP | same TokenResponse |
| Password reset – request OTP | `POST /api/v1/auth/password/reset/request` | `{ "phone": "+91XXXXXXXXXX" }` | `{ "resetToken": "…", "expiresInSeconds": 600, "otp": "…" }` *(OTP echoed only in lower envs – prod SMS only)* |
| Password reset – verify OTP | `POST /api/v1/auth/password/reset/verify` | `{ "resetToken": "…", "otp": "123456" }` | `{ "verificationToken": "…", "expiresInSeconds": 300 }` |
| Password reset – confirm password | `POST /api/v1/auth/password/reset/confirm` | `{ "verificationToken": "…", "newPassword": "S3curePass!", "confirmPassword": "S3curePass!" }` | HTTP `204 No Content` |

> Frontend should persist both tokens and refresh when access expires.

**Password reset flow**

1. **Request OTP** (phone only):
   ```jsonc
   {
     "phone": "+91-90000-12345"
   }
   ```
   Response includes `resetToken` (client stores securely), `expiresInSeconds`, and `otp`. In production the OTP is sent via SMS; sandbox environments may echo it for testing.

2. **Verify OTP** using the `resetToken` + user-entered OTP:
   ```jsonc
   {
     "resetToken": "1f0d0c4b7f2a4f8d9c5b2f4c6e1a3b7d",
     "otp": "482916"
   }
   ```
   Response returns `verificationToken` valid for ~5 minutes. OTP attempts are capped (`AUTH_PASSWORD_RESET_LIMIT_REACHED`).

3. **Confirm new password** with the `verificationToken`:
   ```jsonc
   {
     "verificationToken": "a4b2c6d8e0f1234567890abcdef12345",
     "newPassword": "S3curePassw0rd!",
     "confirmPassword": "S3curePassw0rd!"
   }
   ```
   On success backend revokes prior refresh tokens and returns `204`. UI should prompt user to log in again.

---

## 3. Catalog Management APIs

### 3.1 Product APIs (`/api/v1/catalog/products`)

- **`POST /`** – Create product
  - **Body (ProductCreateRequest):**
    ```jsonc
    {
      "name": "Snake Plant",
      "categoryLabel": "Indoor",
      "description": "…",
      "active": true,
      "categoryIds": [1, 3],
      "variants": [
        {
          "sku": "SNK-001",
          "size": "Medium",
          "color": "Green",
          "style": null,
          "basePrice": 599.00,
          "weightGrams": 750,
          "dimensions": "{\"height\":60}",
          "images": [
            {
              "url": "https://…",
              "altText": "Pot",
              "primary": true,
              "sortOrder": 1,
              "mediaType": "IMAGE",
              "metadata": {
                "width": 1200,
                "height": 1600,
                "focalPoint": "center"
              }
            }
          ],
          "pricing": {
            "mrp": 649.00,
            "sellingPrice": 599.00,
            "discountPercent": 8,
            "startDatetime": "2025-12-01T00:00:00Z",
            "endDatetime": null,
            "active": true
          }
        }
      ]
    }
    ```
  - `mediaType` accepts `IMAGE` or `VIDEO`; include `metadata` map for additional media attributes (e.g. duration, thumbnail URL).
  - **Response:** `ProductResponse` with `categoryLabel`, nested variants, pricing, images (example below).

- **`PUT /{productId}`** – Update product + delta operations for variants (supports adding, updating, deleting via payload).
- **`DELETE /{productId}`** – Archive product (ensures no stock reserved).
- **`GET /`** – List products (returns `ProductSummaryResponse { productId, name, categoryLabel, active }`).
- **`GET /{productId}`** – Full product aggregate including `categoryLabel`, categories, variants, pricing, images.
- **`POST /search`** – Admin search with filters + sorting/pagination.
  ```jsonc
  {
    "name": "snake",
    "categoryLabel": "Indoor",
    "categoryIds": [1, 3],
    "skus": ["SNK-001", "SNK-002"],
    "isActive": true,
    "minPrice": 499.0,
    "maxPrice": 2499.0,
    "limit": 25,
    "offset": 0,
    "sort": { "field": "MIN_PRICE", "direction": "ASC" }
  }
  ```
  Response returns `items` with `productId`, `name`, `categoryLabel`, `isActive`, `createdAt`, `variantCount`, `minPrice`, `maxPrice`, `categoryNames`, `skus`, plus `total`, `limit`, `offset`. Sorting supports `NAME`, `CATEGORY`, `CREATED_AT`, `MIN_PRICE`, `MAX_PRICE`, `VARIANT_COUNT`, `ACTIVE`.

**ProductResponse example**

```jsonc
{
  "productId": 2,
  "name": "Snake Plant",
  "description": "Low-maintenance indoor plant",
  "categoryLabel": "Indoor",
  "active": true,
  "categories": [
    {
      "categoryId": 1,
      "name": "Indoor Plants",
      "slug": "indoor-plants",
      "parentId": null,
      "sortOrder": 10,
      "active": true
    }
  ],
  "variants": [
    {
      "variantId": 10,
      "sku": "SNK-001",
      "size": "Medium",
      "price": {
        "mrp": 649.0,
        "sellingPrice": 599.0,
        "discountPercent": 8,
        "active": true
      }
    }
  ],
  "images": [
    {
      "imageId": 501,
      "productItemId": 2001,
      "url": "https://…",
      "altText": "Planter",
      "primary": true,
      "sortOrder": 1,
      "mediaType": "IMAGE",
      "metadata": {
        "width": 1200,
        "height": 1600,
        "focalPoint": "center"
      }
    }
  ]
}
```

- `mediaType` supports `IMAGE` or `VIDEO`; `metadata` is a flexible map (e.g., `{ "durationSeconds": 48, "thumbnailUrl": "..." }`).

### 3.2 Composite Product APIs (`/api/v1/catalog/composites`)

- Manage bundled offerings that map to multiple variants.
- **`POST /`** – Create composite
  ```jsonc
  {
    "name": "Gift Combo",
    "description": "Planter + Tools",
    "pricingMode": "FIXED", // or DYNAMIC
    "fixedPrice": 1299.00,
    "active": true,
    "items": [
      {"variantId": 10, "quantityRequired": 1},
      {"variantId": 11, "quantityRequired": 2}
    ]
  }
  ```
- **`PUT /{compositeId}`** – Update name, pricing mode, fixed price, component list.
- **`GET /`** – List composites.
- **`GET /{compositeId}`** – Retrieve composite detail.
- **`DELETE /{compositeId}`** – Archive composite (ensures no active stock dependencies).
- **`POST /search`** – Filter composites with pagination/sorting.
  ```jsonc
  {
    "name": "gift",
    "pricingMode": "FIXED",
    "isActive": true,
    "variantSkuQuery": "FIG-",
    "minPrice": 999.0,
    "maxPrice": 2999.0,
    "limit": 25,
    "offset": 0,
    "sort": { "field": "MIN_PRICE", "direction": "ASC" }
  }
  ```
  Response returns `items` with composite metadata, pricing bounds, item count, variant summaries (name + SKU), plus `total`, `limit`, `offset`. Sort fields: `NAME`, `PRICING_MODE`, `MIN_PRICE`, `MAX_PRICE`, `ITEM_COUNT`, `ACTIVE`.

### 3.3 Variant APIs (`/api/v1/catalog/variants`)

- **`POST /search-lite`** – Lightweight type-ahead lookup by variant name or SKU (case-insensitive).
  ```jsonc
  {
    "query": "fig",
    "limit": 10,
    "offset": 0
  }
  ```
  Response:
  ```jsonc
  {
    "items": [
      {
        "variantId": 12,
        "displayName": "Fig Plant – Large",
        "sku": "FIG-L"
      }
    ],
    "total": 3,
    "limit": 10,
    "offset": 0
  }
  ```
  `limit` defaults to 10 (max 25). Blank/whitespace-only `query` returns an empty result set.

### 3.4 Category APIs (`/api/v1/catalog/categories`)

Provide canonical category list for product onboarding. Parents can form hierarchies; `slug` must be unique.

| Endpoint | Description | Request Body / Params | Response |
|----------|-------------|-----------------------|----------|
| `GET /` | List all categories (sorted) | – | `[ { "categoryId", "name", "slug", "parentId", "sortOrder", "active" } ]` |
| `GET /{categoryId}` | Fetch single category | Path `categoryId` | `CategoryResponse` |
| `POST /` | Create category | `{ "name", "slug", "parentId": null, "sortOrder": 10, "active": true }` | `CategoryResponse` |
| `PUT /{categoryId}` | Update fields | Any subset of `{ "name", "slug", "parentId", "sortOrder", "active" }` | `CategoryResponse` |
| `DELETE /{categoryId}` | Remove category (fails if attached to products) | Path `categoryId` | HTTP `204` |

Validation highlights:
- `slug` must be unique; conflicts return `api.error.catalog.categorySlugConflict`.
- `parentId` (if supplied) must reference an existing category and cannot equal the category itself.
- Delete is blocked when products reference the category (`api.error.catalog.categoryInUse`).

**CategoryResponse schema**

```jsonc
{
  "categoryId": 12,
  "name": "Indoor Plants",
  "slug": "indoor-plants",
  "parentId": null,
  "sortOrder": 10,
  "active": true
}
```

**Create request example**

```jsonc
{
  "name": "Succulents",
  "slug": "succulents",
  "parentId": 12,
  "sortOrder": 20,
  "active": true
}
```

**Update request example** – send only fields to change

```jsonc
{
  "name": "Table-Top Succulents",
  "sortOrder": 25
}
```

**Error responses** (HTTP `400/404/409`)

```jsonc
{
  "status": 409,
  "code": "CATALOG_CATEGORY_CONFLICT",
  "message": "Category 12 is assigned to 7 products",
  "details": [],
  "path": "/api/v1/catalog/categories/12",
  "traceId": "..."
}
```

**UI considerations**
1. Show `active` flag toggle in forms; inactive categories stay retrievable for audit.
2. Use `sortOrder` for manual ordering; client can sort ascending.
3. Parent selection dropdown should call `GET /categories` and filter out current category when editing.
4. Handle 409 conflicts gracefully (toast + highlight slug/name field).

---

## 4. Customer Self-Service APIs (`/api/v1/customers/me`)

Profile flows let authenticated customers manage their own details and addresses. Responses now surface role assignments from `app_user.roles` so the UI can adjust feature availability.

| Method & Path | Description | Request | Response |
|---------------|-------------|---------|----------|
| `GET /api/v1/customers/me` | Fetch current customer profile | – | `CustomerProfileResponse` |
| `PUT /api/v1/customers/me` | Update name/email/phone | `{ "name": "Aditi", "email": "aditi@example.com" }` | Updated `CustomerProfileResponse` |
| `GET /api/v1/customers/me/addresses` | List saved addresses | – | `[ CustomerAddressResponse ]` |
| `POST /api/v1/customers/me/addresses` | Create address | `CustomerAddressCreateRequest` | `CustomerAddressResponse` |
| `PUT /api/v1/customers/me/addresses/{addressId}` | Update address | `CustomerAddressUpdateRequest` | `CustomerAddressResponse` |
| `DELETE /api/v1/customers/me/addresses/{addressId}` | Delete address | – | HTTP `204` |
| `POST /api/v1/customers/me/addresses/{addressId}/default` | Mark default address | – | Updated `CustomerAddressResponse` |

**CustomerProfileResponse**

```jsonc
{
  "customerId": 42,
  "name": "Aditi",
  "email": "aditi@example.com",
  "phone": "+91-90000-12345",
  "phoneVerified": true,
  "roles": ["CUSTOMER", "PRODUCT"],
  "addresses": [
    {
      "addressId": 101,
      "line1": "14 MG Road",
      "city": "Bengaluru",
      "state": "KA",
      "postalCode": "560001",
      "country": "IN",
      "isDefault": true
    }
  ]
}
```

> UI tip: check `roles` to unlock catalog/admin tiles for hybrid users. Phone verification and role data come from `app_user` via a join, so they remain accurate even after admin updates.

---

## 5. Admin Customer APIs (`/api/v1/admin/customers`)

- **`POST /`** – Admin onboard user + linked customer.
  ```jsonc
  {
    "name": "Warehouse Ops",
    "email": "ops@example.com",
    "phone": "+91-90000-12345",
    "roles": ["INVENTORY"]
  }
  ```
  - At least one role required (`ADMIN`, `PRODUCT`, `INVENTORY`).
  - Phone is mandatory because onboarding triggers the password-reset OTP flow automatically.
  - Response mirrors `CustomerSearchResultItem`:
    ```jsonc
    {
      "customerId": 204,
      "userId": 311,
      "name": "Warehouse Ops",
      "email": "ops@example.com",
      "phone": "+91-90000-12345",
      "isActive": true,
      "phoneVerified": false,
      "roles": ["INVENTORY"],
      "createdAt": "2025-12-16T08:09:12.341Z"
    }
    ```
  - Side effects: creates `app_user` + `customer`, sends OTP via `PasswordResetService` so the user can set a password using `/api/v1/auth/password/reset/*`.

- **`POST /search`** – Search customers with flexible filters.
  ```jsonc
  {
    "name": "fiddle",
    "email": "example",
    "phone": "9876",
    "role": "CUSTOMER",
    "isActive": true,
    "limit": 50,
    "offset": 0,
    "sort": { "field": "NAME", "direction": "ASC" }
  }
  ```
  Response:
  ```jsonc
  {
    "items": [
      {
        "customerId": 12,
        "userId": 5,
        "name": "Fiddle Leaf Fan",
        "email": "plantlover@example.com",
        "phone": "91-9876543210",
        "isActive": true,
        "phoneVerified": true,
        "roles": ["CUSTOMER"],
        "createdAt": "2025-12-14T20:45:05.391Z"
      }
    ],
    "total": 83,
    "limit": 50,
    "offset": 0
  }
  ```
  > Text filters use case-insensitive LIKE matching. Sorting defaults to `NAME ASC`. Additional filters can be added later without breaking clients.

- **`PUT /{customerId}`** – Update customer contact info, roles, and status.
  ```jsonc
  {
    "email": "fiddle.admin@example.com",
    "phone": "+91-9876543210",
    "roles": ["ADMIN", "PRODUCT"],
    "isActive": true
  }
  ```
  - Leave `password` blank unless a reset is required; when supplied, it must meet minimum policy and will be re-hashed before persistence.
  - Returns the refreshed customer snapshot so the UI can refresh in place.
  - Email/phone updates sync both `customer` and `app_user`; uniqueness is enforced.

## 6. Product Search Engine APIs (`/api/v1/product-search-engine`)

Module: `product-search-engine` — customer-facing discovery layer powering storefront search experiences.

- **`POST /search`** – Execute catalog search across products, variants, and composites with pricing + stock awareness (@modules/product-search-engine/src/main/java/com/mritika/plantstore/productsearch/api/SearchController.java#25-61)
  ```jsonc
  {
    "query": "fiddle",
    "categorySlugs": ["indoor"],
    "tags": ["foliage"],
    "priceMin": 499.0,
    "priceMax": 2499.0,
    "productIds": [12],
    "variantIds": [],
    "compositeIds": [],
    "sort": "PRICE_ASC",          // optional, defaults to RELEVANCE
    "page": 0,
    "pageSize": 20,               // max 50
    "requireInStock": true
  }
  ```
  Response (`SearchResponse`):
  ```jsonc
  {
    "total": 83,
    "page": 0,
    "pageSize": 20,
    "elapsedMs": 12,
    "items": [
      {
        "documentId": 501,
        "productId": 12,
        "variantId": null,
        "compositeId": null,
        "title": "Sansevieria Zeylencia Golden with Arbor Metal Planter",
        "description": "Low-maintenance indoor plant with air-purifying properties",
        "price": 2699.0,
        "priceRange": {
          "min": 2699.0,
          "max": 2699.0
        },
        "availableColors": ["white", "green", "yellow", "black", "blue"],
        "availableSizes": ["medium"],
        "inStock": true,
        "categoryPath": ["indoor", "air-purifying"],
        "tags": ["sansevieria", "indoor", "white", "green", "yellow", "medium", "air-purifying"],
        "media": [
          {
            "mediaType": "IMAGE",
            "url": "https://cdn.plantstore.dev/images/fiddle-fig-primary.jpg",
            "altText": "Fiddle Leaf Fig in white pot",
            "primary": true,
            "sortOrder": 0,
            "metadata": {
              "width": 1200,
              "height": 1600,
              "focalPoint": "center"
            }
          },
          {
            "mediaType": "VIDEO",
            "url": "https://cdn.plantstore.dev/videos/fiddle-care.mp4",
            "altText": "Fiddle Leaf Fig care walkthrough",
            "primary": false,
            "sortOrder": 1,
            "metadata": {
              "durationSeconds": 48,
              "thumbnailUrl": "https://cdn.plantstore.dev/videos/fiddle-care-thumb.jpg"
            }
          }
        ],
        "variantOptions": [
          {
            "variantId": 101,
            "sku": "SNK-WHT-M",
            "color": "White",
            "size": "Medium",
            "style": null,
            "price": 2699.0,
            "imageUrl": "https://cdn.plantstore.dev/images/sansevieria-white.jpg",
            "imageAlt": "Sansevieria with white planter",
            "inStock": true
          },
          {
            "variantId": 102,
            "sku": "SNK-GRN-M",
            "color": "Green",
            "size": "Medium",
            "style": null,
            "price": 2699.0,
            "imageUrl": "https://cdn.plantstore.dev/images/sansevieria-green.jpg",
            "imageAlt": "Sansevieria with green planter",
            "inStock": true
          },
          {
            "variantId": 103,
            "sku": "SNK-YLW-M",
            "color": "Yellow",
            "size": "Medium",
            "style": null,
            "price": 2699.0,
            "imageUrl": "https://cdn.plantstore.dev/images/sansevieria-yellow.jpg",
            "imageAlt": "Sansevieria with yellow planter",
            "inStock": false
          }
        ],
        "attributes": {
          "type": "product"
        }
      }
    ]
  }
  ```
  - Sort options: `RELEVANCE`, `PRICE_ASC`, `PRICE_DESC`, `POPULARITY`, `NEWEST`. Unknown values fall back to relevance.
  - `requireInStock=true` filters variants with zero on-hand stock by calling the inventory service.

- **`GET /suggest`** – Typeahead suggestions sourced from indexed documents (@modules/product-search-engine/src/main/java/com/mritika/plantstore/productsearch/api/SearchController.java#63-69)
  ```http
  GET /api/v1/product-search-engine/suggest?q=fig&limit=10
  ```
  Returns an array of strings. `limit` defaults to 10 (max 20). Blank/whitespace `q` yields an empty list.

- **`POST /reindex`** – Admin-triggered reindex operations (@modules/product-search-engine/src/main/java/com/mritika/plantstore/productsearch/api/SearchAdminController.java#13-51)
  - `POST /api/v1/product-search-engine/reindex` → full rebuild (`202 Accepted`).
  - `POST /api/v1/product-search-engine/reindex?type=variant&id=45` → targeted rebuild (`type` ∈ {`product`, `variant`, `composite`} ).
  - Requires `ADMIN` authority (see `SecurityConfig`).

**Implementation notes**
- **Product-level aggregation**: Search results now return one document per product with all variants grouped in `variantOptions` array. Each variant option includes `variantId`, `sku`, `color`, `size`, `price`, `imageUrl`, and `inStock` status for frontend color/size selectors.
- **Variant-level stock**: Each variant in `variantOptions[]` has an `inStock` boolean indicating real-time availability. Use this to disable/gray out unavailable color/size options in the UI.
- **Price ranges**: `priceRange.min` and `priceRange.max` show the price spread across all variants. Use this for "Starting at ₹X" displays.
- **Available filters**: `availableColors` and `availableSizes` arrays enable quick filtering without loading all variant details.
- **Media**: The `media` array contains primary product images (from the first variant). Each variant's specific image is in `variantOptions[].imageUrl`.
- **Composites**: Composite products remain as single documents without `variantOptions`.
- **Reindexing**: Run `POST /api/v1/product-search-engine/reindex` after product/variant/media/stock updates to refresh the search index.

## 7. Search APIs (`/api/v1/search`)

- **`POST /`** – Execute catalog search across products, variants, and composites.
  ```jsonc
  {
    "query": "fiddle",
    "categorySlugs": ["indoor"],
    "tags": ["Indoor"],
    "priceMin": 499,
    "priceMax": 2499,
    "productIds": [12],
    "variantIds": [],
    "compositeIds": [],
    "sort": "PRICE_ASC",
    "page": 0,
    "pageSize": 20,
    "requireInStock": true
  }
  ```
  Response highlights total hits, page metadata, elapsed time, and result list. Sort accepts `RELEVANCE`, `PRICE_ASC`, `PRICE_DESC`, `NEWEST`.

- **`GET /suggest?q=...&limit=10`** – Returns an array of search suggestions (max 20). Use for autocomplete.

- **`POST /reindex`** – Admin-only reindex trigger.
  - Without params → kicks off full rebuild (accepted response).
  - With query params (`type=product|variant|composite`, `id=<long>`) → reindex specific entity.

## 7. Inventory Management APIs

### 4.1 Warehouse APIs (`/api/v1/inventory/warehouses`)

| Endpoint | Description | Request (body/path) | Response |
|----------|-------------|---------------------|----------|
| `POST /` | Create warehouse | `{ "name": "Mumbai DC", "code": "MUM-01", "address": "…" }` | `WarehouseResponse { warehouseId, name, code, address }` |
| `GET /` | List all warehouses | – | `[WarehouseResponse]` |
| `GET /{warehouseId}` | Fetch single warehouse | `warehouseId` | `WarehouseResponse` |

### 4.2 Stock Queries (`/api/v1/inventory/stock`)

- `GET /variant/{variantId}` → `[ { variantId, warehouseId, quantityAvailable, quantityReserved } ]`
- `GET /warehouse/{warehouseId}` → same structure filtered by warehouse.
- **`POST /search`** – Rich stock lookup with pagination and filters. Sample request:
  ```jsonc
  {
    "warehouseId": 1,
    "search": "fiddle",
    "variantIds": [1]
    "tags": ["Indoor"],
    "limit": 25,
    "offset": 0,
    "sortField": "PRODUCT_NAME",
    "sortDirection": "ASC"
  }
  ```
  Response:
  ```jsonc
  {
    "items": [
      {
        "productId": 12,
        "productName": "Fiddle Leaf Fig",
        "tags": ["Indoor", "Foliage"],
        "variantId": 45,
        "variantName": "Fiddle Leaf Fig 10-inch Pot",
        "sku": "FLF-10",
        "warehouseId": 1,
        "warehouseCode": "WH-001",
        "quantityAvailable": 24,
        "quantityReserved": 1,
        "quantityTotal": 25
      }
    ],
    "total": 83,
    "limit": 25,
    "offset": 0
  }
  ```
  > Filters support partial (case-insensitive) matches across product/variant name, SKU, plus optional tag, productId, variantId, warehouseId, and quantity ranges. `limit` defaults to 50 (max 200).

### 4.3 Stock Adjustments (`/api/v1/inventory/adjustments`)

- **`GET /reasons`** – Returns `[ { "reasonId": 1, "code": "INITIAL_LOAD", "description": "Initial inventory" }, … ]`.
- **`POST /`** – Apply adjustment; positive `quantityDelta` increases available stock.
  ```jsonc
  {
    "variantId": 2,
    "warehouseId": 1,
    "quantityDelta": 10,
    "reasonId": 1,
    "comment": "Manual top-up",
    "createdBy": "admin@example.com",
    "referenceType": "MANUAL",
    "referenceId": "UI-20251215"
  }
  ```
- Response: `AdjustmentResponse { adjustmentId, variantId, warehouseId, quantityDelta, reasonId, comment, createdBy, createdAt }`.
- **`GET /`** – Adjustment ledger. Query params: `warehouseId` (optional), `variantId` (optional),
  `since` (ISO date-time), `limit` (default 100). Response includes both manual stock adjustments
  and reservation ledger entries with an `entryType` discriminator:
  ```jsonc
  {
    "adjustmentId": 101,
    "variantId": 2,
    "warehouseId": 1,
    "quantityDelta": 10,
    "entryType": "STOCK_ADJUSTMENT",
    "reasonId": 1,
    "reasonCode": "MANUAL",
    "reasonDescription": "Manual adjustment",
    "comment": "UI ledger replay",
    "createdBy": "admin@example.com",
    "createdAt": "2025-12-15T18:05:00Z",
    "productItemId": null,
    "referenceType": null,
    "referenceId": null
  }
  ```
  > Tip: filter by `warehouseId` when rendering a specific warehouse’s ledger. Reservation events
  > surface with `entryType="LEDGER"` and typically carry negative `quantityDelta` for consumes.

### 4.4 Reservations (Order Fulfilment Helpers)

| Endpoint | Description |
|----------|-------------|
| `POST /reservations` | Reserve stock manually (mirrors order allocation). Request fields: `orderItemId`, `productItemId`, `variantId`, `warehouseId`, `quantity`, `referenceType`, `referenceId`. Response returns allocation info.
| `POST /reservations/release` | Releases an existing reservation using `{ orderItemId, referenceType, referenceId }`.
| `POST /reservations/consume` | Marks reservation as consumed for completed fulfilment.

**Usage in UI:** Provide manual stock hold/adjust release workflow for admins.

---

## 8. Customer Order APIs (`/api/v1/orders`)

These endpoints are customer-scoped (require `CUSTOMER` or `ADMIN` authority with acting user context).

- **`POST /`** – Place order.
  ```jsonc
  {
    "items": [
      { "variantId": 45, "quantity": 2 }
    ],
    "shippingAddress": 101,
    "paymentMethod": "COD",
    "notes": "Leave at reception"
  }
  ```
  → Returns `OrderResponse` with line items, totals, status.

- **`GET /`** – List orders for current user. Optional query params: `status` (repeatable), `limit`, `offset`.
- **`GET /{orderId}`** – Fetch single order aggregate.
- **`POST /{orderId}/cancel`** – Cancel order with optional body `{ "reason": "CUSTOMER_REQUEST" }`.

## 9. Additional Considerations for Admin UI

1. **Role-based access:**
   - `ADMIN`: full access.
   - `PRODUCT`: catalog endpoints only.
   - `INVENTORY`: warehouse, stock, adjustments, reservations.
2. **Pagination:** Current list endpoints return full collections. UI should implement client-side paging/search (Server pagination can be added later).
3. **Image uploads:** Product images currently require URLs; no upload endpoint is provided. UI must collect URLs from CDN/storage.
4. **Composite pricing modes:** `FIXED` uses `fixedPrice`; `DYNAMIC` derives price from component variants. Frontend should enforce these constraints.
5. **Delivery fees & payments:** Not covered here—future work.

---

## 10. Recommended UI Flows to Cover

1. **Login Screen** → call `/auth/login/password`, store tokens.
2. **Dashboard Home** → summary cards using existing list endpoints (optional).
3. **Product Management:**
   - List products → `GET /catalog/products`.
   - Product detail → `GET /catalog/products/{id}`.
   - Create/edit product → POST/PUT with variant editor (including images & pricing).
   - Delete product button.
4. **Composite Management:** Similar CRUD flow using `/catalog/composites` endpoints.
5. **Warehouse Management:**
   - List/create warehouses.
   - Link inventory views by warehouse.
6. **Stock & Adjustments:**
   - View stock per variant or per warehouse.
   - Apply adjustments with reason selection.
   - Reserve/release stock for manual orders.

---

## 11. Future Extensions

- Payment integration workflows (mock gateway, order payment status, delivery fees).
- Category CRUD APIs for richer taxonomy management.
- Bulk CSV import/export endpoints for products & stock.
- Audit trail endpoints for compliance.

---

*Last updated: 2025-12-15 (covers backend state after localization refactor and admin order testing).*
