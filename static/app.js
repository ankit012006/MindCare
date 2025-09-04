// MindCare Platform JavaScript with Google Gemini API Integration

// All your original data for counselors, resources, etc., remains the same.
const appData = {
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
  forumThreads: [
    {
      id: 1,
      title: "Feeling overwhelmed with semester workload",
      category: "Academic Stress",
      author: "StudentA",
      timestamp: "2 hours ago",
      replies: 8,
      lastReply: "1 hour ago"
    },
    {
      id: 2,
      title: "Tips for making friends in college?",
      category: "Social Support",
      author: "QuietLearner",
      timestamp: "1 day ago",
      replies: 12,
      lastReply: "3 hours ago"
    },
    {
      id: 3,
      title: "Success story: Overcame presentation anxiety",
      category: "Success Stories",
      author: "ConfidentNow",
      timestamp: "3 days ago",
      replies: 15,
      lastReply: "6 hours ago"
    },
    {
      id: 4,
      title: "Dealing with homesickness",
      category: "General Support",
      author: "MissHome",
      timestamp: "5 hours ago",
      replies: 6,
      lastReply: "2 hours ago"
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

// State Management (remains the same)
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

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

function initializeApp() {
  setupNavigation();
  initializeChat(); // This will set up our new chatbot
  loadCounselors();
  loadResources();
  loadForumThreads();
  loadActivityHistory();
  setupMoodTracking();
  setupEventListeners();
}


// --- CHATBOT SECTION ---
// This is the core of the new functionality.

function initializeChat() {
  const welcomeMessage = "Hello, and welcome to a safe space. I'm MindCare Assistant, powered by Google's advanced AI. I'm here to listen and support you. How are you feeling right now?";
  addMessage('bot', welcomeMessage);
}

// MODIFIED: This function now sends the message to our new backend
async function handleChatMessage(message) {
  if (!message) return;

  // 1. Display the user's message in the chat window
  addMessage('user', message);
  
  // 2. Add a "typing..." indicator for the bot
  const typingIndicator = addMessage('bot', 'MindCare Assistant is typing...', true);

  try {
    // 3. Send the user's message to our backend server
    const response = await fetch('/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: message }),
    });

    if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    const botResponse = data.response;

    // 4. Remove the typing indicator
    typingIndicator.remove();
    
    // 5. Display the AI's response
    addMessage('bot', botResponse);

  } catch (error) {
    // Handle errors (e.g., server is down)
    console.error('Error fetching chat response:', error);
    typingIndicator.remove();
    addMessage('bot', "I'm having trouble connecting right now. Please try again in a moment.");
  }
}

// MODIFIED: This function adds messages to the UI. It's mostly the same.
function addMessage(sender, content, isTyping = false) {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return null;

  const messageDiv = document.createElement('div');
  messageDiv.className = `message message--${sender}`;

  // Use textContent to prevent HTML injection issues and handle newlines
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
  return messageDiv; // Return the element so we can remove it (for typing indicator)
}

// Your original functions for quick messages, now using the new handler
function sendQuickMessage(message) {
  handleChatMessage(message);
}

// --- END OF CHATBOT SECTION ---


// --- ALL OTHER FUNCTIONS (UNCHANGED) ---
// The rest of your code for navigation, booking, resources, etc., remains exactly the same.

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
  } else {
    console.error('Section not found:', sectionId);
  }
  
  if (sectionId === 'admin') {
    if (!currentState.adminLoggedIn) {
      document.getElementById('adminLogin').style.display = 'block';
      document.getElementById('adminDashboard').classList.add('hidden');
    } else {
      document.getElementById('adminLogin').style.display = 'none';
      document.getElementById('adminDashboard').classList.remove('hidden');
      loadDashboardCharts();
    }
  }
}

function startScreening(type) {
  currentState.currentScreening = type;
  currentState.screeningAnswers = [];
  
  const modal = document.getElementById('screeningModal');
  const title = document.getElementById('screeningTitle');
  const content = document.getElementById('screeningContent');
  
  title.textContent = type === 'phq9' ? 'PHQ-9 Depression Screening' : 'GAD-7 Anxiety Screening';
  
  const questions = appData.screeningQuestions[type];
  content.innerHTML = questions.map((question, index) => `
    <div class="screening-question">
      <h4>Question ${index + 1}</h4>
      <p>${question}</p>
      <div class="screening-options">
        <label class="screening-option">
          <input type="radio" name="q${index}" value="0">
          Not at all
        </label>
        <label class="screening-option">
          <input type="radio" name="q${index}" value="1">
          Several days
        </label>
        <label class="screening-option">
          <input type="radio" name="q${index}" value="2">
          More than half the days
        </label>
        <label class="screening-option">
          <input type="radio" name="q${index}" value="3">
          Nearly every day
        </label>
      </div>
    </div>
  `).join('');
  
  modal.classList.remove('hidden');
}

