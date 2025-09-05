import os
import google.generativeai as genai
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit, join_room, leave_room
from dotenv import load_dotenv
import datetime
import smtplib
import ssl
from email.message import EmailMessage

load_dotenv()

# --- App Initialization ---
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///mindcare.db'
app.config['SECRET_KEY'] = 'your_very_secret_key_change_this'
db = SQLAlchemy(app)
socketio = SocketIO(app)

# --- AI Model Configuration (Unchanged) ---
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY') 
try:
    genai.configure(api_key=GOOGLE_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash-latest')
    print("AI Model Loaded Successfully!")
except Exception as e:
    print(f"Error loading AI Model: {e}")
    model = None

SYSTEM_PROMPT = """
You are 'MindCare Assistant', a gentle, kind, and professional AI assistant for college students. Your tone is always warm, validating, and supportive, but you must maintain a respectful and professional boundary.
(Instructions from previous version are unchanged)
"""

# --- Counselor Data ---
COUNSELORS = {
    1: "Dr. Priya Sharma",
    2: "Dr. Rajesh Kumar",
    3: "Dr. Meera Patel"
}

# --- Database Models (Unchanged) ---
class Thread(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    author = db.Column(db.String(50), nullable=False, default='Anonymous')
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    message = db.Column(db.Text, nullable=False)
    replies = db.relationship('Reply', backref='thread', lazy=True, cascade="all, delete-orphan")
    def to_dict(self): return { "id": self.id, "title": self.title, "category": self.category, "author": self.author, "timestamp": self.timestamp.strftime('%d %b, %I:%M %p'), "message": self.message, "reply_count": len(self.replies) }

class Reply(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    author = db.Column(db.String(50), nullable=False, default='Anonymous')
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    thread_id = db.Column(db.Integer, db.ForeignKey('thread.id'), nullable=False)
    def to_dict(self): return { "id": self.id, "text": self.text, "author": self.author, "timestamp": self.timestamp.strftime('%d %b, %I:%M %p'), "thread_id": self.thread_id }

class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    counselor_id = db.Column(db.Integer, nullable=False)
    date = db.Column(db.String(20), nullable=False)
    time = db.Column(db.String(10), nullable=False)
    user_name = db.Column(db.String(100), nullable=False)
    user_email = db.Column(db.String(100), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    def to_dict(self): return { "id": self.id, "counselor_name": COUNSELORS.get(self.counselor_id, "Unknown"), "date": self.date, "time": self.time, "user_name": self.user_name, "user_email": self.user_email, "booked_on": self.timestamp.strftime('%d %b %Y') }

# --- NEW EMAIL FUNCTION ---
def send_confirmation_email(booking):
    mail_username = os.environ.get('MAIL_USERNAME')
    mail_password = os.environ.get('MAIL_PASSWORD')
    
    if not mail_username or not mail_password:
        print("Email credentials not found. Skipping email.")
        return

    # Create the email content
    subject = "Your MindCare Appointment is Confirmed!"
    body = f"""
Hi {booking.user_name},

This is a confirmation that your appointment has been successfully scheduled.

Here are the details:
Counselor: {COUNSELORS.get(booking.counselor_id, "N/A")}
Date: {booking.date}
Time: {booking.time}

Please be on time for your session. If you need to cancel or reschedule, please contact student support.

Take care,
The MindCare Team
"""
    
    em = EmailMessage()
    em['From'] = mail_username
    em['To'] = booking.user_email
    em['Subject'] = subject
    em.set_content(body)

    context = ssl.create_default_context()

    try:
        print(f"Attempting to send email to {booking.user_email}...")
        with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context) as smtp:
            smtp.login(mail_username, mail_password)
            smtp.sendmail(mail_username, booking.user_email, em.as_string())
        print("Email sent successfully!")
    except Exception as e:
        print(f"!!! Could not send email. Error: {e}")

# --- Standard Routes (Unchanged) ---
@app.route('/')
def index():
    return render_template('index.html')

# --- Chatbot Route (Unchanged) ---
@app.route('/chat', methods=['POST'])
def chat():
    # ... (chatbot logic is unchanged)
    user_message = request.json.get('message', '')
    if not user_message: return jsonify({'error': 'Empty message received.'}), 400
    try:
        full_prompt = f"{SYSTEM_PROMPT}\n\nUser: \"{user_message}\"\nAssistant:"
        response = model.generate_content(full_prompt)
        bot_response = response.text
    except Exception as e:
        print(f"Error during AI generation: {e}")
        bot_response = "Sorry, I'm having a little trouble connecting right now."
    return jsonify({'response': bot_response})


# --- API Routes for Forum and Booking (UPDATED) ---
@app.route('/api/book', methods=['POST'])
def create_booking():
    data = request.json
    try:
        new_booking = Booking(
            counselor_id=data['counselor_id'],
            date=data['date'],
            time=data['time'],
            user_name=data['user_name'],
            user_email=data['user_email']
        )
        db.session.add(new_booking)
        db.session.commit()
        
        # --- SEND THE EMAIL AFTER SAVING ---
        send_confirmation_email(new_booking)

        return jsonify({"success": True, "message": "Booking confirmed!"}), 201
    except Exception as e:
        print(f"Error creating booking: {e}")
        return jsonify({"success": False, "message": "Could not create booking."}), 500

# ... (All other API and SocketIO routes are unchanged) ...
@app.route('/api/threads', methods=['GET'])
def get_threads():
    threads = Thread.query.order_by(Thread.timestamp.desc()).all()
    return jsonify([thread.to_dict() for thread in threads])

@app.route('/api/thread/<int:thread_id>', methods=['GET'])
def get_thread_details(thread_id):
    thread = Thread.query.get_or_404(thread_id)
    replies = Reply.query.filter_by(thread_id=thread.id).order_by(Reply.timestamp.asc()).all()
    return jsonify({"thread": thread.to_dict(), "replies": [r.to_dict() for r in replies]})

@app.route('/api/availability/<int:counselor_id>/<string:date>', methods=['GET'])
def get_availability(counselor_id, date):
    booked_slots = Booking.query.filter_by(counselor_id=counselor_id, date=date).all()
    booked_times = [booking.time for booking in booked_slots]
    return jsonify(booked_times)

@app.route('/api/bookings', methods=['GET'])
def get_all_bookings():
    bookings = Booking.query.order_by(Booking.date.asc(), Booking.time.asc()).all()
    return jsonify([booking.to_dict() for booking in bookings])
    
@socketio.on('new_thread')
def handle_new_thread(data):
    try:
        new_thread = Thread(title=data['title'], category=data['category'], message=data['message'])
        db.session.add(new_thread)
        db.session.commit()
        emit('thread_created', new_thread.to_dict(), broadcast=True)
    except Exception as e: print(f"Error creating thread: {e}")

@socketio.on('new_reply')
def handle_new_reply(data):
    try:
        new_reply = Reply(text=data['text'], thread_id=data['thread_id'])
        db.session.add(new_reply)
        db.session.commit()
        emit('reply_created', new_reply.to_dict(), room=f"thread_{data['thread_id']}")
    except Exception as e: print(f"Error creating reply: {e}")

@socketio.on('join_room')
def on_join(data):
    join_room(data['room'])

@socketio.on('leave_room')
def on_leave(data):
    leave_room(data['room'])

# --- Main Execution ---
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    socketio.run(app, debug=True)

