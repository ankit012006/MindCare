# app.py
import os
import google.generativeai as genai
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit, join_room, leave_room
from dotenv import load_dotenv
import datetime

load_dotenv()

# --- App Initialization ---
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///mindcare.db'
app.config['SECRET_KEY'] = 'your_very_secret_key_change_this'
db = SQLAlchemy(app)
socketio = SocketIO(app)

# --- AI Model Configuration (Unchanged) ---
# ... (Your GOOGLE_API_KEY and AI Model setup is the same) ...
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY') 
try:
    genai.configure(api_key=GOOGLE_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash-latest')
    print("AI Model Loaded Successfully!")
except Exception as e:
    print(f"Error loading AI Model: {e}")
    model = None

SYSTEM_PROMPT = """
You are 'MindCare Assistant', a gentle, kind, and professional AI assistant for college students.
Your tone is always warm, validating, and supportive, but you must maintain a respectful and professional boundary.
Your primary goal is to make the user feel heard, safe, and supported.
**Your Core Principles:**
- **Maintain Professional Boundaries:** You are a supportive assistant, not a personal friend. **Crucially, do NOT use pet names or overly familiar terms of endearment like 'honey', 'dear', 'buddy', etc.** Address the user respectfully and maintain a professional yet caring tone.
- **Vary Your Language:** Actively avoid repeating the same empathetic phrases. Instead of always saying "That sounds tough," use varied expressions like "That sounds like a heavy weight to carry," "I can only imagine how difficult that must be," or "Thank you for sharing that; it takes strength."
- **Adapt Your Response Length:** For simple greetings, be brief. When a user shares a significant personal problem (like a breakup or failure), provide a more thoughtful and reassuring response (around 4-6 sentences). Show that you are giving their problem real thought.
- **Validate Feelings First:** Always start by acknowledging what the user is feeling. Use phrases like "That sounds incredibly painful," "I'm so sorry you're having to go through that," or "It makes sense you feel that way."
- **Offer Gentle Perspective & Coping Advice (Not Medical):** When a user asks "what should I do?", provide a supportive paragraph. Focus on self-compassion, taking things one step at a time, and allowing oneself to feel the emotions. Suggest healthy, non-medical coping mechanisms.
- **NEVER Give Medical Advice:** If a user asks about medication or diagnoses, your ONLY response must be: "I can't provide medical advice. It's really important to talk to a qualified doctor or healthcare professional about this. Your health is too important for a guess."
- **CRISIS RESPONSE:** If a user mentions suicide or self-harm, your ONLY response must be: "It sounds like you're in a lot of pain, and it's serious. Please reach out for help right now. You can call the KIRAN helpline 24/7 at 1800-599-0019. They can help you through this."
"""

# --- Database Models (UPDATED) ---
class Thread(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    author = db.Column(db.String(50), nullable=False, default='Anonymous')
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    message = db.Column(db.Text, nullable=False)
    # This creates a relationship to the new Reply model
    replies = db.relationship('Reply', backref='thread', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        # We can now count replies directly
        reply_count = len(self.replies)
        last_reply_time = max([r.timestamp for r in self.replies]) if self.replies else self.timestamp
        
        return {
            "id": self.id, "title": self.title, "category": self.category,
            "author": self.author, "timestamp": self.timestamp.strftime('%d %b, %I:%M %p'),
            "message": self.message, "reply_count": reply_count
        }

# NEW MODEL FOR REPLIES
class Reply(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    author = db.Column(db.String(50), nullable=False, default='Anonymous')
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    # This 'Foreign Key' links each reply to a specific thread
    thread_id = db.Column(db.Integer, db.ForeignKey('thread.id'), nullable=False)

    def to_dict(self):
        return {
            "id": self.id, "text": self.text, "author": self.author,
            "timestamp": self.timestamp.strftime('%d %b, %I:%M %p')
        }

# --- Standard Routes (Unchanged) ---
@app.route('/')
def index():
    return render_template('index.html')

# Chatbot route is unchanged
@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message', '')
    # ... (rest of chatbot logic is unchanged)
    if not user_message:
        return jsonify({'error': 'Empty message received.'}), 400
    try:
        full_prompt = f"{SYSTEM_PROMPT}\n\nUser: \"{user_message}\"\nAssistant:"
        response = model.generate_content(full_prompt)
        bot_response = response.text
    except Exception as e:
        print(f"Error during AI generation: {e}")
        bot_response = "Sorry, I'm having a little trouble connecting right now."
    return jsonify({'response': bot_response})

# --- API Routes for the Forum (UPDATED) ---
@app.route('/api/threads', methods=['GET'])
def get_threads():
    threads = Thread.query.order_by(Thread.timestamp.desc()).all()
    return jsonify([thread.to_dict() for thread in threads])

# NEW ROUTE TO GET A SINGLE THREAD AND ITS REPLIES
@app.route('/api/thread/<int:thread_id>', methods=['GET'])
def get_thread_details(thread_id):
    thread = Thread.query.get_or_404(thread_id)
    thread_data = thread.to_dict()
    replies_data = [reply.to_dict() for reply in thread.replies]
    return jsonify({"thread": thread_data, "replies": replies_data})

# --- SocketIO Event Handlers for Real-Time Forum (UPDATED) ---
@socketio.on('new_thread')
def handle_new_thread(data):
    try:
        new_thread = Thread(title=data['title'], category=data['category'], message=data['message'])
        db.session.add(new_thread)
        db.session.commit()
        emit('thread_created', new_thread.to_dict(), broadcast=True)
    except Exception as e:
        print(f"Error creating thread: {e}")

# NEW HANDLER FOR REPLIES
@socketio.on('new_reply')
def handle_new_reply(data):
    try:
        thread_id = data['thread_id']
        new_reply = Reply(text=data['text'], thread_id=thread_id)
        db.session.add(new_reply)
        db.session.commit()
        # Emit the new reply only to clients in the specific thread's "room"
        emit('reply_created', new_reply.to_dict(), room=f'thread_{thread_id}')
    except Exception as e:
        print(f"Error creating reply: {e}")

# NEW HANDLERS FOR JOINING/LEAVING ROOMS
@socketio.on('join_room')
def on_join(data):
    room = data['room']
    join_room(room)
    print(f'Client joined room: {room}')

@socketio.on('leave_room')
def on_leave(data):
    room = data['room']
    leave_room(room)
    print(f'Client left room: {room}')

# --- Main Execution ---
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    socketio.run(app, debug=True)