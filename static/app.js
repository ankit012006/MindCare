// MindCare Platform JavaScript with Functional Forum & Reply-To Functionality

const appData = {
  copingStrategies: {
    breathing: "Let's try a simple breathing technique together: Breathe in slowly for 4 counts, hold for 4 counts, then exhale for 6 counts. Repeat this 3-5 times. This helps activate your body's relaxation response.",
    grounding: "Try the 5-4-3-2-1 grounding technique: Name 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, and 1 thing you can taste. This helps bring you back to the present moment.",
    progressive_muscle: "Progressive muscle relaxation can help release physical tension. Start by tensing your shoulders for 5 seconds, then release. Notice the difference between tension and relaxation.",
    journaling: "Sometimes writing down our thoughts can help organize them and provide relief. Try writing for just 5-10 minutes about what's on your mind, without worrying about grammar or structure.",
    movement: "Gentle movement can help release stress hormones. This could be a short walk, stretching, dancing to a favorite song, or any movement that feels good to your body.",
    mindfulness: "Try this simple mindfulness exercise: Focus on your breath for one minute. When your mind wanders (which is normal), gently bring your attention back to breathing."
  },
  counselors: [
    {
      id: 1,
      name: "Dr. Priya Sharma",
      specialization: "Anxiety & Stress Management",
      languages: ["English", "Hindi"],
      experience: "8 years",
      availability: ["Monday 10:00-16:00", "Wednesday 14:00-18:00", "Friday 09:00-15:00"],
      rating: 4.8
    },
    {
      id: 2,
      name: "Dr. Rajesh Kumar",
      specialization: "Depression & Mood Support",
      languages: ["English", "Hindi", "Bengali"],
      experience: "12 years",
      availability: ["Tuesday 11:00-17:00", "Thursday 10:00-16:00", "Saturday 09:00-13:00"],
      rating: 4.9
    },
    {
      id: 3,
      name: "Dr. Meera Patel",
      specialization: "Academic & Life Stress",
      languages: ["English", "Hindi", "Gujarati"],
      experience: "6 years",
      availability: ["Monday 14:00-18:00", "Wednesday 10:00-14:00", "Friday 16:00-20:00"],
      rating: 4.7
    }
  ],
  resources: [
    {
      id: 1,
      title: "5-Minute Breathing Exercise",
      category: "Stress Management",
      type: "audio",
      duration: "5 min",
      language: "English",
      description: "Quick breathing technique to reduce immediate stress",
      rating: 4.6
    },
    {
      id: 2,
      title: "Sleep Hygiene Guide",
      category: "Sleep Help",
      type: "pdf",
      language: "Hindi",
      description: "Complete guide to better sleep habits for students",
      rating: 4.8
    },
    {
      id: 3,
      title: "Managing Exam Anxiety",
      category: "Academic Stress",
      type: "video",
      duration: "12 min",
      language: "English",
      description: "Practical strategies for test anxiety and exam preparation",
      rating: 4.7
    },
    {
      id: 4,
      title: "Mindfulness for Students",
      category: "Mindfulness",
      type: "video",
      duration: "15 min",
      language: "Hindi",
      description: "Introduction to mindfulness practices adapted for college life",
      rating: 4.9
    },
    {
      id: 5,
      title: "Building Self-Confidence",
      category: "Self-Esteem",
      type: "pdf",
      language: "English",
      description: "Evidence-based techniques to improve self-worth and confidence",
      rating: 4.5
    }
  ],
  analytics: {
    totalUsers: 2847,
    activeSessions: 234,
    completedScreenings: 156,
    counselorBookings: 89,
    forumPosts: 1240,
    crisisInterventions: 12
  },
  screeningQuestions: {
    phq9: [
      "Over the last 2 weeks, how often have you been bothered by little interest or pleasure in doing things?",
      "Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?",
      "Over the last 2 weeks, how often have you been bothered by trouble falling or staying asleep, or sleeping too much?",
      "Over the last 2 weeks, how often have you been bothered by feeling tired or having little energy?"
    ],
    gad7: [
      "Over the last 2 weeks, how often have you been bothered by feeling nervous, anxious, or on edge?",
      "Over the last 2 weeks, how often have you been bothered by not being able to stop or control worrying?",
      "Over the last 2 weeks, how often have you been bothered by worrying too much about different things?"
    ]
  }
};