function submitScreening() {
  const answers = [];
  const questions = appData.screeningQuestions[currentState.currentScreening];
  
  for (let i = 0; i < questions.length; i++) {
    const selected = document.querySelector(`input[name="q${i}"]:checked`);
    if (selected) {
      answers.push(parseInt(selected.value));
    } else {
      alert('Please answer all questions.');
      return;
    }
  }
  
  currentState.screeningAnswers = answers;
  const total = answers.reduce((sum, answer) => sum + answer, 0);
  
  closeModal();
  
  setTimeout(() => {
    let feedback = '';
    let followUp = '';
    
    if (currentState.currentScreening === 'phq9') {
      if (total >= 15) {
        feedback = "Your responses suggest you may be experiencing significant symptoms of depression. This score indicates that you might benefit greatly from professional support. I want you to know that what you're experiencing is treatable, and reaching out for help is a sign of strength, not weakness.";
        followUp = "I strongly encourage you to book a session with one of our licensed counselors. They can provide personalized strategies and support tailored to your specific situation. You don't have to go through this alone.";
      } else if (total >= 10) {
        feedback = "Your responses indicate moderate symptoms that are worth addressing. Many students experience these feelings, especially during stressful periods like exams or major life transitions. The important thing is that you're recognizing these feelings and taking steps to address them.";
        followUp = "Consider speaking with one of our counselors who can help you develop personalized coping strategies. In the meantime, our stress management resources might be helpful.";
      } else if (total >= 5) {
        feedback = "Your responses suggest mild symptoms that are quite common among students. While these feelings might not be severely impacting your daily life, it's still important to take care of your mental health proactively.";
        followUp = "Continue practicing self-care and consider exploring our wellness resources. If these feelings persist or worsen, don't hesitate to reach out for additional support.";
      } else {
        feedback = "Your responses suggest minimal symptoms, which is encouraging. It's great that you're being proactive about your mental health by taking this screening.";
        followUp = "Keep up the good self-care practices, and remember that it's normal for mood to fluctuate. Our resource hub has great tools for maintaining mental wellness.";
      }
    } else { // GAD-7
      if (total >= 15) {
        feedback = "Your responses suggest you may be experiencing severe anxiety symptoms. Anxiety at this level can significantly impact your daily life, relationships, and academic performance. Please know that anxiety is highly treatable, and you don't have to suffer through this alone.";
        followUp = "I strongly recommend booking a session with one of our counselors who specializes in anxiety management. They can help you develop effective coping strategies and may discuss treatment options that could provide significant relief.";
      } else if (total >= 10) {
        feedback = "Your responses indicate moderate anxiety levels that are definitely worth addressing. Many students experience anxiety, especially during high-stress periods, but there are effective ways to manage these feelings.";
        followUp = "Our counselors can help you develop personalized anxiety management techniques. You might also find our breathing exercises and mindfulness resources helpful for immediate relief.";
      } else if (total >= 5) {
        feedback = "Your responses suggest mild anxiety, which is quite normal and manageable. Everyone experiences some level of anxiety, especially during challenging times like college.";
        followUp = "Try incorporating some of our stress management techniques into your daily routine. If your anxiety increases or starts interfering with your daily activities, don't hesitate to reach out for additional support.";
      } else {
        feedback = "Your responses indicate minimal anxiety symptoms, which is great. It shows you're managing stress well and maintaining good mental health.";
        followUp = "Keep up whatever self-care practices you're currently using. Our resource hub has additional tools for maintaining mental wellness and preventing future anxiety.";
      }
    }
    
    addMessage('bot', feedback);
    
    setTimeout(() => {
      addMessage('bot', followUp);
    }, 2000);
    
    if (total >= 10) {
      setTimeout(() => {
        addMessage('bot', "Would you like me to help you book a session with one of our counselors, or would you prefer to explore some immediate coping strategies first?");
      }, 4000);
    }
  }, 500);
}

