# StoreFlow

**Full-stack inventory and order management system for merchants**

StoreFlow is a merchant application for managing a product catalog, tracking inventory, placing customer orders, and monitoring revenue. A React front end talks to a Java and Spring Boot REST API backed by PostgreSQL, with all business rules enforced server-side inside database transactions.

## Overview

Small merchants need one view of what is in stock, what is running low, and what has sold, plus a way to take orders that cannot accidentally sell inventory they do not have. StoreFlow covers that loop: manage products, build an order, and watch stock and revenue update as orders are placed.

## Problem

Two categories of problem drove this design.

**Operational:** merchants tracking inventory by hand have no single view of stock levels, no safeguard against promising units they do not have, and no automatic link between a sale and the resulting inventory change.

**Technical:** the original version of StoreFlow ran entirely in the browser with state in `localStorage`. That meant business rules like "you cannot order more than is in stock" lived in client-side JavaScript, where they could be bypassed with the browser console; prices and tax were calculated by the client and trusted; and every browser held its own private copy of the data, so nothing was shared and two people could never be looking at the same inventory.

## Solution

The rules and the data moved to the server.

A Spring Boot API owns validation, pricing, tax, and stock. The browser sends only product ids and quantities; the server looks up prices, rejects impossible orders, applies Ontario HST, decrements stock, and writes the order. Every one of those steps happens inside a single database transaction, so an order either fully succeeds or leaves nothing behind. Optimistic locking on the product row means two customers racing for the last unit cannot both win.

The React front end is now purely a presentation layer, with loading states, error handling, and server-supplied error messages.

## Features

- **Dashboard**: live totals for products, inventory units, low stock count, orders placed, and revenue
- **Product management**: create, edit, and delete products, persisted to PostgreSQL
- **Search and filters**: live search by name or category, plus stock status and category filters
- **Automatic inventory status**: products classify as In Stock, Low Stock, or Out of Stock from their current quantity
- **Order builder**: select products and quantities, review a running cart, then place the order
- **Server-side order validation**: an order for more units than exist is rejected with a clear message naming the quantity actually available
- **Tax calculation**: subtotal, Ontario HST at 13 percent, and total, computed with `BigDecimal` and half-up rounding
- **Atomic stock decrement**: placing an order and reducing stock happen in one transaction, so a partially applied order is impossible
- **Concurrency safety**: optimistic locking rejects the losing request when two orders contend for the same stock, returning HTTP 409
- **Order history**: every order stored with its line items and the unit price captured at purchase time

## Technologies

**Backend**
- Java 17
- Spring Boot 4.1 (Spring Web MVC, Spring Data JPA, Bean Validation)
- Hibernate 7 as the JPA provider
- PostgreSQL 18
- Maven (via the Maven Wrapper)
- JUnit 5, AssertJ, Spring Boot Test

**Frontend**
- React 19 (function components and hooks)
- Vite
- JavaScript (ES2022+)
- Plain CSS with custom properties

## Architecture

```
storeflow/
  backend/
    src/main/java/com/storeflow/backend/
      controller/     HTTP mapping only, no business logic
      service/        business rules and transaction boundaries
      repository/     Spring Data JPA database access
      model/          JPA entities mapped to tables
      dto/            request and response shapes, decoupled from entities
      exception/      domain exceptions and the HTTP translation layer
      config/         CORS configuration and demo data seeding
    src/test/java/    JUnit 5 tests against a dedicated test database
  frontend/
    src/
      api/            fetch wrappers and field mapping
      components/     presentation components
      utils/          display formatting and client-side form feedback
```

Requests flow in one direction through the layers:

```
Browser -> Controller -> Service -> Repository -> PostgreSQL
```

Each layer has one job. Controllers translate HTTP to method calls and back, holding no logic. Services own the business rules and define where transactions start and end. Repositories are the only code that touches the database. Entities describe the tables. Domain exceptions are thrown by services and converted to status codes by a `@RestControllerAdvice`, so no service class needs to know HTTP exists.

DTOs sit between the API and the entities so the database schema is not exposed directly to clients, and so an order response can flatten product names into line items without triggering lazy loading during serialization.

### API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/products` | List all products |
| POST | `/api/products` | Create a product |
| PUT | `/api/products/{id}` | Update a product |
| DELETE | `/api/products/{id}` | Delete a product |
| GET | `/api/orders` | List orders, newest first |
| GET | `/api/orders/{id}` | Fetch a single order |
| POST | `/api/orders` | Place an order |

Error responses carry a JSON body with `status`, `message`, and `timestamp`. Ordering more than is available returns 400, an unknown id returns 404, and losing a concurrency race returns 409.

## Running Locally

**Prerequisites:** JDK 17+, PostgreSQL 14+, Node.js 18+.

**1. Create the databases.** In pgAdmin or `psql`, create `storeflow` and `storeflow_test`.

**2. Set your database password** as an environment variable so it is never committed:

```powershell
[Environment]::SetEnvironmentVariable("DB_PASSWORD", "your-postgres-password", "User")
```

**3. Start the backend** (first run downloads dependencies):

```bash
cd backend
./mvnw spring-boot:run
```

The API starts on `http://localhost:8080`. Hibernate creates the schema and seeds ten demo products on first run.

