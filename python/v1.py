"""
v1: Old algorithm (18 questions)
- Binary: Jaccard similarity
- Ordinal: Spearman rank correlation (normalised)
- Complement: unweighted mean absolute difference
- Risk: same conflict penalty
- Score = 0.4*sim + 0.4*comp - 0.2*risk
"""

import numpy as np
from itertools import combinations
from scipy.stats import spearmanr

QUESTIONS = {
    0:  {"type": "binary",  "labels": ["Night", "Early"]},
    1:  {"type": "ordinal", "labels": ["Low", "Medium", "High"]},
    2:  {"type": "ordinal", "labels": ["No", "Sometimes", "Yes"]},
    3:  {"type": "binary",  "labels": ["No", "Yes"]},
    4:  {"type": "binary",  "labels": ["Group", "Individual"]},
    5:  {"type": "binary",  "labels": ["No", "Yes"]},
    6:  {"type": "binary",  "labels": ["NeedSupport", "Calm"]},
    7:  {"type": "ordinal", "labels": ["Never", "Rarely", "Sometimes", "Frequently"]},
    8:  {"type": "binary",  "labels": ["Bad", "Good"]},
    9:  {"type": "ordinal", "labels": ["Not", "Somewhat", "Very"]},
    10: {"type": "ordinal", "labels": ["Introvert", "Ambivert", "Extrovert"]},
    11: {"type": "binary",  "labels": ["Yes", "No"]},
    12: {"type": "binary",  "labels": ["Emotional", "Logical"]},
    13: {"type": "ordinal", "labels": ["Low", "Medium", "High"]},
    14: {"type": "binary",  "labels": ["Reassure others", "Seek reassurance"]},
    15: {"type": "binary",  "labels": ["Alarm", "Self wake up"]},
    16: {"type": "binary",  "labels": ["Mostly listen", "Mostly speak"]},
    17: {"type": "binary",  "labels": ["Remind Timeline", "Rely on reminders"]}
}

BINARY_IDX  = [i for i, q in QUESTIONS.items() if q["type"] == "binary"]
ORDINAL_IDX = [i for i, q in QUESTIONS.items() if q["type"] == "ordinal"]
N_QUESTIONS = len(QUESTIONS)

ALPHA, BETA, GAMMA = 0.4, 0.4, 0.2

def preprocess_student(raw: list[str]) -> np.ndarray:
    encoded = []
    for i, ans in enumerate(raw):
        labels = QUESTIONS[i]["labels"]
        idx = labels.index(ans) if ans in labels else 0
        encoded.append(float(idx))
    vec = np.array(encoded)
    for i in ORDINAL_IDX:
        maxv = len(QUESTIONS[i]["labels"]) - 1
        vec[i] /= maxv
    return vec

def jaccard_similarity(a_bin, b_bin):
    inter = np.sum(a_bin * b_bin)
    total = np.sum(a_bin) + np.sum(b_bin)
    return 1.0 if total == 0 else inter / (total - inter)

def spearman_similarity(a_ord, b_ord):
    if np.std(a_ord) == 0 or np.std(b_ord) == 0:
        return 1.0 if np.array_equal(a_ord, b_ord) else 0.5
    rho, _ = spearmanr(a_ord, b_ord)
    return (rho + 1) / 2

def complement_unweighted(A, B):
    return np.mean(np.abs(A - B))

def conflict_risk(A, B):
    risk = 0.0
    if A[6] > 0.7 and B[6] > 0.7: risk += 0.3
    if A[1] < 0.3 and B[1] < 0.3: risk += 0.2
    if A[7] > 0.7 and B[7] > 0.7: risk += 0.2
    return risk

def compatibility(raw_a, raw_b):
    A = preprocess_student(raw_a)
    B = preprocess_student(raw_b)
    A_bin = A[BINARY_IDX]
    B_bin = B[BINARY_IDX]
    jac = jaccard_similarity(A_bin, B_bin)
    A_ord = A[ORDINAL_IDX]
    B_ord = B[ORDINAL_IDX]
    sp = spearman_similarity(A_ord, B_ord)
    sim = (jac + sp) / 2
    comp = complement_unweighted(A, B)
    risk = conflict_risk(A, B)
    return ALPHA * sim + BETA * comp - GAMMA * risk

def build_compatibility_matrix(students):
    mat = {s["id"]: {} for s in students}
    for s1, s2 in combinations(students, 2):
        score = compatibility(s1["answers"], s2["answers"])
        mat[s1["id"]][s2["id"]] = score
        mat[s2["id"]][s1["id"]] = score
    return mat

def greedy_room_assignment(students, room_size=4):
    compat = build_compatibility_matrix(students)
    used = set()
    rooms = []
    for student in students:
        uid = student["id"]
        if uid in used:
            continue
        room = [uid]
        used.add(uid)
        while len(room) < room_size:
            best, best_score = None, -float("inf")
            for candidate in students:
                cid = candidate["id"]
                if cid in used:
                    continue
                score = sum(compat[r].get(cid, 0) for r in room)
                if score > best_score:
                    best_score, best = score, cid
            if best is None:
                break
            room.append(best)
            used.add(best)
        rooms.append(room)
    return rooms