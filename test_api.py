"""
End-to-end API test: sends a real yoga image to the Flask backend
and prints the prediction result.
"""
import base64, json, urllib.request, urllib.error

IMG_PATH = r"d:\Yoga Website\Some_tests\WhatsApp Image 2026-04-20 at 10.10.16 PM.jpeg"
API_URL  = "http://localhost:5000/predict"

# Encode image as data URL
with open(IMG_PATH, "rb") as f:
    b64 = base64.b64encode(f.read()).decode("utf-8")
data_url = f"data:image/jpeg;base64,{b64}"

payload = json.dumps({"image": data_url}).encode("utf-8")
req = urllib.request.Request(
    API_URL, data=payload,
    headers={"Content-Type": "application/json"},
    method="POST"
)

print(f"Sending image: {IMG_PATH.split(chr(92))[-1]}")
print(f"Endpoint     : {API_URL}")
print()

try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read().decode("utf-8"))

    print("=" * 50)
    print(f"  Predicted Pose : {result['label']}")
    print(f"  Confidence     : {result['confidence_pct']}%")
    print(f"  Annotated Image: {'YES' if result.get('annotated_image') else 'NO'}")
    print()
    print("  Top-5 Predictions:")
    for i, item in enumerate(result.get("top5", []), 1):
        bar = "#" * int(item["score"] * 30)
        print(f"    {i}. {item['label']:<35} {item['score']*100:5.1f}%  {bar}")
    print("=" * 50)
except urllib.error.URLError as e:
    print(f"ERROR: {e}")
