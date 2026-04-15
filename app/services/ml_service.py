import pickle
from pathlib import Path

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split

MODEL_ARTIFACT_PATH = Path("app/artifacts/fraud_model.pkl")
TARGET_COLUMN = "Fraud"
HIGH_RISK_CONFIDENCE_THRESHOLD = 0.8

model: RandomForestClassifier
model_columns: pd.Index
model_metrics: dict
feature_importances: list[dict]


def _compute_feature_importance(feature_names: pd.Index, importances: list[float]) -> list[dict]:
    ranking = sorted(
        zip(feature_names.tolist(), importances),
        key=lambda item: item[1],
        reverse=True,
    )
    return [
        {"feature": feature, "importance": float(importance)}
        for feature, importance in ranking
    ]


def _train_and_persist_model() -> tuple[RandomForestClassifier, pd.Index, dict, list[dict]]:
    df = pd.read_csv("data/claims.csv")
    encoded_df = pd.get_dummies(df)

    X = encoded_df.drop(TARGET_COLUMN, axis=1)
    y = encoded_df[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    trained_model = RandomForestClassifier(
        n_estimators=300,
        random_state=42,
        n_jobs=-1,
    )
    trained_model.fit(X_train, y_train)

    y_pred = trained_model.predict(X_test)
    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, zero_division=0)),
        "f1_score": float(f1_score(y_test, y_pred, zero_division=0)),
    }
    importance = _compute_feature_importance(X.columns, trained_model.feature_importances_)

    MODEL_ARTIFACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with MODEL_ARTIFACT_PATH.open("wb") as artifact_file:
        pickle.dump(
            {
                "model": trained_model,
                "model_columns": X.columns.tolist(),
                "metrics": metrics,
                "feature_importance": importance,
            },
            artifact_file,
        )

    return trained_model, X.columns, metrics, importance


def _load_or_train_model() -> tuple[RandomForestClassifier, pd.Index, dict, list[dict]]:
    if MODEL_ARTIFACT_PATH.exists():
        with MODEL_ARTIFACT_PATH.open("rb") as artifact_file:
            artifact = pickle.load(artifact_file)
        loaded_columns = pd.Index(artifact["model_columns"])
        return (
            artifact["model"],
            loaded_columns,
            artifact["metrics"],
            artifact["feature_importance"],
        )

    return _train_and_persist_model()


model, model_columns, model_metrics, feature_importances = _load_or_train_model()


def preprocess_input(data: dict) -> pd.DataFrame:
    input_df = pd.DataFrame([data])
    input_df = pd.get_dummies(input_df)
    input_df = input_df.reindex(columns=model_columns, fill_value=0)
    return input_df


def predict_fraud(data: dict) -> dict:
    processed = preprocess_input(data)

    prediction = model.predict(processed)[0]
    probability = model.predict_proba(processed)[0][1]

    return {
        "prediction": int(prediction),
        "confidence": float(probability),
    }


def get_model_metrics() -> dict:
    return {
        **model_metrics,
        "feature_importance": feature_importances,
        "artifact_path": str(MODEL_ARTIFACT_PATH),
    }