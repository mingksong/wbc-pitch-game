"""
Fetch Skubal & Skenes Statcast data via pybaseball, filter borderline pitches,
and output TypeScript data files for the umpire game.

Usage:
    python scripts/fetch_pitcher_data.py
"""
import json
import os
import sys

try:
    from pybaseball import statcast_pitcher
except ImportError:
    print("pybaseball not installed. Install with: pip install pybaseball")
    sys.exit(1)

# Constants
BALL_RADIUS = 0.121  # ft (1.45 inches)
ZONE_HALF_W = 17 / 24  # 0.708 ft (8.5 inches from center)
EFF_HALF_W = ZONE_HALF_W + BALL_RADIUS  # 0.829 ft
MARGIN = BALL_RADIUS * 2  # ~0.242 ft (1 ball diameter)

PITCHERS = {
    "skubal": {
        "player_id": 669373,
        "name": "Tarik Skubal",
        "seasons": [
            ("2024-03-20", "2024-10-01", "2024 Regular Season"),
        ],
        "output": "../src/data/skubalPitches.ts",
    },
    "skenes": {
        "player_id": 694973,
        "name": "Paul Skenes",
        "seasons": [
            ("2024-05-10", "2024-10-01", "2024 Regular Season"),
            ("2025-03-20", "2025-10-01", "2025 Regular Season"),
        ],
        "output": "../src/data/skenesPitches.ts",
    },
}

PITCH_TYPE_MAP = {
    "FF": "Four-Seam Fastball",
    "SI": "Sinker",
    "FC": "Cutter",
    "SL": "Slider",
    "CU": "Curveball",
    "CH": "Changeup",
    "FS": "Splitter",
    "KC": "Knuckle Curve",
    "ST": "Sweeper",
    "SV": "Slurve",
    "KN": "Knuckleball",
    "CS": "Slow Curve",
    "SC": "Screwball",
    "EP": "Eephus",
}


def is_geometric_strike(px, pz, sz_bot, sz_top):
    """Ball's edge touches or is inside the strike zone."""
    h_in = abs(px) <= EFF_HALF_W
    v_in = (pz >= sz_bot - BALL_RADIUS) and (pz <= sz_top + BALL_RADIUS)
    return h_in and v_in


def is_borderline(px, pz, sz_bot, sz_top):
    """Pitch is within 1 ball diameter of the effective zone edge."""
    eff_left = -EFF_HALF_W
    eff_right = EFF_HALF_W
    eff_bot = sz_bot - BALL_RADIUS
    eff_top = sz_top + BALL_RADIUS

    h_dist = min(abs(px - eff_left), abs(px - eff_right))
    v_dist = min(abs(pz - eff_bot), abs(pz - eff_top))

    return (h_dist <= MARGIN) or (v_dist <= MARGIN)


