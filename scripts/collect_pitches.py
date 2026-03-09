"""
Collect strikeout pitches + borderline pitches from KOR WBC 2026 games.
Outputs TypeScript data file for the umpire game.
"""
import requests
import json
import time

GAMES = [
    {"gamePk": 788115, "label": "vs CZE"},
    {"gamePk": 788118, "label": "vs JPN"},
    {"gamePk": 788113, "label": "vs TPE"},
]

KOR_TEAM_ID = 1171
BASE_URL = "https://statsapi.mlb.com"

def fetch_game(game_pk: int) -> dict:
    url = f"{BASE_URL}/api/v1.1/game/{game_pk}/feed/live"
    resp = requests.get(url, timeout=30)
    resp.raise_for_status()
    return resp.json()

def is_strike_by_zone(px: float, pz: float, sz_top: float, sz_bot: float) -> bool:
    half_plate = 0.83  # 17in/2 + ball radius ≈ 0.83ft
    return abs(px) <= half_plate and sz_bot <= pz <= sz_top

def extract_pitches(data: dict, game_label: str):
    teams = data.get("gameData", {}).get("teams", {})
    home_id = teams.get("home", {}).get("id")
    # Korea bats in bottom when home, top when away
    kor_bat_half = "bottom" if home_id == KOR_TEAM_ID else "top"

    all_plays = data.get("liveData", {}).get("plays", {}).get("allPlays", [])
    strikeout_pitches = []
    borderline_pitches = []

    for play in all_plays:
        about = play.get("about", {})
        half_inning = about.get("halfInning")
        if half_inning != kor_bat_half:
            continue

        result = play.get("result", {})
        matchup = play.get("matchup", {})
        batter_name = matchup.get("batter", {}).get("fullName", "Unknown")
        bat_side = matchup.get("batSide", {}).get("code", "R")
        pitcher_name = matchup.get("pitcher", {}).get("fullName", "Unknown")
        pitcher_hand = matchup.get("pitchHand", {}).get("code", "R")

        is_strikeout = result.get("eventType") == "strikeout"

        for event in play.get("playEvents", []):
            if not event.get("isPitch"):
                continue

            pitch_data = event.get("pitchData", {})
            details = event.get("details", {})
            pitch_type = details.get("type", {})
            coords = pitch_data.get("coordinates", {})
            breaks_data = pitch_data.get("breaks", {})

            vx0 = coords.get("vX0")
            vy0 = coords.get("vY0")
            vz0 = coords.get("vZ0")
            ax = coords.get("aX")
            ay = coords.get("aY")
            az = coords.get("aZ")
            x0 = coords.get("x0")
            y0 = coords.get("y0")
            z0 = coords.get("z0")
            px = coords.get("pX")
            pz = coords.get("pZ")

            sz_top = pitch_data.get("strikeZoneTop")
            sz_bot = pitch_data.get("strikeZoneBottom")
            start_speed = pitch_data.get("startSpeed")
            end_speed = pitch_data.get("endSpeed")
            plate_time = pitch_data.get("plateTime")
            spin_rate = breaks_data.get("spinRate")

            if any(v is None for v in [vx0, vy0, vz0, ax, ay, az, x0, y0, z0, px, pz, sz_top, sz_bot]):
                continue

            pitch_code = pitch_type.get("code", "UN")
            pitch_name = pitch_type.get("description", "Unknown")
            call_desc = details.get("description", "")
            is_strike = is_strike_by_zone(px, pz, sz_top, sz_bot)

            record = {
                "pitcher": pitcher_name,
                "pitcherHand": pitcher_hand,
                "batter": batter_name,
                "batSide": bat_side,
                "pitchCode": pitch_code,
                "pitchName": pitch_name,
                "game": game_label,
                "vX0": round(vx0, 4),
                "vY0": round(vy0, 4),
                "vZ0": round(vz0, 4),
                "aX": round(ax, 4),
                "aY": round(ay, 4),
                "aZ": round(az, 4),
                "x0": round(x0, 4),
                "y0": round(y0, 4),
                "z0": round(z0, 4),
                "pX": round(px, 4),
                "pZ": round(pz, 4),
                "szTop": round(sz_top, 4),
                "szBot": round(sz_bot, 4),
                "startSpeed": round(start_speed, 1) if start_speed else 0,
                "endSpeed": round(end_speed, 1) if end_speed else 0,
                "plateTime": round(plate_time, 4) if plate_time else 0.45,
                "spinRate": round(spin_rate) if spin_rate else 0,
                "callDesc": call_desc,
                "isStrike": is_strike,
            }

            if is_strikeout:
                strikeout_pitches.append(record)
            else:
                # Borderline pitches: near zone edges
                px_border = abs(abs(px) - 0.708) < 0.5
                pz_border = abs(pz - sz_top) < 0.4 or abs(pz - sz_bot) < 0.4
                if px_border or pz_border:
                    borderline_pitches.append(record)

    return strikeout_pitches, borderline_pitches

def generate_typescript(all_strikeout: list, all_borderline: list, output_path: str):
    combined = all_strikeout + all_borderline

    lines = [
        "export interface StrikeoutPitch {",
        "  pitcher: string;",
        "  pitcherHand: 'L' | 'R';",
        "  batter: string;",
        "  batSide: 'L' | 'R';",
        "  pitchCode: string;",
        "  pitchName: string;",
        "  game: string;",
        "  vX0: number; vY0: number; vZ0: number;",
        "  aX: number; aY: number; aZ: number;",
        "  x0: number; y0: number; z0: number;",
        "  pX: number; pZ: number;",
        "  szTop: number; szBot: number;",
        "  startSpeed: number;",
        "  endSpeed: number;",
        "  plateTime: number;",
        "  spinRate: number;",
        "  callDesc: string;",
        "  isStrike: boolean;",
        "}",
        "",
        f"// {len(all_strikeout)} strikeout pitches + {len(all_borderline)} borderline pitches",
        f"// Total: {len(combined)} pitches from KOR WBC 2026 Pool C games",
        "export const pitchData: StrikeoutPitch[] = ",
        json.dumps(combined, indent=2, ensure_ascii=False) + ";",
    ]

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    print(f"Written {len(combined)} pitches to {output_path}")

def main():
    all_strikeout = []
    all_borderline = []

    for game in GAMES:
        print(f"Fetching {game['label']} (gamePk={game['gamePk']})...")
        try:
            data = fetch_game(game["gamePk"])
            so, bl = extract_pitches(data, game["label"])
            print(f"  → {len(so)} strikeout pitches, {len(bl)} borderline pitches")
            all_strikeout.extend(so)
            all_borderline.extend(bl)
        except Exception as e:
            print(f"  ERROR: {e}")
        time.sleep(1)

    print(f"\nTotal: {len(all_strikeout)} strikeout + {len(all_borderline)} borderline = {len(all_strikeout) + len(all_borderline)}")
    output = "../src/data/korStrikeoutPitches.ts"
    generate_typescript(all_strikeout, all_borderline, output)

if __name__ == "__main__":
    main()
