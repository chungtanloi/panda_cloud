# ROLE & PERMISSION MATRIX — PANDA CLOUD

> Tài liệu tổng hợp chức năng và quyền của 7 role trong hệ thống Panda Cloud.
>
> **Nguồn chính:** CR-003 — Migrate custom refresh-token auth to Clerk và role model được xác nhận trong tài liệu ngày 2026-08-13.
>
> **Nguyên tắc:** Chỉ ghi nhận những quyền/chức năng đã được xác nhận trong nguồn. Những permission matrix chi tiết chưa được tài liệu cung cấp được đánh dấu `NEEDS CLARIFICATION`, không tự suy diễn.

---

## 1. Tổng quan Role Model

Hệ thống sử dụng **7 role**:

| # | Role | Type | Mục tiêu chính |
|---|---|---|---|
| 1 | Customer | Non-staff | Đăng nhập, theo dõi project/cluster/portfolio và sử dụng các customer journeys |
| 2 | Sales | Staff | Qualify leads, tạo/sửa deal, quản lý Kanban và contact history |
| 3 | Technical | Staff | Tạo, thực hiện và review Technical Due Diligence |
| 4 | Legal | Staff | Quản lý NCNDA và document versions |
| 5 | Compliance | Staff | Quản lý KYC cases, risk và status |
| 6 | Manager | Staff | Xem toàn bộ pipeline, Mark Won/Lost, chuyển Won deal thành project |
| 7 | Admin | Staff | Quản lý stage/template, permissions và operational configuration |

### Lưu ý về `USER` và `Customer`

Frontend hiện tại đang dùng:

```text
USER | SALES | MANAGER | ADMIN
```

Trong khi role model backend đã xác nhận là:

```text
Customer | Sales | Technical | Legal | Compliance | Manager | Admin
```

Việc wire value có đổi từ `USER` sang `CUSTOMER` hay chỉ đổi label hiển thị thành `Customer` vẫn là **NEEDS CLARIFICATION**. Không tự thay đổi API/wire value nếu chưa có quyết định.

---

# 2. Role Permission Matrix

## 2.1. Bảng tổng hợp

| Chức năng | Customer | Sales | Technical | Legal | Compliance | Manager | Admin |
|---|---:|---:|---:|---:|---:|---:|---:|
| Xem Kanban / Dealflow | — | Assigned | Relevant | Relevant | Relevant | All | All |
| Tạo / sửa Deal | — | Có | Không | Không | Không | Có | Có |
| Chuyển stage thông thường | — | Có | Limited | Limited | Limited | Có | Có |
| Ghi Activity / Note | — | Có | Có | Có | Có | Có | Có |
| Cập nhật Technical DD | — | Không | Có | Không | Không | Có | Có |
| Cập nhật KYC | — | Không | Không | Không | Có | Có | Có |
| Cập nhật NCNDA | — | Không | Không | Có | Không | Có | Có |
| Mark Won / Lost | — | Không | Không | Không | Không | Có | Có |
| Cấu hình stage/template | — | Không | Không | Không | Không | Read | Có |
| Quản lý user/role | — | Không | Không | Không | Không | Read | Có |

### Giải thích mức truy cập

- **All:** xem toàn bộ pipeline/dealflow.
- **Assigned:** Sales xem các deal được assign.
- **Relevant:** role chuyên môn xem các deal liên quan đến công việc của role.
- **Có:** được thực hiện chức năng theo bảng.
- **Không:** không thực hiện chức năng đó.
- **Limited:** quyền chuyển stage có giới hạn; phạm vi chính xác chưa được role matrix chi tiết hóa trong tài liệu nguồn.
- **Read:** chỉ xem, không cấu hình/chỉnh sửa.
- **—:** không phải chức năng của Customer trong Kanban nội bộ.

> **Quan trọng:** Bảng trên là bản tổng hợp từ matrix hiện có. Role matrix chi tiết cho quyền read/write/approve giữa Sales, Technical, Legal, Compliance, Manager và Admin chưa được cung cấp đầy đủ trong tài liệu nguồn. Không được tự suy diễn thêm.

---

# 3. Chi tiết chức năng theo từng Role

## 3.1. Customer

### Mục tiêu

Customer là role **non-staff**, phục vụ người dùng cuối.

### Chức năng chính

