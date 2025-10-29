# make_SocialMediaTime.py
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
        date = row["Date"]     # e.g., "3/1/2024 (Friday)"
        sum_[date] += likes
        cnt[date] += 1

with open("socialMediaTime.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["Date", "AvgLikes"])
    for date in sorted(sum_.keys()):
        w.writerow([date, f"{sum_[date]/cnt[date]:.2f}"])
