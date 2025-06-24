-- test1@gmail.com 사용자를 위한 더미 데이터 삽입

-- 1단계: 먼저 프로필 정보 추가 (없다면)
INSERT INTO profiles (id, name, created_at, updated_at)
SELECT 
    id,
    '데모 사용자',
    NOW(),
    NOW()
FROM auth.users 
WHERE email = 'test1@gmail.com'
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = NOW();

-- 2단계: 더미 할일 데이터 삽입
INSERT INTO todos (
    title, 
    description, 
    start_date, 
    due_date, 
    progress, 
    completed, 
    user_id, 
    created_at, 
    updated_at
) VALUES 
-- 완료된 할일들
(
    '프로젝트 기획서 작성',
    '새로운 웹 애플리케이션 기획서 완성',
    '2025-06-20T09:00:00+00:00',
    '2025-06-22T18:00:00+00:00',
    100,
    true,
    (SELECT id FROM auth.users WHERE email = 'test2@gmail.com'),
    NOW(),
    NOW()
),
(
    '팀 미팅 준비',
    '주간 팀 미팅 자료 준비 및 발표',
    '2025-06-21T14:00:00+00:00',
    '2025-06-21T16:00:00+00:00',
    100,
    true,
    (SELECT id FROM auth.users WHERE email = 'test2@gmail.com'),
    NOW(),
    NOW()
),
(
    '요구사항 분석',
    '클라이언트 요구사항 정리 및 문서화',
    '2025-06-19T10:00:00+00:00',
    '2025-06-20T17:00:00+00:00',
    100,
    true,
    (SELECT id FROM auth.users WHERE email = 'test2@gmail.com'),
    NOW(),
    NOW()
),

-- 진행 중인 할일들
(
    '데이터베이스 설계',
    '사용자 관리 및 할일 관리 테이블 설계',
    '2025-06-23T10:00:00+00:00',
    '2025-06-26T17:00:00+00:00',
    75,
    false,
    (SELECT id FROM auth.users WHERE email = 'test2@gmail.com'),
    NOW(),
    NOW()
),
(
    'UI/UX 디자인 개선',
    '모바일 반응형 디자인 및 사용성 개선',
    '2025-06-24T09:00:00+00:00',
    '2025-06-28T18:00:00+00:00',
    40,
    false,
    (SELECT id FROM auth.users WHERE email = 'test2@gmail.com'),
    NOW(),
    NOW()
),
(
    'API 문서 작성',
    'REST API 명세서 및 사용 가이드 작성',
    '2025-06-25T13:00:00+00:00',
    '2025-06-27T16:00:00+00:00',
    60,
    false,
    (SELECT id FROM auth.users WHERE email = 'test2@gmail.com'),
    NOW(),
    NOW()
),

-- 미래 할일들
(
    '코드 리뷰 및 테스트',
    '전체 코드 품질 검토 및 단위 테스트 작성',
    '2025-06-27T09:00:00+00:00',
    '2025-06-30T17:00:00+00:00',
    0,
    false,
    (SELECT id FROM auth.users WHERE email = 'test2@gmail.com'),
    NOW(),
    NOW()
),
(
    '배포 환경 구축',
    '프로덕션 서버 설정 및 CI/CD 파이프라인 구축',
    '2025-07-01T10:00:00+00:00',
    '2025-07-03T16:00:00+00:00',
    0,
    false,
    (SELECT id FROM auth.users WHERE email = 'test2@gmail.com'),
    NOW(),
    NOW()
),
(
    '사용자 가이드 제작',
    '최종 사용자를 위한 매뉴얼 및 튜토리얼 제작',
    '2025-07-02T14:00:00+00:00',
    '2025-07-05T17:00:00+00:00',
    0,
    false,
    (SELECT id FROM auth.users WHERE email = 'test2@gmail.com'),
    NOW(),
    NOW()
),

-- 마감 임박 할일
(
    '클라이언트 프레젠테이션',
    '최종 결과물 발표 및 피드백 수집',
    '2025-06-25T14:00:00+00:00',
    '2025-06-26T16:00:00+00:00',
    20,
    false,
    (SELECT id FROM auth.users WHERE email = 'test2@gmail.com'),
    NOW(),
    NOW()
),

-- 장기 프로젝트
(
    '성능 최적화',
    '로딩 속도 개선 및 메모리 사용량 최적화',
    '2025-06-28T09:00:00+00:00',
    '2025-07-10T18:00:00+00:00',
    10,
    false,
    (SELECT id FROM auth.users WHERE email = 'test2@gmail.com'),
    NOW(),
    NOW()
),

-- 일일 업무
(
    '일일 스탠드업 미팅',
    '팀원들과 진행 상황 공유 및 이슈 논의',
    '2025-06-25T09:30:00+00:00',
    '2025-06-25T10:00:00+00:00',
    0,
    false,
    (SELECT id FROM auth.users WHERE email = 'test2@gmail.com'),
    NOW(),
    NOW()
),

-- 추가 다양한 할일들
(
    '보안 점검',
    '애플리케이션 보안 취약점 분석 및 개선',
    '2025-06-26T10:00:00+00:00',
    '2025-06-29T17:00:00+00:00',
    30,
    false,
    (SELECT id FROM auth.users WHERE email = 'test2@gmail.com'),
    NOW(),
    NOW()
),
(
    '백업 시스템 구축',
    '데이터 백업 및 복구 시스템 설정',
    '2025-06-30T09:00:00+00:00',
    '2025-07-02T18:00:00+00:00',
    5,
    false,
    (SELECT id FROM auth.users WHERE email = 'test2@gmail.com'),
    NOW(),
    NOW()
),
(
    '모니터링 시스템 설정',
    '시스템 상태 모니터링 및 알림 설정',
    '2025-07-03T10:00:00+00:00',
    '2025-07-06T16:00:00+00:00',
    0,
    false,
    (SELECT id FROM auth.users WHERE email = 'test2@gmail.com'),
    NOW(),
    NOW()
);

 