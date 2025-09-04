# app.py
import os
import google.generativeai as genai
from flask import Flask, render_template, request, jsonify

# --- Configuration ---
# 1. Get your API key from Google AI Studio.
# 2. Paste your key here.
# IMPORTANT: If you share this code online, REMOVE YOUR KEY FIRST!
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')

# --- Flask App Initialization ---
app = Flask(__name__)

# --- AI Model Configuration ---
try:
    genai.configure(api_key=GOOGLE_API_KEY)
    # NEW CODE
    model = genai.GenerativeModel('gemini-1.5-flash-latest')
    print("AI Model Loaded Successfully!")
except Exception as e:
    print(f"Error loading AI Model: {e}")
    model = None

# This is the "secret sauce"! We give the AI a persona and instructions.
# This keeps its responses focused and appropriate for your app.
SYSTEM_PROMPT = """
You are 'MindCare Assistant', a compassionate and supportive AI mental wellness chatbot for college students. Your purpose is to provide a safe, non-judgmental space for students to express their feelings.

Your primary functions are:
1.  **Listen Empathetically:** Acknowledge the user's feelings and validate their experiences. Use phrases like "That sounds really tough," or "It makes sense that you're feeling that way."
2.  **Provide Initial Coping Strategies:** Offer simple, actionable, evidence-based techniques (like deep breathing, grounding, or a simple CBT reframing exercise).
3.  **Suggest Resources:** Gently guide users towards the app's Resource Hub for more detailed information.
4.  **Encourage Professional Help:** For serious issues, gently suggest booking an appointment with a professional counsellor through the app.
5.  **Maintain a Warm and encouraging Tone:** Use simple, accessible language. Be positive and hopeful.
6.  **Do NOT give medical advice or a diagnosis.** You are a first-aid assistant, not a doctor. Always include a disclaimer to consult a professional for serious concerns.
7.  **Detect Crisis Language:** If a user mentions suicide, self-harm, or indicates they are in immediate danger, your response MUST prioritize their safety. Your response should be: "I'm very concerned about what you've shared. Your safety is the most important thing right now. Please reach out immediately to one of these 24/7 helplines in India: Emergency Services: 112 or the KIRAN Mental Health Helpline: 1800-599-0019. There are people who want to help you right now."
"""

# This route will serve your main HTML file
@app.route('/')
def index():
    return render_template('index.html')

# This route will handle the chat messages
@app.route('/chat', methods=['POST'])
def chat():
    if not model:
        return jsonify({'error': 'AI model is not available.'}), 500

    user_message = request.json.get('message', '')
    if not user_message:
        return jsonify({'error': 'Empty message received.'}), 400

    try:
        # Combine the system prompt with the user's message for context
        full_prompt = f"{SYSTEM_PROMPT}\n\nStudent says: \"{user_message}\""
        
        response = model.generate_content(full_prompt)
        
        bot_response = response.text

    except Exception as e:
        print(f"Error during AI generation: {e}")
        bot_response = "Sorry, I encountered an error. Please try again later."

    return jsonify({'response': bot_response})

if __name__ == '__main__':
    # This makes the app run
    app.run(debug=True)