function loadCounselors() {
  const counselorsList = document.getElementById('counselorsList');
  if (!counselorsList) return;
  
  counselorsList.innerHTML = appData.counselors.map(counselor => `
    <div class="counselor-card" onclick="selectCounselor(${counselor.id})">
      <div class="counselor-info">
        <h4>${counselor.name}</h4>
        <div class="counselor-specialization">${counselor.specialization}</div>
        <div class="counselor-details">
          <div><strong>Experience:</strong> ${counselor.experience}</div>
          <div><strong>Languages:</strong> ${counselor.languages.join(', ')}</div>
        </div>
        <div class="counselor-rating">
          <span class="rating-stars">★★★★★</span>
          <span>${counselor.rating}</span>
        </div>
      </div>
    </div>
  `).join('');
  
  initializeCalendar();
}

function selectCounselor(counselorId) {
  currentState.selectedCounselor = counselorId;
  
  document.querySelectorAll('.counselor-card').forEach(card => {
    card.classList.remove('selected');
  });
  
  event.currentTarget.classList.add('selected');
  
  loadTimeSlots();
}

function initializeCalendar() {
  const currentMonthEl = document.getElementById('currentMonth');
  const calendarGrid = document.getElementById('calendarGrid');
  
  if (!currentMonthEl || !calendarGrid) return;
  
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  
  currentMonthEl.textContent = `${monthNames[currentState.currentMonth]} ${currentState.currentYear}`;
  
  const firstDay = new Date(currentState.currentYear, currentState.currentMonth, 1).getDay();
  const daysInMonth = new Date(currentState.currentYear, currentState.currentMonth + 1, 0).getDate();
  const today = new Date();
  
  let calendarHTML = '';
  
  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayHeaders.forEach(day => {
    calendarHTML += `<div class="calendar-day-header" style="font-weight: bold; text-align: center; padding: 8px;">${day}</div>`;
  });
  
  for (let i = 0; i < firstDay; i++) {
    calendarHTML += '<div class="calendar-day disabled"></div>';
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentState.currentYear, currentState.currentMonth, day);
    const isPast = date < today && date.toDateString() !== today.toDateString();
    const isSelected = currentState.selectedDate === day;
    
    calendarHTML += `
      <div class="calendar-day ${isPast ? 'disabled' : ''} ${isSelected ? 'selected' : ''}" 
            onclick="${isPast ? '' : `selectDate(${day})`}">
        ${day}
      </div>
    `;
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
    timeSlotsContainer.innerHTML = '<p>Please select a counselor and date first.</p>';
    return;
  }
  
  const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
  
  timeSlotsContainer.innerHTML = timeSlots.map(time => `
    <div class="time-slot" onclick="selectTime('${time}')">
      ${time}
    </div>
  `).join('');
}

function selectTime(time) {
  currentState.selectedTime = time;
  
  document.querySelectorAll('.time-slot').forEach(slot => {
    slot.classList.remove('selected');
  });
  
  event.currentTarget.classList.add('selected');
  
  const bookingForm = document.getElementById('bookingFormContainer');
  if (bookingForm) {
    bookingForm.classList.remove('hidden');
  }
}

