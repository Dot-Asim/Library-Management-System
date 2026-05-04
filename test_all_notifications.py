import requests
import json
import time
import random

BASE_URL = "http://localhost:8080/api/v1"

class LMSNotificationTester:
    def __init__(self):
        self.student_token = None
        self.librarian_token = None
        self.student_id = None
        self.student_member_id = None
        self.test_email = f"tester_{random.randint(100, 999999)}@example.com"
        self.book_id = None
        self.copy_id = None
        self.borrow_id = None

    def login_librarian(self):
        print("\n[Admin/Librarian Login]")
        res = requests.post(f"{BASE_URL}/auth/login", json={
            "email": "librarian@ulms.com",
            "password": "librarian123"
        })
        if res.status_code == 200:
            self.librarian_token = res.json()['data']['accessToken']
            print("SUCCESS: Logged in as Librarian")
            return True
        print(f"FAILED: Librarian login: {res.text}")
        return False

    def test_registration(self):
        print(f"\n[Case 1: Member Registration] Testing email: {self.test_email}")
        reg_data = {
            "email": self.test_email,
            "password": "password123",
            "firstName": "Test",
            "lastName": "User",
            "role": "STUDENT",
            "membershipPlanId": 1
        }
        res = requests.post(f"{BASE_URL}/auth/register", json=reg_data)
        if res.status_code in [200, 201]:
            self.student_token = res.json()['data']['accessToken']
            self.student_id = res.json()['data']['user']['id']
            print(f"SUCCESS: Registered student (User ID: {self.student_id})")
            
            # Get Member ID
            time.sleep(5) # Give it more time to sync
            mem_res = requests.get(f"{BASE_URL}/members/user/{self.student_id}", headers={"Authorization": f"Bearer {self.student_token}"})
            if mem_res.status_code == 200:
                self.student_member_id = mem_res.json()['id']
                print(f"SUCCESS: Member Profile Found (Member ID: {self.student_member_id})")
                return True
            else:
                print(f"FAILED: Could not find member profile: {mem_res.text}")
                return False
        print(f"FAILED: Registration: {res.text}")
        return False

    def test_add_book(self):
        print("\n[Case 2: Global Notification - New Book Added]")
        book_data = {
            "title": f"Test Book {random.randint(100,999)}",
            "isbn": str(random.randint(1000000000000, 9999999999999)),
            "authorId": 1,
            "categoryId": 1,
            "bookType": "PHYSICAL",
            "description": "Auto-generated test book"
        }
        res = requests.post(f"{BASE_URL}/books", json=book_data, headers={"Authorization": f"Bearer {self.librarian_token}"})
        if res.status_code == 201:
            self.book_id = res.json()['id']
            print(f"SUCCESS: Added book '{book_data['title']}' (ID: {self.book_id})")
            
            # Add a copy for borrowing later
            copy_data = {
                "bookId": self.book_id, 
                "status": "AVAILABLE",
                "barcode": f"TEST-{random.randint(10000, 99999)}"
            }
            res_copy = requests.post(f"{BASE_URL}/books/copies", json=copy_data, headers={"Authorization": f"Bearer {self.librarian_token}"})
            if res_copy.status_code == 201:
                self.copy_id = res_copy.json()['id']
                print(f"SUCCESS: Added book copy (ID: {self.copy_id})")
                return True
            else:
                print(f"FAILED: Adding book copy: {res_copy.text}")
                return False
        print(f"FAILED: Adding book: {res.text}")
        return False

    def test_borrow_book(self):
        print("\n[Case 3: Personal Notification - Book Borrowed]")
        borrow_data = {
            "memberId": int(self.student_member_id),
            "bookCopyId": int(self.copy_id),
            "bookId": int(self.book_id)
        }
        res = requests.post(f"{BASE_URL}/borrows", json=borrow_data, headers={"Authorization": f"Bearer {self.student_token}"})
        if res.status_code == 201:
            self.borrow_id = res.json()['id']
            print(f"SUCCESS: Borrowed book (Borrow ID: {self.borrow_id})")
            return True
        print(f"FAILED: Borrowing: {res.text}")
        return False

    def test_return_book(self):
        print("\n[Case 4: Personal Notification - Book Returned]")
        return_data = {
            "bookCopyId": int(self.copy_id),
            "memberId": int(self.student_member_id)
        }
        # In this LMS, librarians usually process returns
        res = requests.post(f"{BASE_URL}/borrows/return", json=return_data, headers={"Authorization": f"Bearer {self.librarian_token}"})
        if res.status_code == 200:
            print("SUCCESS: Book returned")
            return True
        print(f"FAILED: Returning: {res.text}")
        return False

    def test_delete_book(self):
        print("\n[Case 5: Global Notification - Book Removed]")
        res = requests.delete(f"{BASE_URL}/books/{self.book_id}", headers={"Authorization": f"Bearer {self.librarian_token}"})
        if res.status_code == 204:
            print(f"SUCCESS: Deleted book (ID: {self.book_id})")
            return True
        print(f"FAILED: Deleting book: {res.text}")
        return False

    def verify_notifications(self):
        print("\n--- Final Verification: Checking Notification Database ---")
        time.sleep(3) # Wait for processing
        res = requests.get(f"{BASE_URL}/notifications/all")
        all_notifs = res.json()
        
        print(f"Total notifications found: {len(all_notifs)}")
        
        found_cases = {
            "Welcome Message": False,
            "New Book Added": False,
            "Book Borrowed": False,
            "Book Returned": False,
            "Book Removed": False
        }

        for n in all_notifs:
            subj = n['subject']
            mid = n['memberId']
            
            if "Welcome" in subj:
                if mid == self.student_member_id or mid == 0:
                    found_cases["Welcome Message"] = True
            if ("New Arrival" in subj or "New Book" in subj) and mid == 0: 
                found_cases["New Book Added"] = True
            if "Borrow" in subj and (mid == self.student_member_id or mid == 0): 
                found_cases["Book Borrowed"] = True
            if "Return" in subj and (mid == self.student_member_id or mid == 0): 
                found_cases["Book Returned"] = True
            if "Removed" in subj and mid == 0: 
                found_cases["Book Removed"] = True

        print("\nResults Summary:")
        for case, status in found_cases.items():
            result = "PASS" if status else "FAIL"
            print(f" - {case}: {result}")

if __name__ == "__main__":
    tester = LMSNotificationTester()
    if tester.login_librarian():
        if tester.test_registration():
            if tester.test_add_book():
                tester.test_borrow_book()
                tester.test_return_book()
                tester.test_delete_book()
                tester.verify_notifications()
