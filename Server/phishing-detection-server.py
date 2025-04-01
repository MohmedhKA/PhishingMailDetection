import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences
import pickle
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Load tokenizer and model
MODEL_PATH = "D:/GTZAN/WorkingPhishing/100%/enron_spam_lstm_model_updated_Phishing-Email-Dataset/Nigerian_Fraud.h5"
TOKENIZER_PATH = "D:/GTZAN/WorkingPhishing/100%/model/enron_spam_lstm_tokenizer.pkl"
cert_path = "D:/GTZAN/WorkingPhishing/100%/server/cert.pem"
key_path = "D:/GTZAN/WorkingPhishing/100%/server/key.pem"
MAX_LEN = 128

try:
    with open(TOKENIZER_PATH, 'rb') as handle:
        loaded_tokenizer = pickle.load(handle)
    print("Tokenizer loaded successfully.")
except Exception as e:
    print(f"Error loading tokenizer: {e}")

try:
    loaded_model = tf.keras.models.load_model(MODEL_PATH)
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")

def predict_spam(sender, subject, body):
    """Predicts whether the given email details indicate phishing."""
    combined_text = f"From: {sender}\nSubject: {subject}\n\n{body}"
    sequence = loaded_tokenizer.texts_to_sequences([combined_text])
    padded_sequence = pad_sequences(sequence, maxlen=MAX_LEN, padding='post', truncating='post')
    prediction = loaded_model.predict(padded_sequence)[0]
    print(f"Prediction score: {prediction}")
    return "Phishing" if prediction > 0.5 else "Safe"

@app.route('/predict', methods=['POST'])
def predict():
    """API endpoint to predict if an email is phishing or safe."""
    try:
        data = request.get_json()
        if not all(k in data for k in ['sender', 'subject', 'body']):
            return jsonify({"error": "Missing sender, subject, or body"}), 400

        result = predict_spam(data['sender'], data['subject'], data['body'])
        return jsonify({"result": result})

    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({"error": "An error occurred during prediction"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True, ssl_context=(cert_path, key_path))

