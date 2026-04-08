import json
from pywebpush import webpush, WebPushException
from flask import current_app
from app.models.push_subscription import PushSubscription
from app.extensions import db

def send_web_push(user_id, payload_dict):
    """Gửi thông báo đẩy tới tất cả thiết bị của một user."""
    subscriptions = PushSubscription.query.filter_by(user_id=user_id).all()
    
    # Payload phải là chuỗi JSON
    payload_str = json.dumps(payload_dict)
    
    results = []
    for sub in subscriptions:
        try:
            response = webpush(
                subscription_info=sub.to_subscription_info(),
                data=payload_str,
                vapid_private_key=current_app.config['VAPID_PRIVATE_KEY'],
                vapid_claims={"sub": current_app.config['VAPID_CLAIM_EMAIL']}
            )
            results.append(response.ok)
        except WebPushException as ex:
            # Nếu lỗi 410 (Gone) có nghĩa là user đã thu hồi quyền hoặc token hết hạn
            if ex.response is not None and ex.response.status_code == 410:
                db.session.delete(sub)
                db.session.commit()
            print(f"Lỗi gửi push: {ex}")
            results.append(False)
            
    return results