- Đăng nhập hệ thống.
- Theo dõi project.
- Theo dõi cluster.
- Theo dõi portfolio.
- Sử dụng customer journey liên quan đến:
  - GPU.
  - Land.
  - Investment.
  - Hyperscale.

### Kanban

Customer không phải role quản lý Kanban/Dealflow nội bộ.

### Luồng tổng quát

```text
Customer
  |
  +-- Login / Sign up
  |
  +-- Project
  +-- Cluster
  +-- Portfolio
  |
  +-- GPU journey
  +-- Land journey
  +-- Investment journey
  +-- Hyperscale journey
```

---

# 4. Sales

## 4.1. Mục tiêu

Sales chịu trách nhiệm:

- Qualify leads.
- Tạo và chỉnh sửa deal.
- Quản lý Kanban.
- Quản lý contact history.

## 4.2. Chức năng

| Chức năng | Sales |
|---|---|
| Xem Kanban | Assigned |
| Tạo Deal | Có |
| Sửa Deal | Có |
| Chuyển stage thông thường | Có |
| Activity | Có |
| Note | Có |
| Technical DD | Không cập nhật |
| KYC | Không cập nhật |
| NCNDA | Không cập nhật |
| Mark Won/Lost | Không |
| Stage/Template configuration | Không |
| User/Role management | Không |

## 4.3. Luồng

```text
Sales
  |
  +-- View assigned deals
  |
  +-- Create Deal
  +-- Edit Deal
  +-- Move Stage
  |
  +-- Activity
  +-- Note
  +-- Contact History
  |
  +-- Theo dõi trạng thái DD / KYC / NCNDA
```

Sales không trực tiếp cập nhật Technical DD, KYC hoặc NCNDA theo matrix hiện tại.

---

# 5. Technical

## 5.1. Mục tiêu

Technical chịu trách nhiệm thực hiện và review **Technical Due Diligence**.

## 5.2. Technical workspace

Đề xuất workspace:

```text
/technical
```

Các route được tài liệu thiết kế:

| Page | Route | Chức năng |
|---|---|---|
| Overview | `/technical` | Xem assessments đang thực hiện, items pending review, critical-failure count và completion % |
| Assessments | `/technical/assessments` | Xem danh sách DD assessments; tạo assessment cho Won-track deal |
| Assessment detail | `/technical/assessments/[id]` | Làm việc với DD items, nhập response/status/comment và review |
| Evidence | `/technical/assessments/[id]/evidence` | Upload/attach evidence qua signed-upload flow và xem malware-scan status |

## 5.3. Quy trình Technical DD

```text
Technical
  |
  +-- View Assessments
  |
  +-- Create DD Assessment
  |
  +-- Open Assessment
  |
  +-- Process DD Items
  |     |
  |     +-- Typed response
  |     +-- Status
  |     +-- Comment
  |     +-- Mark reviewed
  |
  +-- Attach Evidence
  |     |
  |     +-- Signed upload
  |     +-- Malware scan gate
  |
  +-- Complete Assessment
  |
  +-- Cancel Assessment
```

## 5.4. DD items

Tài liệu xác định assessment hiện có:

- **68 DD items**
- **56 IDC**
- **12 Dedicated Line**

## 5.5. Read-only cross-role access

Sales/Legal/Compliance có read access đối với DD responses theo role matrix được nhắc tới trong tài liệu.

Tuy nhiên, **chi tiết field-level read/write matrix chưa được cung cấp**.

Do đó implementation nên phân biệt:

```text
canRead
canWrite
```

thay vì chỉ sử dụng một boolean permission.

---

# 6. Legal

## 6.1. Mục tiêu

Legal chịu trách nhiệm quản lý:

- NCNDA.
- Agreement lifecycle.
- Document versions.

## 6.2. Legal workspace

```text
/legal
```

Các route:

| Page | Route | Chức năng |
|---|---|---|
| Overview | `/legal` | Dashboard trạng thái agreement |
| Agreements | `/legal/agreements` | List và quản lý NCNDA agreements |
| Agreement detail | `/legal/agreements/[id]` | Quản lý current document version và xem lịch sử versions |

## 6.3. Quy trình NCNDA

```text
Legal
  |
  +-- View Agreements
  |
  +-- Create Agreement
  |
  +-- Manage Agreement Lifecycle
  |
  +-- Current Document Version
  |
  +-- Replace Current Version
  |
  +-- View Previous Versions
```

