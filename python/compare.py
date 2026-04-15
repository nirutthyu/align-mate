"""
Compare v1 (old) and v2 (new) on real CSV data using all 18 questions.
Metrics: worst pair score, mean compatibility, standard deviation (normalised).
"""

import sys, os
import numpy as np
import csv
import ast
import matplotlib.pyplot as plt
import v1, v2

ROOM_SIZE = 4
CSV_FILE = "users.csv"

# Map frontend qid → algorithm index (0‑17) – must match backend QID_INDEX
QID_TO_INDEX = {
    "early-night": 0,
    "cleanliness": 1,
    "daily-routine": 2,
    "quiet-room": 3,
    "study-style": 4,
    "gaming": 5,
    "stress-handle-comp": 6,
    "movies-frequency": 7,
    "friends-other-rooms": 8,
    "sharing-items": 9,
    "social-level": 10,
    "group-lead": 11,
    "decision-style": 12,
    "adaptability": 13,
    "difficult-situations": 14,
    "wake-up-style": 15,
    "conversation-style": 16,
    "exam-period": 17
}

LABEL_MAP = {
    "sharing-items": {
        "Not comfortable": "Not",
        "Somewhat": "Somewhat",
        "Very comfortable": "Very"
    },
    "stress-handle-comp": {
        "Stay calm": "Calm",
        "Need support": "NeedSupport"
    }
}

def load_students_from_csv(csv_path):
    students = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Parse all answer columns (answer1..answer17) into dict
            answers_dict = {}
            for col in [f'answer{i}' for i in range(1, 18)]:
                if row[col].strip():
                    try:
                        d = ast.literal_eval(row[col])
                        qid = d.get('qid')
                        chosen = d.get('chosenAnswer')
                        if qid and chosen:
                            answers_dict[qid] = chosen
                    except:
                        pass

            # Build list of 18 answers, defaulting to first label of each question
            ans_list = [v1.QUESTIONS[i]["labels"][0] for i in range(18)]
            for qid, idx in QID_TO_INDEX.items():
                val = answers_dict.get(qid)
                if val is not None:
                    # apply label mapping if needed
                    if qid in LABEL_MAP:
                        val = LABEL_MAP[qid].get(val, val)
                    ans_list[idx] = val

            students.append({
                "id": row['email'],
                "answers": ans_list
            })
    return students

def get_room_pair_scores(mod, students):
    rooms = mod.greedy_room_assignment(students, room_size=ROOM_SIZE)
    compat = mod.build_compatibility_matrix(students)
    scores = []
    for room in rooms:
        for i in range(len(room)):
            for j in range(i+1, len(room)):
                scores.append(compat[room[i]].get(room[j], 0))
    return np.array(scores)

def normalise(s1, s2):
    lo = min(s1.min(), s2.min())
    hi = max(s1.max(), s2.max())
    if hi == lo:
        return s1, s2
    return (s1 - lo) / (hi - lo), (s2 - lo) / (hi - lo)

def print_comparison(r1, r2):
    print("\n" + "="*80)
    print("COMPARISON: v1 (Jaccard+Spearman) vs v2 (Dice+Ordinal+WeightedComplement)")
    print("Using all 18 questions from the questionnaire")
    print("="*80)
    print(f"{'Metric':<30} {'v1':>20} {'v2':>20} {'Winner':>10}")
    print("-"*80)
    metrics = [("Worst pair score", "worst", True),
               ("Mean compatibility", "mean", True),
               ("Std deviation", "std", False)]
    for label, key, higher_better in metrics:
        v1v, v2v = r1[key], r2[key]
        winner = "v2" if (v2v > v1v) == higher_better else "v1"
        print(f"{label:<30} {v1v:>20.4f} {v2v:>20.4f} {winner:>10}")
    print("="*80 + "\n")

def plot_comparison(r1, r2, outfile="comparison_v1_v2_18q.png"):
    labels = ["Worst pair\n(higher better)", "Mean\n(higher better)", "Std dev\n(lower better)"]
    v1_vals = [r1["worst"], r1["mean"], r1["std"]]
    v2_vals = [r2["worst"], r2["mean"], r2["std"]]
    x = np.arange(len(labels))
    width = 0.35
    fig, ax = plt.subplots(figsize=(9,5))
    bars1 = ax.bar(x - width/2, v1_vals, width, color="#378ADD", label="v1 (Jaccard+Spearman)")
    bars2 = ax.bar(x + width/2, v2_vals, width, color="#D85A30", label="v2 (Dice+Ordinal+Weighted)")
    ax.set_ylabel("Normalised Score")
    ax.set_xticks(x)
    ax.set_xticklabels(labels)
    ax.legend()
    ax.grid(axis='y', linestyle='--', alpha=0.3)
    for bar in bars1:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height + 0.01,
                f'{height:.3f}', ha='center', va='bottom', fontsize=9)
    for bar in bars2:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height + 0.01,
                f'{height:.3f}', ha='center', va='bottom', fontsize=9)
    ax.set_title("Roommate Matching Algorithm Comparison")
    plt.tight_layout()
    plt.savefig(outfile, dpi=150)
    plt.close()
    print(f"Plot saved as {outfile}")

if __name__ == "__main__":
    if not os.path.exists(CSV_FILE):
        print(f"Error: {CSV_FILE} not found.")
        sys.exit(1)
    students = load_students_from_csv(CSV_FILE)
    print(f"Loaded {len(students)} students from {CSV_FILE}")

    scores_v1 = get_room_pair_scores(v1, students)
    scores_v2 = get_room_pair_scores(v2, students)
    n1, n2 = normalise(scores_v1, scores_v2)

    r1 = {"worst": n1.min(), "mean": n1.mean(), "std": n1.std()}
    r2 = {"worst": n2.min(), "mean": n2.mean(), "std": n2.std()}

    print_comparison(r1, r2)
    plot_comparison(r1, r2)