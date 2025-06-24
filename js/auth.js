// 인증 관련 함수들
const Auth = {
    // 회원가입
    async signUp(email, password, fullName) {
        try {
            console.log('회원가입 시도:', { email, fullName })
            
            // 테스트 모드 확인
            const isTestMode = localStorage.getItem('test_logged_in') !== null
            
            if (!isTestMode) {
                // 실제 Supabase 호출
                console.log('실제 Supabase 회원가입 시도...')
                const { data, error } = await supabaseClient.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            full_name: fullName
                        }
                    }
                })

                if (error) {
                    console.error('Supabase 회원가입 오류:', error)
                    
                    // 회원가입 오류 코드별 한글 메시지 처리
                    let errorMessage = '회원가입에 실패했습니다.'
                    
                    if (error.message.includes('User already registered')) {
                        errorMessage = '이미 등록된 이메일입니다. 로그인을 시도해보세요.'
                    } else if (error.message.includes('Email already exists')) {
                        errorMessage = '이미 사용 중인 이메일입니다. 다른 이메일을 사용해주세요.'
                    } else if (error.message.includes('Password should be at least')) {
                        errorMessage = '비밀번호는 최소 6자 이상이어야 합니다.'
                    } else if (error.message.includes('Invalid email')) {
                        errorMessage = '올바르지 않은 이메일 형식입니다.'
                    } else if (error.message.includes('Signup disabled')) {
                        errorMessage = '현재 회원가입이 비활성화되어 있습니다.'
                    } else if (error.message.includes('Email rate limit exceeded')) {
                        errorMessage = '이메일 전송 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
                    } else if (error.message.includes('Password is too weak')) {
                        errorMessage = '비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.'
                    } else if (error.message.includes('Network error') || error.message.includes('fetch')) {
                        errorMessage = '네트워크 연결을 확인해주세요.'
                    } else if (error.message.includes('Database error')) {
                        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
                    } else if (error.message.includes('Email service unavailable')) {
                        errorMessage = '이메일 서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.'
                    }
                    
                    SupabaseUtils.showError(errorMessage)
                    return { success: false, error: errorMessage }
                }

                console.log('Supabase 회원가입 성공:', data)
                
                // 이메일 확인이 필요한 경우 처리
                if (data.user && !data.user.email_confirmed_at) {
                    // 이메일 확인 필요 메시지와 함께 테스트 모드 제안
                    const message = '회원가입이 완료되었습니다! 이메일을 확인하여 계정을 활성화해주세요.\n\n만약 이메일이 오지 않는다면 "확인" 버튼을 눌러 테스트 모드로 전환할 수 있습니다.'
                    
                    setTimeout(() => {
                        const useTestMode = confirm('이메일이 도착하지 않았나요?\n\n테스트 모드로 전환하여 바로 로그인하시겠습니까?')
                        if (useTestMode) {
                            localStorage.setItem('test_logged_in', 'true')
                            localStorage.setItem('test_user_email', email)
                            SupabaseUtils.showSuccess('테스트 모드로 전환되었습니다!')
                            setTimeout(() => {
                                window.location.href = '../index.html'
                            }, 1000)
                        }
                    }, 5000) // 5초 후에 테스트 모드 제안
                    
                    SupabaseUtils.showSuccess('회원가입이 완료되었습니다! 이메일을 확인하여 계정을 활성화해주세요.')
                    return { success: true, user: data.user, emailConfirmationRequired: true }
                }
                
                // 프로필 생성 시도
                if (data.user) {
                    try {
                        await this.createProfile(data.user.id, email, fullName)
                    } catch (profileError) {
                        console.warn('프로필 생성 실패:', profileError)
                        // 프로필 생성 실패해도 회원가입은 성공으로 처리
                    }
                }

                SupabaseUtils.showSuccess('회원가입이 완료되었습니다!')
                return { success: true, user: data.user }
            } else {
                // 테스트 모드 회원가입
                console.log('테스트 모드 회원가입')
                SupabaseUtils.showSuccess('테스트 모드 회원가입이 완료되었습니다!')
                return { success: true, user: { email, id: 'test-user-id' } }
            }
        } catch (error) {
            const message = SupabaseUtils.handleError(error)
            console.error('회원가입 오류:', message)
            SupabaseUtils.showError(`회원가입 실패: ${message}`)
            return { success: false, error: message }
        }
    },

    // 로그인
    async signIn(email, password) {
        try {
            console.log('로그인 시도:', { email })
            
            // 실제 Supabase 호출을 우선으로 시도
            console.log('실제 Supabase 로그인 시도...')
            
            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                })

                if (error) {
                    console.error('Supabase 로그인 오류:', error)
                    
                    // 오류 코드별 한글 메시지 처리
                    let errorMessage = '로그인에 실패했습니다.'
                    
                    if (error.message.includes('Invalid login credentials')) {
                        errorMessage = '등록된 이메일이 없거나 비밀번호가 틀렸습니다.'
                    } else if (error.message.includes('Email not confirmed')) {
                        errorMessage = '이메일 확인이 필요합니다. 이메일을 확인하여 계정을 활성화해주세요.'
                    } else if (error.message.includes('User not found')) {
                        errorMessage = '등록된 이메일이 없습니다. 회원가입을 먼저 진행해주세요.'
                    } else if (error.message.includes('Wrong password')) {
                        errorMessage = '비밀번호가 틀렸습니다. 다시 확인해주세요.'
                    } else if (error.message.includes('Too many requests')) {
                        errorMessage = '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.'
                    } else if (error.message.includes('Email rate limit exceeded')) {
                        errorMessage = '이메일 전송 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
                    } else if (error.message.includes('Signup disabled')) {
                        errorMessage = '현재 회원가입이 비활성화되어 있습니다.'
                    } else if (error.message.includes('Invalid email')) {
                        errorMessage = '올바르지 않은 이메일 형식입니다.'
                    } else if (error.message.includes('Password should be at least')) {
                        errorMessage = '비밀번호는 최소 6자 이상이어야 합니다.'
                    } else if (error.message.includes('Network error') || error.message.includes('fetch')) {
                        errorMessage = '네트워크 연결을 확인해주세요.'
                    } else if (error.message.includes('Database error')) {
                        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
                    } else if (error.message.includes('Account locked')) {
                        errorMessage = '계정이 잠겼습니다. 관리자에게 문의해주세요.'
                    } else if (error.message.includes('Session expired')) {
                        errorMessage = '세션이 만료되었습니다. 다시 로그인해주세요.'
                    }
                    
                    throw new Error(errorMessage)
                }

                console.log('Supabase 로그인 성공:', data)
                SupabaseUtils.showSuccess('로그인되었습니다!')
                return { success: true, user: data.user }
                
            } catch (supabaseError) {
                console.error('Supabase 로그인 실패, 테스트 모드 확인 중...', supabaseError)
                
                // Supabase 실패 시에만 테스트 모드 확인
                const isTestMode = localStorage.getItem('test_logged_in') !== null
                
                if (isTestMode) {
                    // 테스트 모드 로그인
                    console.log('테스트 모드 로그인')
                    localStorage.setItem('test_logged_in', 'true')
                    localStorage.setItem('test_user_email', email)
                    SupabaseUtils.showSuccess('테스트 모드 로그인되었습니다!')
                    return { success: true, user: { email, id: 'test-user-id' } }
                }
                
                // 테스트 모드도 아니면 오류 처리
                SupabaseUtils.showError(supabaseError.message)
                return { success: false, error: supabaseError.message }
            }
        } catch (error) {
            const message = SupabaseUtils.handleError(error)
            console.error('로그인 오류:', message)
            SupabaseUtils.showError(`로그인 실패: ${message}`)
            return { success: false, error: message }
        }
    },

    // 로그아웃
    async signOut() {
        try {
            // 테스트 모드 확인
            const testLoggedIn = localStorage.getItem('test_logged_in')
            
            if (testLoggedIn === 'true') {
                // 테스트 모드 로그아웃
                localStorage.removeItem('test_logged_in')
                localStorage.removeItem('test_user_email')
            } else {
                // 실제 Supabase 로그아웃
                const { error } = await supabaseClient.auth.signOut()
                if (error) throw error
            }

            SupabaseUtils.showSuccess('로그아웃되었습니다.')
            
            // 로그인 페이지로 리다이렉트
            window.location.href = 'pages/login.html'
        } catch (error) {
            const message = SupabaseUtils.handleError(error)
            SupabaseUtils.showError(message)
        }
    },

    // 프로필 생성
    async createProfile(userId, email, fullName) {
        try {
            const { error } = await supabaseClient
                .from('profiles')
                .insert([
                    {
                        id: userId,
                        email: email,
                        full_name: fullName
                    }
                ])

            if (error) throw error
        } catch (error) {
            console.error('프로필 생성 실패:', error)
            // 프로필 생성 실패는 사용자에게 표시하지 않음 (백그라운드 작업)
        }
    },

    // 프로필 조회
    async getProfile(userId) {
        try {
            console.log('프로필 조회 시도:', userId)
            const { data, error } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle() // single() 대신 maybeSingle() 사용

            if (error) {
                console.warn('프로필 조회 실패:', error)
                // 프로필이 없어도 오류로 처리하지 않음
                return null
            }
            
            console.log('프로필 조회 성공:', data)
            return data
        } catch (error) {
            console.warn('프로필 조회 실패:', error)
            return null
        }
    },

    // 프로필 업데이트
    async updateProfile(userId, updates) {
        try {
            const { data, error } = await supabaseClient
                .from('profiles')
                .update(updates)
                .eq('id', userId)
                .select()

            if (error) throw error

            SupabaseUtils.showSuccess('프로필이 업데이트되었습니다.')
            return data
        } catch (error) {
            const message = SupabaseUtils.handleError(error)
            SupabaseUtils.showError(message)
            throw error
        }
    },

    // 인증 상태 확인 및 리다이렉트
    async checkAuthAndRedirect() {
        const isLoggedIn = await SupabaseUtils.isLoggedIn()
        
        if (!isLoggedIn) {
            // 현재 페이지가 로그인/회원가입 페이지가 아니면 로그인 페이지로 리다이렉트
            const currentPath = window.location.pathname
            if (!currentPath.includes('login.html') && !currentPath.includes('signup.html')) {
                console.log('로그인되지 않음 - 로그인 페이지로 리다이렉트')
                window.location.href = 'pages/login.html'
                return false
            }
        } else {
            // 로그인된 상태에서 로그인/회원가입 페이지에 있으면 메인으로 리다이렉트
            const currentPath = window.location.pathname
            if (currentPath.includes('login.html') || currentPath.includes('signup.html')) {
                console.log('이미 로그인됨 - 메인 페이지로 리다이렉트')
                window.location.href = '../index.html'
                return false
            }
        }
        
        return isLoggedIn
    },

    // 사용자 정보 표시
    async displayUserInfo() {
        // 헤더의 사용자 정보 영역 사용
        const userInfoElement = document.querySelector('.user-info')
        if (userInfoElement) {
            try {
                const isLoggedIn = await SupabaseUtils.isLoggedIn()
                if (isLoggedIn) {
                    // 테스트 모드 확인
                    const testLoggedIn = localStorage.getItem('test_logged_in')
                    if (testLoggedIn === 'true') {
                        // 테스트 모드에서는 저장된 이름 사용, 없으면 기본 이름
                        const testUserName = localStorage.getItem('test_user_name') || '차정훈'
                        userInfoElement.innerHTML = `
                            <span>안녕하세요, <span class="user-name-clickable" onclick="openProfileModal()">${testUserName}</span>님! (테스트 모드)</span>
                            <button onclick="Auth.signOut()" class="btn btn-sm btn-secondary">로그아웃</button>
                        `
                    } else {
                        // 실제 Supabase 사용자
                        const user = await SupabaseUtils.getCurrentUser()
                        if (user) {
                            // 이름 우선순위: 1) 프로필 full_name, 2) 사용자 메타데이터 full_name, 3) 이메일
                            let displayName = user.email
                            
                            try {
                                // 1순위: 프로필 테이블에서 full_name 조회
                                const profile = await this.getProfile(user.id)
                                if (profile && profile.full_name) {
                                    displayName = profile.full_name
                                    console.log('프로필에서 이름 조회 성공:', displayName)
                                } else {
                                    // 2순위: 사용자 메타데이터에서 full_name 조회
                                    if (user.user_metadata && user.user_metadata.full_name) {
                                        displayName = user.user_metadata.full_name
                                        console.log('메타데이터에서 이름 조회 성공:', displayName)
                                    } else {
                                        console.log('이름을 찾을 수 없어 이메일 사용:', displayName)
                                    }
                                }
                            } catch (profileError) {
                                console.warn('프로필 로드 실패:', profileError)
                                // 프로필 조회 실패 시 메타데이터 확인
                                if (user.user_metadata && user.user_metadata.full_name) {
                                    displayName = user.user_metadata.full_name
                                    console.log('프로필 실패 후 메타데이터에서 이름 조회:', displayName)
                                }
                            }
                            
                            userInfoElement.innerHTML = `
                                <span>안녕하세요, <span class="user-name-clickable" onclick="openProfileModal()">${displayName}</span>님!</span>
                                <button onclick="Auth.signOut()" class="btn btn-sm btn-secondary">로그아웃</button>
                            `
                        }
                    }
                }
            } catch (error) {
                console.error('사용자 정보 표시 실패:', error)
                // 오류 발생 시에도 기본 정보 표시
                userInfoElement.innerHTML = `
                    <span>사용자 (로그인됨)</span>
                    <button onclick="Auth.signOut()" class="btn btn-sm btn-secondary">로그아웃</button>
                `
            }
        }
    },

    // 폼 유효성 검사
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    },

    validatePassword(password) {
        // 최소 6자, 영문자와 숫자 포함
        return password.length >= 6 && /[A-Za-z]/.test(password) && /\d/.test(password)
    },

    // 회원가입 폼 처리
    async handleSignUpForm(event) {
        event.preventDefault()
        
        const formData = new FormData(event.target)
        const email = formData.get('email').trim()
        const password = formData.get('password')
        const confirmPassword = formData.get('confirmPassword')
        const fullName = formData.get('fullName').trim()

        // 필수 필드 검사
        if (!fullName) {
            SupabaseUtils.showError('이름을 입력해주세요.')
            return
        }

        if (fullName.length < 2) {
            SupabaseUtils.showError('이름은 최소 2자 이상 입력해주세요.')
            return
        }

        if (!email) {
            SupabaseUtils.showError('이메일을 입력해주세요.')
            return
        }

        if (!this.validateEmail(email)) {
            SupabaseUtils.showError('올바른 이메일 주소를 입력해주세요.')
            return
        }

        if (!password) {
            SupabaseUtils.showError('비밀번호를 입력해주세요.')
            return
        }

        if (!this.validatePassword(password)) {
            SupabaseUtils.showError('비밀번호는 최소 6자 이상이며, 영문자와 숫자를 포함해야 합니다.')
            return
        }

        if (!confirmPassword) {
            SupabaseUtils.showError('비밀번호 확인을 입력해주세요.')
            return
        }

        if (password !== confirmPassword) {
            SupabaseUtils.showError('비밀번호가 일치하지 않습니다.')
            return
        }

        try {
            const result = await this.signUp(email, password, fullName)
            
            if (result.success) {
                // 성공 시 로그인 페이지로 이동
                setTimeout(() => {
                    window.location.href = 'login.html'
                }, 2000)
            }
        } catch (error) {
            // 에러는 signUp 함수에서 처리됨
        }
    },

    // 로그인 폼 처리
    async handleSignInForm(event) {
        event.preventDefault()
        
        const formData = new FormData(event.target)
        const email = formData.get('email')
        const password = formData.get('password')

        // 유효성 검사
        if (!this.validateEmail(email)) {
            SupabaseUtils.showError('올바른 이메일 주소를 입력해주세요.')
            return
        }

        if (!password.trim()) {
            SupabaseUtils.showError('비밀번호를 입력해주세요.')
            return
        }

        try {
            const result = await this.signIn(email, password)
            
            if (result.success) {
                // 성공 시 메인 페이지로 이동
                console.log('로그인 성공 - 1초 후 메인 페이지로 이동')
                setTimeout(() => {
                    console.log('메인 페이지로 리다이렉트 실행')
                    window.location.href = '../index.html'
                }, 500)
            }
        } catch (error) {
            // 에러는 signIn 함수에서 처리됨
        }
    }
}

// 전역으로 내보내기
window.Auth = Auth

// 페이지 로드 시 인증 상태 확인 (임시 수정)
document.addEventListener('DOMContentLoaded', async () => {
    console.log('페이지 로드됨 - UI 확인 모드')
    
    // 인증 상태 변경 리스너 설정 (임시 비활성화)
    /*
    SupabaseUtils.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
            console.log('사용자가 로그인했습니다:', session.user)
        } else if (event === 'SIGNED_OUT') {
            console.log('사용자가 로그아웃했습니다')
        }
    })
    */

    // 현재 페이지에서 인증 상태 확인 (임시 비활성화)
    await Auth.checkAuthAndRedirect()
    
    // 사용자 정보 표시 (더미 데이터)
    Auth.displayUserInfo()
})

console.log('인증 모듈이 로드되었습니다. (UI 확인 모드)') 