### Quy tắc version

- Có **một current document version**.
- Các document versions trước đó là immutable/read-only.
- Legal là role quản lý lifecycle.
- Deal-level NCNDA status được materialize để các workspace khác có thể sử dụng.

---

# 7. Compliance

## 7.1. Mục tiêu

Compliance chịu trách nhiệm:

- KYC cases.
- Provider/manual lifecycle.
- Risk.
- Status.
- Manual review.

## 7.2. Compliance workspace

```text
/compliance
```

Các route:

| Page | Route | Chức năng |
|---|---|---|
| Overview | `/compliance` | Dashboard KYC cases theo risk/status |
| Cases | `/compliance/cases` | Danh sách và tạo KYC cases |
| Case detail | `/compliance/cases/[id]` | Xem subject/provider/risk/status và manual review |
| Case documents | `/compliance/cases/[id]/documents` | Chưa được build; đang là gap backend |

## 7.3. Quy trình KYC

```text
Compliance
  |
  +-- View KYC Cases
  |
  +-- Create Case
  |     |
  |     +-- One subject
  |
  +-- Track Provider
  +-- Track Risk
  +-- Track Status
  |
  +-- Manual Review
  |
  +-- Materialize Deal KYC Status
```

## 7.4. KYC Documents — GAP

Không được tự tạo data model kiểu:

```text
kycCaseDocuments
```

Tài liệu chỉ ra rằng:

- `kycCases` hiện chưa có document relation.
- Prototype có upload identity/accreditation files.
- Backend schema chưa giải quyết relation này.
- Đây là **explicit gap**.

Vì vậy trang documents chỉ nên để placeholder/coming soon cho đến khi backend có quyết định schema.

---

# 8. Manager

## 8.1. Mục tiêu

Manager quản lý toàn bộ pipeline ở cấp quản lý.

### Chức năng

| Chức năng | Manager |
|---|---|
| Xem Kanban | All |
| Tạo / sửa Deal | Có |
| Chuyển stage | Có |
| Activity / Note | Có |
| Technical DD | Có theo matrix hiện tại |
| KYC | Có theo matrix hiện tại |
| NCNDA | Có theo matrix hiện tại |
| Mark Won | Có |
| Mark Lost | Có |
| Stage/Template configuration | Read |
| User/Role | Read |

### Chức năng đặc trưng

Manager có trách nhiệm:

1. Xem toàn bộ pipeline.
2. Theo dõi deal.
3. Mark Won.
4. Mark Lost.
5. Chuyển Won deal thành project.

### Luồng

```text
Manager
  |
  +-- View All Pipeline
  |
  +-- Create / Edit Deal
  +-- Move Stage
  |
  +-- Activity / Note
  |
  +-- Review DD / KYC / NCNDA status
  |
  +-- Mark Won
  |      |
  |      +-- Convert Won Deal -> Project
  |
  +-- Mark Lost
```

---

# 9. Admin

## 9.1. Mục tiêu

Admin là role quản trị hệ thống.

### Chức năng

| Chức năng | Admin |
|---|---|
| Xem Kanban | All |
| Tạo / sửa Deal | Có |
| Chuyển stage | Có |
| Activity / Note | Có |
| Technical DD | Có theo matrix hiện tại |
| KYC | Có theo matrix hiện tại |
| NCNDA | Có theo matrix hiện tại |
| Mark Won / Lost | Có |
| Stage/Template configuration | Có |
| User/Role management | Có |

### Luồng

```text
Admin
  |
  +-- View All Pipeline
  |
  +-- Create / Edit Deal
  +-- Move Stage
  |
  +-- Activity / Note
  |
  +-- Technical DD
  +-- KYC
  +-- NCNDA
  |
  +-- Mark Won / Lost
  |
  +-- Configure Stage
  +-- Configure Template
  |
  +-- Manage Users
  +-- Manage Roles
  +-- Manage Permissions
  +-- Operational Configuration
```

---

# 10. Permission Names

Tài liệu hiện đề xuất permission theo resource/action convention:

## Technical DD

```text
dd:view
dd:respond
dd:review
dd:evidence:upload
```

## NCNDA

```text
ncnda:view
ncnda:manage
```

## KYC

```text
kyc:view
kyc:manage
```

## Các permission khác

Các permission chi tiết cho:

