import requests
import json
import time

BASE_URL = "http://localhost:8080/api/v1"

def test_borrow_flow():
    print("--- Starting Borrow & Notification Test ---")
    
    # 1. Login as Student
    print("Step 1: Logging in...")
    login_data = {
        "email": "student@ulms.com",
        "password": "student123"
    }
    res = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if res.status_code != 200:
        print(f"FAILED: Login failed with status {res.status_code}")
        print(res.text)
        return
    
    token = res.json()['data']['accessToken']
    user_id = res.json()['data']['user']['id']
    headers = {"Authorization": f"Bearer {token}"}
    print(f"SUCCESS: Logged in as student (ID: {user_id})")

    # 2. Get Member Profile (numeric ID)
    print("\nStep 2: Getting member profile...")
    res = requests.get(f"{BASE_URL}/members/user/{user_id}", headers=headers)
    if res.status_code != 200:
        print(f"FAILED: Could not get member profile: {res.text}")
        return
    
    member_id = res.json()['id']
    member_email = res.json()['email']
    print(f"SUCCESS: Member ID found: {member_id}")

    # 3. Find an available book copy and try to borrow
    print("\nStep 3: Finding an available book and borrowing it...")
    res = requests.get(f"{BASE_URL}/books")
    books = res.json()
    
    success = False
    for book in books:
        if book.get('availableCopies', 0) > 0:
            print(f"Trying book: {book['title']} (ID: {book['id']})")
            copy_res = requests.get(f"{BASE_URL}/books/{book['id']}/available-copy", headers=headers)
            if copy_res.status_code != 200:
                continue
                
            target_copy_id = copy_res.json()['id']
            
            # Step 4: Borrow the book
            borrow_data = {
                "memberId": int(member_id),
                "bookCopyId": int(target_copy_id),
                "bookId": int(book['id'])
            }
            borrow_res = requests.post(f"{BASE_URL}/borrows", json=borrow_data, headers=headers)
            
            if borrow_res.status_code == 201:
                print(f"SUCCESS: Borrowed '{book['title']}'!")
                success = True
                target_book = book
                break
            else:
                print(f"  Skipping: {borrow_res.text}")
    
    if not success:
        print("FAILED: Could not borrow any book from the catalog.")
        return

    # 5. Wait for notification processing
    print("\nStep 5: Waiting 3 seconds for event processing...")
    time.sleep(3)

    # 6. Check Notifications
    print("\nStep 6: Checking notifications database...")
    res = requests.get(f"{BASE_URL}/notifications/all")
    if res.status_code != 200:
        print(f"FAILED: Could not fetch all notifications: {res.text}")
        return
    
    notifications = res.json()
    print(f"Found {len(notifications)} total notifications in system.")
    
    # Filter for the borrow confirmation we just triggered
    my_notif = [n for n in notifications if n['memberId'] == member_id and target_book['title'] in n['subject']]
    
    if my_notif:
        print("\n=== TEST PASSED! ===")
        print(f"Notification found: {json.dumps(my_notif[0], indent=2)}")
    else:
        print("\n=== TEST FAILED! ===")
        print("Borrow was successful, but no notification was found in the database for this member/book.")
        print("Check if notification-service is running and connected to RabbitMQ.")

if __name__ == "__main__":
    test_borrow_flow()
