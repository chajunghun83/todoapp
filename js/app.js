// TodoApp - Supabase 설정은 supabase.js에서 처리됨

// Todo 앱 메인 로직
const TodoApp = {
    currentFilter: 'all',
    currentSort: 'default',
    searchQuery: '',
    todos: [],

    // 초기화
    async init() {
        console.log('Todo 앱 초기화 시작...')
        
        // UI 상태 관리
        this.updateUIForCurrentMode()
        
        await this.checkAuthentication()
        this.setupEventListeners()
        await this.loadTodos()
        this.setupRealtimeSubscription()
        
        console.log('Todo 앱 초기화 완료')
    },

    // 현재 모드에 따른 UI 업데이트
    updateUIForCurrentMode() {
        const isTestMode = localStorage.getItem('test_logged_in') === 'true'
        // 정상 작동 중이므로 별도 설정 불필요
        console.log('앱 초기화 완료 - 정상 모드')
    },

    // 인증 확인
    async checkAuthentication() {
        console.log('인증 체크 시작...')
        const isLoggedIn = await SupabaseUtils.isLoggedIn()
        console.log('로그인 상태:', isLoggedIn)
        
        if (!isLoggedIn) {
            console.log('로그인되지 않음 - 리다이렉트 중...')
            window.location.href = 'pages/login.html'
            return
        }
        
        console.log('로그인됨 - 사용자 정보 표시')
        // 사용자 정보 표시
        await Auth.displayUserInfo()
    },

    // 이벤트 리스너 설정
    setupEventListeners() {
        // Todo 추가 폼
        const todoForm = document.getElementById('todo-form')
        if (todoForm) {
            todoForm.addEventListener('submit', this.handleAddTodo.bind(this))
        }

        // Todo 수정 폼
        const editForm = document.getElementById('edit-todo-form')
        if (editForm) {
            editForm.addEventListener('submit', this.handleEditTodo.bind(this))
        }

        // 필터 버튼들
        const filterBtns = document.querySelectorAll('.filter-btn')
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter)
            })
        })

        // 검색 입력
        const searchInput = document.getElementById('search-input')
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.setSearch(e.target.value)
            })
        }

        // 정렬 선택
        const sortSelect = document.getElementById('sort-select')
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.setSort(e.target.value)
            })
        }
    },

    // Todo 목록 로드
    async loadTodos() {
        try {
            console.log('Todo 로드 시작...')
            const user = await SupabaseUtils.getCurrentUser()
            if (!user) {
                console.log('사용자 정보 없음 - Todo 로드 중단')
                return
            }

            const todoListElement = document.getElementById('todo-list')
            if (todoListElement) {
                SupabaseUtils.showLoading(todoListElement)
            }

            // 실제 Supabase 호출을 우선으로 시도
            console.log('실제 Supabase에서 Todo 데이터 로드 중...', 'User ID:', user.id)
            
            try {
                let data, error
                
                // 모든 환경에서 DirectSupabaseAPI 사용 (토큰 인증을 위해)
                console.log('DirectSupabaseAPI로 Todo 데이터 로드')
                const result = await DirectSupabaseAPI.getTodos(user.id)
                data = result.data
                error = result.error

                if (error) {
                    console.error('Supabase Todo 로드 오류:', error)
                    
                    // 테이블이 없는 경우 빈 배열로 처리
                    if (error.code === 'PGRST116') {
                        console.log('todos 테이블이 없음 - 빈 목록 표시')
                        this.todos = []
                        this.renderTodos()
                        return
                    }
                    
                    throw error
                }

                console.log('Supabase에서 로드된 Todo 데이터:', data)
                this.todos = data || []
                this.renderTodos()
                return
            } catch (supabaseError) {
                console.error('Supabase 연결 실패, 테스트 모드 확인 중...', supabaseError)
                
                // Supabase 실패 시에만 테스트 모드 확인
                const testLoggedIn = localStorage.getItem('test_logged_in')
                if (testLoggedIn === 'true') {
                    console.log('테스트 모드: 더미 Todo 데이터 로드')
                    // 더미 Todo 데이터
                    this.todos = [
                        {
                            id: '1',
                            title: '테스트 할 일 1',
                            description: '이것은 테스트용 할 일입니다.',
                            completed: false,
                            progress: 30,
                            start_date: new Date().toISOString(), // 오늘
                            due_date: new Date(Date.now() + 86400000).toISOString(), // 내일
                            created_at: new Date().toISOString(),
                            user_id: 'test-user-id'
                        },
                        {
                            id: '2',
                            title: '테스트 할 일 2',
                            description: '완료된 테스트 할 일입니다.',
                            completed: true,
                            progress: 100,
                            start_date: new Date(Date.now() - 172800000).toISOString(), // 이틀 전
                            due_date: new Date(Date.now() - 86400000).toISOString(), // 어제
                            created_at: new Date(Date.now() - 86400000).toISOString(), // 어제
                            user_id: 'test-user-id'
                        }
                    ]
                    this.renderTodos()
                    return
                }
                
                // 테스트 모드도 아니면 오류 처리
                throw supabaseError
            }
        } catch (error) {
            console.error('Todo 로드 실패:', error)
            
            // 오류 발생 시에도 빈 배열로 초기화
            this.todos = []
            
            const todoListElement = document.getElementById('todo-list')
            if (todoListElement) {
                todoListElement.innerHTML = `
                    <li class="empty-state">
                        <p>할 일을 불러올 수 없습니다.</p>
                        <p>데이터베이스 설정을 확인하거나 테스트 모드를 사용해보세요.</p>
                        <button onclick="toggleTestMode()" class="btn btn-sm btn-warning">테스트 모드로 전환</button>
                    </li>
                `
            }
            
            // 사용자에게는 부드러운 메시지 표시
            if (error.code === 'PGRST116') {
                SupabaseUtils.showError('데이터베이스 테이블이 설정되지 않았습니다. 화면 하단의 "todos 테이블 생성" 버튼을 확인해주세요.')
            } else {
                SupabaseUtils.showError('할 일을 불러오는데 실패했습니다.')
            }
        }
    },

    // Todo 목록 렌더링
    renderTodos() {
        const todoList = document.getElementById('todo-list')
        if (!todoList) return

        let filteredTodos = this.filterTodos()
        filteredTodos = this.sortTodos(filteredTodos)

        if (filteredTodos.length === 0) {
            todoList.innerHTML = `
                <li class="empty-state">
                    <p>표시할 할 일이 없습니다.</p>
                    ${this.currentFilter === 'all' && !this.searchQuery ? 
                        '<p>새로운 할 일을 추가해보세요!</p>' : 
                        '<p>다른 필터나 검색어를 시도해보세요.</p>'
                    }
                </li>
            `
        } else {
            todoList.innerHTML = filteredTodos.map(todo => this.createTodoElement(todo)).join('')
        }

        // 캘린더 뷰가 활성화되어 있으면 캘린더도 업데이트
        if (typeof currentView !== 'undefined' && currentView === 'calendar') {
            if (typeof renderCalendarTodos === 'function') {
                // 기존 Todo 항목들 제거
                document.querySelectorAll('.calendar-todo-item').forEach(item => item.remove())
                // 새로 렌더링
                renderCalendarTodos()
            }
        }
    },

    // Todo 요소 생성
    createTodoElement(todo) {
        const isOverdue = todo.due_date && new Date(todo.due_date) < new Date() && !todo.completed
        const dueDateClass = isOverdue ? 'overdue' : ''

        return `
            <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                <div class="todo-header">
                    <div>
                        <h3 class="todo-title ${todo.completed ? 'completed' : ''}">${this.escapeHtml(todo.title)}</h3>
                        ${todo.description ? `<p class="todo-description">${this.escapeHtml(todo.description)}</p>` : ''}
                    </div>
                </div>
                
                <div class="todo-meta">
                    ${todo.start_date ? `<span class="start-date">🚀 시작: ${SupabaseUtils.formatDate(todo.start_date)}</span>` : ''}
                    ${todo.due_date ? `<span class="due-date ${dueDateClass}">📅 마감: ${SupabaseUtils.formatDate(todo.due_date)}</span>` : ''}
                    <span class="created-date">생성: ${SupabaseUtils.getRelativeTime(todo.created_at)}</span>
                </div>
                
                <div class="todo-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${todo.progress || 0}%"></div>
                    </div>
                    <span class="progress-text">${todo.progress || 0}% 완료</span>
                </div>
                
                <div class="todo-actions">
                    <button class="btn btn-sm ${todo.completed ? 'btn-secondary' : 'btn-success'}" 
                            onclick="TodoApp.toggleComplete('${todo.id}', ${!todo.completed})">
                        ${todo.completed ? '되돌리기' : '완료'}
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="openEditModal('${todo.id}')">
                        수정
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="TodoApp.deleteTodo('${todo.id}')">
                        삭제
                    </button>
                </div>
            </li>
        `
    },

    // HTML 이스케이프
    escapeHtml(text) {
        const div = document.createElement('div')
        div.textContent = text
        return div.innerHTML
    },

    // Todo 추가
    async handleAddTodo(event) {
        event.preventDefault()

        try {
            console.log('=== Todo 추가 시작 ===')
            console.log('Event:', event)
            console.log('Event target:', event.target)
            
            const user = await SupabaseUtils.getCurrentUser()
            console.log('현재 사용자:', user)
            console.log('사용자 ID:', user?.id)
            console.log('사용자 ID 타입:', typeof user?.id)
            
            if (!user || !user.id) {
                console.error('사용자 정보가 없습니다.')
                SupabaseUtils.showError('로그인이 필요합니다.')
                return
            }

            const formData = new FormData(event.target)
            console.log('Form data entries:', Array.from(formData.entries()))
            
            // 먼저 간단한 데이터로 테스트
            const todoData = {
                title: formData.get('title').trim(),
                description: formData.get('description').trim() || null,
                due_date: formData.get('due_date') || null,
                completed: false,
                user_id: user.id
            }

            console.log('기본 Todo 데이터:', todoData)

            if (!todoData.title) {
                SupabaseUtils.showError('제목을 입력해주세요.')
                return
            }

            if (!todoData.due_date) {
                SupabaseUtils.showError('마감일을 입력해주세요.')
                return
            }

            // 실제 Supabase 호출을 우선으로 시도
            console.log('=== 실제 Supabase에 Todo 추가 시작 ===')
            console.log('추가할 데이터:', todoData)
            
            try {
                // 토큰 기반 사용자 정보 사용
                console.log('토큰 기반 사용자 정보 사용...')
                console.log('사용자 ID 확인:', user.id)
                
                // 완전한 데이터로 삽입 시도
                const completeTodoData = {
                    title: todoData.title,
                    description: todoData.description,
                    start_date: formData.get('start_date') || null,
                    due_date: todoData.due_date,
                    completed: false,
                    progress: parseInt(formData.get('progress')) || 0,
                    user_id: todoData.user_id
                }
                
                console.log('=== Supabase 삽입 시도 ===')
                console.log('완전한 데이터:', completeTodoData)
                
                // 환경별 분기
                let data, error
                
                // 모든 환경에서 DirectSupabaseAPI 사용 (토큰 인증을 위해)
                console.log('DirectSupabaseAPI로 todo 추가')
                const result = await DirectSupabaseAPI.insertTodo(completeTodoData)
                data = result.data
                error = result.error

                console.log('=== Supabase 응답 ===')
                console.log('응답 데이터:', data)
                console.log('응답 오류:', error)

                if (error) {
                    console.error('=== Supabase Todo 추가 오류 상세 ===')
                    console.error('오류 객체:', error)
                    console.error('오류 코드:', error.code)
                    console.error('오류 메시지:', error.message)
                    throw error
                }

                console.log('=== Todo 추가 성공 ===')
                console.log('추가된 데이터:', data)
                SupabaseUtils.showSuccess('할 일이 추가되었습니다!')
                
                // 모달 닫기
                if (typeof closeAddModal === 'function') {
                    closeAddModal()
                } else {
                    event.target.reset()
                    const progressDisplay = document.getElementById('progress-display')
                    if (progressDisplay) progressDisplay.textContent = '0%'
                }
                
                console.log('할일 목록 다시 로드 시작...')
                await this.loadTodos()
                console.log('할일 목록 다시 로드 완료')
                return
                
            } catch (supabaseError) {
                console.error('Supabase 연결 실패, 테스트 모드 확인 중...', supabaseError)
                
                // Supabase 실패 시에만 테스트 모드 확인
                const testLoggedIn = localStorage.getItem('test_logged_in')
                console.log('테스트 모드 상태:', testLoggedIn)
                
                if (testLoggedIn === 'true') {
                    console.log('테스트 모드: Todo 추가')
                    const newTodo = {
                        ...todoData,
                        id: Date.now().toString(), // 간단한 ID 생성
                        created_at: new Date().toISOString(),
                        start_date: formData.get('start_date') || null,
                        progress: parseInt(formData.get('progress')) || 0 // 진행률도 포함
                    }
                    console.log('테스트 모드에서 추가할 Todo:', newTodo)
                    this.todos.unshift(newTodo) // 배열 맨 앞에 추가
                    console.log('현재 todos 배열:', this.todos)
                    this.renderTodos()
                    
                    SupabaseUtils.showSuccess('할 일이 추가되었습니다! (테스트 모드)')
                    
                    // 모달 닫기
                    if (typeof closeAddModal === 'function') {
                        closeAddModal()
                    } else {
                        event.target.reset()
                        const progressDisplay = document.getElementById('progress-display')
                        if (progressDisplay) progressDisplay.textContent = '0%'
                    }
                    return
                }
                
                // 테스트 모드도 아니면 오류 처리
                throw supabaseError
            }
        } catch (error) {
            console.error('=== Todo 추가 최종 실패 ===')
            console.error('최종 오류:', error)
            
            // 데이터베이스 관련 오류인 경우 테스트 모드 제안
            if (error.code === '23503' || error.code === 'PGRST116' || error.code === '42501' || 
                error.message.includes('로그인 세션이 만료') || error.message.includes('Network error')) {
                // 자동으로 테스트 모드 제안 모달 표시
                const shouldUseTestMode = confirm(`할 일 추가에 실패했습니다.

데이터베이스 연결 또는 인증 문제로 보입니다.
지금 바로 테스트 모드로 전환하시겠습니까?

테스트 모드에서는 모든 기능을 정상적으로 사용할 수 있습니다.
(데이터는 브라우저에만 저장되며, 새로고침 시 초기화됩니다)`)
                
                if (shouldUseTestMode) {
                    toggleTestMode()
                    // toggleTestMode가 자동으로 페이지를 새로고침하므로 별도 처리 불필요
                    return
                }
            }
            
            // 일반적인 오류 처리
            const errorMessage = SupabaseUtils.handleError(error)
            SupabaseUtils.showError(errorMessage)
        }
    },

    // Todo 수정을 위한 데이터 로드
    async loadTodoForEdit(todoId) {
        try {
            const todo = this.todos.find(t => t.id === todoId)
            if (!todo) return

            document.getElementById('edit-todo-id').value = todo.id
            document.getElementById('edit-todo-title').value = todo.title
            document.getElementById('edit-todo-description').value = todo.description || ''
            
            if (todo.start_date) {
                // 시간대 문제를 피하기 위해 로컬 시간대로 변환
                const startDate = new Date(todo.start_date)
                const localStartDate = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000)
                document.getElementById('edit-todo-start-date').value = localStartDate.toISOString().slice(0, 16)
            } else {
                document.getElementById('edit-todo-start-date').value = ''
            }
            
            if (todo.due_date) {
                // 시간대 문제를 피하기 위해 로컬 시간대로 변환
                const dueDate = new Date(todo.due_date)
                const localDueDate = new Date(dueDate.getTime() - dueDate.getTimezoneOffset() * 60000)
                document.getElementById('edit-todo-due-date').value = localDueDate.toISOString().slice(0, 16)
            } else {
                document.getElementById('edit-todo-due-date').value = ''
            }
            
            document.getElementById('edit-todo-progress').value = todo.progress || 0
            document.getElementById('edit-progress-display').textContent = (todo.progress || 0) + '%'
        } catch (error) {
            console.error('Todo 로드 실패:', error)
            SupabaseUtils.showError('할 일 정보를 불러오는데 실패했습니다.')
        }
    },

    // Todo 수정
    async handleEditTodo(event) {
        event.preventDefault()

        try {
            const formData = new FormData(event.target)
            const todoId = formData.get('edit-todo-id') || document.getElementById('edit-todo-id').value
            
            const updates = {
                title: formData.get('title').trim(),
                description: formData.get('description').trim() || null,
                start_date: formData.get('start_date') || null,
                due_date: formData.get('due_date') || null,
                progress: parseInt(formData.get('progress')) || 0,
                updated_at: new Date().toISOString()
            }

            if (!updates.title) {
                SupabaseUtils.showError('제목을 입력해주세요.')
                return
            }

            if (!updates.due_date) {
                SupabaseUtils.showError('마감일을 입력해주세요.')
                return
            }

            // 테스트 모드에서는 로컬 데이터 업데이트
            const testLoggedIn = localStorage.getItem('test_logged_in')
            if (testLoggedIn === 'true') {
                const todoIndex = this.todos.findIndex(t => t.id === todoId)
                if (todoIndex !== -1) {
                    this.todos[todoIndex] = { ...this.todos[todoIndex], ...updates }
                    console.log('테스트 모드: Todo 수정됨', this.todos[todoIndex])
                }
                SupabaseUtils.showSuccess('할 일이 수정되었습니다! (테스트 모드)')
                closeEditModal()
                this.renderTodos()
                return
            }

            // DirectSupabaseAPI 사용
            console.log('DirectSupabaseAPI로 Todo 수정 중...', { todoId, updates })
            const result = await DirectSupabaseAPI.updateTodo(todoId, updates)
            const error = result.error

            if (error) {
                console.error('Supabase Todo 수정 오류:', error)
                throw error
            }

            SupabaseUtils.showSuccess('할 일이 수정되었습니다!')
            closeEditModal()
            await this.loadTodos()
        } catch (error) {
            console.error('Todo 수정 실패:', error)
            SupabaseUtils.showError('할 일 수정에 실패했습니다.')
        }
    },

    // Todo 완료 상태 토글
    async toggleComplete(todoId, completed) {
        try {
            // 테스트 모드에서는 로컬 데이터 업데이트
            const testLoggedIn = localStorage.getItem('test_logged_in')
            if (testLoggedIn === 'true') {
                const todoIndex = this.todos.findIndex(t => t.id === todoId)
                if (todoIndex !== -1) {
                    this.todos[todoIndex].completed = completed
                    this.todos[todoIndex].progress = completed ? 100 : 0
                    this.todos[todoIndex].updated_at = new Date().toISOString()
                    console.log('테스트 모드: Todo 상태 변경됨', this.todos[todoIndex])
                }
                SupabaseUtils.showSuccess(completed ? '할 일을 완료했습니다! (테스트 모드)' : '할 일을 미완료로 변경했습니다! (테스트 모드)')
                this.renderTodos()
                return
            }

            // DirectSupabaseAPI 사용
            console.log('DirectSupabaseAPI로 Todo 상태 변경 중...', { todoId, completed })
            const result = await DirectSupabaseAPI.updateTodo(todoId, { 
                completed: completed,
                progress: completed ? 100 : 0,
                updated_at: new Date().toISOString()
            })
            const error = result.error

            if (error) {
                console.error('Supabase Todo 상태 변경 오류:', error)
                throw error
            }

            SupabaseUtils.showSuccess(completed ? '할 일을 완료했습니다!' : '할 일을 미완료로 변경했습니다!')
            await this.loadTodos()
        } catch (error) {
            console.error('Todo 상태 변경 실패:', error)
            SupabaseUtils.showError('할 일 상태 변경에 실패했습니다.')
        }
    },

    // Todo 삭제
    async deleteTodo(todoId) {
        if (!confirm('정말로 이 할 일을 삭제하시겠습니까?')) {
            return
        }

        try {
            // 테스트 모드에서는 로컬 데이터에서 삭제
            const testLoggedIn = localStorage.getItem('test_logged_in')
            if (testLoggedIn === 'true') {
                const todoIndex = this.todos.findIndex(t => t.id === todoId)
                if (todoIndex !== -1) {
                    const deletedTodo = this.todos.splice(todoIndex, 1)[0]
                    console.log('테스트 모드: Todo 삭제됨', deletedTodo)
                }
                SupabaseUtils.showSuccess('할 일이 삭제되었습니다! (테스트 모드)')
                this.renderTodos()
                return
            }

            // DirectSupabaseAPI 사용
            console.log('DirectSupabaseAPI로 Todo 삭제 중...', { todoId })
            const result = await DirectSupabaseAPI.deleteTodo(todoId)
            const error = result.error

            if (error) {
                console.error('Supabase Todo 삭제 오류:', error)
                throw error
            }

            SupabaseUtils.showSuccess('할 일이 삭제되었습니다!')
            await this.loadTodos()
        } catch (error) {
            console.error('Todo 삭제 실패:', error)
            SupabaseUtils.showError('할 일 삭제에 실패했습니다.')
        }
    },

    // 필터 설정
    setFilter(filter) {
        this.currentFilter = filter
        
        // 필터 버튼 활성화 상태 업데이트
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active')
        })
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active')
        
        this.renderTodos()
    },

    // 검색 설정
    setSearch(query) {
        this.searchQuery = query.toLowerCase()
        this.renderTodos()
    },

    // 정렬 설정
    setSort(sort) {
        this.currentSort = sort
        this.renderTodos()
    },

    // Todo 필터링
    filterTodos() {
        let filtered = this.todos

        // 상태별 필터
        switch (this.currentFilter) {
            case 'completed':
                filtered = filtered.filter(todo => todo.completed)
                break
            case 'pending':
                filtered = filtered.filter(todo => !todo.completed)
                break
            default:
                // 'all' - 모든 항목
                break
        }

        // 검색 필터
        if (this.searchQuery) {
            filtered = filtered.filter(todo => 
                todo.title.toLowerCase().includes(this.searchQuery) ||
                (todo.description && todo.description.toLowerCase().includes(this.searchQuery))
            )
        }

        return filtered
    },

    // Todo 정렬 - 미완료 최신순, 완료된 것들은 하단에 완료일 최신순
    sortTodos(todos) {
        return todos.sort((a, b) => {
            // 완료 상태에 따른 1차 정렬
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1  // 미완료가 위, 완료가 아래
            }
            
            // 같은 완료 상태 내에서 2차 정렬
            if (a.completed && b.completed) {
                // 완료된 항목들은 완료일(updated_at) 최신순
                return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
            } else {
                // 미완료 항목들은 선택된 정렬 방식 적용
                switch (this.currentSort) {
                    case 'due_date_asc':
                        if (!a.due_date && !b.due_date) return new Date(b.created_at) - new Date(a.created_at)
                        if (!a.due_date) return 1
                        if (!b.due_date) return -1
                        return new Date(a.due_date) - new Date(b.due_date)
                    case 'due_date_desc':
                        if (!a.due_date && !b.due_date) return new Date(b.created_at) - new Date(a.created_at)
                        if (!a.due_date) return 1
                        if (!b.due_date) return -1
                        return new Date(b.due_date) - new Date(a.due_date)
                    case 'progress_desc':
                        const progressDiff = (b.progress || 0) - (a.progress || 0)
                        return progressDiff !== 0 ? progressDiff : new Date(b.created_at) - new Date(a.created_at)
                    case 'progress_asc':
                        const progressDiffAsc = (a.progress || 0) - (b.progress || 0)
                        return progressDiffAsc !== 0 ? progressDiffAsc : new Date(b.created_at) - new Date(a.created_at)
                    default:
                        // 기본값: 생성일 최신순
                        return new Date(b.created_at) - new Date(a.created_at)
                }
            }
        })
    },

    // 실시간 업데이트 구독 설정
    setupRealtimeSubscription() {
        // 테스트 모드에서는 실시간 구독 비활성화
        const testLoggedIn = localStorage.getItem('test_logged_in')
        if (testLoggedIn === 'true') {
            console.log('테스트 모드: 실시간 구독 비활성화')
            return
        }

        try {
            // 실제 Supabase 실시간 구독
            console.log('실제 Supabase 실시간 구독 설정 중...')
            const channel = supabaseClient
                .channel('todos')
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'todos' }, 
                    (payload) => {
                        console.log('실시간 변경 감지:', payload)
                        if (this.todos) {
                            this.loadTodos()
                        }
                    }
                )
                .subscribe((status) => {
                    console.log('실시간 구독 상태:', status)
                    if (status === 'SUBSCRIBED') {
                        console.log('실시간 구독 성공!')
                    } else if (status === 'CHANNEL_ERROR') {
                        console.warn('실시간 구독 오류 - 테이블이 없을 수 있습니다')
                    }
                })
        } catch (error) {
            console.warn('실시간 구독 설정 실패:', error)
            console.log('실시간 구독 없이 계속 진행합니다.')
        }
    }
}