- Kanban.
- Deal.
- Stage.
- Won/Lost.
- User.
- Role.
- Template.

chưa có complete role grant matrix trong tài liệu nguồn.

Không tự thêm grant nếu chưa được FE/BE owner xác nhận.

---

# 11. Workspace / Route Mapping

| Role | Workspace | Route |
|---|---|---|
| Customer | Customer | `/dashboard` |
| Sales | Sales | `/sales` |
| Technical | Technical | `/technical` |
| Legal | Legal | `/legal` |
| Compliance | Compliance | `/compliance` |
| Manager | Manager | `/manager` |
| Admin | Admin | `/admin` |

## Sales routes

```text
/sales
/sales/customers
/leads
/leads/[id]
/pipeline
/quotes
/reports
/tasks
```

## Manager routes

```text
/manager
/manager/sales
/team
/pipeline
/operations
/approvals
/reports
```

## Admin routes

```text
/admin
/admin/users
/roles
/permissions
/system
/audit-logs
/settings
```

## Technical routes

```text
/technical
/technical/assessments
/technical/assessments/[id]
/technical/assessments/[id]/evidence
```

## Legal routes

```text
/legal
/legal/agreements
/legal/agreements/[id]
```

## Compliance routes

```text
/compliance
/compliance/cases
/compliance/cases/[id]
/compliance/cases/[id]/documents
```

> Technical/Legal/Compliance route trees chưa tồn tại trong frontend hiện tại; phần trên là page design được đề xuất dựa trên backend use cases, không phải các page đã implement.

---

# 12. Những điểm KHÔNG được tự quyết định

## 12.1. Role matrix chi tiết

Chưa có matrix chính thức cho:

```text
Who can Read?
Who can Write?
Who can Approve?
Which DD fields are visible?
Which NCNDA fields are visible?
Which KYC fields are visible?
```

=> Phải `NEEDS CLARIFICATION`.

## 12.2. Customer wire value

Chưa quyết định:

```text
USER
```

hay:

```text
CUSTOMER
```

Tài liệu khuyến nghị quyết định cùng với CR-005 về role casing.

## 12.3. Admin access

Frontend hiện chỉ special-case:

```text
ADMIN -> USER
```

Không tự động có nghĩa:

```text
ADMIN -> SALES
ADMIN -> MANAGER
```

Đây là câu hỏi chưa được quyết định.

## 12.4. Technical/Legal/Compliance sales-board permissions

Chưa xác nhận các role này có được hưởng quyền `sales_manager` hoặc quyền đặc biệt trên sales board hay không.

## 12.5. KYC Documents

Không tự tạo schema hoặc endpoint cho KYC documents khi backend chưa quyết định relation.

---

# 13. Nguyên tắc triển khai Frontend

Role authorization nên được tách thành:

```text
Authentication
    |
    v
Role
    |
    v
Workspace
    |
    v
Permission
    |
    v
Action
```

Ví dụ:

```text
Technical
   |
   +-- Technical Workspace
          |
          +-- dd:view
          +-- dd:respond
          +-- dd:review
          +-- dd:evidence:upload
```

Không nên hard-code permission trực tiếp trong từng component.

Nên duy trì một access configuration trung tâm, tương ứng với cấu trúc hiện tại:

```text
src/config/access.ts
```

---

# 14. Nguyên tắc Backend Authorization

Frontend RoleGuard chỉ là convenience layer.

Backend phải là nơi quyết định cuối cùng việc một user có được phép thực hiện staff operation hay không.

Không được coi:

```text
ẩn button
```

hoặc:

```text
RoleGuard
```

là security boundary.

Luồng đúng:

```text
Frontend
   |
   | Clerk JWT
   v
Gateway
   |
   | Verify JWT
   v
Resolve user
   |
   | users.clerkSubject
   v
Resolve organization membership
   |
   | role
   v
Backend Authorization
   |
   v
Business Module
```

---

# 15. Mapping với Clerk

Role model 7 role phải được phản ánh trong authorization context sau khi Clerk được tích hợp.

Target flow:

```text
User
  |
  v
Clerk Sign-in / Sign-up
  |
  v
Clerk Session
  |
  v
getToken()
  |
  v
Bearer JWT
  |
  v
Vercel HTTP Gateway
  |
  v
Verify Clerk JWT
  |
  v
users.clerkSubject
  |
  v
organizationMemberships
  |
  v
Role
  |
  v
Authorization
```

