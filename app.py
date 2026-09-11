import cohere
from flask import Flask, render_template, request, jsonify, session
import os

API_KEY = "YOUR_COHERE_API_KEY"  # Replace with your actual Cohere API key
co = cohere.ClientV2(API_KEY)

app = Flask(__name__)
app.secret_key = os.urandom(24)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/chat')
def chat_page():
    return render_template('chat.html')

@app.route('/ask', methods=['POST'])
def ask():
    try:
        user_query = request.json.get("message")
        history = request.json.get("history", [])

        MODEL_NAME = "command-a-03-2025"

        # --- EXTRACT USER AND ASSISTANT MESSAGES ONLY (LAST 10) ---
        cohere_history = []
        # Get the last 10 messages from the history list (user + assistant)
        for msg in history[-10:]:
            role = "assistant" if msg["role"] == "assistant" else "user"
            if msg["content"].strip():  # Skip empty messages
                cohere_history.append({"role": role, "content": msg["content"]})

        # --- SYSTEM PROMPT (CONCISE AND CLEAR) ---
        system_prompt = (
            "You are Glydn AI. You are a companion, not just an assistant. "
            "Do not tell the user what to think; open up space for them to think. "
            "No directing, no judging, no pressuring. Offer options, then step back. "
            "Your goal is to provide accurate answers while encouraging the user to think critically. "
            "Speak in a clean, friendly, and natural tone. Respond in whichever language the user is speaking. "
            "Do not stifle or look down on the user. Try to understand them and build empathy. "
            "Help expand their horizons instead of narrowing their vision. Do not judge or belittle the user."
        )

        messages = [
            {"role": "system", "content": system_prompt}
        ] + cohere_history + [
            {"role": "user", "content": user_query}
        ]

        # --- API REQUEST ---
        response = co.chat(
            model=MODEL_NAME,
            messages=messages,
            max_tokens=512,
            temperature=0.7
        )

        ai_response = response.message.content[0].text

        return jsonify({"response": ai_response})

    except Exception as e:
        print(f"API Error: {e}")
        # Capture Cohere error details if available
        if hasattr(e, 'response'):
            print(e.response.text)
        return jsonify({"response": f"An error occurred: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
