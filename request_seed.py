import urllib.request
import urllib.error

url = 'https://aegis-backend-production-d87a.up.railway.app/api/scan/seed_demo'
req = urllib.request.Request(url, method='POST')
req.add_header('Content-Type', 'application/json')
req.add_header('User-Agent', 'Mozilla/5.0')
try:
    with urllib.request.urlopen(req) as response:
        print("Success:", response.read().decode())
except urllib.error.HTTPError as e:
    print(f"HTTPError: {e.code} - {e.reason}")
    print("Body:", e.read().decode())
except Exception as e:
    print("Exception:", e)