// 전역으로 내보내기
window.TodoApp = TodoApp

// 페이지 로드 시 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    TodoApp.init()
})

console.log('Todo 앱이 초기화되었습니다.')

// 테스트 함수들 추가
window.checkLoginStatus = async function() {
    const resultDiv = document.getElementById('test-result')
    resultDiv.textContent = '로그인 상태 확인 중...\n'
    
    try {
        const isLoggedIn = await SupabaseUtils.isLoggedIn()
        const testLoggedIn = localStorage.getItem('test_logged_in')
        
        let result = `=== 로그인 상태 확인 ===\n`
        result += `실제 Supabase 로그인: ${isLoggedIn}\n`
        result += `테스트 모드 로그인: ${testLoggedIn === 'true'}\n`
        result += `현재 환경: ${window.location.hostname.includes('github.io') ? 'GitHub Pages' : '로컬'}\n`
        result += `현재 시간: ${new Date().toLocaleString()}\n`
        
        resultDiv.textContent = result
    } catch (error) {
        resultDiv.textContent = `오류 발생: ${error.message}`
    }
}

window.checkTokens = function() {
    const resultDiv = document.getElementById('test-result')
    
    const accessToken = localStorage.getItem('supabase_access_token')
    const userStr = localStorage.getItem('supabase_user')
    const testLoggedIn = localStorage.getItem('test_logged_in')
    const testUserEmail = localStorage.getItem('test_user_email')
    
    let result = `=== 저장된 토큰/정보 확인 ===\n`
    result += `Supabase Access Token: ${accessToken ? accessToken.substring(0, 50) + '...' : '없음'}\n`
    result += `Supabase User: ${userStr ? '존재' : '없음'}\n`
    result += `테스트 로그인: ${testLoggedIn || '없음'}\n`
    result += `테스트 사용자 이메일: ${testUserEmail || '없음'}\n`
    
    if (userStr) {
        try {
            const user = JSON.parse(userStr)
            result += `\n=== Supabase 사용자 정보 ===\n`
            result += `ID: ${user.id || '없음'}\n`
            result += `Email: ${user.email || '없음'}\n`
            result += `Created: ${user.created_at || '없음'}\n`
        } catch (error) {
            result += `사용자 정보 파싱 오류: ${error.message}\n`
        }
    }
    
    resultDiv.textContent = result
}

