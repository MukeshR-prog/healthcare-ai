import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

df = pd.read_csv("data/claims.csv")
df = pd.get_dummies(df)

target_column = "Fraud"

X = df.drop(target_column, axis=1)
y = df[target_column]

model_columns = X.columns

X_train, X_test, y_train, y_test = train_test_split(X, y)

model = RandomForestClassifier()
model.fit(X_train, y_train)


def preprocess_input(data):
    input_df = pd.DataFrame([data])
    input_df = pd.get_dummies(input_df)
    input_df = input_df.reindex(columns=model_columns, fill_value=0)
    return input_df


def predict_fraud(data):
    processed = preprocess_input(data)
    return int(model.predict(processed)[0])