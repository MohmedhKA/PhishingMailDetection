import requests
import json
from googleapiclient.discovery import build
import base64

# Replace with your actual API key
API_KEY = 'AIzaSyAJZA24DRlLw0Fp1Jr_dtIkpBYX8vGDPik'
SERVER_URL = 'https://localhost:5000/predict'  # Replace with your server URL

def get_email_content(message_id):
    """
    Retrieves the content of a Gmail message given its ID using an API key.
    """
    try:
        service = build('gmail', 'v1', developerKey=API_KEY)
        msg = service.users().messages().get(userId='me', id=message_id, format='full').execute()

        # Extract parts of the message
        payload = msg.get('payload')
        headers = payload.get('headers')
        body_parts = payload.get('parts')

        subject = next((h['value'] for h in headers if h['name'] == 'Subject'), None)
        sender = next((h['value'] for h in headers if h['name'] == 'From'), None)

        email_body = ""
        if body_parts:
            for part in body_parts:
                if part['mimeType'] == 'text/plain':
                    data = part['body'].get('data')
                    if data:
                        email_body += base64.urlsafe_b64decode(data).decode()
                elif part['mimeType'] == 'text/html':
                    data = part['body'].get('data')
                    if data:
                        email_body += base64.urlsafe_b64decode(data).decode()
        else:
            data = payload['body'].get('data')
            if data:
                email_body = base64.urlsafe_b64decode(data).decode()

        return {
            'subject': subject,
            'sender': sender,
            'body': email_body
        }

    except Exception as error:
        print(f'An error occurred: {error}')
        return None

def send_to_prediction_server(email_data):
    """
    Sends the extracted email data to your prediction server.
    """
    try:
        response = requests.post(SERVER_URL, json=email_data)
        response.raise_for_status()  # Raise an exception for bad status codes
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error sending data to prediction server: {e}")
        return None

if __name__ == '__main__':
    message_id = 'FMfcgzQZTqCVHmRzLdbpjzRSNHwmDxvW'  # Replace with the actual message ID
    email_data = get_email_content(message_id)

    if email_data:
        print("Email data retrieved from Gmail API:")
        print(f"Subject: {email_data['subject']}")
        print(f"From: {email_data['sender']}")
        print(f"Body: {email_data['body']}")

        prediction_result = send_to_prediction_server(email_data)

        if prediction_result:
            print("Prediction from server:", prediction_result)
        else:
            print("Failed to get prediction from server.")
    else:
        print("Could not retrieve email content.")