window.checkUserInfo = async function() {
    const resultDiv = document.getElementById('test-result')
    resultDiv.textContent = '사용자 정보 확인 중...\n'
    
    try {
        const user = await SupabaseUtils.getCurrentUser()
        
        let result = `=== 현재 사용자 정보 ===\n`
        if (user) {
            result += `ID: ${user.id}\n`
            result += `Email: ${user.email}\n`
            result += `Created: ${user.created_at}\n`
            result += `Last Sign In: ${user.last_sign_in_at}\n`
            
            if (user.user_metadata) {
                result += `\n=== 메타데이터 ===\n`
                result += JSON.stringify(user.user_metadata, null, 2) + '\n'
            }
        } else {
            result += '사용자 정보 없음\n'
        }
        
        resultDiv.textContent = result
    } catch (error) {
        resultDiv.textContent = `오류 발생: ${error.message}`
    }
}

window.testTodoInsert = async function() {
    const resultDiv = document.getElementById('test-result')
    resultDiv.textContent = '할일 추가 테스트 중...\n'
    
    try {
        const user = await SupabaseUtils.getCurrentUser()
        if (!user) {
            resultDiv.textContent = '로그인되지 않음 - 할일 추가 불가'
            return
        }
        
        const testTodo = {
            title: `테스트 할일 ${new Date().getTime()}`,
            description: '테스트용 할일입니다',
            completed: false,
            priority: 'medium',
            progress: 0,
            due_date: null,
            start_date: null,
            user_id: user.id
        }
        
        let result = `=== 할일 추가 테스트 ===\n`
        result += `사용자 ID: ${user.id}\n`
        result += `테스트 할일: ${testTodo.title}\n`
        result += `요청 데이터: ${JSON.stringify(testTodo, null, 2)}\n`
        result += `요청 시작...\n`
        
        resultDiv.textContent = result
        
        // 모든 환경에서 DirectSupabaseAPI 사용 (토큰 인증을 위해)
        result += `DirectSupabaseAPI 사용\n`
        const insertResult = await DirectSupabaseAPI.insertTodo(testTodo)
        
        if (insertResult.error) {
            result += `\n❌ 오류 발생:\n${JSON.stringify(insertResult.error, null, 2)}`
        } else {
            result += `\n✅ 성공!\n${JSON.stringify(insertResult.data, null, 2)}`
        }
        
        resultDiv.textContent = result
        
    } catch (error) {
        resultDiv.textContent = `오류 발생: ${error.message}\n${error.stack}`
    }
}

