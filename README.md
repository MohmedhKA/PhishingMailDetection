# Phishing Mail Detection Using LSTM Algorithm
This Repo focus on Phishing Mail Detection using Deep Learning Algorithm. This LSTM model is an type of Recurrent Neural Network (RNN) specifically designed to handle sequential data like text, speech, and time series.

Unlike traditional Machine Learning models (e.g., Random Forest, SVM), LSTMs have memory cells that help them learn long-term dependencies in data, making them highly effective for NLP tasks like spam detection, sentiment analysis, and speech recognition.
## Aproaches 
There are many ways to train a model example BERT which provide more precious than LSTM Algorithm but it takes much time to run which may not be an ideal for using in real time appications.

So, we started with LSTM training model and uses the [Enron Dataset](https://www.kaggle.com/datasets/wanderfj/enron-spam) since it have more than 30k datasets of Spam and Ham (legit).

it give the Accuracy rate of 99.1% and Lose rate of 4.5% which is Good start for us but it can't predict the Emails which comes under the category of Trageted and Advanced Phishing mails. which corner us to train the model with even more real-time datasets.

so, we started to fin tune the model by giving more dataset. well throwing more dataset on model is may not be good approch when it comes to accuracy but we still try to give it a shot.

we used the [Phishing Email Dataset](https://github.com/rokibulroni/Phishing-Email-Dataset) and we choose CEAS_08, NazrioEmails, SpamAssassin and Nigerian_Fruad (This is the order we trained the dataset to get higher accuracy). since this datasets has same features it was easy for to work on it and fin tunning the model

And after the fun tunnung session completes it works like magic with Accuracy rate of 99.87% and Loss rate 0.92% which is an great improvement. And not only that it can even detect trageted attachs and phishing attachs more accuractly than before, 

## Conclusion
we use literally 5 datasets (4 .csv files and one complete dataset with .txt) to get the result as much expected. You can see the accuracy the rate and etc.. on the [LSTMmodel.ipynb](https://github.com/MohmedhKA/PhishingMailDetection/blob/main/LSTMmodel.ipynb)