def process_pitcher(key, config):
    """Fetch and filter borderline pitches for a pitcher."""
    print(f"\n{'='*60}")
    print(f"Processing: {config['name']} (ID: {config['player_id']})")
    print(f"{'='*60}")

    all_rows = []
    for start, end, label in config["seasons"]:
        print(f"  Fetching {label} ({start} to {end})...")
        try:
            df = statcast_pitcher(start, end, player_id=config["player_id"])
            print(f"    → {len(df)} total pitches")
            # Tag with season label
            df = df.copy()
            df["season_label"] = label
            all_rows.append(df)
        except Exception as e:
            print(f"    ERROR: {e}")

    if not all_rows:
        print("  No data fetched!")
        return []

    import pandas as pd
    df = pd.concat(all_rows, ignore_index=True)

    # Filter: must have essential tracking columns
    required = ["plate_x", "plate_z", "sz_top", "sz_bot",
                 "vx0", "vy0", "vz0", "ax", "ay", "az",
                 "release_pos_x", "release_pos_y", "release_pos_z",
                 "release_speed", "effective_speed", "release_spin_rate"]
    df = df.dropna(subset=["plate_x", "plate_z", "sz_top", "sz_bot"])

    # Compute geometric strike and borderline
    df["geo_strike"] = df.apply(
        lambda r: is_geometric_strike(r["plate_x"], r["plate_z"], r["sz_bot"], r["sz_top"]),
        axis=1,
    )
    df["borderline"] = df.apply(
        lambda r: is_borderline(r["plate_x"], r["plate_z"], r["sz_bot"], r["sz_top"]),
        axis=1,
    )

    borderline_df = df[df["borderline"]].copy()
    print(f"\n  Total after filtering: {len(df)} pitches")
    print(f"  Borderline: {len(borderline_df)} pitches")
    print(f"  Borderline strike rate: {borderline_df['geo_strike'].mean():.1%}")

    # Convert to records
    pitches = []
    for _, row in borderline_df.iterrows():
        # plate_time: distance / speed approximation
        plate_time = row.get("plate_time")
        if plate_time is None or (isinstance(plate_time, float) and plate_time != plate_time):
            # Approximate: 55ft / (release_speed * 1.467) -- rough
            speed = row.get("release_speed", 90)
            plate_time = round(55.0 / (speed * 1.467), 4) if speed else 0.45

        pitch_code = row.get("pitch_type", "UN")
        pitch_name = PITCH_TYPE_MAP.get(pitch_code, row.get("pitch_name", "Unknown"))

        # Batter side
        bat_side = row.get("stand", "R")
        pitcher_hand = row.get("p_throws", "R")
        batter_name = row.get("batter_name", "Unknown") if "batter_name" in row.index else "Unknown"

        # Call description from Statcast
        call_desc = row.get("description", "")
        # Map common Statcast descriptions
        call_map = {
            "called_strike": "Called Strike",
            "ball": "Ball",
            "swinging_strike": "Swinging Strike",
            "foul": "Foul",
            "foul_tip": "Foul Tip",
            "hit_into_play": "In Play",
            "swinging_strike_blocked": "Swinging Strike (Blocked)",
            "blocked_ball": "Blocked Ball",
            "foul_bunt": "Foul Bunt",
            "missed_bunt": "Missed Bunt",
            "hit_by_pitch": "Hit By Pitch",
        }
        call_desc = call_map.get(call_desc, call_desc)

        # Build game label from date + opponent
        game_date = str(row.get("game_date", ""))[:10]
        season_label = row.get("season_label", "")

        record = {
            "pitcher": config["name"],
            "pitcherHand": pitcher_hand,
            "batter": batter_name if batter_name != "Unknown" else f"Batter",
            "batSide": bat_side,
            "pitchCode": pitch_code if pitch_code else "UN",
            "pitchName": pitch_name,
            "game": f"{season_label} ({game_date})" if game_date else season_label,
            "vX0": safe_round(row.get("vx0"), 4),
            "vY0": safe_round(row.get("vy0"), 4),
            "vZ0": safe_round(row.get("vz0"), 4),
            "aX": safe_round(row.get("ax"), 4),
            "aY": safe_round(row.get("ay"), 4),
            "aZ": safe_round(row.get("az"), 4),
            "x0": safe_round(row.get("release_pos_x"), 4),
            "y0": safe_round(row.get("release_pos_y", 55.0), 4),
            "z0": safe_round(row.get("release_pos_z"), 4),
            "pX": safe_round(row.get("plate_x"), 4),
            "pZ": safe_round(row.get("plate_z"), 4),
            "szTop": safe_round(row.get("sz_top"), 4),
            "szBot": safe_round(row.get("sz_bot"), 4),
            "startSpeed": safe_round(row.get("release_speed"), 1),
            "endSpeed": safe_round(row.get("effective_speed"), 1),
            "plateTime": safe_round(plate_time, 4),
            "spinRate": safe_round(row.get("release_spin_rate"), 0),
            "callDesc": call_desc,
            "isStrike": bool(row["geo_strike"]),
        }

        # Skip if any critical tracking field is missing
        if any(record[k] == 0 for k in ["vX0", "vY0", "vZ0", "aX", "aY", "aZ", "x0", "z0"]):
            continue

        pitches.append(record)

    print(f"  Final usable pitches: {len(pitches)}")
    strikes = sum(1 for p in pitches if p["isStrike"])
    print(f"  Strikes: {strikes}, Balls: {len(pitches) - strikes}")

    return pitches


def safe_round(val, decimals=4):
    """Round a value, returning 0 if NaN or None."""
    if val is None:
        return 0
    try:
        import math
        if math.isnan(val):
            return 0
        return round(val, decimals)
    except (TypeError, ValueError):
        return 0


def generate_ts_file(pitches, output_path, pitcher_name):
    """Generate a TypeScript data file."""
    strikes = sum(1 for p in pitches if p["isStrike"])
    balls = len(pitches) - strikes

    lines = [
        "import type { StrikeoutPitch } from './types';",
        "",
        f"// {pitcher_name} borderline pitches",
        f"// {strikes} strikes + {balls} balls = {len(pitches)} total",
        f"// Geometric strike zone judgment (ball radius included)",
        "export const pitchData: StrikeoutPitch[] =",
        json.dumps(pitches, indent=2, ensure_ascii=False) + ";",
    ]

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    print(f"  Written to {output_path}")


def main():
    for key, config in PITCHERS.items():
        pitches = process_pitcher(key, config)
        if pitches:
            generate_ts_file(pitches, config["output"], config["name"])
        else:
            print(f"  WARNING: No pitches for {config['name']}, skipping file generation")

    print("\nDone!")


if __name__ == "__main__":
    main()