window.testDirectLogin = async function() {
    const resultDiv = document.getElementById('test-result')
    resultDiv.textContent = '직접 로그인 테스트 중...\n'
    
    try {
        const email = 'test@gmail.com'
        const password = prompt('비밀번호를 입력하세요:')
        
        if (!password) {
            resultDiv.textContent = '비밀번호가 입력되지 않았습니다.'
            return
        }
        
        let result = `=== 직접 로그인 테스트 ===\n`
        result += `이메일: ${email}\n`
        result += `요청 시작...\n`
        
        resultDiv.textContent = result
        
        const loginResult = await DirectSupabaseAPI.signIn(email, password)
        
        if (loginResult.error) {
            result += `\n❌ 오류 발생:\n${JSON.stringify(loginResult.error, null, 2)}`
        } else {
            result += `\n✅ 성공!\n${JSON.stringify(loginResult.data, null, 2)}`
            
            // 토큰 저장 확인
            const savedToken = localStorage.getItem('supabase_access_token')
            const savedUser = localStorage.getItem('supabase_user')
            
            result += `\n=== 저장된 정보 확인 ===\n`
            result += `토큰: ${savedToken ? savedToken.substring(0, 50) + '...' : '없음'}\n`
            result += `사용자: ${savedUser ? '저장됨' : '없음'}\n`
        }
        
        resultDiv.textContent = result
        
    } catch (error) {
        resultDiv.textContent = `오류 발생: ${error.message}\n${error.stack}`
    }
}

window.forceRelogin = function() {
    const resultDiv = document.getElementById('test-result')
    resultDiv.textContent = '강제 재로그인 실행 중...\n'
    
    // 모든 인증 관련 정보 삭제
    localStorage.removeItem('supabase_access_token')
    localStorage.removeItem('supabase_user')
    localStorage.removeItem('test_logged_in')
    localStorage.removeItem('test_user_email')
    localStorage.removeItem('test_user_name')
    
    resultDiv.textContent = '모든 인증 정보가 삭제되었습니다.\n로그인 페이지로 이동합니다...'
    
    setTimeout(() => {
        window.location.href = 'pages/login.html'
    }, 2000)
} 