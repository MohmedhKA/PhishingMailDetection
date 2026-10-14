# Phishing Mail Detection Using LSTM

A research and prototype project that uses a deep-learning text classifier to flag email content as **phishing/spam** or **safe/legitimate**. The repository combines model training and evaluation in a Jupyter notebook with a Python prediction script, a Flask prediction API, and a Chrome extension intended to scan messages viewed in Gmail.

> **Scope:** This is an educational prototype, not a production-grade email security product. Its reported scores come from particular dataset splits and should not be interpreted as a guarantee that it will detect every real-world phishing email.

## How the project works

```text
Gmail message
    ↓
Chrome extension extracts sender, subject, and body
    ↓  POST /predict (JSON over HTTPS)
Flask API (Server/phishing-detection-server.py)
    ↓
Saved Keras tokenizer → integer tokens → 128-token padded sequence
    ↓
Saved LSTM classifier → phishing probability
    ↓
Threshold > 0.5: "Phishing"; otherwise: "Safe"
    ↓
Extension displays the result
```

There are two ways to use the model:

1. **Notebook/training workflow:** `LSTMmodel.ipynb` loads email datasets, prepares sequences, trains the model, evaluates validation splits, and saves model/tokenizer files.
2. **Prediction workflow:** `prediction.py` classifies the text in a sample file. The Flask API offers a `/predict` endpoint that accepts a sender, subject, and body; the browser extension is intended to call this endpoint from Gmail.

## Model architecture

The notebook builds a binary text classifier using TensorFlow/Keras:

| Layer | Configuration | Purpose |
|---|---|---|
| Tokenizer | Vocabulary limit: 10,000 words; out-of-vocabulary token enabled | Converts words to integer IDs |
| Padding | Maximum sequence length: 128; post-padding and post-truncation | Makes input sequences a consistent size |
| Embedding | 10,000 × 100 | Learns a 100-dimensional representation for each token |
| LSTM 1 | 64 units; returns sequences | Learns patterns across the token sequence |
| LSTM 2 | 64 units | Summarizes the sequence into a fixed-size representation |
| Dropout | 0.5 | Regularization during training |
| Dense output | 1 unit, sigmoid activation | Outputs a value between 0 and 1 |

The model is compiled with the Adam optimizer and binary cross-entropy loss. The notebook uses a batch size of 32 for its main training run.

The Enron labels are mapped as `ham = 0` and `spam = 1`. The `Phishing_Email.csv` dataset maps `Safe Email = 0` and `Phishing Email = 1`. The later CSV fine-tuning blocks expect a numeric `label` column where `0` means safe/legitimate and `1` means phishing/fraud.

## Datasets and training workflow

The notebook expects downloaded datasets in local folders; the datasets themselves are not guaranteed to be included in this repository.

- **Enron spam/ham corpus:** the notebook reads `DataSet/enron1` through `DataSet/enron6`, with `ham` and `spam` subfolders. This is the initial training and validation stage.
- **Phishing Email dataset:** `DataSet/csv/Phishing_Email.csv` is used in a separate fine-tuning experiment.
- **CEAS 2008:** `Phishing-Email-Dataset/CEAS_08.csv` is used by a later fine-tuning block.
- **Nazario:** `Phishing-Email-Dataset/Nazario.csv` is used by another fine-tuning block.
- **Nigerian Fraud:** `Phishing-Email-Dataset/Nigerian_Fraud.csv` is used by the final fine-tuning block in the uploaded notebook.

The CSV blocks expect the relevant email-text and label columns shown in the notebook. For example, the CEAS/Nazario/Nigerian Fraud blocks use `body` and `label`; adjust the paths and column names if your downloaded copies differ. The notebook also contains a separately saved SpamAssassin model file in the repository, but the uploaded version of `LSTMmodel.ipynb` does not show a corresponding SpamAssassin training/evaluation block in its visible sequence.

### Preprocessing

For the Enron corpus, the notebook removes simple HTML tags, collapses repeated newline characters, and trims surrounding whitespace. Text is converted to token IDs and padded/truncated to 128 tokens. The same saved tokenizer must be used at inference time so new emails are represented using the vocabulary expected by the model.

## Results recorded in the notebook

