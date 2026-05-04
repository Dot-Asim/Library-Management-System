import requests
import json
import time
import random

BASE_URL = "http://localhost:8080/api/v1"

def get_auth_info(email, password):
    res = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    if res.status_code == 200:
        data = res.json()['data']
        return data['accessToken'], data['user']['id']
    return None, None

def get_available_count(book_id, token):
    res = requests.get(f"{BASE_URL}/books/{book_id}", headers={"Authorization": f"Bearer {token}"})
    if res.status_code == 200:
        return res.json().get('availableCopies', 0)
    return 0

def get_any_available_copy(book_id, token):
    res = requests.get(f"{BASE_URL}/books/{book_id}/available-copy", headers={"Authorization": f"Bearer {token}"})
    if res.status_code == 200:
        return res.json()
    return None

def test_inventory_decrease():
    print("--- Inventory Decrease Test ---")
    
    # 1. Login
    lib_token, _ = get_auth_info("librarian@ulms.com", "librarian123")
    std_token, std_user_id = get_auth_info("student@ulms.com", "student123")
    
    if not lib_token or not std_token:
        print("FAILED: Login failed")
        return

    # 2. Create Book
    book_data = {
        "title": f"Inv Test {random.randint(100,999)}",
        "isbn": str(random.randint(1000000000000, 9999999999999)),
        "authorId": 1,
        "categoryId": 1,
        "bookType": "PHYSICAL",
        "description": "Testing inventory count"
    }
    res = requests.post(f"{BASE_URL}/books", json=book_data, headers={"Authorization": f"Bearer {lib_token}"})
    if res.status_code != 201:
        print(f"FAILED: Book creation failed: {res.text}")
        return
    book_id = res.json()['id']
    print(f"Created book ID: {book_id}")

    # Add 2 copies
    for i in range(2):
        copy_data = {"bookId": book_id, "status": "AVAILABLE", "barcode": f"INV-{book_id}-{i}-{random.randint(100,999)}"}
        requests.post(f"{BASE_URL}/books/copies", json=copy_data, headers={"Authorization": f"Bearer {lib_token}"})

    time.sleep(2) # Wait for copies to be registered and count updated

    # 3. Initial Count
    count_before = get_available_count(book_id, std_token)
    print(f"Available copies BEFORE borrowing: {count_before}")
    
    if count_before == 0:
        print("FAILED: No available copies to borrow (Check catalog-service sync)")
        return

    # 4. Borrow
    copy_to_borrow = get_any_available_copy(book_id, std_token)
    if not copy_to_borrow:
        print("FAILED: Could not fetch an available copy")
        return
    
    # Get member ID using userId
    res_mem = requests.get(f"{BASE_URL}/members/user/{std_user_id}", headers={"Authorization": f"Bearer {std_token}"})
    if res_mem.status_code != 200:
        print(f"FAILED: Could not find member profile for user {std_user_id}: {res_mem.text}")
        return
    member_id = res_mem.json()['id']
    
    borrow_data = {
        "memberId": member_id,
        "bookCopyId": copy_to_borrow['id'],
        "bookId": book_id
    }
    
    print(f"Borrowing Copy ID: {copy_to_borrow['id']}...")
    res_borrow = requests.post(f"{BASE_URL}/borrows", json=borrow_data, headers={"Authorization": f"Bearer {std_token}"})
    
    if res_borrow.status_code != 201:
        print(f"FAILED: Borrowing failed: {res_borrow.text}")
        return

    # 5. Final Count
    time.sleep(2) # Give more time for DB sync
    count_after = get_available_count(book_id, std_token)
    print(f"Available copies AFTER borrowing: {count_after}")

    # 6. Verify
    if count_after == count_before - 1:
        print("\nSUCCESS: Inventory decreased by exactly 1!")
    else:
        print(f"\nFAILED: Expected {count_before - 1}, but got {count_after}")

if __name__ == "__main__":
    test_inventory_decrease()
