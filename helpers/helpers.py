from flask import redirect, session, current_app
from functools import wraps

def login_required(route):
    # creates login required routes
    @wraps(route)
    def decorated_function(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect("/")
        return route(*args, **kwargs)
    return decorated_function