Clerk chịu trách nhiệm session/refresh token.

Panda Cloud không tạo custom refresh-token API nếu không có requirement mới được phê duyệt.

---

# 16. Checklist triển khai Role & Permission

## Role model

- [ ] Xác nhận 7 role.
- [ ] Xác nhận Customer thay cho khái niệm USER ở business layer.
- [ ] Quyết định wire value `USER` hay `CUSTOMER`.
- [ ] Thêm Technical.
- [ ] Thêm Legal.
- [ ] Thêm Compliance.

## Access configuration

- [ ] Cập nhật `UserRole`.
- [ ] Cập nhật `ROLE_PERMISSIONS`.
- [ ] Cập nhật `navigationByRole`.
- [ ] Cập nhật `defaultRouteByRole`.
- [ ] Cập nhật `canAccessWorkspace()`.
- [ ] Xác nhận Admin có vào Sales/Manager hay không.

## Technical

- [ ] `/technical`
- [ ] `/technical/assessments`
- [ ] `/technical/assessments/[id]`
- [ ] Evidence upload flow
- [ ] `dd:view`
- [ ] `dd:respond`
- [ ] `dd:review`
- [ ] `dd:evidence:upload`

## Legal

- [ ] `/legal`
- [ ] `/legal/agreements`
- [ ] `/legal/agreements/[id]`
- [ ] `ncnda:view`
- [ ] `ncnda:manage`
- [ ] Current document version
- [ ] Immutable previous versions

## Compliance

- [ ] `/compliance`
- [ ] `/compliance/cases`
- [ ] `/compliance/cases/[id]`
- [ ] KYC risk/status
- [ ] Manual review
- [ ] `kyc:view`
- [ ] `kyc:manage`
- [ ] Không tự tạo KYC document schema

## Manager

- [ ] Full pipeline view
- [ ] Create/Edit Deal
- [ ] Stage transition
- [ ] Mark Won
- [ ] Mark Lost
- [ ] Won -> Project flow

## Admin

- [ ] Full pipeline
- [ ] Deal management
- [ ] Stage configuration
- [ ] Template configuration
- [ ] User management
- [ ] Role management
- [ ] Permission management
- [ ] Operational configuration

---

# 17. Các vấn đề cần Product/FE/BE Owner xác nhận trước khi code

1. CR-003 đã được FE/BE owner approve chưa?
2. Backend gateway đã sẵn sàng verify Clerk JWT chưa?
3. `GET /auth/me` còn tồn tại sau Clerk hay không?
4. `PUT /auth/path` còn tồn tại hay chuyển sang Clerk/organization metadata?
5. `/choose-path` cần authentication hay không?
6. `/investment/kyc`, `/payment`, `/confirmation` có bắt buộc authentication không?
7. `/dashboard/sales` khác `/sales` ở audience hay chỉ là legacy/duplicate?
8. Admin có được truy cập Sales và Manager workspace không?
9. Clerk Organization map như thế nào với `organizationMemberships`?
10. Role được lưu/resolve ở đâu?
11. Exact permission matrix cho DD/NCNDA/KYC là gì?
12. Technical/Legal/Compliance có quyền nào trên Sales board?
13. KYC documents sẽ được model như thế nào ở backend?

---

# 18. Kết luận

Mô hình quyền mục tiêu của Panda Cloud gồm:

```text
                    PANDA CLOUD
                         |
        +----------------+----------------+
        |                |                |
     Customer           Staff          Admin
                         |
       +---------+-------+-------+---------+
       |         |       |       |         |
     Sales   Technical  Legal Compliance Manager
```

Trong đó:

```text
Customer
  -> Customer journeys

Sales
  -> Leads / Deals / Kanban / Contact history

Technical
  -> Technical Due Diligence / Evidence

Legal
  -> NCNDA / Document versions

Compliance
  -> KYC / Risk / Manual review

Manager
  -> Full pipeline / Won-Lost / Project conversion

Admin
  -> System configuration / Users / Roles / Permissions
```

Đây là baseline để FE xây dựng workspace và access control, đồng thời để BE mapping authorization. Những điểm chưa có role matrix chính thức phải được giữ ở trạng thái `NEEDS CLARIFICATION`, không tự phát sinh permission mới.
