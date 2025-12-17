# 일정 API 인터페이스 명세서

## 1. 일정 등록 API

### Endpoint

```
POST /my/schedule
```

### 인증

- Bearer Token 필요 (Authorization 헤더)

### Request Headers

```
Content-Type: application/json
Authorization: Bearer {token}
```

### Request Body

```typescript
{
  title: string;           // 필수, 일정 제목
  description?: string;     // 선택, 일정 설명
  scheduleDate: string;     // 필수, 일정 날짜 (YYYY-MM-DD 형식)
}
```

### Request Example

```json
{
  "title": "React 스터디",
  "description": "오후 3시에 React 스터디 진행",
  "scheduleDate": "2025-01-15"
}
```

### Response (Success - 201)

```typescript
{
  message: string; // 성공 메시지
  schedule: {
    scheduleId: number; // 일정 ID
    userIdx: number; // 사용자 ID
    title: string; // 일정 제목
    description: string | null; // 일정 설명
    scheduleDate: string; // 일정 날짜 (YYYY-MM-DD)
    createdAt: string; // 생성일시 (ISO 8601)
    updatedAt: string; // 수정일시 (ISO 8601)
  }
}
```

### Response Example (Success)

```json
{
  "message": "일정이 성공적으로 등록되었습니다.",
  "schedule": {
    "scheduleId": 1,
    "userIdx": 1,
    "title": "React 스터디",
    "description": "오후 3시에 React 스터디 진행",
    "scheduleDate": "2025-01-15",
    "createdAt": "2025-01-12T10:00:00.000Z",
    "updatedAt": "2025-01-12T10:00:00.000Z"
  }
}
```

### Error Responses

#### 400 Bad Request - 제목 누락

```json
{
  "message": "제목을 입력하세요."
}
```

#### 400 Bad Request - 날짜 누락

```json
{
  "message": "일정 날짜를 입력하세요."
}
```

#### 400 Bad Request - 날짜 형식 오류

```json
{
  "message": "날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)"
}
```

#### 401 Unauthorized - 인증 실패

```json
{
  "message": "인증 에러"
}
```

#### 500 Internal Server Error

```json
{
  "message": "일정 등록에 실패했습니다.",
  "error": "에러 상세 메시지"
}
```

---

## 2. 일정 조회 API

### Endpoint

```
GET /my/schedule
```

### 인증

- Bearer Token 필요 (Authorization 헤더)

### Request Headers

```
Authorization: Bearer {token}
```

### Query Parameters

#### 옵션 1: 날짜 범위 조회

```
GET /my/schedule?startDate=2025-01-01&endDate=2025-01-31
```

#### 옵션 2: 전체 조회

```
GET /my/schedule
```

### Query Parameters 설명

```typescript
{
  startDate?: string;   // 선택, 시작 날짜 (YYYY-MM-DD)
  endDate?: string;     // 선택, 종료 날짜 (YYYY-MM-DD)
}
```

### Response (Success - 200)

```typescript
{
  schedules: Array<{
    scheduleId: number; // 일정 ID
    userIdx: number; // 사용자 ID
    title: string; // 일정 제목
    description: string | null; // 일정 설명
    scheduleDate: string; // 일정 날짜 (YYYY-MM-DD)
    createdAt: string; // 생성일시 (ISO 8601)
    updatedAt: string; // 수정일시 (ISO 8601)
  }>;
}
```

### Response Example (Success)

```json
{
  "schedules": [
    {
      "scheduleId": 1,
      "userIdx": 1,
      "title": "React 스터디",
      "description": "오후 3시에 React 스터디 진행",
      "scheduleDate": "2025-01-15",
      "createdAt": "2025-01-12T10:00:00.000Z",
      "updatedAt": "2025-01-12T10:00:00.000Z"
    },
    {
      "scheduleId": 2,
      "userIdx": 1,
      "title": "알고리즘 테스트",
      "description": "오전 10시",
      "scheduleDate": "2025-01-20",
      "createdAt": "2025-01-13T09:00:00.000Z",
      "updatedAt": "2025-01-13T09:00:00.000Z"
    }
  ]
}
```

### 빈 결과 예시

```json
{
  "schedules": []
}
```

### Error Responses

#### 400 Bad Request - 날짜 형식 오류

```json
{
  "message": "날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)"
}
```

#### 401 Unauthorized - 인증 실패

```json
{
  "message": "인증 에러"
}
```

#### 500 Internal Server Error

```json
{
  "message": "일정 조회에 실패했습니다.",
  "error": "에러 상세 메시지"
}
```

---

## 데이터 타입 상세

### Schedule Entity

```typescript
interface Schedule {
  scheduleId: number; // BIGINT, PRIMARY KEY, AUTO_INCREMENT
  userIdx: number; // BIGINT, NOT NULL, FK to members.user_idx
  title: string; // VARCHAR(255), NOT NULL
  description: string | null; // TEXT, NULLABLE
  scheduleDate: string; // DATE, NOT NULL (YYYY-MM-DD)
  createdAt: string; // DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP
  updatedAt: string; // DATETIME, NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE
}
```

---

## 사용 예시

### 일정 등록

```bash
curl -X POST http://localhost:3000/my/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "React 스터디",
    "description": "오후 3시에 React 스터디 진행",
    "scheduleDate": "2025-01-15"
  }'
```

### 날짜 범위 일정 조회

```bash
curl -X GET "http://localhost:3000/my/schedule?startDate=2025-01-01&endDate=2025-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 전체 일정 조회

```bash
curl -X GET http://localhost:3000/my/schedule \
  -H "Authorization: Bearer YOUR_TOKEN"
```
