import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences
import pickle
import warnings

warnings.filterwarnings('ignore')

# Define the paths to your saved model and tokenizer files
model_path = "enron_spam_lstm_model_updated_Phishing-Email-Dataset/Nigerian_Fraud.h5"
tokenizer_path = "model/enron_spam_lstm_tokenizer.pkl"
MAX_LEN = 128  # Ensure this matches the MAX_LEN used during training

# Load the tokenizer
with open(tokenizer_path, 'rb') as handle:
    loaded_tokenizer = pickle.load(handle)

# Load the trained LSTM model
loaded_model = tf.keras.models.load_model(model_path)

def read_file_as_string(file_path):
    """Reads the entire content of a text file as a single string.

    Args:
        file_path (str): The path to the text file.

    Returns:
        str: The entire content of the file as a string, or None if an error occurs.
    """
    try:
        with open(file_path, 'r') as file:
            content = file.read()
            return content
    except FileNotFoundError:
        print(f"Error: File not found at path: {file_path}")
        return None
    except Exception as e:
        print(f"An error occurred: {e}")
        return None

def predict_spam(text):
    """
    Predicts whether the given text is spam or legitimate using the loaded LSTM model.

    Args:
        text (str): The input email text.

    Returns:
        str: "Spam" or "Legit" based on the model's prediction.
    """
    # Tokenize the input text
    sequence = loaded_tokenizer.texts_to_sequences([text])

    # Pad the sequence
    padded_sequence = pad_sequences(sequence, maxlen=MAX_LEN, padding='post', truncating='post')

    # Make the prediction
    prediction = loaded_model.predict(padded_sequence)[0]

    # Interpret the prediction
    if prediction > 0.5:
        return "Spam"
    else:
        return "Legit"

if __name__ == '__main__':
    # Example usage:
    email1 = "Free entry in 2 a wkly comp to win iPhone 11 Pro. Txt word FREE to 89990 today! Ts&Cs apply"
    email2 = "Hi John, Just following up on our meeting yesterday. Please find the attached document."
    email3 = "URGENT! You have won a $1000 gift card. Click here to claim now!"
    email4 = "Meeting reminder: Project discussion at 2 PM tomorrow."

    print(f"Email 1: '{email1}' - Prediction: {predict_spam(email1)}")
    print(f"Email 2: '{email2}' - Prediction: {predict_spam(email2)}")
    print(f"Email 3: '{email3}' - Prediction: {predict_spam(email3)}")
    print(f"Email 4: '{email4}' - Prediction: {predict_spam(email4)}")

    # You can also take user input:
    # user_input = input("Enter the email text to predict: ")
    file_path = 'example.txt'  # Replace with the actual path to your file
    file_content = read_file_as_string(file_path)
    if file_content:
        prediction_result = predict_spam(file_content)
        print(f"Prediction for the entered text: {prediction_result}")