let currentState = {
  selectedCounselor: null,
  selectedDate: null,
  selectedTime: null,
  currentScreening: null,
  screeningAnswers: [],
  chatHistory: [],
  adminLoggedIn: false,
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear()
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => initializeApp());

function initializeApp() {
    setupNavigation();
    initializeChat();
    loadCounselors();
    loadResources();
    initializeForum();
    loadActivityHistory();
    setupMoodTracking();
    setupEventListeners();
}

// --- NAVIGATION ---
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav__link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSection = this.getAttribute('href').substring(1);
            showSection(targetSection);
        });
    });
    const brandLogo = document.querySelector('.nav__brand');
    if (brandLogo) {
        brandLogo.addEventListener('click', function(e) {
            e.preventDefault();
            showSection('home');
        });
    }
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('section--active');
    });
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('section--active');
    }
    if (sectionId === 'admin') {
        if (!currentState.adminLoggedIn) {
            document.getElementById('adminLogin').style.display = 'block';
            document.getElementById('adminDashboard').classList.add('hidden');
        } else {
            document.getElementById('adminLogin').style.display = 'none';
            document.getElementById('adminDashboard').classList.remove('hidden');
            loadDashboardData();
            loadDashboardCharts();
        }
    }
}

// --- CHATBOT SECTION (API VERSION) ---
function initializeChat() {
    const welcomeMessage = "Hello, and welcome to a safe space. I'm MindCare Assistant. I'm here to listen and support you. How are you feeling right now?";
    addMessage('bot', welcomeMessage);
}

async function handleChatMessage(message) {
    if (!message) return;
    addMessage('user', message);
    const typingIndicator = addMessage('bot', 'MindCare Assistant is typing...', true);
    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message }),
        });
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const data = await response.json();
        typingIndicator.remove();
        addMessage('bot', data.response);
    } catch (error) {
        console.error('Error fetching chat response:', error);
        typingIndicator.remove();
        addMessage('bot', "I'm having trouble connecting right now. Please try again in a moment.");
    }
}