These are the values printed by the uploaded notebook, not independently rerun benchmark results.

| Experiment | Validation samples | Validation accuracy | Notes |
|---|---:|---:|---|
| Initial Enron spam/ham model | 6,743 | **99.10%** | Both classes appear in the validation split: 3,282 ham and 3,461 spam |
| Fine-tuning on CEAS_08 | 7,831 | **96.23%** | Both classes appear in the validation split: 3,490 class 0 and 4,341 class 1 |
| Fine-tuning on Nazario | 313 | 96.17% | The validation labels contain only class 1; this is **not** a meaningful two-class evaluation |
| Fine-tuning on Nigerian Fraud | 667 | 99.70% | The validation labels contain only class 1; this is **not** a meaningful two-class evaluation |
| Fine-tuning on `Phishing_Email.csv` | 3,727 | 91.84% | Both classes appear in the validation split |

**Important interpretation:** the 99.10% Enron score measures the notebook's spam-versus-ham split; it does not by itself establish 99.10% accuracy on unseen, targeted phishing emails. The 99.70% Nigerian Fraud result should not be advertised as a balanced phishing-detection accuracy, because its validation split contains no class-0 examples; the dataset used for that fine-tuning stage is all class 1 in the notebook output. The existing repository README's stated 99.87% final accuracy is not demonstrated by the outputs in the uploaded notebook, so this README does not present it as a verified result. The current `prediction.py` and Flask server both point to the Nigerian Fraud checkpoint, so change those paths to a validated two-class checkpoint (for example, the CEAS_08 checkpoint) before presenting the application as a binary detector, and retest it end to end.

There are also methodology limitations to address before making strong performance claims:

- The tokenizer is fitted on the complete Enron text corpus before the train/validation split. For a cleaner evaluation, fit preprocessing only on the training partition.
- The splits use a fixed random seed but do not request stratification.
- Each fine-tuning stage continues training the previous model, so results across different datasets are not independent tests of a frozen final model.
- The model's vocabulary is based on Enron text and maps previously unseen words to an out-of-vocabulary token.
- The inference code uses a fixed probability threshold of `0.5`; that threshold has not been shown to be tuned for an operational phishing-detection use case.

## Repository layout

```text
PhishingMailDetection/
├── LSTMmodel.ipynb                         # Dataset loading, preprocessing, training and evaluation
├── prediction.py                           # Predicts from a local text file
├── model/
│   ├── enron_spam_lstm_model.h5             # Initial Enron-trained Keras model
│   ├── enron_spam_lstm_model_updated.h5     # Another saved model checkpoint
│   └── enron_spam_lstm_tokenizer.pkl        # Tokenizer paired with the training vocabulary
├── enron_spam_lstm_model_updated_Phishing-Email-Dataset/
│   ├── CEAS_08.h5                           # Checkpoint after CEAS fine-tuning
│   ├── Nazario.h5                            # Checkpoint after Nazario fine-tuning
│   ├── Nigerian_Fraud.h5                    # Checkpoint after Nigerian Fraud fine-tuning
│   └── SpamAssasin.h5                        # Saved checkpoint present in the repository
├── Server/
│   ├── phishing-detection-server.py         # Flask /predict API
│   ├── cert.pem                             # Local TLS certificate file
│   └── key.pem                              # TLS private-key file; see security note below
├── Extension/
│   ├── manifest.json                        # Chrome extension configuration (Manifest V3)
│   ├── content.js                           # Gmail page integration and email extraction flow
│   ├── popup.html / popup.js                # Extension popup and manual scan interaction
│   ├── background.js                        # Extension service worker
│   └── gmail.js / jquery.min.js              # Gmail integration libraries
└── TestingExamples/                         # Sample email text/JSON files for testing
```

## Requirements

For the notebook and prediction script:

- Python 3.10 or another Python version supported by the TensorFlow version you install
- TensorFlow/Keras
- NumPy and pandas
- scikit-learn
- Matplotlib (for notebook plots)

For the API:

- Flask
- flask-cors

Install the Python packages in a virtual environment. Package versions are not pinned in the current repository, so use a TensorFlow/Python combination compatible with your operating system and record the versions for repeatable results.

