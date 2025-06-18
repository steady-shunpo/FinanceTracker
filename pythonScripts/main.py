from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
import re
import sys
import json

training_data = [
("paid 20 to rahul", "add_transaction"),
("gave 100 to mom", "add_transaction"),
("send 30 to shreya", "add_transaction"),
("sent 30 to shreya", "add_transaction"),
("added 50 for tea", "add_transaction"),
("transferred 500 to rent", "add_transaction"),
("paid 45 to cab", "add_transaction"),
("push 90 for lunch", "add_transaction"),
("send money to arjun", "add_transaction"),
("added 70 for snacks", "add_transaction"),
("paid 120 to gym", "add_transaction"),
("update amount to 60", "update_amount"),
("change the amount to 80", "update_amount"),
("edit transaction amount to 100", "update_amount"),
("update to 200", "update_amount"),
("modify amount to 90", "update_amount"),
("change it to 150", "update_amount"),
("fix the amount to 30", "update_amount"),
("edit the transaction to 110", "update_amount"),
("make the amount 75", "update_amount"),
("adjust amount to 40", "update_amount"),
("change remark to snacks", "update_remark"),
("update this transaction remark to lunch", "update_remark"),
("remark to food", "update_remark"),
("set remark as recharge", "update_remark"),
("edit the remark to petrol", "update_remark"),
("modify remark to office snacks", "update_remark"),
("make the remark 'uber ride'", "update_remark"),
("fix remark to groceries", "update_remark"),
("update to travel", "update_remark"),  
("change it to coffee", "update_remark"),
]

texts, labels = zip(*training_data)

model = Pipeline([
    ("tfidf", TfidfVectorizer()),
    ("clf", LogisticRegression())
])

model.fit(texts, labels)


def extract_amount(text):
    match = re.search(r"\b\d+\b", text)
    return int(match.group()) if match else None

def extract_remark(text):
    match = re.search(r"(?:to|for)\s+(\w+)", text)
    return match.group(1) if match else None


def mainFunc(text):
    prediction = model.predict([text])[0]

    if prediction == "add_transaction":
        transaction = extract_amount(text)
        remark = extract_remark(text)

        print(json.dumps({
            "action": "add_transaction",
            "transaction": transaction,
            "remark": remark
        }))
    elif prediction == "update_amount":
        transaction = extract_amount(text)

        print(json.dumps({
            "action": "update_amount",
            "transaction": transaction
        }))
    elif prediction == "update_remark":
        remark = extract_remark(text)

        print(json.dumps({
            "action": "update_remark",
            "remark": remark
        }))



if __name__ == "__main__":
    jsonString = sys.argv[1]
    data = json.loads(jsonString)
    mainFunc(data)

