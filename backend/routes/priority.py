from flask import Blueprint, jsonify
import numpy as np

priority_bp = Blueprint('priority', __name__)

@priority_bp.route('/api/priority-list')
def get_priority_list():
    # Dummy zip list with priority scores
    zip_priority_struct = np.array([
        (1430, 0.9), (2020, 0.7), (3200, 0.4)
    ], dtype=[("zipcode", "i4"), ("score", "f4")])

    def get_color(score):   #If meets the score or not
        if score > 0.8: return "red"
        elif score > 0.5: return "orange"
        elif score > 0.2: return "yellow"
        return "white"

    output = [
        {
            "zipcode": int(row["zipcode"]),
            "score": float(row["score"]),
            "color": get_color(row["score"])
        }
        for row in zip_priority_struct
    ]

    return jsonify(output)
