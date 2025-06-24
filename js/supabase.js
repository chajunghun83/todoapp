// Supabase 설정
const SUPABASE_URL = 'https://ouraddztctgfeeqdqqas.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91cmFkZHp0Y3RnZmVlcWRxcWFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzOTY0NzksImV4cCI6MjA2NTk3MjQ3OX0.reT9RDNCHL0ezW-0jjFUvj23zSbR1dB0zKVTq8N5WrA'

// GitHub Pages CORS 우회를 위한 설정
const SUPABASE_CONFIG = {
    global: {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        fetch: (url, options = {}) => {
            // 모든 환경에서 직접 fetch 사용 (프록시 제거)
            const corsOptions = {
                ...options,
                mode: 'cors',
                credentials: 'omit',
                headers: {
                    ...options.headers,
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': options.headers?.Authorization || `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
            
            console.log('직접 fetch 요청:', url, corsOptions)
            return fetch(url, corsOptions)
        }
    }
}

// Supabase 클라이언트 초기화 (CORS 설정 포함)
const { createClient } = supabase
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_CONFIG)

// 내보내기 (전역 변수로 사용)
window.supabaseClient = supabaseClient

// 유틸리티 함수들
const SupabaseUtils = {
    // 현재 사용자 가져오기
    async getCurrentUser() {
        // GitHub Pages 환경에서는 저장된 토큰 우선 확인
        if (window.location.hostname.includes('github.io')) {
            const tokenUser = DirectSupabaseAPI.getCurrentUserFromToken()
            if (tokenUser) {
                console.log('토큰에서 사용자 정보 반환:', tokenUser)
                return tokenUser
            }
        }
        
        // 실제 Supabase 호출을 우선으로 시도
        try {
            const { data: { user }, error } = await supabaseClient.auth.getUser()
            if (error) {
                console.error('사용자 정보 가져오기 오류:', error)
                // 오류가 발생했을 때만 테스트 모드 확인
                const testLoggedIn = localStorage.getItem('test_logged_in')
                if (testLoggedIn === 'true') {
                    const testUserEmail = localStorage.getItem('test_user_email')
                    return {
                        id: 'test-user-id',
                        email: testUserEmail || 'test@example.com'
                    }
                }
                return null
            }
            return user
        } catch (error) {
            console.error('사용자 정보 가져오기 실패:', error)
            // 네트워크 오류 등의 경우에만 테스트 모드 확인
            const testLoggedIn = localStorage.getItem('test_logged_in')
            if (testLoggedIn === 'true') {
                const testUserEmail = localStorage.getItem('test_user_email')
                return {
                    id: 'test-user-id',
                    email: testUserEmail || 'test@example.com'
                }
            }
            return null
        }
    },

    // Supabase 연결 테스트
    async testConnection() {
        try {
            console.log('Supabase 연결 테스트 시작...')
            console.log('URL:', SUPABASE_URL)
            console.log('API Key (처음 20자):', SUPABASE_ANON_KEY.substring(0, 20) + '...')
            
            // 간단한 auth 상태 확인
            const { data, error } = await supabaseClient.auth.getSession()
            
            if (error) {
                console.error('Supabase 연결 오류:', error)
                return { success: false, error: error.message }
            }
            
            console.log('Supabase 연결 성공!')
            return { success: true, data }
        } catch (error) {
            console.error('Supabase 연결 테스트 실패:', error)
            return { success: false, error: error.message }
        }
    },

    // 로그인 상태 확인
    async isLoggedIn() {
        // 실제 Supabase 확인을 우선으로 시도
        try {
            const { data: { session }, error } = await supabaseClient.auth.getSession()
            if (error) {
                console.error('세션 확인 오류:', error)
                // 오류가 발생했을 때만 테스트 모드 확인
                const testLoggedIn = localStorage.getItem('test_logged_in')
                console.log('localStorage test_logged_in:', testLoggedIn)
                if (testLoggedIn === 'true') {
                    console.log('테스트 모드 로그인 상태: true')
                    return true
                }
                return false
            }
            
            const isReallyLoggedIn = !!(session && session.user)
            console.log('실제 Supabase 로그인 상태:', isReallyLoggedIn)
            console.log('세션 정보:', session ? '존재' : '없음')
            
            return isReallyLoggedIn
        } catch (error) {
            console.error('로그인 상태 확인 실패:', error)
            // 네트워크 오류 등의 경우에만 테스트 모드 확인
            const testLoggedIn = localStorage.getItem('test_logged_in')
            console.log('localStorage test_logged_in:', testLoggedIn)
            if (testLoggedIn === 'true') {
                console.log('테스트 모드 로그인 상태: true')
                return true
            }
            return false
        }
    },

    // 세션 가져오기
    async getSession() {
        const { data: { session } } = await supabaseClient.auth.getSession()
        return session
    },

    // 인증 상태 변경 리스너
    onAuthStateChange(callback) {
        return supabaseClient.auth.onAuthStateChange(callback)
    },

    // 에러 처리 헬퍼
    handleError(error) {
        console.error('Supabase Error:', error)
        
        // 일반적인 Supabase 오류 코드별 한글 메시지 처리
        if (error.message) {
            let errorMessage = error.message
            
            // 일반적인 오류 메시지 한글화
            if (error.message.includes('Invalid login credentials')) {
                errorMessage = '등록된 이메일이 없거나 비밀번호가 틀렸습니다.'
            } else if (error.message.includes('User already registered')) {
                errorMessage = '이미 등록된 이메일입니다.'
            } else if (error.message.includes('Email not confirmed')) {
                errorMessage = '이메일 확인이 필요합니다.'
            } else if (error.message.includes('Network error')) {
                errorMessage = '네트워크 연결을 확인해주세요.'
            } else if (error.message.includes('Database error')) {
                errorMessage = '데이터베이스 오류가 발생했습니다.'
            } else if (error.message.includes('Permission denied')) {
                errorMessage = '권한이 없습니다.'
            } else if (error.message.includes('Rate limit exceeded')) {
                errorMessage = '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
            } else if (error.message.includes('Service unavailable')) {
                errorMessage = '서비스가 일시적으로 사용할 수 없습니다.'
            } else if (error.message.includes('Timeout')) {
                errorMessage = '요청 시간이 초과되었습니다. 다시 시도해주세요.'
            }
            
            return errorMessage
        }
        
        return '알 수 없는 오류가 발생했습니다.'
    },

    // 성공 메시지 표시
    showSuccess(message) {
        this.showMessage(message, 'success')
    },

    // 에러 메시지 표시
    showError(message) {
        this.showMessage(message, 'error')
    },

    // 메시지 표시 (UI 헬퍼)
    showMessage(message, type = 'info') {
        const messageDiv = document.getElementById('message')
        if (messageDiv) {
            messageDiv.innerHTML = `<div class="message ${type}">${message}</div>`
            
            // 3초 후 메시지 제거
            setTimeout(() => {
                messageDiv.innerHTML = ''
            }, 3000)
        }
    },

    // 로딩 상태 표시
    showLoading(element, show = true) {
        if (show) {
            element.innerHTML = '<div class="loading"><div class="spinner"></div>로딩 중...</div>'
        }
    },

    // 날짜 포맷팅
    formatDate(dateString) {
        if (!dateString) return ''
        
        const date = new Date(dateString)
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    },

    // 상대적 시간 표시
    getRelativeTime(dateString) {
        if (!dateString) return ''
        
        const date = new Date(dateString)
        const now = new Date()
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
        
        if (diffInHours < 1) {
            return '방금 전'
        } else if (diffInHours < 24) {
            return `${diffInHours}시간 전`
        } else {
            const diffInDays = Math.floor(diffInHours / 24)
            return `${diffInDays}일 전`
        }
    }
}

// 전역으로 내보내기
window.SupabaseUtils = SupabaseUtils

// GitHub Pages CORS 우회를 위한 직접 API 호출 함수들
const DirectSupabaseAPI = {
    // 직접 fetch로 todos 조회
    async getTodos(userId) {
        try {
            console.log('직접 API 호출로 todos 조회:', userId)
            const response = await fetch(`${SUPABASE_URL}/rest/v1/todos?user_id=eq.${userId}&select=*`, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Range': '0-999'
                }
            })
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }
            
            const data = await response.json()
            console.log('직접 API 조회 성공:', data)
            return { data, error: null }
        } catch (error) {
            console.error('직접 API 조회 실패:', error)
            return { data: null, error }
        }
    },
    
    // 직접 fetch로 todo 추가
    async insertTodo(todoData) {
        try {
            console.log('직접 API 호출로 todo 추가:', todoData)
            const response = await fetch(`${SUPABASE_URL}/rest/v1/todos`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(todoData)
            })
            
            if (!response.ok) {
                const errorText = await response.text()
                console.error('API 응답 오류:', response.status, errorText)
                throw new Error(`HTTP ${response.status}: ${errorText}`)
            }
            
            const data = await response.json()
            console.log('직접 API 추가 성공:', data)
            return { data, error: null }
        } catch (error) {
            console.error('직접 API 추가 실패:', error)
            return { data: null, error }
        }
    },
    
    // 직접 fetch로 todo 업데이트
    async updateTodo(todoId, updates) {
        try {
            console.log('직접 API 호출로 todo 업데이트:', todoId, updates)
            const response = await fetch(`${SUPABASE_URL}/rest/v1/todos?id=eq.${todoId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(updates)
            })
            
            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`HTTP ${response.status}: ${errorText}`)
            }
            
            const data = await response.json()
            console.log('직접 API 업데이트 성공:', data)
            return { data, error: null }
        } catch (error) {
            console.error('직접 API 업데이트 실패:', error)
            return { data: null, error }
        }
    },
    
    // 직접 fetch로 todo 삭제
    async deleteTodo(todoId) {
        try {
            console.log('직접 API 호출로 todo 삭제:', todoId)
            const response = await fetch(`${SUPABASE_URL}/rest/v1/todos?id=eq.${todoId}`, {
                method: 'DELETE',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            })
            
            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`HTTP ${response.status}: ${errorText}`)
            }
            
            console.log('직접 API 삭제 성공')
            return { data: null, error: null }
        } catch (error) {
            console.error('직접 API 삭제 실패:', error)
            return { data: null, error }
        }
    },
    
    // 직접 fetch로 회원가입
    async signUp(email, password) {
        try {
            console.log('직접 API 호출로 회원가입:', email)
            const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            })
            
            if (!response.ok) {
                const errorData = await response.json()
                console.error('회원가입 API 응답 오류:', response.status, errorData)
                throw new Error(errorData.error_description || errorData.msg || '회원가입에 실패했습니다.')
            }
            
            const data = await response.json()
            console.log('직접 API 회원가입 성공:', data)
            return { data, error: null }
        } catch (error) {
            console.error('직접 API 회원가입 실패:', error)
            return { data: null, error }
        }
    },
    
    // 직접 fetch로 로그인
    async signIn(email, password) {
        try {
            console.log('직접 API 호출로 로그인:', email)
            const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            })
            
            if (!response.ok) {
                const errorData = await response.json()
                console.error('로그인 API 응답 오류:', response.status, errorData)
                throw new Error(errorData.error_description || errorData.msg || '로그인에 실패했습니다.')
            }
            
            const data = await response.json()
            console.log('직접 API 로그인 성공:', data)
            
            // 로그인 성공 시 토큰을 localStorage에 저장
            if (data.access_token) {
                localStorage.setItem('supabase_access_token', data.access_token)
                localStorage.setItem('supabase_user', JSON.stringify(data.user))
            }
            
            return { data, error: null }
        } catch (error) {
            console.error('직접 API 로그인 실패:', error)
            return { data: null, error }
        }
    },
    
    // 저장된 토큰으로 사용자 정보 가져오기
    getCurrentUserFromToken() {
        const token = localStorage.getItem('supabase_access_token')
        const userStr = localStorage.getItem('supabase_user')
        
        if (token && userStr) {
            try {
                const user = JSON.parse(userStr)
                return user
            } catch (error) {
                console.error('사용자 정보 파싱 오류:', error)
                return null
            }
        }
        
        return null
    }
}

// 전역으로 내보내기
window.DirectSupabaseAPI = DirectSupabaseAPI

// 개발 도구 함수들
window.testSupabaseConnection = async function() {
    const result = await SupabaseUtils.testConnection()
    if (result.success) {
        SupabaseUtils.showSuccess('Supabase 연결 성공!')
    } else {
        SupabaseUtils.showError(`Supabase 연결 실패: ${result.error}`)
    }
    return result
}

window.toggleTestMode = function() {
    const isTestMode = localStorage.getItem('test_logged_in') === 'true'
    
    if (isTestMode) {
        // 테스트 모드 해제
        localStorage.removeItem('test_logged_in')
        localStorage.removeItem('test_user_email')
        localStorage.removeItem('test_user_name')
        SupabaseUtils.showSuccess('실제 Supabase 모드로 전환됩니다...')
        
        // 1초 후 페이지 새로고침
        setTimeout(() => {
            window.location.reload()
        }, 1000)
    } else {
        // 테스트 모드 활성화
        localStorage.setItem('test_logged_in', 'true')
        localStorage.setItem('test_user_email', 'test@example.com')
        localStorage.setItem('test_user_name', '차정훈')
        SupabaseUtils.showSuccess('테스트 모드로 전환됩니다...')
        
        // 1초 후 페이지 새로고침
        setTimeout(() => {
            window.location.reload()
        }, 1000)
    }
}

window.createTodosTable = async function() {
    try {
        console.log('todos 테이블 생성 시도...')
        
        // Supabase에서는 SQL을 직접 실행할 수 없으므로, 
        // 테이블 존재 여부만 확인하고 안내 메시지 표시
        const { data, error } = await supabaseClient
            .from('todos')
            .select('count', { count: 'exact', head: true })
        
        if (error) {
            if (error.code === 'PGRST116') {
                console.error('todos 테이블이 존재하지 않습니다.')
                SupabaseUtils.showError(`
                    todos 테이블이 존재하지 않습니다. 
                    Supabase 대시보드 → SQL Editor에서 다음 SQL을 실행하세요:
                    
                    -- 1. todos 테이블 생성
                    CREATE TABLE todos (
                        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
                        title TEXT NOT NULL,
                        description TEXT,
                        completed BOOLEAN DEFAULT FALSE,
                        due_date TIMESTAMP WITH TIME ZONE,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                    );
                    
                    -- 2. RLS 정책 활성화
                    ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
                    
                    -- 3. 보안 정책 생성
                    CREATE POLICY "Users can view own todos" ON todos
                        FOR SELECT USING (auth.uid() = user_id);
                    
                    CREATE POLICY "Users can insert own todos" ON todos
                        FOR INSERT WITH CHECK (auth.uid() = user_id);
                    
                    CREATE POLICY "Users can update own todos" ON todos
                        FOR UPDATE USING (auth.uid() = user_id);
                    
                    CREATE POLICY "Users can delete own todos" ON todos
                        FOR DELETE USING (auth.uid() = user_id);
                    
                    -- 4. 인덱스 생성 (성능 향상)
                    CREATE INDEX idx_todos_user_id ON todos(user_id);
                    CREATE INDEX idx_todos_created_at ON todos(created_at);
                `)
                return { success: false, error: 'Table does not exist' }
            } else {
                throw error
            }
        }
        
        SupabaseUtils.showSuccess('todos 테이블이 이미 존재합니다!')
        return { success: true }
        
    } catch (error) {
        console.error('테이블 생성 확인 실패:', error)
        SupabaseUtils.showError(`테이블 확인 실패: ${error.message}`)
        return { success: false, error: error.message }
    }
}

window.checkTableStructure = async function() {
    try {
        console.log('테이블 구조 확인 중...')
        
        // 빈 쿼리로 테이블 구조 확인
        const { data, error } = await supabaseClient
            .from('todos')
            .select('*')
            .limit(1)
        
        if (error) {
            if (error.code === 'PGRST116') {
                SupabaseUtils.showError('todos 테이블이 존재하지 않습니다.')
                return { success: false, error: 'Table does not exist' }
            } else {
                throw error
            }
        }
        
        console.log('테이블 구조 확인 완료:', data)
        SupabaseUtils.showSuccess('todos 테이블이 정상적으로 존재합니다!')
        
        // 현재 사용자의 todos 개수도 확인
        const user = await SupabaseUtils.getCurrentUser()
        if (user) {
            const { count, error: countError } = await supabaseClient
                .from('todos')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
            
            if (!countError) {
                console.log(`현재 사용자의 todos 개수: ${count}`)
                SupabaseUtils.showSuccess(`테이블 구조 정상 - 현재 할일 ${count}개`)
            }
        }
        
        return { success: true, data }
        
    } catch (error) {
        console.error('테이블 구조 확인 실패:', error)
        SupabaseUtils.showError(`테이블 구조 확인 실패: ${error.message}`)
        return { success: false, error: error.message }
    }
}

console.log('Supabase 클라이언트가 초기화되었습니다.') 