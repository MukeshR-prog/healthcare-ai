import pickle
from pathlib import Path

import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.model_selection import train_test_split

MODEL_ARTIFACT_PATH = Path("app/artifacts/fraud_model.pkl")
TARGET_COLUMN = "Fraud"
HIGH_RISK_CONFIDENCE_THRESHOLD = 0.8

model: RandomForestClassifier
anomaly_model: IsolationForest
model_columns: pd.Index
model_metrics: dict
feature_importances: list[dict]
anomaly_score_bounds: tuple[float, float]


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


def _train_and_persist_model() -> tuple[
    RandomForestClassifier,
    IsolationForest,
    pd.Index,
    dict,
    list[dict],
    tuple[float, float],
]:
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

    trained_anomaly_model = IsolationForest(
        n_estimators=300,
        random_state=42,
        contamination="auto",
    )
    trained_anomaly_model.fit(X)

    y_pred = trained_model.predict(X_test)
    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred, zero_division=0)),
        "recall": float(recall_score(y_test, y_pred, zero_division=0)),
        "f1_score": float(f1_score(y_test, y_pred, zero_division=0)),
    }
    importance = _compute_feature_importance(X.columns, trained_model.feature_importances_)

    anomaly_raw_scores = -trained_anomaly_model.decision_function(X)
    anomaly_min = float(anomaly_raw_scores.min())
    anomaly_max = float(anomaly_raw_scores.max())

    MODEL_ARTIFACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with MODEL_ARTIFACT_PATH.open("wb") as artifact_file:
        pickle.dump(
            {
                "model": trained_model,
                "anomaly_model": trained_anomaly_model,
                "model_columns": X.columns.tolist(),
                "metrics": metrics,
                "feature_importance": importance,
                "anomaly_score_bounds": [anomaly_min, anomaly_max],
            },
            artifact_file,
        )

    return (
        trained_model,
        trained_anomaly_model,
        X.columns,
        metrics,
        importance,
        (anomaly_min, anomaly_max),
    )


def _load_or_train_model() -> tuple[
    RandomForestClassifier,
    IsolationForest,
    pd.Index,
    dict,
    list[dict],
    tuple[float, float],
]:
    if MODEL_ARTIFACT_PATH.exists():
        with MODEL_ARTIFACT_PATH.open("rb") as artifact_file:
            artifact = pickle.load(artifact_file)

        required_keys = {
            "model",
            "anomaly_model",
            "model_columns",
            "metrics",
            "feature_importance",
            "anomaly_score_bounds",
        }
        if not required_keys.issubset(set(artifact.keys())):
            return _train_and_persist_model()

        loaded_columns = pd.Index(artifact["model_columns"])
        return (
            artifact["model"],
            artifact["anomaly_model"],
            loaded_columns,
            artifact["metrics"],
            artifact["feature_importance"],
            tuple(artifact["anomaly_score_bounds"]),
        )

    return _train_and_persist_model()


model, anomaly_model, model_columns, model_metrics, feature_importances, anomaly_score_bounds = _load_or_train_model()


def preprocess_input(data: dict) -> pd.DataFrame:
    input_df = pd.DataFrame([data])
    input_df = pd.get_dummies(input_df)
    input_df = input_df.reindex(columns=model_columns, fill_value=0)
    return input_df


def predict_fraud(data: dict) -> dict:
    processed = preprocess_input(data)

    prediction = model.predict(processed)[0]
    probability = model.predict_proba(processed)[0][1]

    anomaly_prediction = anomaly_model.predict(processed)[0]
    anomaly_raw_score = float(-anomaly_model.decision_function(processed)[0])
    min_score, max_score = anomaly_score_bounds
    if max_score > min_score:
        normalized_anomaly_score = (anomaly_raw_score - min_score) / (max_score - min_score)
    else:
        normalized_anomaly_score = 0.5
    normalized_anomaly_score = float(max(0.0, min(1.0, normalized_anomaly_score)))

    return {
        "prediction": int(prediction),
        "confidence": float(probability),
        "anomaly_score": normalized_anomaly_score,
        "is_anomalous": bool(anomaly_prediction == -1),
    }


def get_model_metrics() -> dict:
    return {
        **model_metrics,
        "feature_importance": feature_importances,
        "artifact_path": str(MODEL_ARTIFACT_PATH),
        "anomaly_detection": {
            "algorithm": "IsolationForest",
            "score_range": [0.0, 1.0],
            "flag_rule": "is_anomalous=true when IsolationForest predicts -1",
        },
    }