```bash
python -m venv .venv
# Linux/macOS
source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1

python -m pip install --upgrade pip
python -m pip install tensorflow numpy pandas scikit-learn matplotlib flask flask-cors
```

## Running the notebook

1. Download the required datasets and arrange their folders/columns as expected by the notebook, or edit the dataset paths to match your local files.
2. Ensure the model and tokenizer output directories exist, and correct any checkpoint paths that do not match your environment.
3. Open `LSTMmodel.ipynb` in Jupyter or VS Code and run the cells in order for the experiment you want to reproduce.
4. Check the class counts in each validation split before interpreting its accuracy. A binary classifier should be evaluated with examples of both classes, and precision, recall, F1-score, and a confusion matrix should be reviewed in addition to accuracy.

## Running a local text prediction

`prediction.py` loads a saved Keras model and tokenizer, reads `TestingExamples/exam.txt`, and prints a `Spam` or `Legit` prediction. Before running it, verify that `model_path` and `tokenizer_path` point to the exact model/tokenizer pair you intend to use and that the file exists.

```bash
python prediction.py
```

The script currently reports the model's raw output as a prediction score and classifies values above `0.5` as `Spam`. That function was written around spam/ham labels; the Flask server uses the labels `Phishing` and `Safe` for the same binary threshold. Keep the label definitions consistent with the model checkpoint you load.

## Running the Flask API and extension

The Flask service is in `Server/phishing-detection-server.py`. It expects a JSON request similar to:

```json
{
  "sender": "sender@example.com",
  "subject": "Please verify your account",
  "body": "Email message text goes here"
}
```

Send a `POST` request to `/predict`. On a successful prediction, the API returns a JSON response containing `result`, which is either `Phishing` or `Safe`.

Before starting the service:

1. Replace the hard-coded Windows paths in `Server/phishing-detection-server.py` with paths valid on your machine, preferably read from environment variables or a configuration file.
2. Ensure the server loads the correct model and its matching tokenizer. The checked-in script currently selects `Nigerian_Fraud.h5`; in the uploaded notebook, that fine-tuning dataset contains only class-1 labels, so do **not** treat that checkpoint as a validated two-class detector. The CEAS_08 checkpoint has a two-class validation split in the notebook, but it should still be retested after changing the path.
3. Configure the certificate and private-key paths for local HTTPS, and update the endpoint IP/port in `Extension/content.js` and `Extension/popup.js` to match your server.
4. Load the `Extension/` directory as an unpacked extension in a Chromium-based browser, then open Gmail and test with sample emails.
5. Set `debug=False` before exposing the server beyond local development. Do not expose this prototype publicly without additional security, privacy, and robustness work.

The checked-in server currently uses a local-network IP and Windows-specific file paths, so it will not run unchanged on another machine. A self-signed certificate may also need to be trusted by the browser for HTTPS requests to succeed.

## Security and privacy notes

- Email bodies and sender/subject details can contain sensitive information. Use test emails when developing and do not send confidential messages to an untrusted server.
- The repository tree contains `Server/key.pem`. **Do not publish or reuse a private key.** If this is a real key, remove it from the repository and Git history and generate a new key/certificate. Adding a path to `.gitignore` does not remove a file already tracked by Git.
- Keep the Flask debug mode disabled outside local development, validate request bodies, restrict network access, and use properly managed TLS certificates before deployment.
- Treat predictions as indicators for further review, not definitive proof that an email is safe or malicious.

## Limitations and future improvements

- Refit the tokenizer only on the training split and use stratified splits where appropriate.
- Recheck label distributions and label mappings in every imported dataset; reject evaluation splits that contain only one class when assessing binary performance.
- Build a final evaluation set that is never used for fine-tuning, ideally with data from different sources and a time-separated test set.
- Report confusion matrix, class-wise precision/recall/F1, and false-positive/false-negative counts.
- Make data paths and server endpoint configurable; add a dependency file with tested package versions.
- Align preprocessing between training and inference, and validate that the selected checkpoint and tokenizer are paired correctly.

## License

No repository-level license was visible in the inspected project files. Add a license only after confirming that you have the right to license your code and that the datasets and bundled third-party libraries permit their intended use.
