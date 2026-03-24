import requests

base = "http://127.0.0.1:8000"

r1 = requests.post(f"{base}/token", data={"username": "admin@college.com", "password": "Admin@123"})
token = r1.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Test STUDENT creation
data = {
    "name": "Final Test Student",
    "email": "final_test_student@college.test",
    "password": "Test@1234",
    "role": "STUDENT",
    "department": "CSE",
    "year": 1,
    "section": "A"
}
r2 = requests.post(f"{base}/admin/users", json=data, headers=headers)
print("STUDENT create status:", r2.status_code)
if r2.status_code == 200:
    print("SUCCESS! User created:", r2.json().get("name"), r2.json().get("email"))
    # Clean up
    uid = r2.json()["id"]
    rd = requests.delete(f"{base}/admin/users/{uid}", headers=headers)
    print("Cleanup:", rd.status_code, rd.json())
else:
    print("FAILED:", r2.text[:500])
