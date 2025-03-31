import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences
import pickle
import json
from flask import Flask, request, jsonify

app = Flask(__name__)

# Define the paths to your saved model and tokenizer files
model_path = "D:/GTZAN/WorkingPhishing/100%/enron_spam_lstm_model_updated_Phishing-Email-Dataset/Nigerian_Fraud.h5"
tokenizer_path = "D:/GTZAN/WorkingPhishing/100%/model/enron_spam_lstm_tokenizer.pkl"
MAX_LEN = 128  # Ensure this matches the MAX_LEN used during training

# Load the tokenizer
try:
    with open(tokenizer_path, 'rb') as handle:
        loaded_tokenizer = pickle.load(handle)
    print("Tokenizer loaded successfully.")
except Exception as e:
    print(f"Error loading tokenizer: {e}")

# Load the trained LSTM model
try:
    loaded_model = tf.keras.models.load_model(model_path)
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")

def predict_spam(text):
    """
    Predicts whether the given text is spam or legitimate using the loaded LSTM model.

    Args:
        text (str): The input email text.

    Returns:
        str: "Phishing" or "Safe" based on the model's prediction.
    """
    # Tokenize the input text
    sequence = loaded_tokenizer.texts_to_sequences([text])

    # Pad the sequence
    padded_sequence = pad_sequences(sequence, maxlen=MAX_LEN, padding='post', truncating='post')

    # Make the prediction
    prediction = loaded_model.predict(padded_sequence)[0]

    # Interpret the prediction
    print(f"Prediction score: {prediction}")

    if prediction > 0.5:
        return "Phishing"
    else:
        return "Safe"

@app.route('/predict', methods=['POST'])
def predict():
    """
    Endpoint to predict if an email is phishing or safe.
    Expects JSON data with subject, body, and sender.
    """
    try:
        # Get data from request
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Extract fields
        subject = data.get('subject', '')
        body = data.get('body', '')
        sender = data.get('sender', '')
        
        # Combine fields for prediction
        # You might want to adjust this based on how your model was trained
        combined_text = f"From: {sender}\nSubject: {subject}\n\n{body}"
        
        # Make prediction
        result = predict_spam(combined_text)
        
        # Return result
        return jsonify({"result": result})
    
    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({"error": "An error occurred during prediction"}), 500

if __name__ == '__main__':
    # Run the Flask app
    # Set debug=False for production use
    app.run(host='0.0.0.0', port=5000, debug=True)