**4. Start the frontend** in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

**Run the test suite:**

```bash
cd backend
./mvnw test
```

## Key Business Logic

### Order placement is one transaction

`OrderService.placeOrder` validates each line against current stock, decrements it, and saves the order inside a single `@Transactional` method. If any line fails, the exception rolls back every change made so far. A multi-item order where the last line is impossible leaves the earlier products untouched, which is covered by a test.

```java
@Transactional
public Order placeOrder(CreateOrderRequest request) {
    for (OrderItemRequest line : request.items()) {
        Product product = productRepository.findById(line.productId())
                .orElseThrow(() -> new ProductNotFoundException(line.productId()));

        if (line.quantity() > product.getStockQuantity()) {
            throw new InsufficientStockException(product.getName(), product.getStockQuantity());
        }

        product.setStockQuantity(product.getStockQuantity() - line.quantity());
        ...
    }
}
```

### Optimistic locking prevents overselling

`@Transactional` gives atomicity but not isolation from stale reads. Under PostgreSQL's default READ_COMMITTED isolation, two transactions can both read `stock = 1`, both pass the stock check, and both commit, selling the same unit twice.

A `@Version` column closes that gap. Hibernate includes the version it read in the update:

```sql
UPDATE products SET stock_quantity = 0, version = 8
WHERE id = 4 AND version = 7
```

The first transaction to commit moves the row to version 8. The second matches zero rows, Hibernate raises `ObjectOptimisticLockingFailureException`, and the transaction rolls back. The API returns 409 Conflict, signalling a valid request that lost a race and may be retried.

### Money is never floating point

Prices, tax, and totals use `BigDecimal` with explicit `HALF_UP` rounding to two decimals. Binary floating point cannot represent values like 0.1 exactly, which produces cent-level drift that compounds across a catalog.

### The client is not trusted

Order requests contain only product ids and quantities. The server looks up prices itself, so tampering with the request cannot change what an order costs. Client-side validation still exists for immediate feedback, but the server re-validates everything independently.

## Testing

Seven tests run against a dedicated `storeflow_test` database, so they never touch development data.

| Test | What it proves |
|---|---|
| `rejectsAnOrderForMoreUnitsThanAreInStock` | Oversell is refused and stock is untouched |
| `appliesOntarioHstAcrossAMultiItemOrder` | 13 percent HST is correct across multiple line items |
| `decrementsStockForEveryLineInTheOrder` | Every line reduces its product's stock |
| `rollsBackEarlierLinesWhenALaterLineFails` | A failed line undoes earlier decrements |
| `aWriteCarryingAStaleVersionIsRejected` | The version column rejects stale writes, deterministically |
| `onlyOneOfTwoConcurrentOrdersForTheLastUnitSucceeds` | Two real threads race for one unit and exactly one wins |
| `contextLoads` | The Spring context and database wiring start correctly |

The concurrency test reports which guard rejected the loser, so it is clear whether optimistic locking or the stock check caught the race on a given run.

## Screenshots

**Dashboard**
![StoreFlow dashboard view](./screenshots/dashboard.png)

**Products**
![StoreFlow products view](./screenshots/products.png)

**Add Product**
![Add product modal with validation](./screenshots/add-product-modal.png)

**Edit Product**
![Edit product modal](./screenshots/edit-product-modal.png)

**Filtered Products**
![Products filtered to In Stock](./screenshots/products-filtered.png)

**Orders**
![StoreFlow orders view with order history](./screenshots/orders.png)

## Project History

The browser-only version is tagged [`v1.0.0`](https://github.com/rayhansadiq/storeflow/releases/tag/v1.0.0), a React single-page app with `localStorage` persistence and client-side business logic. The current version replaces that with a Java backend and PostgreSQL while keeping the same interface.

## Future Improvements

- Flyway migrations instead of `ddl-auto`, so schema changes are versioned and reviewable
- Authentication and per-merchant data isolation
- Pagination for large catalogs
- Retry handling on 409 responses so a losing order can be resubmitted automatically
- Integration tests with Testcontainers, removing the local PostgreSQL requirement
- Deployment with the API and database hosted rather than run locally

## What I Learned

This started as a React project and became my introduction to Java and Spring Boot.

**Where a rule lives determines whether it is a rule.** Oversell prevention existed in v1, but as browser JavaScript it was a suggestion. Moving it behind an API made it enforceable, and that distinction between client-side validation for user experience and server-side validation for correctness is the single most useful thing I took from this.

**Atomicity and isolation are different guarantees.** I assumed `@Transactional` made concurrent orders safe. It does not. It guarantees all-or-nothing, but two transactions can still read the same stale value and both pass their checks. Understanding why required actually writing the race, watching it happen, and seeing the version column reject the loser.

**Layering pays off when requirements change.** Because validation and tax logic lived in a service rather than in controllers, testing it meant calling a method rather than standing up HTTP requests, and the exception-to-status-code translation stayed in one place.

**ORMs generate SQL you should look at.** Turning on `show-sql` made the framework legible instead of magical. It also caught a real bug: `findAll()` has no `ORDER BY`, and PostgreSQL relocates updated rows, so the product list reshuffled after every order until I added explicit ordering.