function changeMonth(direction) {
  currentState.currentMonth += direction;
  if (currentState.currentMonth < 0) {
    currentState.currentMonth = 11;
    currentState.currentYear--;
  } else if (currentState.currentMonth > 11) {
    currentState.currentMonth = 0;
    currentState.currentYear++;
  }
  initializeCalendar();
}

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
  
  resourcesGrid.innerHTML = resources.map(resource => `
    <div class="resource-card">
      <div class="resource-header">
        <h3 class="resource-title">${resource.title}</h3>
        <span class="resource-type">${resource.type}</span>
      </div>
      <div class="resource-category">${resource.category}</div>
      <p class="resource-description">${resource.description}</p>
      <div class="resource-meta">
        <div>
          <span>${resource.language}</span>
          ${resource.duration ? ` • ${resource.duration}` : ''}
        </div>
        <div class="resource-rating">
          <span class="rating-stars">★★★★★</span>
          <span>${resource.rating}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function filterResources() {
  const categoryFilter = document.getElementById('categoryFilter');
  const languageFilter = document.getElementById('languageFilter');
  const searchResources = document.getElementById('searchResources');
  
  if (!categoryFilter || !languageFilter || !searchResources) return;
  
  const categoryValue = categoryFilter.value;
  const languageValue = languageFilter.value;
  const searchTerm = searchResources.value.toLowerCase();
  
  let filteredResources = appData.resources;
  
  if (categoryValue) {
    filteredResources = filteredResources.filter(resource => 
      resource.category === categoryValue
    );
  }
  
  if (languageValue) {
    filteredResources = filteredResources.filter(resource => 
      resource.language === languageValue
    );
  }
  
  if (searchTerm) {
    filteredResources = filteredResources.filter(resource =>
      resource.title.toLowerCase().includes(searchTerm) ||
      resource.description.toLowerCase().includes(searchTerm)
    );
  }
  
  displayResources(filteredResources);
}

function loadForumThreads() {
  const forumThreads = document.getElementById('forumThreads');
  if (!forumThreads) return;
  
  displayThreads(appData.forumThreads);
  
  document.querySelectorAll('.category-filter').forEach(filter => {
    filter.addEventListener('click', function() {
      document.querySelectorAll('.category-filter').forEach(f => f.classList.remove('active'));
      this.classList.add('active');
      
      const category = this.dataset.category;
      const filtered = category ? 
        appData.forumThreads.filter(thread => thread.category === category) :
        appData.forumThreads;
      
      displayThreads(filtered);
    });
  });
}

function displayThreads(threads) {
  const forumThreads = document.getElementById('forumThreads');
  if (!forumThreads) return;
  
  forumThreads.innerHTML = threads.map(thread => `
    <div class="thread-card">
      <div class="thread-header">
        <h3 class="thread-title">${thread.title}</h3>
        <span class="thread-category">${thread.category}</span>
      </div>
      <div class="thread-meta">
        <div>
          <span class="thread-author">${thread.author}</span> • 
          <span class="thread-timestamp">${thread.timestamp}</span>
        </div>
        <div class="thread-stats">
          <span>${thread.replies} replies</span>
          <span>Last reply: ${thread.lastReply}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function showCreateThread() {
  const modal = document.getElementById('createThreadModal');
  if (modal) {
    modal.classList.remove('hidden');
  }
}

function createThread() {
  const title = document.getElementById('threadTitle');
  const category = document.getElementById('threadCategory');
  const message = document.getElementById('threadMessage');
  
  if (!title || !category || !message) return;
  
  if (!title.value || !category.value || !message.value) {
    alert('Please fill in all fields.');
    return;
  }
  
  const newThread = {
    id: appData.forumThreads.length + 1,
    title: title.value,
    category: category.value,
    author: 'Anonymous',
    timestamp: 'Just now',
    replies: 0,
    lastReply: 'Just now'
  };
  
  appData.forumThreads.unshift(newThread);
  displayThreads(appData.forumThreads);
  closeModal();
  
  const form = document.getElementById('createThreadForm');
  if (form) form.reset();
}

function adminLogin(event) {
  event.preventDefault();
  const username = document.getElementById('adminUsername');
  const password = document.getElementById('adminPassword');
  
  if (!username || !password) return;
  
  if (username.value === 'admin' && password.value === 'demo123') {
    currentState.adminLoggedIn = true;
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminDashboard').classList.remove('hidden');
    loadDashboardData();
    loadDashboardCharts();
  } else {
    alert('Invalid credentials. Use admin/demo123');
  }
}

function adminLogout() {
  currentState.adminLoggedIn = false;
  document.getElementById('adminLogin').style.display = 'block';
  document.getElementById('adminDashboard').classList.add('hidden');
}

function loadDashboardData() {
  const totalUsers = document.getElementById('totalUsers');
  const activeSessions = document.getElementById('activeSessions');
  const crisisCount = document.getElementById('crisisCount');
  const bookingsCount = document.getElementById('bookingsCount');
  
  if (totalUsers) totalUsers.textContent = appData.analytics.totalUsers.toLocaleString();
  if (activeSessions) activeSessions.textContent = appData.analytics.activeSessions;
  if (crisisCount) crisisCount.textContent = appData.analytics.crisisInterventions;
  if (bookingsCount) bookingsCount.textContent = appData.analytics.counselorBookings;
  
  const alertsList = document.getElementById('alertsList');
  if (alertsList) {
    alertsList.innerHTML = `
      <div class="alert-item">
        <strong>High Risk Student Detected</strong><br>
        PHQ-9 score of 18 requires immediate follow-up - Student referred to counselor
      </div>
      <div class="alert-item warning">
        <strong>Spike in Anxiety Reports</strong><br>
        40% increase in anxiety-related chat sessions this week - Consider additional resources
      </div>
      <div class="alert-item info">
        <strong>Resource Usage Alert</strong><br>
        Sleep hygiene resources trending - 85% positive feedback, consider expanding content
      </div>
      <div class="alert-item">
        <strong>Crisis Intervention Success</strong><br>
        3 students successfully connected to emergency services this week
      </div>
    `;
  }
}

function loadDashboardCharts() {
  if (typeof Chart === 'undefined') return;
  const usageCtx = document.getElementById('usageChart');
  if (usageCtx) {
    new Chart(usageCtx.getContext('2d'), {
      type: 'line',
      data: {
        labels: ['8 AM', '10 AM', '2 PM', '6 PM', '10 PM'],
        datasets: [{
          label: 'Active Users',
          data: [45, 78, 156, 234, 189],
          borderColor: '#1FB8CD',
          backgroundColor: 'rgba(31, 184, 205, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }
  
  const concernsCtx = document.getElementById('concernsChart');
  if (concernsCtx) {
    new Chart(concernsCtx.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Academic Stress', 'Anxiety', 'Depression', 'Social Issues', 'Sleep Problems'],
        datasets: [{
          data: [35, 28, 18, 12, 7],
          backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }
}

function loadActivityHistory() {
  const activityHistory = document.getElementById('activityHistory');
  if (!activityHistory) return;
  
  const activities = [
    { date: 'Today', activity: 'Completed GAD-7 anxiety screening', type: 'screening' },
    { date: 'Today', activity: 'Used breathing exercise resource', type: 'resource' },
    { date: 'Yesterday', activity: 'Enhanced chat session - 25 minutes', type: 'chat' },
    { date: '2 days ago', activity: 'Booked session with Dr. Priya Sharma', type: 'booking' },
    { date: '3 days ago', activity: 'Posted in Academic Stress forum', type: 'forum' },
    { date: '1 week ago', activity: 'Completed mood tracking', type: 'mood' }
  ];
  
  activityHistory.innerHTML = activities.map(activity => `
    <div class="activity-item">
      <div class="activity-date">${activity.date}</div>
      <div>${activity.activity}</div>
    </div>
  `).join('');
}

function setupMoodTracking() {
  if (typeof Chart === 'undefined') return;
  const moodCtx = document.getElementById('moodChart');
  if (moodCtx) {
    new Chart(moodCtx.getContext('2d'), {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Mood',
          data: [3, 2, 4, 3, 5, 4, 4],
          borderColor: '#1FB8CD',
          backgroundColor: 'rgba(31, 184, 205, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#1FB8CD',
          pointRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            min: 1,
            max: 5,
            ticks: {
              stepSize: 1,
              callback: function(value) {
                const moods = ['', '😢', '😕', '😐', '🙂', '😊'];
                return moods[value];
              }
            }
          }
        }
      }
    });
  }
  
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
      
      const mood = this.dataset.mood;
      const moodText = ['', 'very low', 'low', 'neutral', 'good', 'very good'][mood];
      
      const tempMessage = document.createElement('div');
      tempMessage.textContent = `Mood recorded: ${moodText}`;
      tempMessage.style.cssText = 'position: absolute; background: #4A90A4; color: white; padding: 8px 12px; border-radius: 4px; font-size: 12px; z-index: 1000; top: -30px; left: 50%; transform: translateX(-50%);';
      
      this.style.position = 'relative';
      this.appendChild(tempMessage);
      
      setTimeout(() => {
        tempMessage.remove();
      }, 2000);
    });
  });
}

function closeModal() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.classList.add('hidden');
  });
}

// MODIFIED: This is now the main event listener for the new chatbot form
function setupEventListeners() {
  const chatForm = document.getElementById('chat-form');
  if (chatForm) {
      chatForm.addEventListener('submit', function(e) {
          e.preventDefault();
          const messageInput = document.getElementById('messageInput');
          const message = messageInput.value.trim();
          messageInput.value = '';
          handleChatMessage(message);
      });
  }

  // Your other event listeners remain the same
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        closeModal();
      }
    });
  });
  
  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', function(e) {
      e.preventDefault();
      alert('Booking confirmed! You will receive a confirmation email shortly. Our counselor will reach out to you before your scheduled session.');
      const bookingContainer = document.getElementById('bookingFormContainer');
      if (bookingContainer) {
        bookingContainer.classList.add('hidden');
      }
      
      currentState.selectedCounselor = null;
      currentState.selectedDate = null;
      currentState.selectedTime = null;
      
      document.querySelectorAll('.counselor-card.selected').forEach(card => {
        card.classList.remove('selected');
      });
      document.querySelectorAll('.time-slot.selected').forEach(slot => {
        slot.classList.remove('selected');
      });
    });
  }
}

// Global functions (no changes needed)
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