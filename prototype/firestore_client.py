"""
Firestore Client for ADK Agents
firebase-admin を初期化し、Firestore クライアントを提供する
"""

import os
import firebase_admin
from firebase_admin import credentials, firestore


def _initialize_firebase() -> firestore.Client:
    """Firebase Admin SDK を初期化して Firestore クライアントを返す"""
    if not firebase_admin._apps:
        # 環境変数 GOOGLE_APPLICATION_CREDENTIALS が設定されていれば ADC を使用
        # Cloud Run / Agent Engine 上では自動的にサービスアカウントが使われる
        project_id = os.environ.get("GOOGLE_CLOUD_PROJECT") or os.environ.get("FIREBASE_PROJECT_ID")

        if os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
            cred = credentials.ApplicationDefault()
        else:
            # ローカル開発: サービスアカウントキーのパスを指定
            sa_path = os.environ.get("FIREBASE_SA_KEY_PATH")
            if sa_path:
                cred = credentials.Certificate(sa_path)
            else:
                cred = credentials.ApplicationDefault()

        firebase_admin.initialize_app(cred, {"projectId": project_id})

    return firestore.client()


# シングルトン Firestore クライアント
db = _initialize_firebase()
