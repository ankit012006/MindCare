import os
import google.generativeai as genai
from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_login import LoginManager, UserMixin, login_user, logout_user, current_user, login_required
from authlib.integrations.flask_client import OAuth
from dotenv import load_dotenv
import datetime
import smtplib
import ssl
from email.message import EmailMessage

load_dotenv()

# --- App Initialization ---
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///mindcare.db'
app.config['SECRET_KEY'] = 'your_very_secret_key_change_this_for_production'
db = SQLAlchemy(app)
socketio = SocketIO(app)

# --- Login Manager Setup ---
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# --- OAuth Setup for Google ---
oauth = OAuth(app)
google = oauth.register(
    name='google',
    client_id=os.environ.get("GOOGLE_CLIENT_ID"),
    client_secret=os.environ.get("GOOGLE_CLIENT_SECRET"),
    access_token_url='https://accounts.google.com/o/oauth2/token',
    access_token_params=None,
    authorize_url='https://accounts.google.com/o/oauth2/auth',
    authorize_params=None,
    api_base_url='https://www.googleapis.com/oauth2/v1/',
    userinfo_endpoint='https://openidconnect.googleapis.com/v1/userinfo',
    client_kwargs={'scope': 'openid email profile'},
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration'
)

# --- AI Model Configuration ---
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY') 
try:
    genai.configure(api_key=GOOGLE_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash-latest')
    print("AI Model Loaded Successfully!")
except Exception as e:
    print(f"Error loading AI Model: {e}")
    model = None

# --- UPDATED & OPTIMIZED SYSTEM PROMPT ---
SYSTEM_PROMPT = """
You are MindCare Assistant, a professional AI for college students.
ROLE: Be a supportive, warm, and empathetic listener.
RULES:
1.  **Language:** ALWAYS detect and respond in the user's language.
2.  **Tone:** Be gentle and professional. NEVER use pet names (honey, dear). Vary your empathetic phrases.
3.  **Length:** Be brief for simple queries. For serious problems (breakups, grief), give a more thoughtful, 4-6 sentence response.
4.  **Safety (CRITICAL):**
    - If asked for medical advice, reply ONLY: "I can't provide medical advice. It's really important to talk to a qualified doctor or healthcare professional about this."
    - For crisis/self-harm, reply ONLY: "It sounds like you're in a lot of pain, and it's serious. Please reach out for help right now. You can call the KIRAN helpline 24/7 at 1800-599-0019. They can help you through this."
"""

# --- Counselor Data ---
COUNSELORS = {
    1: "Dr. Priya Sharma",
    2: "Dr. Rajesh Kumar",
    3: "Dr. Meera Patel"
}

# --- Database Models ---
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    google_id = db.Column(db.String(30), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    profile_pic = db.Column(db.String(200))
    screening_results = db.relationship('ScreeningResult', backref='user', lazy=True)

class Thread(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    author = db.Column(db.String(100), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    message = db.Column(db.Text, nullable=False)
    replies = db.relationship('Reply', backref='thread', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return { "id": self.id, "title": self.title, "category": self.category, "author": self.author, "timestamp": self.timestamp.strftime('%d %b, %I:%M %p'), "message": self.message, "reply_count": len(self.replies) }

class Reply(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    author = db.Column(db.String(100), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    thread_id = db.Column(db.Integer, db.ForeignKey('thread.id'), nullable=False)

    def to_dict(self):
        return { "id": self.id, "text": self.text, "author": self.author, "timestamp": self.timestamp.strftime('%d %b, %I:%M %p'), "thread_id": self.thread_id }

class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    counselor_id = db.Column(db.Integer, nullable=False)
    date = db.Column(db.String(20), nullable=False)
    time = db.Column(db.String(10), nullable=False)
    user_name = db.Column(db.String(100), nullable=False)
    user_email = db.Column(db.String(100), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return { "id": self.id, "counselor_name": COUNSELORS.get(self.counselor_id, "Unknown"), "date": self.date, "time": self.time, "user_name": self.user_name, "user_email": self.user_email, "booked_on": self.timestamp.strftime('%d %b %Y') }

class ScreeningResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    test_type = db.Column(db.String(10), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return { "id": self.id, "user_id": self.user_id, "test_type": self.test_type, "score": self.score, "timestamp": self.timestamp.strftime('%d %b %Y') }

# --- Login Manager User Loader ---
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- Email Function ---
def send_confirmation_email(booking):
    mail_username = os.environ.get('MAIL_USERNAME')
    mail_password = os.environ.get('MAIL_PASSWORD')
    if not mail_username or not mail_password:
        print("Email credentials not found. Skipping email.")
        return
    subject = "Your MindCare Appointment is Confirmed!"
    body = f"""Hi {booking.user_name},\n\nThis is a confirmation that your appointment has been successfully scheduled.\n\nDetails:\nCounselor: {COUNSELORS.get(booking.counselor_id, "N/A")}\nDate: {booking.date}\nTime: {booking.time}\n\nTake care,\nThe MindCare Team"""
    em = EmailMessage()
    em['From'] = mail_username
    em['To'] = booking.user_email
    em['Subject'] = subject
    em.set_content(body)
    context = ssl.create_default_context()
    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context) as smtp:
            smtp.login(mail_username, mail_password)
            smtp.send_message(em)
        print(f"Confirmation email sent to {booking.user_email}")
    except Exception as e:
        print(f"Could not send email. Error: {e}")

# --- Routes ---
@app.route('/')
def index():
    return render_template('index.html')

# --- AUTHENTICATION ROUTES ---
@app.route('/login')
def login():
    redirect_uri = url_for('authorize', _external=True)
    return google.authorize_redirect(redirect_uri)

@app.route('/google/callback')
def authorize():
    token = google.authorize_access_token()
    user_info = google.parse_id_token(token)
    user = User.query.filter_by(google_id=user_info['sub']).first()
    if not user:
        user = User(google_id=user_info['sub'], name=user_info['name'], email=user_info['email'], profile_pic=user_info['picture'])
        db.session.add(user)
        db.session.commit()
    login_user(user)
    return redirect(url_for('index'))

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

# --- API Routes ---
@app.route('/api/me')
def get_current_user():
    if current_user.is_authenticated:
        return jsonify({"is_logged_in": True, "user": {"name": current_user.name, "email": current_user.email, "profile_pic": current_user.profile_pic}})
    return jsonify({"is_logged_in": False})

@app.route('/chat', methods=['POST'])
def chat():
    if not model:
        return jsonify({'error': 'AI model is not available.'}), 500
    user_message = request.json.get('message', '')
    if not user_message:
        return jsonify({'error': 'Empty message received.'}), 400
    try:
        full_prompt = f"{SYSTEM_PROMPT}\n\nUser: \"{user_message}\"\nAssistant:"
        response = model.generate_content(full_prompt)
        bot_response = response.text
    except Exception as e:
        print(f"Error during AI generation: {e}")
        bot_response = "Sorry, I encountered an error. Please try again later."
    return jsonify({'response': bot_response})

@app.route('/api/screening', methods=['POST'])
@login_required
def save_screening():
    data = request.json
    try:
        new_result = ScreeningResult(user_id=current_user.id, test_type=data['test_type'], score=data['score'])
        db.session.add(new_result)
        db.session.commit()
        return jsonify({"success": True}), 201
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/students', methods=['GET'])
@login_required
def get_students():
    users_with_screenings = User.query.join(User.screening_results).distinct().all()
    return jsonify([{"id": user.id, "name": user.name} for user in users_with_screenings])

@app.route('/api/student-analytics/<int:user_id>', methods=['GET'])
@login_required
def get_student_analytics(user_id):
    results = ScreeningResult.query.filter_by(user_id=user_id).order_by(ScreeningResult.timestamp.asc()).all()
    return jsonify([result.to_dict() for result in results])

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
    return jsonify([booking.time for booking in booked_slots])

@app.route('/api/book', methods=['POST'])
@login_required
def create_booking():
    data = request.json
    try:
        new_booking = Booking(counselor_id=data['counselor_id'], date=data['date'], time=data['time'], user_name=current_user.name, user_email=current_user.email)
        db.session.add(new_booking)
        db.session.commit()
        send_confirmation_email(new_booking)
        return jsonify({"success": True, "message": "Booking confirmed!"}), 201
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/bookings', methods=['GET'])
@login_required
def get_all_bookings():
    bookings = Booking.query.order_by(Booking.date.asc(), Booking.time.asc()).all()
    return jsonify([booking.to_dict() for booking in bookings])

# --- SocketIO Event Handlers ---
@socketio.on('new_thread')
@login_required
def handle_new_thread(data):
    try:
        new_thread = Thread(title=data['title'], category=data['category'], message=data['message'], author=current_user.name)
        db.session.add(new_thread)
        db.session.commit()
        emit('thread_created', new_thread.to_dict(), broadcast=True)
    except Exception as e: print(f"Error creating thread: {e}")

@socketio.on('new_reply')
@login_required
def handle_new_reply(data):
    try:
        new_reply = Reply(text=data['text'], thread_id=data['thread_id'], author=current_user.name)
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

