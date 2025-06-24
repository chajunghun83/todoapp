// test2@gmail.com 계정에 더미 데이터 추가 스크립트

async function addDummyData() {
    console.log('🚀 더미 데이터 추가 시작...');
    
    // test2@gmail.com으로 로그인
    console.log('📧 test2@gmail.com으로 로그인 중...');
    
    try {
        const loginResult = await DirectSupabaseAPI.signIn('test2@gmail.com', 'test123');
        if (loginResult.error) {
            console.error('❌ 로그인 실패:', loginResult.error);
            return;
        }
        console.log('✅ 로그인 성공');
        
        // 더미 할일 데이터
        const dummyTodos = [
            // 완료된 할일들
            {
                title: "프로젝트 기획서 작성",
                description: "새로운 웹 애플리케이션 기획서 완성",
                start_date: "2025-06-20T09:00:00",
                due_date: "2025-06-22T18:00:00",
                progress: 100,
                completed: true
            },
            {
                title: "팀 미팅 준비",
                description: "주간 팀 미팅 자료 준비 및 발표",
                start_date: "2025-06-21T14:00:00",
                due_date: "2025-06-21T16:00:00",
                progress: 100,
                completed: true
            },
            {
                title: "요구사항 분석",
                description: "클라이언트 요구사항 정리 및 문서화",
                start_date: "2025-06-19T10:00:00",
                due_date: "2025-06-20T17:00:00",
                progress: 100,
                completed: true
            },
            
            // 진행 중인 할일들
            {
                title: "데이터베이스 설계",
                description: "사용자 관리 및 할일 관리 테이블 설계",
                start_date: "2025-06-23T10:00:00",
                due_date: "2025-06-26T17:00:00",
                progress: 75,
                completed: false
            },
            {
                title: "UI/UX 디자인 개선",
                description: "모바일 반응형 디자인 및 사용성 개선",
                start_date: "2025-06-24T09:00:00",
                due_date: "2025-06-28T18:00:00",
                progress: 40,
                completed: false
            },
            {
                title: "API 문서 작성",
                description: "REST API 명세서 및 사용 가이드 작성",
                start_date: "2025-06-25T13:00:00",
                due_date: "2025-06-27T16:00:00",
                progress: 60,
                completed: false
            },
            
            // 미래 할일들
            {
                title: "코드 리뷰 및 테스트",
                description: "전체 코드 품질 검토 및 단위 테스트 작성",
                start_date: "2025-06-27T09:00:00",
                due_date: "2025-06-30T17:00:00",
                progress: 0,
                completed: false
            },
            {
                title: "배포 환경 구축",
                description: "프로덕션 서버 설정 및 CI/CD 파이프라인 구축",
                start_date: "2025-07-01T10:00:00",
                due_date: "2025-07-03T16:00:00",
                progress: 0,
                completed: false
            },
            {
                title: "사용자 가이드 제작",
                description: "최종 사용자를 위한 매뉴얼 및 튜토리얼 제작",
                start_date: "2025-07-02T14:00:00",
                due_date: "2025-07-05T17:00:00",
                progress: 0,
                completed: false
            },
            
            // 마감 임박 할일
            {
                title: "클라이언트 프레젠테이션",
                description: "최종 결과물 발표 및 피드백 수집",
                start_date: "2025-06-25T14:00:00",
                due_date: "2025-06-26T16:00:00",
                progress: 20,
                completed: false
            },
            
            // 장기 프로젝트
            {
                title: "성능 최적화",
                description: "로딩 속도 개선 및 메모리 사용량 최적화",
                start_date: "2025-06-28T09:00:00",
                due_date: "2025-07-10T18:00:00",
                progress: 10,
                completed: false
            },
            
            // 일일 업무
            {
                title: "일일 스탠드업 미팅",
                description: "팀원들과 진행 상황 공유 및 이슈 논의",
                start_date: "2025-06-25T09:30:00",
                due_date: "2025-06-25T10:00:00",
                progress: 0,
                completed: false
            }
        ];
        
        console.log(`📝 ${dummyTodos.length}개의 더미 할일 추가 중...`);
        
        // 각 할일 추가
        for (let i = 0; i < dummyTodos.length; i++) {
            const todo = dummyTodos[i];
            console.log(`📌 ${i + 1}/${dummyTodos.length}: "${todo.title}" 추가 중...`);
            
            const result = await DirectSupabaseAPI.insertTodo({
                ...todo,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
            
            if (result.error) {
                console.error(`❌ "${todo.title}" 추가 실패:`, result.error);
            } else {
                console.log(`✅ "${todo.title}" 추가 성공`);
            }
            
            // 요청 간 간격 두기 (API 부하 방지)
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        console.log('🎉 모든 더미 데이터 추가 완료!');
        console.log('💡 이제 페이지를 새로고침하여 결과를 확인하세요.');
        
    } catch (error) {
        console.error('❌ 더미 데이터 추가 중 오류 발생:', error);
    }
}

// 페이지 로드 후 실행
if (typeof window !== 'undefined') {
    window.addDummyData = addDummyData;
    console.log('🔧 더미 데이터 추가 함수가 준비되었습니다.');
    console.log('💡 콘솔에서 addDummyData() 를 실행하세요.');
} 