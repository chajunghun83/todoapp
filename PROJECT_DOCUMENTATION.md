# Todo 앱 프로젝트 인수인계 문서

## 📋 프로젝트 개요

### 기본 정보
- **프로젝트명**: Todo 앱 (할일 관리 시스템)
- **개발 언어**: HTML, CSS, JavaScript (Vanilla JS)
- **백엔드**: Supabase (BaaS - Backend as a Service)
- **배포**: GitHub Pages (https://chajunghun83.github.io/todoapp/)
- **개발 기간**: 2025년 1월
- **현재 버전**: v1.0.0-backup

### 주요 기능
- 회원가입/로그인 (이메일 인증 없음)
- 할일 CRUD (생성, 읽기, 수정, 삭제)
- 캘린더 뷰와 리스트 뷰
- 할일 우선순위 및 진행률 관리
- 시작일/마감일 설정
- 반응형 웹 디자인
- 텍스트 오버플로우 처리 (말줄임표)
- 프로필 정보 수정 기능

## 🏗️ 프로젝트 구조

```
todoapp/
├── index.html              # 메인 페이지
├── pages/
│   ├── login.html          # 로그인 페이지
│   └── signup.html         # 회원가입 페이지
├── css/
│   └── style.css           # 전체 스타일시트
├── js/
│   ├── app.js              # 메인 애플리케이션 로직
│   ├── auth.js             # 인증 관련 로직
│   └── supabase.js         # Supabase API 연동
├── assets/
│   └── images/             # 이미지 파일들
├── favicon.svg             # 파비콘
└── deploy.bat              # 배포 스크립트
```

## 🔧 기술 스택

### 프론트엔드
- **HTML5**: 시맨틱 마크업
- **CSS3**: 
  - Flexbox, Grid 레이아웃
  - CSS 애니메이션 및 트랜지션
  - 반응형 디자인 (모바일 우선)
  - 커스텀 CSS 변수
- **JavaScript (ES6+)**:
  - 모듈 패턴
  - Async/Await
  - LocalStorage 활용
  - DOM 조작

### 백엔드 (Supabase)
- **데이터베이스**: PostgreSQL
- **인증**: Supabase Auth
- **API**: RESTful API
- **실시간**: Real-time subscriptions (미사용)

## 🗄️ 데이터베이스 구조

### profiles 테이블
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### todos 테이블
```sql
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  priority INTEGER DEFAULT 1,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### RLS (Row Level Security) 정책
**현재 RLS는 활성화되어 있으며**, 다음 정책들이 적용되어 있습니다:
```sql
-- profiles 테이블
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- todos 테이블
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own todos" ON todos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own todos" ON todos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own todos" ON todos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own todos" ON todos FOR DELETE USING (auth.uid() = user_id);
```

## 🔐 인증 시스템

### 인증 방식
- **이메일 기반 인증** (이메일 확인 비활성화)
- **토큰 기반 세션 관리**
- **LocalStorage를 통한 클라이언트 사이드 토큰 저장**

### 인증 플로우
1. 회원가입 → 자동 로그인 → 프로필 생성
2. 로그인 → 토큰 저장 → 메인 페이지 리다이렉트
3. 페이지 로드 시 토큰 검증 → 인증 상태 확인

### 주요 인증 함수
- `Auth.signUp()`: 회원가입
- `Auth.signIn()`: 로그인
- `Auth.signOut()`: 로그아웃
- `SupabaseUtils.isLoggedIn()`: 로그인 상태 확인
- `SupabaseUtils.getCurrentUser()`: 현재 사용자 정보 조회

## 🌐 API 연동

### Supabase 설정
```javascript
// supabase.js
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

### API 호출 방식
프로젝트는 환경에 따라 자동으로 적절한 API 호출 방식을 선택합니다:

#### 1. 직접 REST API 호출 (기본 방식)
모든 환경에서 토큰 기반 인증을 통한 직접 API 호출을 사용합니다:
```javascript
const response = await fetch(`${SUPABASE_URL}/rest/v1/todos`, {
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json'
  }
});
```

#### 2. Supabase 클라이언트 (레거시)
기존 코드 호환성을 위해 유지되지만 실제로는 사용되지 않습니다.

### 주요 API 함수
- `DirectSupabaseAPI.getTodos()`: 할일 목록 조회
- `DirectSupabaseAPI.insertTodo()`: 할일 추가
- `DirectSupabaseAPI.updateTodo()`: 할일 수정
- `DirectSupabaseAPI.deleteTodo()`: 할일 삭제
- `DirectSupabaseAPI.signUp()`: 회원가입 및 프로필 생성
- `DirectSupabaseAPI.signIn()`: 로그인
- `DirectSupabaseAPI.createProfile()`: 프로필 생성
- `DirectSupabaseAPI.getProfile()`: 프로필 조회
- `DirectSupabaseAPI.updateProfile()`: 프로필 수정

## 🎨 UI/UX 특징

### 디자인 시스템
- **컬러 팔레트**: 
  - Primary: #667eea (보라-파랑 그라데이션)
  - Success: #28a745 (초록)
  - Danger: #dc3545 (빨강)
  - Warning: #ffc107 (노랑)
- **타이포그래피**: 시스템 폰트 스택
- **애니메이션**: CSS 트랜지션 및 키프레임

### 반응형 브레이크포인트
- **Desktop**: 768px 이상
- **Tablet**: 768px 이하
- **Mobile**: 480px 이하
- **Small Mobile**: 360px 이하

### 주요 컴포넌트
- **인증 폼**: 현대적인 그라데이션 배경, 떠다니는 애니메이션, 빛나는 버튼 효과
- **할일 카드**: 호버 효과, 진행률 바, 텍스트 오버플로우 처리
- **캘린더**: 완전 반응형 7x6 그리드
- **모달**: 부드러운 오버레이, 페이드 애니메이션

## 📱 주요 기능 상세

### 1. 할일 관리
- **추가**: 제목, 설명, 시작일, 마감일, 진행률 설정
- **수정**: 인라인 편집 또는 모달을 통한 수정
- **삭제**: 확인 후 삭제
- **완료 처리**: 체크박스 토글
- **텍스트 처리**: 긴 제목/설명 자동 말줄임표 처리

### 2. 캘린더 뷰
- **월간 캘린더**: 완전 반응형 7x6 그리드
- **할일 표시**: 시작일(초록), 중간일(회색), 마감일(빨강)
- **네비게이션**: 이전/다음 월, 오늘로 이동
- **날짜 선택**: 년/월 선택 모달
- **모바일 최적화**: 작은 화면에서도 완벽한 표시

### 3. 필터링 및 정렬
- **상태별 필터**: 전체, 진행중, 완료, 지연
- **우선순위별 필터**: 높음, 보통, 낮음
- **정렬**: 마감일, 생성일, 제목, 우선순위
- **검색**: 제목 기반 실시간 검색

### 4. 프로필 관리
- **정보 수정**: 이름 변경 (실시간 반영)
- **사용자 정보**: 이메일, 가입일 표시
- **프로필 사진**: 기본 아바타 표시

## 🚀 배포 및 운영

### GitHub Pages 배포
- **배포 URL**: https://chajunghun83.github.io/todoapp/
- **자동 배포**: main 브랜치 푸시 시 자동 배포
- **HTTPS 지원**: GitHub Pages 기본 제공
- **커스텀 도메인**: 설정 가능

### 백업 시스템
프로젝트는 다음과 같은 백업 시스템을 갖추고 있습니다:

#### Git 태그 백업
- `v1.0.0-backup`: 완성된 기본 기능 백업 포인트
- 롤백 명령: `git checkout v1.0.0-backup`

#### 백업 브랜치
- `backup-v1.0.0`: 백업 전용 브랜치
- 롤백 명령: `git checkout backup-v1.0.0`

#### 로컬 백업
- `C:\work\todoapp-backup-v1.0.0`: 로컬 전체 백업

### 환경 변수 관리
- Supabase URL과 API 키는 코드에 직접 포함
- 보안이 중요한 경우 환경변수 또는 설정 파일 분리 권장

### 성능 최적화
- **이미지 최적화**: SVG 아이콘 사용
- **CSS 최적화**: 단일 파일, 압축된 스타일
- **JavaScript 최적화**: 토큰 기반 인증으로 성능 향상
- **텍스트 렌더링**: CSS를 통한 효율적인 오버플로우 처리

## ⚠️ 알려진 이슈 및 제한사항

### 해결된 이슈
1. ✅ **RLS 활성화**: 보안 정책 적용 완료
2. ✅ **토큰 인증**: 안정적인 토큰 기반 인증 시스템 구축
3. ✅ **반응형 캘린더**: 모든 디바이스에서 완벽한 표시
4. ✅ **텍스트 오버플로우**: 긴 텍스트 자동 처리
5. ✅ **프로필 관리**: 이름 수정 기능 완료

### 현재 제한사항
1. **실시간 업데이트 없음**: 페이지 새로고침 필요
2. **오프라인 지원 없음**: 인터넷 연결 필수
3. **이메일 인증 비활성화**: 보안 강화 시 활성화 권장

### 개선 가능한 부분
1. **PWA 지원**: 서비스 워커, 매니페스트 추가
2. **실시간 알림**: 마감일 알림, 푸시 알림
3. **파일 첨부**: 할일에 파일 첨부 기능
4. **협업 기능**: 할일 공유, 댓글 기능
5. **통계 대시보드**: 완료율, 생산성 통계
6. **다크 모드**: 테마 전환 기능

## 🔧 개발 환경 설정

### 로컬 개발
1. 프로젝트 클론: `git clone https://github.com/chajunghun83/todoapp.git`
2. HTTP 서버 실행 (Live Server 등)
3. Supabase 프로젝트 설정
4. API 키 설정

### 필수 도구
- **코드 에디터**: VS Code 권장
- **브라우저**: Chrome, Firefox (개발자 도구 활용)
- **HTTP 서버**: Live Server, Python SimpleHTTPServer 등
- **Git**: 버전 관리 및 배포

### 디버깅 도구
HTML에 숨겨진 디버깅 도구가 있습니다:
```javascript
// 브라우저 콘솔에서 활성화
document.querySelector('.test-buttons').style.display = 'block';
```

주요 디버깅 기능:
- 로그인 상태 확인
- 토큰 유효성 검증
- 사용자 정보 확인
- 할일 추가 테스트

## 📞 문의 및 지원

### 코드 구조 이해
- `js/app.js`: 메인 애플리케이션 로직, 할일 관리
- `js/auth.js`: 인증 관련 함수들, 프로필 관리
- `js/supabase.js`: DirectSupabaseAPI, 토큰 기반 API 호출
- `css/style.css`: 반응형 스타일, 텍스트 오버플로우 처리

### 주요 함수 목록
- **인증**: `signUp()`, `signIn()`, `signOut()`
- **할일**: `loadTodos()`, `addTodo()`, `editTodo()`, `deleteTodo()`
- **캘린더**: `renderCalendar()`, `navigateMonth()`
- **필터**: `applyFilters()`, `sortTodos()`
- **프로필**: `loadUserProfile()`, `updateProfile()`

### 백업 및 복구
```bash
# 백업 포인트로 롤백
git checkout v1.0.0-backup
git checkout -b restore-from-backup

# 백업 브랜치로 전환
git checkout backup-v1.0.0

# 태그 목록 확인
git tag -l
```

## 📚 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase RLS 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- [JavaScript MDN 문서](https://developer.mozilla.org/ko/docs/Web/JavaScript)
- [CSS Grid 가이드](https://css-tricks.com/snippets/css/complete-guide-grid/)
- [Flexbox 가이드](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
- [GitHub Pages 배포 가이드](https://docs.github.com/en/pages)

---

**마지막 업데이트**: 2025년 1월
**개발자**: AI Assistant  
**현재 버전**: v1.0.0-backup
**배포 상태**: ✅ 운영 중 (GitHub Pages)
**백업 상태**: ✅ 다중 백업 완료 