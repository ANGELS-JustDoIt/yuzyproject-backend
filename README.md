# Backend Service

Express.js 기반의 RESTful API 서버입니다. 사용자 인증, 게시글 관리, 댓글, 좋아요, 일정 관리 등의 기능을 제공합니다.

## 📋 목차

- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [환경 요구사항](#환경-요구사항)
- [설치 및 설정](#설치-및-설정)
- [실행 방법](#실행-방법)
- [API 엔드포인트](#api-엔드포인트)
- [프로젝트 구조](#프로젝트-구조)
- [데이터베이스](#데이터베이스)
- [환경 변수](#환경-변수)

## 🚀 주요 기능

- **사용자 인증**: JWT 기반 인증 시스템 (회원가입, 로그인)
- **게시글 관리**: 게시글 CRUD, 이미지 업로드, 파일 첨부
- **댓글 시스템**: 게시글 댓글 작성, 수정, 삭제
- **좋아요 기능**: 게시글 및 댓글 좋아요
- **사용자 프로필**: 프로필 조회 및 수정, 프로필 이미지 업로드
- **일정 관리**: 사용자 일정 관리 기능
- **활동 기록**: 잔디(커밋 그래프) 기능으로 활동 기록

## 🛠 기술 스택

- **Runtime**: Node.js
- **Framework**: Express.js 5.x
- **Database**: MySQL
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **File Upload**: Multer
- **Image Processing**: Sharp
- **Validation**: express-validator
- **Documentation**: Swagger (swagger-jsdoc, swagger-ui-express)

## 📦 환경 요구사항

- **Node.js**: v18 이상 권장
- **MySQL**: 8.0 이상
- **npm** 또는 **yarn**

## 🔧 설치 및 설정

### 1. 의존성 설치

```bash
cd yuzyproject-backend
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 변수들을 설정합니다:

```env
# JWT 설정
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_SEC=86400

# Bcrypt 설정
BCRYPT_SALT_ROUNDS=12

# 서버 포트
PORT=9090
HOST_PORT=9090

# 데이터베이스 설정
DB_HOST=localhost
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_DATABASE=your-database-name
DB_PORT=3306

# 프론트엔드 URL (CORS 설정용)
FRONTEND_URL=http://localhost:3000

# 환경 설정
NODE_ENV=development
```

### 3. 데이터베이스 설정

1. MySQL 데이터베이스 생성
2. `DDL.txt` 파일의 SQL 스크립트를 실행하여 테이블 생성
3. `foreign_keys.sql` 파일을 실행하여 외래키 설정 (필요 시)
4. `add_profile_image_column.sql` 실행 (프로필 이미지 컬럼 추가, 필요 시)

### 4. 업로드 디렉토리 생성

`uploads` 디렉토리가 자동으로 생성되지만, 필요 시 수동으로 생성할 수 있습니다:

```bash
mkdir uploads
```

## ▶️ 실행 방법

### 개발 모드 실행

```bash
npm run dev
```

Nodemon이 설치되어 있어 파일 변경 시 자동으로 서버가 재시작됩니다.

### 프로덕션 모드 실행

```bash
npm start
```

서버가 실행되면 기본적으로 `http://localhost:9090`에서 접근 가능합니다.

## 📡 API 엔드포인트

### 인증 (Authentication)

#### 회원가입
```
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "userName": "사용자명"
}
```

#### 로그인
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt-token-here",
  "user": {
    "userIdx": 1,
    "email": "user@example.com",
    "userName": "사용자명"
  }
}
```

### 게시글 (Posts)

#### 게시글 작성
```
POST /post
Authorization: Bearer {token}
Content-Type: multipart/form-data

title: 게시글 제목
type: 게시글 타입
content: 게시글 내용
mainImage: (file, optional)
files: (files, optional)
```

#### 게시글 목록 조회
```
GET /post?page=1&limit=10
```

#### 게시글 상세 조회
```
GET /post/:boardId
```

#### 게시글 수정
```
PUT /post/:boardId
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

#### 게시글 삭제
```
DELETE /post/:boardId
Authorization: Bearer {token}
```

### 댓글 (Comments)

#### 댓글 작성
```
POST /post/:boardId/comment
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "댓글 내용"
}
```

#### 댓글 수정
```
PUT /post/:boardId/comment/:commentId
Authorization: Bearer {token}
```

#### 댓글 삭제
```
DELETE /post/:boardId/comment/:commentId
Authorization: Bearer {token}
```

### 좋아요 (Likes)

#### 좋아요 추가/제거
```
POST /post/:boardId/like
Authorization: Bearer {token}
```

### 사용자 (My)

#### 프로필 조회
```
GET /my/profile
Authorization: Bearer {token}
```

#### 프로필 수정
```
PUT /my/profile
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

### 정적 파일

업로드된 이미지 및 파일은 다음 경로로 접근 가능합니다:

```
GET /uploads/{filename}
```

예: `http://localhost:9090/uploads/1765680275595-84573369.png`

## 📁 프로젝트 구조

```
yuzyproject-backend/
├── app.mjs                 # Express 애플리케이션 진입점
├── config.mjs              # 환경 변수 설정
├── package.json            # 프로젝트 의존성 및 스크립트
├── router/                 # 라우터 모듈
│   ├── auth.mjs           # 인증 라우터
│   ├── post.mjs           # 게시글 라우터
│   └── my.mjs             # 사용자 프로필 라우터
├── controller/             # 컨트롤러 (비즈니스 로직)
│   ├── auth.mjs
│   ├── post.mjs
│   ├── comment.mjs
│   ├── like.mjs
│   ├── my.mjs
│   └── schedule.mjs
├── data/                   # 데이터 접근 계층 (Repository)
│   ├── auth.mjs
│   ├── post.mjs
│   ├── comment.mjs
│   ├── like.mjs
│   ├── my.mjs
│   ├── schedule.mjs
│   └── file.mjs
├── middleware/             # 미들웨어
│   ├── auth.mjs           # JWT 인증 미들웨어
│   ├── upload.mjs         # 파일 업로드 미들웨어
│   └── validator.mjs      # 요청 검증 미들웨어
├── db/                     # 데이터베이스 연결
│   └── database.mjs
├── uploads/                # 업로드된 파일 저장 디렉토리
├── DDL.txt                 # 데이터베이스 스키마
├── foreign_keys.sql        # 외래키 설정
└── add_profile_image_column.sql
```

## 🗄️ 데이터베이스

### 주요 테이블

- `users`: 사용자 정보
- `boards`: 게시글
- `comments`: 댓글
- `likes`: 좋아요
- `files`: 업로드된 파일 정보
- `schedules`: 일정 정보
- `grass`: 활동 기록 (잔디)

### 데이터베이스 연결

`db/database.mjs`에서 MySQL 연결 풀을 관리합니다. 환경 변수의 데이터베이스 설정을 사용합니다.

## 🔐 인증 시스템

### JWT 토큰

- **발급**: 로그인 성공 시 JWT 토큰 발급
- **검증**: `middleware/auth.mjs`의 `isAuth` 미들웨어로 토큰 검증
- **형식**: `Authorization: Bearer {token}`
- **만료 시간**: `JWT_EXPIRES_SEC` 환경 변수로 설정 (기본 86400초 = 24시간)

### 비밀번호 암호화

- **알고리즘**: bcrypt
- **Salt Rounds**: `BCRYPT_SALT_ROUNDS` 환경 변수로 설정 (기본 12)

## 📤 파일 업로드

### 지원 기능

- **이미지 업로드**: 게시글 메인 이미지, 프로필 이미지
- **파일 첨부**: 게시글에 여러 파일 첨부 가능
- **이미지 처리**: Sharp를 사용한 이미지 최적화
- **저장 위치**: `uploads/` 디렉토리
- **접근 경로**: `/uploads/{filename}`

### 업로드 제한

- Multer 설정에서 파일 크기 및 개수 제한 가능
- `middleware/upload.mjs`에서 업로드 설정 관리

## ✅ 요청 검증

`express-validator`를 사용하여 요청 데이터를 검증합니다:

- **이메일 형식 검증**
- **비밀번호 길이 검증** (최소 8자)
- **필수 필드 검증**
- **커스텀 검증 규칙**

검증 실패 시 적절한 에러 메시지를 반환합니다.

## 🌐 CORS 설정

프론트엔드와의 통신을 위해 CORS가 설정되어 있습니다:

- **개발 환경**: 모든 origin 허용
- **프로덕션 환경**: `FRONTEND_URL` 환경 변수에 지정된 origin만 허용

## 🐛 문제 해결

### 데이터베이스 연결 실패
- MySQL 서버가 실행 중인지 확인
- 환경 변수의 데이터베이스 정보 확인
- 방화벽 설정 확인

### JWT 토큰 오류
- `JWT_SECRET` 환경 변수 확인
- 토큰 만료 시간 확인
- Authorization 헤더 형식 확인 (`Bearer {token}`)

### 파일 업로드 실패
- `uploads` 디렉토리 권한 확인
- 파일 크기 제한 확인
- Multer 설정 확인

## 📝 라이선스

ISC