function addMessage(sender, content, isTyping = false) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return null;
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message--${sender}`;
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message__content';
    contentDiv.textContent = content;
    if (isTyping) {
        contentDiv.classList.add('typing-indicator');
    }
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    currentState.chatHistory.push({ sender, content, timestamp: new Date() });
    return messageDiv;
}

function sendQuickMessage(message) {
    handleChatMessage(message);
}


// --- FORUM SECTION (UPDATED FOR REPLY-TO FUNCTIONALITY) ---
let socket; 
let currentThreadId = null;

function initializeForum() {
    socket = io();

    fetchInitialThreads();

    socket.on('thread_created', (newThread) => addThreadToPage(newThread, true));
    socket.on('reply_created', (newReply) => {
        if (newReply.thread_id === currentThreadId) {
            addReplyToPage(newReply);
        }
        const threadCard = document.querySelector(`.thread-card[data-id='${newReply.thread_id}'] .reply-count`);
        if (threadCard) {
            const currentCount = parseInt(threadCard.textContent) || 0;
            threadCard.textContent = `${currentCount + 1} replies`;
        }
    });

    const createThreadButton = document.querySelector('#createThreadModal .btn--primary');
    if (createThreadButton) {
        createThreadButton.onclick = () => {
            const form = document.getElementById('createThreadForm');
            const title = document.getElementById('threadTitle').value;
            const category = document.getElementById('threadCategory').value;
            const message = document.getElementById('threadMessage').value;
            if (!title || !category || !message) return alert('Please fill in all fields.');
            socket.emit('new_thread', { title, category, message });
            closeModal();
            form.reset();
        };
    }

    document.getElementById('forumThreads')?.addEventListener('click', (e) => {
        const threadCard = e.target.closest('.thread-card');
        if (threadCard) showThreadDetail(threadCard.dataset.id);
    });
    
    document.getElementById('replies-container')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('reply-btn')) {
            const author = e.target.dataset.author;
            prepareReplyTo(author);
        }
    });

    document.getElementById('back-to-forum-btn')?.addEventListener('click', () => showForumList());
    
    document.getElementById('reply-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const replyText = document.getElementById('reply-text');
        if (replyText.value.trim() && currentThreadId) {
            socket.emit('new_reply', {
                thread_id: currentThreadId,
                text: replyText.value.trim()
            });
            replyText.value = '';
            cancelReplyTo();
        }
    });

    document.getElementById('cancel-reply-btn')?.addEventListener('click', () => cancelReplyTo());
}

async function fetchInitialThreads() {
    try {
        const response = await fetch('/api/threads');
        const threads = await response.json();
        displayThreads(threads);
    } catch (error) {
        console.error("Failed to fetch threads:", error);
    }
}

function displayThreads(threads) {
    const container = document.getElementById('forumThreads');
    if (!container) return;
    container.innerHTML = '';
    threads.forEach(thread => addThreadToPage(thread, false));
}

function addThreadToPage(thread, atBeginning) {
    const container = document.getElementById('forumThreads');
    if(!container) return;
    const card = document.createElement('div');
    card.className = 'thread-card';
    card.dataset.id = thread.id;
    card.innerHTML = `
        <div class="thread-header">
            <h3 class="thread-title">${thread.title}</h3>
            <span class="thread-category">${thread.category}</span>
        </div>
        <p class="thread-message-preview">${thread.message.substring(0, 100)}...</p>
        <div class="thread-meta">
            <div><span class="thread-author">${thread.author}</span> • <span class="thread-timestamp">${thread.timestamp}</span></div>
            <div class="thread-stats"><span class="reply-count">${thread.reply_count} replies</span></div>
        </div>
    `;
    if (atBeginning) container.prepend(card);
    else container.appendChild(card);
}

async function showThreadDetail(threadId) {
    if (currentThreadId) {
        socket.emit('leave_room', { room: `thread_${currentThreadId}` });
    }
    currentThreadId = parseInt(threadId);

    try {
        const response = await fetch(`/api/thread/${threadId}`);
        const data = await response.json();
        
        showSection('thread-detail');

        document.getElementById('thread-detail-title').textContent = data.thread.title;
        
        const opContainer = document.getElementById('thread-original-post');
        opContainer.innerHTML = `
            <p style="white-space: pre-wrap;">${data.thread.message}</p>
            <div class="thread-meta">
                <span>By ${data.thread.author}</span>
                <span>${data.thread.timestamp}</span>
            </div>
        `;

        const repliesContainer = document.getElementById('replies-container');
        repliesContainer.innerHTML = ''; 
        data.replies.forEach(reply => addReplyToPage(reply));

        socket.emit('join_room', { room: `thread_${threadId}` });

    } catch (error) {
        console.error('Failed to fetch thread details:', error);
    }
}

function addReplyToPage(reply) {
    const container = document.getElementById('replies-container');
    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '16px';
    card.innerHTML = `
        <div class="card__body">
            <p style="white-space: pre-wrap;">${reply.text}</p>
            <div class="thread-meta" style="display: flex; justify-content: space-between; align-items: center; font-size: var(--font-size-sm); color: var(--color-text-secondary);">
                <span>By ${reply.author}</span>
                <span>${reply.timestamp}</span>
                <button class="btn btn--secondary btn--sm reply-btn" data-author="${reply.author}">Reply</button>
            </div>
        </div>
    `;
    container.appendChild(card);
    container.scrollTop = container.scrollHeight;
}

function showForumList() {
    if (currentThreadId) {
        socket.emit('leave_room', { room: `thread_${currentThreadId}` });
        currentThreadId = null;
    }
    showSection('forum');
    fetchInitialThreads();
}

function prepareReplyTo(author) {
    const contextBanner = document.getElementById('reply-context');
    const contextAuthor = document.getElementById('reply-context-author');
    const replyText = document.getElementById('reply-text');
    
    contextAuthor.textContent = `@${author}`;
    contextBanner.classList.remove('hidden');
    
    replyText.value = `@${author} `;
    replyText.focus();
}

function cancelReplyTo() {
    const contextBanner = document.getElementById('reply-context');
    const replyText = document.getElementById('reply-text');
    
    contextBanner.classList.add('hidden');
    if (replyText.value.startsWith('@')) {
        replyText.value = '';
    }
}

function showCreateThread() {
    const modal = document.getElementById('createThreadModal');
    if (modal) modal.classList.remove('hidden');
}

function createThread() {}


// --- SCREENING FUNCTIONALITY (FULL ORIGINAL VERSION) ---
function startScreening(type) {
  currentState.currentScreening = type;
  currentState.screeningAnswers = [];
  const modal = document.getElementById('screeningModal');
  const title = document.getElementById('screeningTitle');
  const content = document.getElementById('screeningContent');
  title.textContent = type === 'phq9' ? 'PHQ-9 Depression Screening' : 'GAD-7 Anxiety Screening';
  const questions = appData.screeningQuestions[type];
  content.innerHTML = questions.map((question, index) => `<div class="screening-question"><h4>Question ${index + 1}</h4><p>${question}</p><div class="screening-options"><label class="screening-option"><input type="radio" name="q${index}" value="0"> Not at all</label><label class="screening-option"><input type="radio" name="q${index}" value="1"> Several days</label><label class="screening-option"><input type="radio" name="q${index}" value="2"> More than half the days</label><label class="screening-option"><input type="radio" name="q${index}" value="3"> Nearly every day</label></div></div>`).join('');
  modal.classList.remove('hidden');
}

function submitScreening() {
    const answers = [];
    const questions = appData.screeningQuestions[currentState.currentScreening];
    for (let i = 0; i < questions.length; i++) {
        const selected = document.querySelector(`input[name="q${i}"]:checked`);
        if (selected) { answers.push(parseInt(selected.value)); } else { alert('Please answer all questions.'); return; }
    }
    currentState.screeningAnswers = answers;
    const total = answers.reduce((sum, answer) => sum + answer, 0);
    closeModal();
    setTimeout(() => {
        let feedback = '', followUp = '';
        if (currentState.currentScreening === 'phq9') {
            if (total >= 15) { feedback = "Your responses suggest you may be experiencing significant symptoms of depression..."; followUp = "I strongly encourage you to book a session with one of our licensed counselors..."; }
            else if (total >= 10) { feedback = "Your responses indicate moderate symptoms that are worth addressing..."; followUp = "Consider speaking with one of our counselors..."; }
            else if (total >= 5) { feedback = "Your responses suggest mild symptoms that are quite common..."; followUp = "Continue practicing self-care and consider exploring our wellness resources..."; }
            else { feedback = "Your responses suggest minimal symptoms, which is encouraging..."; followUp = "Keep up the good self-care practices..."; }
        } else { // GAD-7
            if (total >= 15) { feedback = "Your responses suggest you may be experiencing severe anxiety symptoms..."; followUp = "I strongly recommend booking a session with one of our counselors..."; }
            else if (total >= 10) { feedback = "Your responses indicate moderate anxiety levels that are definitely worth addressing..."; followUp = "Our counselors can help you develop personalized anxiety management techniques..."; }
            else if (total >= 5) { feedback = "Your responses suggest mild anxiety, which is quite normal and manageable..."; followUp = "Try incorporating some of our stress management techniques into your daily routine..."; }
            else { feedback = "Your responses indicate minimal anxiety symptoms, which is great..."; followUp = "Keep up whatever self-care practices you're currently using..."; }
        }
        addMessage('bot', feedback);
        setTimeout(() => { addMessage('bot', followUp); }, 2000);
        if (total >= 10) {
            setTimeout(() => { addMessage('bot', "Would you like me to help you book a session or explore coping strategies first?"); }, 4000);
        }
    }, 500);
}

// --- COUNSELOR BOOKING SECTION (FULL ORIGINAL VERSION) ---
function loadCounselors() {
    const counselorsList = document.getElementById('counselorsList');
    if (!counselorsList) return;
    counselorsList.innerHTML = appData.counselors.map(c => `<div class="counselor-card" onclick="selectCounselor(${c.id})"><div class="counselor-info"><h4>${c.name}</h4><div class="counselor-specialization">${c.specialization}</div><div class="counselor-details"><div><strong>Experience:</strong> ${c.experience}</div><div><strong>Languages:</strong> ${c.languages.join(', ')}</div></div><div class="counselor-rating"><span class="rating-stars">★★★★★</span><span>${c.rating}</span></div></div></div>`).join('');
    initializeCalendar();
}

function selectCounselor(counselorId) {
    currentState.selectedCounselor = counselorId;
    document.querySelectorAll('.counselor-card').forEach(card => card.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    loadTimeSlots();
}

function initializeCalendar() {
    const currentMonthEl = document.getElementById('currentMonth');
    const calendarGrid = document.getElementById('calendarGrid');
    if (!currentMonthEl || !calendarGrid) return;
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    currentMonthEl.textContent = `${monthNames[currentState.currentMonth]} ${currentState.currentYear}`;
    const firstDay = new Date(currentState.currentYear, currentState.currentMonth, 1).getDay();
    const daysInMonth = new Date(currentState.currentYear, currentState.currentMonth + 1, 0).getDate();
    let calendarHTML = '';
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => { calendarHTML += `<div class="calendar-day-header" style="font-weight: bold; text-align: center; padding: 8px;">${day}</div>`; });
    for (let i = 0; i < firstDay; i++) { calendarHTML += '<div class="calendar-day disabled"></div>'; }
    for (let day = 1; day <= daysInMonth; day++) {
        const isPast = new Date(currentState.currentYear, currentState.currentMonth, day) < new Date().setHours(0, 0, 0, 0);
        calendarHTML += `<div class="calendar-day ${isPast ? 'disabled' : ''} ${currentState.selectedDate === day ? 'selected' : ''}" onclick="${isPast ? '' : `selectDate(${day})`}">${day}</div>`;
    }
    calendarGrid.innerHTML = calendarHTML;
}

function selectDate(day) {
    currentState.selectedDate = day;
    initializeCalendar();
    loadTimeSlots();
}

function loadTimeSlots() {
    const timeSlotsContainer = document.getElementById('timeSlots');
    if (!timeSlotsContainer) return;
    if (!currentState.selectedCounselor || !currentState.selectedDate) {
        timeSlotsContainer.innerHTML = '<p>Please select a counselor and date first.</p>'; return;
    }
    const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
    timeSlotsContainer.innerHTML = timeSlots.map(time => `<div class="time-slot" onclick="selectTime('${time}')">${time}</div>`).join('');
}

function selectTime(time) {
    currentState.selectedTime = time;
    document.querySelectorAll('.time-slot').forEach(slot => slot.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    const bookingForm = document.getElementById('bookingFormContainer');
    if (bookingForm) bookingForm.classList.remove('hidden');
}

function changeMonth(direction) {
    currentState.currentMonth += direction;
    if (currentState.currentMonth < 0) { currentState.currentMonth = 11; currentState.currentYear--; }
    else if (currentState.currentMonth > 11) { currentState.currentMonth = 0; currentState.currentYear++; }
    initializeCalendar();
}

// --- RESOURCES SECTION (FULL ORIGINAL VERSION) ---
function loadResources() {
    const resourcesGrid = document.getElementById('resourcesGrid');
    if (!resourcesGrid) return;
    displayResources(appData.resources);
    const categoryFilter = document.getElementById('categoryFilter');
    const languageFilter = document.getElementById('languageFilter');
    const searchResources = document.getElementById('searchResources');
    if (categoryFilter) categoryFilter.addEventListener('change', filterResources);
    if (languageFilter) languageFilter.addEventListener('change', filterResources);
    if (searchResources) searchResources.addEventListener('input', filterResources);
}

function displayResources(resources) {
    const resourcesGrid = document.getElementById('resourcesGrid');
    if (!resourcesGrid) return;
    resourcesGrid.innerHTML = resources.map(r => `<div class="resource-card"><div class="resource-header"><h3 class="resource-title">${r.title}</h3><span class="resource-type">${r.type}</span></div><div class="resource-category">${r.category}</div><p class="resource-description">${r.description}</p><div class="resource-meta"><div><span>${r.language}</span>${r.duration ? ` • ${r.duration}` : ''}</div><div class="resource-rating"><span class="rating-stars">★★★★★</span><span>${r.rating}</span></div></div></div>`).join('');
}

function filterResources() {
    const category = document.getElementById('categoryFilter').value;
    const language = document.getElementById('languageFilter').value;
    const searchTerm = document.getElementById('searchResources').value.toLowerCase();
    let filtered = appData.resources;
    if (category) { filtered = filtered.filter(r => r.category === category); }
    if (language) { filtered = filtered.filter(r => r.language === language); }
    if (searchTerm) { filtered = filtered.filter(r => r.title.toLowerCase().includes(searchTerm) || r.description.toLowerCase().includes(searchTerm)); }
    displayResources(filtered);
}

// --- ADMIN & PROFILE SECTIONS (FULL ORIGINAL VERSION) ---
function adminLogin(event) {
    event.preventDefault();
    if (document.getElementById('adminUsername').value === 'admin' && document.getElementById('adminPassword').value === 'demo123') {
        currentState.adminLoggedIn = true;
        showSection('admin');
    } else {
        alert('Invalid credentials. Use admin/demo123');
    }
}

function adminLogout() {
    currentState.adminLoggedIn = false;
    showSection('admin');
}

function loadDashboardData() {
    document.getElementById('totalUsers').textContent = appData.analytics.totalUsers.toLocaleString();
    document.getElementById('activeSessions').textContent = appData.analytics.activeSessions;
    document.getElementById('crisisCount').textContent = appData.analytics.crisisInterventions;
    document.getElementById('bookingsCount').textContent = appData.analytics.counselorBookings;
    document.getElementById('alertsList').innerHTML = `<div class="alert-item"><strong>High Risk Student Detected</strong><br>PHQ-9 score of 18 requires immediate follow-up.</div><div class="alert-item warning"><strong>Spike in Anxiety Reports</strong><br>40% increase in anxiety-related chats this week.</div>`;
}

function loadDashboardCharts() {
    if (typeof Chart === 'undefined') return;
    const usageCtx = document.getElementById('usageChart');
    if (usageCtx && usageCtx.chart) usageCtx.chart.destroy();
    if (usageCtx) {
        usageCtx.chart = new Chart(usageCtx.getContext('2d'), { type: 'line', data: { labels: ['8 AM', '10 AM', '2 PM', '6 PM', '10 PM'], datasets: [{ label: 'Active Users', data: [45, 78, 156, 234, 189], borderColor: '#1FB8CD', backgroundColor: 'rgba(31, 184, 205, 0.1)', tension: 0.4, fill: true }] }, options: { responsive: true, maintainAspectRatio: false } });
    }
    const concernsCtx = document.getElementById('concernsChart');
    if (concernsCtx && concernsCtx.chart) concernsCtx.chart.destroy();
    if (concernsCtx) {
        concernsCtx.chart = new Chart(concernsCtx.getContext('2d'), { type: 'doughnut', data: { labels: ['Academic Stress', 'Anxiety', 'Depression', 'Social Issues', 'Sleep Problems'], datasets: [{ data: [35, 28, 18, 12, 7], backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F'] }] }, options: { responsive: true, maintainAspectRatio: false } });
    }
}

function loadActivityHistory() {
    const activityHistory = document.getElementById('activityHistory');
    if (!activityHistory) return;
    const activities = [{ date: 'Today', activity: 'Completed GAD-7 anxiety screening' },{ date: 'Yesterday', activity: 'Enhanced chat session - 25 minutes' },{ date: '2 days ago', activity: 'Booked session with Dr. Priya Sharma' },];
    activityHistory.innerHTML = activities.map(a => `<div class="activity-item"><div class="activity-date">${a.date}</div><div>${a.activity}</div></div>`).join('');
}

function setupMoodTracking() {
    if (typeof Chart === 'undefined') return;
    const moodCtx = document.getElementById('moodChart');
    if (moodCtx && moodCtx.chart) moodCtx.chart.destroy();
    if (moodCtx) {
        moodCtx.chart = new Chart(moodCtx.getContext('2d'), {
            type: 'line', data: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [{ label: 'Mood', data: [3, 2, 4, 3, 5, 4, 4], borderColor: '#1FB8CD', tension: 0.4 }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 1, max: 5, ticks: { stepSize: 1, callback: (v) => ['', '😢', '😕', '😐', '🙂', '😊'][v] } } } }
        });
    }
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
}

// --- MODALS & EVENT LISTENERS ---
function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
}

function setupEventListeners() {
    const chatForm = document.getElementById('chat-form');
    if (chatForm) {
        chatForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const messageInput = document.getElementById('messageInput');
            handleChatMessage(messageInput.value);
            messageInput.value = '';
        });
    }
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    });
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Booking confirmed!');
            closeModal();
        });
    }
}

// --- GLOBAL FUNCTIONS ---
window.showSection = showSection;
window.sendQuickMessage = sendQuickMessage;
window.startScreening = startScreening;
window.submitScreening = submitScreening;
window.selectCounselor = selectCounselor;
window.selectDate = selectDate;
window.selectTime = selectTime;
window.changeMonth = changeMonth;
window.showCreateThread = showCreateThread;
window.createThread = createThread;
window.adminLogin = adminLogin;
window.adminLogout = adminLogout;
window.closeModal = closeModal;

