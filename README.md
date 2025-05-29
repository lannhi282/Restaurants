# Restaurant Recommendation System

This project integrates a restaurant recommendation system from a Jupyter notebook into a web application.

## Features

- **Restaurant Listings**: Browse and filter restaurants
- **User Profiles**: View user information and preferences  
- **Recommendation System**: Get personalized restaurant recommendations based on collaborative filtering
- **Responsive Design**: Works on desktop and mobile devices

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Start the Flask Backend

```bash
python app.py
```

The Flask server will start on `http://localhost:5000`

### 3. Open the Website

Open `index.html` in your web browser or serve it using a local web server:

```bash
# Using Python's built-in server
python -m http.server 8000
```

Then visit `http://localhost:8000`

## How to Use the Recommendation System

1. Navigate to the "Gợi Ý" (Recommendations) page
2. Select a user ID from the dropdown menu
3. Click "Lấy Gợi Ý" (Get Recommendations) 
4. View the top 10 recommended restaurants for that user

## Data Files

The system uses the following CSV files in the `data/` directory:

- `userprofile.csv` - User demographic information
- `rating_final.csv` - User ratings for restaurants
- `geoplaces2.csv` - Restaurant information
- `chefmozcuisine.csv` - Restaurant cuisine types
- `chefmozaccepts.csv` - Restaurant payment methods
- `chefmozhours4.csv` - Restaurant hours
- `chefmozparking.csv` - Restaurant parking information
- `usercuisine.csv` - User cuisine preferences
- `userpayment.csv` - User payment preferences

## Algorithm

The recommendation system uses collaborative filtering with cosine similarity to find similar users and predict ratings for unrated restaurants. The algorithm is implemented exactly as specified in the original Jupyter notebook (`data/DA_RS.ipynb`).

## API Endpoints

- `GET /api/users` - Get list of all users
- `GET /api/recommendations/<user_id>` - Get recommendations for a specific user
- `GET /api/user/<user_id>` - Get user profile information

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Flask (Python)
- **Data Processing**: Pandas, NumPy, Scikit-learn
- **Recommendation Algorithm**: Collaborative Filtering - Content-based Filtering
