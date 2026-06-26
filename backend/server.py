import os
import json
import urllib.request
import urllib.error
import urllib.parse
from http.server import SimpleHTTPRequestHandler, HTTPServer
import mimetypes

# Load .env file manually to avoid external dependencies
def load_env():
    env_vars = {}
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    env_vars[k.strip()] = v.strip()
    return env_vars

ENV = load_env()
GEMINI_API_KEY = ENV.get('GEMINI_API_KEY', os.environ.get('GEMINI_API_KEY', ''))
PORT = int(ENV.get('PORT', 5000))

# Fallback models in order
MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest"]

def call_gemini_api(system_instruction, user_prompt, response_json=False):
    if not GEMINI_API_KEY:
        raise Exception("GEMINI_API_KEY is not defined. Please set it in your .env file.")
    
    # Try models one by one
    last_error = None
    for model_name in MODELS:
        try:
            print(f"Attempting content generation with Python and model: {model_name}")
            
            # API endpoint URL
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
            
            # Prepare payload
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": user_prompt}
                        ]
                    }
                ],
                "systemInstruction": {
                    "parts": [
                        {"text": system_instruction}
                    ]
                }
            }
            
            if response_json:
                payload["generationConfig"] = {
                    "responseMimeType": "application/json"
                }
                
            headers = {
                "Content-Type": "application/json"
            }
            
            req = urllib.request.Request(
                url, 
                data=json.dumps(payload).encode('utf-8'), 
                headers=headers,
                method='POST'
            )
            
            with urllib.request.urlopen(req, timeout=30) as response:
                resp_data = json.loads(response.read().decode('utf-8'))
                
                # Extract text
                candidates = resp_data.get('candidates', [])
                if not candidates:
                    raise Exception("No candidates returned from Gemini.")
                
                parts = candidates[0].get('content', {}).get('parts', [])
                if not parts:
                    raise Exception("No text parts returned from Gemini.")
                    
                text = parts[0].get('text', '')
                return text
                
        except Exception as e:
            print(f"Model {model_name} failed: {e}")
            last_error = e
            
    raise last_error or Exception("All Gemini models failed.")

def clean_and_parse_json(text):
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned
    if cleaned.endswith("```"):
        cleaned = cleaned.rsplit("```", 1)[0]
    cleaned = cleaned.strip()
    if cleaned.startswith("json"):
        cleaned = cleaned[4:].strip()
    return json.loads(cleaned)

class NextSelfHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Prevent caching
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        # Serve static files from the 'public' directory
        # If the path is not a file or directory, fallback to index.html (SPA routing)
        clean_path = self.path.split('?', 1)[0]
        
        # Calculate full path under public directory
        public_dir = os.path.join(os.path.dirname(__file__), 'public')
        
        if clean_path == '/' or clean_path == '':
            target_path = os.path.join(public_dir, 'index.html')
        else:
            # Strip leading slash
            rel_path = clean_path.lstrip('/')
            target_path = os.path.join(public_dir, rel_path)
            
        # If the file does not exist, serve index.html (single page application fallback)
        if not os.path.exists(target_path) or os.path.isdir(target_path):
            target_path = os.path.join(public_dir, 'index.html')
            
        # Read the file and serve it
        try:
            with open(target_path, 'rb') as f:
                content = f.read()
                
            self.send_response(200)
            mime_type, _ = mimetypes.guess_type(target_path)
            if mime_type:
                self.send_header('Content-Type', mime_type)
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_error(404, f"File not found: {e}")

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        # Enable CORS response headers
        def send_cors_headers():
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        
        if self.path == '/api/generate-NextSelf':
            try:
                body = json.loads(post_data)
                name = body.get('name')
                age = body.get('age')
                goal = body.get('goal')
                struggle = body.get('struggle')
                one_year_vision = body.get('oneYearVision')
                tone = body.get('tone')
                
                if not all([name, age, goal, struggle, one_year_vision, tone]):
                    self.send_response(400)
                    send_cors_headers()
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": False, "error": "All fields are required."}).encode('utf-8'))
                    return
                
                tone_desc = ""
                if tone == 'Motivational':
                    tone_desc = "warm, inspiring, supportive, encouraging, and highly empowering."
                elif tone == 'Brutally Honest':
                    tone_desc = "direct, sharp, uncompromising, realistic, and with absolutely no excuses."
                elif tone == 'Calm Mentor':
                    tone_desc = "peaceful, wise, grounded, patient, philosophical, and deeply reflecting."
                elif tone == 'CEO Mode':
                    tone_desc = "strategic, focused, high-execution, metric-oriented, and hyper-logical."
                else:
                    tone_desc = "balanced, wise, and personal."
                
                system_instruction = (
                    "You are NextSelf, the future successful version of the user. You are not a generic motivational coach. "
                    "You speak with emotional intelligence, clarity, and deep personal understanding. Your job is to help the user "
                    "see who they are becoming, what they must change, and what they should do next.\n\n"
                    "Write as if you are the user’s future self speaking directly to their current self.\n\n"
                    "Return only valid JSON in this exact format:\n"
                    "{\n"
                    "  \"message\": \"A powerful 120-180 word message from the future self.\",\n"
                    "  \"futureIdentity\": \"A concise description of who the user is becoming.\",\n"
                    "  \"nextMoves\": [\"Action 1\", \"Action 2\", \"Action 3\"],\n"
                    "  \"habit\": \"One small daily habit they should start today.\",\n"
                    "  \"warning\": \"One mistake their future self warns them about.\",\n"
                    "  \"mantra\": \"A short memorable line they can repeat daily.\"\n"
                    "}\n\n"
                    "Make it specific, deeply personalized to the user's struggle and goal. Avoid generic motivation. "
                    "Avoid clichés. Make it emotional but practical."
                )
                
                user_prompt = (
                    f"Tone selected by user: {tone} ({tone_desc})\n\n"
                    f"User details:\n"
                    f"Name: {name}\n"
                    f"Age: {age}\n"
                    f"Goal: {goal}\n"
                    f"Current struggle: {struggle}\n"
                    f"One-year vision: {one_year_vision}"
                )
                
                raw_text = call_gemini_api(system_instruction, user_prompt, response_json=True)
                parsed_data = clean_and_parse_json(raw_text)
                
                self.send_response(200)
                send_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "data": parsed_data}).encode('utf-8'))
                
            except Exception as e:
                print(f"Error in /api/generate-NextSelf: {e}")
                self.send_response(500)
                send_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))
                
        elif self.path == '/api/chat-NextSelf':
            try:
                body = json.loads(post_data)
                user_profile = body.get('userProfile')
                chat_history = body.get('chatHistory', [])
                question = body.get('question')
                
                if not user_profile or not question:
                    self.send_response(400)
                    send_cors_headers()
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": False, "error": "Missing user profile or follow-up question."}).encode('utf-8'))
                    return
                
                name = user_profile.get('name')
                age = user_profile.get('age')
                goal = user_profile.get('goal')
                struggle = user_profile.get('struggle')
                one_year_vision = user_profile.get('oneYearVision')
                tone = user_profile.get('tone')
                
                tone_desc = ""
                if tone == 'Motivational':
                    tone_desc = "warm, inspiring, supportive, encouraging, and highly empowering."
                elif tone == 'Brutally Honest':
                    tone_desc = "direct, sharp, uncompromising, realistic, and with absolutely no excuses."
                elif tone == 'Calm Mentor':
                    tone_desc = "peaceful, wise, grounded, patient, philosophical, and deeply reflecting."
                elif tone == 'CEO Mode':
                    tone_desc = "strategic, focused, high-execution, metric-oriented, and hyper-logical."
                else:
                    tone_desc = "balanced, wise, and personal."
                
                formatted_history = ""
                if chat_history:
                    formatted_history = "\n".join([f"{'You' if c.get('role') == 'user' else 'NextSelf'}: {c.get('message')}" for c in chat_history])
                else:
                    formatted_history = "(No previous conversation history)"
                
                system_instruction = (
                    "You are NextSelf, the future version of the user who already achieved their one-year vision. "
                    "Reply directly to the user’s question. Be personal, sharp, honest, and useful. Do not sound like a normal AI assistant. "
                    "Do not mention that you are Gemini or an AI model. Speak like the future self.\n\n"
                    "Reply in 2-5 short paragraphs. Give at least one clear, actionable advice. Speak directly to them as their future self."
                )
                
                user_prompt = (
                    f"User profile:\n"
                    f"Name: {name}\n"
                    f"Age: {age}\n"
                    f"Goal: {goal}\n"
                    f"Struggle: {struggle}\n"
                    f"One-year vision: {one_year_vision}\n"
                    f"Tone: {tone} ({tone_desc})\n\n"
                    f"Recent chat history:\n"
                    f"{formatted_history}\n\n"
                    f"Current question:\n"
                    f"{question}"
                )
                
                reply = call_gemini_api(system_instruction, user_prompt, response_json=False)
                
                self.send_response(200)
                send_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "reply": reply}).encode('utf-8'))
                
            except Exception as e:
                print(f"Error in /api/chat-NextSelf: {e}")
                self.send_response(500)
                send_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        # Handle preflight CORS requests
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def run():
    print(f"==================================================")
    print(f"FutureMe Python Backend Server running on Port {PORT}")
    print(f"Local Access: http://localhost:{PORT}")
    print(f"==================================================")
    server = HTTPServer(('0.0.0.0', PORT), NextSelfHandler)
    server.serve_forever()

if __name__ == '__main__':
    run()
