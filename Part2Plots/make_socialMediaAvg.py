# make_socialMediaAvg.py
import csv
from collections import defaultdict

sum_, cnt = defaultdict(float), defaultdict(int)
with open("socialMedia.csv", newline="", encoding="utf-8") as f:
    r = csv.DictReader(f)
    for row in r:
        try:
            likes = float(row["Likes"])
        except:
            continue
        key = (row["Platform"], row["PostType"])
        sum_[key] += likes
        cnt[key] += 1

with open("socialMediaAvg.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["Platform", "PostType", "AvgLikes"])
    for (plat, ptype), total in sum_.items():
        w.writerow([plat, ptype, f"{total/cnt[(plat, ptype)]:.2f}"])
