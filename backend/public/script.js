/**
 * FutureMe Frontend Engine
 * Nitish's Founder Labs
 */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================================================
  // DOM Elements Selection
  // ==========================================================================
  
  // Sections
  const formSection = document.getElementById('form-section');
  const loadingSection = document.getElementById('loading-section');
  const resultSection = document.getElementById('result-section');
  const chatSection = document.getElementById('chat-section');

  // Form & Inputs
  const reflectionForm = document.getElementById('reflection-form');
  const nameInput = document.getElementById('name');
  const ageInput = document.getElementById('age');
  const goalInput = document.getElementById('goal');
  const struggleInput = document.getElementById('struggle');
  const visionInput = document.getElementById('one-year-vision');
  const submitBtn = document.getElementById('submit-btn');

  // Loader
  const loadingStatusText = document.getElementById('loading-status');

  // Result Elements
  const futureMessageEl = document.getElementById('future-message');
  const futureIdentityEl = document.getElementById('future-identity');
  const futureWarningEl = document.getElementById('future-warning');
  const futureHabitEl = document.getElementById('future-habit');
  const futureMantraEl = document.getElementById('future-mantra');
  const move1El = document.getElementById('move-1');
  const move2El = document.getElementById('move-2');
  const move3El = document.getElementById('move-3');
  const toneBadge = document.getElementById('tone-badge');

  // Action Buttons
  const copyBtn = document.getElementById('copy-btn');
  const resetBtn = document.getElementById('reset-btn');
  const chatTriggerBtn = document.getElementById('chat-trigger-btn');
  const closeChatBtn = document.getElementById('close-chat-btn');

  // Chat Elements
  const chatMessagesContainer = document.getElementById('chat-messages');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatSendBtn = document.getElementById('chat-send-btn');
  const chatTypingIndicator = document.getElementById('chat-typing');

  // Toast
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  const toastIconSuccess = document.getElementById('toast-icon-success');
  const toastIconError = document.getElementById('toast-icon-error');

  // ==========================================================================
  // App Global State
  // ==========================================================================
  let userProfile = null;
  let chatHistory = [];
  let generatedData = null; // Store output details
  let loadingInterval = null;

  // List of quotes to display during generation loading state
  const loadingPhrases = [
    "Establishing temporal connection...",
    "Aligning future coordinates...",
    "Analyzing current behavior patterns...",
    "Parsing obstacles and self-doubts...",
    "Formulating optimal tactical pathways...",
    "Synthesizing advice from the future self...",
    "Translating deep emotional insights...",
    "Writing your future identity..."
  ];

  // ==========================================================================
  // Utilities & Helpers
  // ==========================================================================

  // Toast Notification Trigger
  function showToast(message, isError = false) {
    toastMessage.textContent = message;
    
    if (isError) {
      toastIconError.classList.remove('hidden');
      toastIconSuccess.classList.add('hidden');
      toast.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    } else {
      toastIconSuccess.classList.remove('hidden');
      toastIconError.classList.add('hidden');
      toast.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    }
    
    toast.classList.remove('hidden');
    // For transition animation trigger
    setTimeout(() => toast.classList.add('show'), 50);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.classList.add('hidden'), 400);
    }, 3000);
  }

  // Active view state transitions
  function showSection(sectionToShow) {
    const sections = [formSection, loadingSection, resultSection, chatSection];
    
    sections.forEach(section => {
      if (section === sectionToShow) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });
  }

  // Set up loading text updates
  function startLoadingAnimations() {
    let index = 0;
    loadingStatusText.textContent = loadingPhrases[0];
    
    loadingInterval = setInterval(() => {
      index = (index + 1) % loadingPhrases.length;
      loadingStatusText.style.opacity = 0;
      
      setTimeout(() => {
        loadingStatusText.textContent = loadingPhrases[index];
        loadingStatusText.style.opacity = 1;
      }, 400);

    }, 2500);
  }

  function stopLoadingAnimations() {
    if (loadingInterval) {
      clearInterval(loadingInterval);
      loadingInterval = null;
    }
  }

  // ==========================================================================
  // API Integration Hooks
  // ==========================================================================

  // Submit Reflection Form (POST /api/generate-futureme)
  reflectionForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Extract inputs
    const name = nameInput.value.trim();
    const age = ageInput.value.trim();
    const goal = goalInput.value.trim();
    const struggle = struggleInput.value.trim();
    const oneYearVision = visionInput.value.trim();
    
    // Extract selected tone radio
    const selectedToneRadio = document.querySelector('input[name="tone"]:checked');
    const tone = selectedToneRadio ? selectedToneRadio.value : 'Motivational';

    // 2. Validate
    if (!name || !age || !goal || !struggle || !oneYearVision) {
      showToast("Please fill in all details.", true);
      return;
    }

    userProfile = { name, age, goal, struggle, oneYearVision, tone };

    // 3. Enter loading state
    submitBtn.disabled = true;
    showSection(loadingSection);
    startLoadingAnimations();

    // 4. API Request
    try {
      const response = await fetch('/api/generate-futureme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userProfile)
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Failed connection");
      }

      // 5. Populate Result Data
      generatedData = resData.data;
      
      futureMessageEl.textContent = generatedData.message;
      futureIdentityEl.textContent = generatedData.futureIdentity;
      futureWarningEl.textContent = generatedData.warning;
      futureHabitEl.textContent = generatedData.habit;
      futureMantraEl.textContent = generatedData.mantra;
      
      toneBadge.textContent = tone;

      // Moves grid mapping
      if (generatedData.nextMoves && generatedData.nextMoves.length >= 3) {
        move1El.textContent = generatedData.nextMoves[0];
        move2El.textContent = generatedData.nextMoves[1];
        move3El.textContent = generatedData.nextMoves[2];
      } else {
        move1El.textContent = "Take immediate action on your core priorities.";
        move2El.textContent = "Eliminate the habits driving consistency struggles.";
        move3El.textContent = "Review your progress weekly and adjust execution.";
      }

      // 6. Transition state
      stopLoadingAnimations();
      showSection(resultSection);
      showToast("Connection established!");

    } catch (err) {
      console.error(err);
      stopLoadingAnimations();
      showSection(formSection);
      showToast(err.message || "FutureMe could not respond right now. Try again.", true);
    } finally {
      submitBtn.disabled = false;
    }
  });

  // Start Over Button Event
  resetBtn.addEventListener('click', () => {
    reflectionForm.reset();
    userProfile = null;
    chatHistory = [];
    generatedData = null;
    showSection(formSection);
  });

  // Copy Reflection Event
  copyBtn.addEventListener('click', () => {
    if (!generatedData || !userProfile) return;

    const copyText = `--- FUTUREME REFLECTION TRANSMISSION ---
Name: ${userProfile.name}
Tone: ${userProfile.tone}
Future Identity: ${generatedData.futureIdentity}

[MESSAGE FROM YOUR FUTURE SELF]
"${generatedData.message}"

[YOUR NEXT 3 MOVES]
1. ${generatedData.nextMoves[0] || 'Take Action'}
2. ${generatedData.nextMoves[1] || 'Stay Consistent'}
3. ${generatedData.nextMoves[2] || 'Evaluate and Pivot'}

[DAILY HABIT]
${generatedData.habit}

[FUTURE WARNING]
${generatedData.warning}

[DAILY MANTRA]
"${generatedData.mantra}"

Generated by FutureMe - Nitish's Founder Labs.`;

    navigator.clipboard.writeText(copyText)
      .then(() => {
        showToast("Reflection copied to clipboard!");
      })
      .catch(err => {
        console.error("Clipboard copy failed", err);
        showToast("Failed to copy automatically.", true);
      });
  });

  // ==========================================================================
  // Chat Interface Logic
  // ==========================================================================

  // Render chat bubble helper
  function appendChatMessage(role, messageText) {
    const bubble = document.createElement('div');
    bubble.classList.add('message-bubble', role.toLowerCase());

    const meta = document.createElement('span');
    meta.classList.add('message-meta');
    meta.textContent = role === 'user' ? 'You' : 'FutureMe';

    const text = document.createElement('div');
    text.classList.add('message-text');
    text.textContent = messageText;

    bubble.appendChild(meta);
    bubble.appendChild(text);

    chatMessagesContainer.appendChild(bubble);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  }

  // Trigger Conversation View Open
  chatTriggerBtn.addEventListener('click', () => {
    showSection(chatSection);
    
    // Initialize welcome bubble if chat is empty
    if (chatMessagesContainer.children.length === 0) {
      const welcomeMsg = `Hello ${userProfile.name}. I am here. We have successfully bridged the gap to the version of you who has executed, built, and achieved the one-year vision: "${userProfile.oneYearVision}". Ask me anything about our path, our choices, or how to defeat the struggle of "${userProfile.struggle}". I have already solved it.`;
      
      appendChatMessage('futureme', welcomeMsg);
    }
  });

  // Close Conversation Event (Back to results card)
  closeChatBtn.addEventListener('click', () => {
    showSection(resultSection);
  });

  // Submit Chat Message (POST /api/chat-futureme)
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const question = chatInput.value.trim();
    if (!question) return;

    // 1. Add user question to UI and state
    appendChatMessage('user', question);
    chatInput.value = '';
    
    // Store in history
    chatHistory.push({ role: 'user', message: question });

    // 2. Enable typing state UI
    chatTypingIndicator.classList.remove('hidden');
    chatSendBtn.disabled = true;
    chatInput.disabled = true;
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

    // 3. Request
    try {
      const response = await fetch('/api/chat-futureme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userProfile: userProfile,
          chatHistory: chatHistory.slice(0, -1), // History up to before this message
          question: question
        })
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || "Failed connection");
      }

      const reply = resData.reply;
      
      // 4. Add answer bubble to UI and state
      chatTypingIndicator.classList.add('hidden');
      appendChatMessage('futureme', reply);
      
      // Save history
      chatHistory.push({ role: 'futureme', message: reply });

    } catch (err) {
      console.error(err);
      chatTypingIndicator.classList.add('hidden');
      showToast("FutureMe could not respond right now. Try again.", true);
      
      // Remove failed user message from state history so it can be retried cleanly
      chatHistory.pop();
    } finally {
      chatSendBtn.disabled = false;
      chatInput.disabled = false;
      chatInput.focus();
    }
  });

});
