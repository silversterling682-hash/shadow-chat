from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

DB_FILE = "database.json"

def init_db():
    if not os.path.exists(DB_FILE):
        data = {"users": [], "messages": []}
        with open(DB_FILE, "w") as f:
            json.dump(data, f)

def load_db():
    with open(DB_FILE, "r") as f:
        return json.load(f)

def save_db(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=4)

@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    db = load_db()
    if any(u['username'] == data['username'] for u in db['users']):
        return jsonify({"status":"error","msg":"User exists"})
    new_user = {"id":"USR-"+str(len(db['users'])+1), **data}
    db['users'].append(new_user)
    save_db(db)
    return jsonify({"status":"success","user":new_user})

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    db = load_db()
    for u in db['users']:
        if u['username'] == data['username'] and u['password'] == data['password']:
            return jsonify({"status":"success","user":u})
    return jsonify({"status":"error","msg":"Wrong details"})

@app.route('/send', methods=['POST'])
def send():
    data = request.json
    db = load_db()
    msg = {
        "from": data['from'],
        "text": data['text'],
        "time": datetime.now().strftime("%H:%M"),
        "timer": data.get('timer', 0)
    }
    db['messages'].append(msg)
    save_db(db)
    return jsonify({"status":"success"})

@app.route('/messages', methods=['GET'])
def get_msgs():
    return jsonify(load_db()['messages'])

if __name__ == "__main__":
    init_db()
    print("""
██╗███╗   ██╗██╗███████╗██╗   ██╗
██║████╗  ██║██║██╔════╝██║   ██║
██║██╔██╗ ██║██║█████╗  ██║   ██║
██║██║╚██╗██║██║██╔══╝  ██║   ██║
██║██║ ╚████║██║███████╗╚██████╔╝
╚═╝╚═╝  ╚═══╝╚═╝══════╝ ╚═════╝ 
       WHATSAPP STYLE COMPLETE
    """)
    app.run(host='0.0.0.0', port=5000, debug=False)
    