# BI Management Platform

A full-stack Business Intelligence (BI) web application with interactive dashboards, workflow configuration, and data visualization. Built with Django for the backend and Angular for the frontend.

---

## 🚀 Features

- Interactive dashboards with advanced filtering
- Workflow configuration using low-code modules
- Role-based access control
- Secure user management
- REST APIs for backend-frontend communication
- Scalable architecture for future expansion

---

## 🛠 Tech Stack

**Backend:**  
- Python 3  
- Django  
- Django REST Framework  

**Frontend:**  
- Angular  
- TypeScript  
- HTML / CSS  

**Databases & Tools:**  
- SQL (SQLite/PostgreSQL)  
- Power BI (optional for reporting)  
- WebSockets (if used for live updates)

---

## 📁 Project Structure

BI-management/
│
├── backend/ # Django backend
│ ├── accounts/ # User authentication
│ ├── core/ # Main business logic
│ ├── datasets/ # Sample datasets (ignored in Git)
│ ├── media/ # Media files (ignored in Git)
│ └── ... # Other backend modules
│
├── frontend/ # Angular frontend
│ ├── src/ # Angular app source code
│ ├── node_modules/ # Node dependencies (ignored in Git)
│ └── ...
│
├── .gitignore
└── README.md 

---

## ▶️ Getting Started

### Backend

1. Create and activate a virtual environment:

```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
source venv/bin/activate   # macOS/Linux
Install dependencies:

pip install -r requirements.txt


Run migrations and start the server:

python manage.py migrate
python manage.py runserver

Frontend

Navigate to the frontend folder and install dependencies:

cd frontend
npm install


Start the Angular development server:

ng serve


The frontend will be running at http://localhost:4200/.


Author

Nidhal Dalhoumi

GitHub: https://github.com/Nidhaldal

LinkedIn: https://www.linkedin.com/in/nidhal-dalhoumi-1b4a721a6/

Email: nidhal.dalhoumi@esprit.tn