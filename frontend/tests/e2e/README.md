# Playwright E2E Coverage

This suite automates core user journeys for QuickEats authentication and route access controls.

## Covered journeys

| Journey | Responsible component(s) | Test intent |
|---|---|---|
| Public landing page access | `HomePage`, app public route config | Verify unauthenticated users can open `/` |
| Protected student route guard | `ProtectedRoute`, `AuthContext` | Verify unauthenticated users requesting `/dashboard` are redirected to `/login` |
| Student sign-in | `LoginPage`, `AuthContext.login` | Verify student credentials route to `/dashboard` |
| Admin sign-in | `LoginPage`, `AuthContext.login` | Verify admin credentials route to `/admin/dashboard` |
| Canteen staff sign-in | `LoginPage`, `AuthContext.login`, `SelectCanteenPage` | Verify canteen staff are routed to `/admin/select-canteen` |
| Order status filtering | `Admin/OrdersPage` | Verify admin can filter order cards by status (Pending) |
| Expired orders bulk cancellation | `Admin/OrdersPage`, `StaleOrdersTab`, `BulkCancelModal` | Verify expired orders can be bulk-cancelled and stale list updates |
| Pickup code delivery confirmation | `Admin/OrdersPage`, pickup code toolbar | Verify ready order can be confirmed delivered via pickup code |
| Food ordering flow | `Student/CanteensPage`, `Student/CanteenMenuPage`, `Student/CartPage` | Verify student can add menu item to cart and place an order |
| Group order flow | `Student/GroupOrderHub` | Verify student can create a group session and receive a share code |
| Event catering request flow | `Student/EventCateringRequestPage` | Verify student can submit event catering request and see it in tracking list |

## Test strategy

- Network calls are mocked at the browser level to isolate frontend behavior and avoid backend dependency during UI journey checks.
- Mocked endpoints include:
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `GET /api/canteens`
  - `GET /api/orders/canteen`
  - `GET /api/orders/canteen/stale`
  - `POST /api/orders/canteen/bulk-cancel`
  - `POST /api/orders/pickup-by-code`
  - `PATCH /api/orders/:id/status`
  - `POST /api/orders`
  - `GET /api/group-sessions/my/active`
  - `POST /api/group-sessions`
  - `GET /api/event-catering/packages`
  - `POST /api/event-catering/requests`
  - `GET /api/event-catering/requests/my`

## Run

```bash
npm run test:e2e
```

## Useful variants

```bash
npm run test:e2e:headed
npm run test:e2e:ui
```

## Report

After execution, open the HTML report from `playwright-report/index.html`.
