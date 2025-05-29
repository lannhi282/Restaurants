from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.preprocessing import OneHotEncoder
from sklearn.metrics.pairwise import cosine_similarity
import os

app = Flask(__name__)
# Configure CORS to allow all origins and methods
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})


# Global variables to store loaded data
data_loaded = False
rest_pay = None
rest_cuisine = None
rest_hours = None
rest_parking = None
rest_geo = None
cons_cuisine = None
cons_pay = None
cons_profile = None
rating = None

def load_dataset(file_name):
    """Load dataset from CSV file"""
    try:
        df = pd.read_csv(os.path.join('data', file_name))
        print(f'{file_name} has {df.shape[0]} samples with {df.shape[1]} features each.')
        return df
    except Exception as e:
        print(f'{file_name} could not be loaded. Error: {e}')
        return None

def load_all_data():
    """Load all datasets - exactly as in the notebook"""
    global data_loaded, rest_pay, rest_cuisine, rest_hours, rest_parking, rest_geo
    global cons_cuisine, cons_pay, cons_profile, rating

    if data_loaded:
        return True

    print('Loading restaurant datasets')
    rest_pay = load_dataset('chefmozaccepts.csv')
    rest_cuisine = load_dataset('chefmozcuisine.csv')
    rest_hours = load_dataset('chefmozhours4.csv')
    rest_parking = load_dataset('chefmozparking.csv')
    rest_geo = load_dataset('geoplaces2.csv')

    print('\nLoading consumer datasets')
    cons_cuisine = load_dataset('usercuisine.csv')
    cons_pay = load_dataset('userpayment.csv')
    cons_profile = load_dataset('userprofile.csv')

    print('\nLoading User-Item-Rating dataset')
    rating = load_dataset('rating_final.csv')

    # Filter users as in notebook
    if rating is not None and cons_profile is not None:
        list_users = rating['userID'].unique()
        cons_profile = cons_profile[cons_profile['userID'].isin(list_users)]

    data_loaded = True
    return True

def get_user_recommendations(user_id, top_n=10):
    """
    Get restaurant recommendations for a specific user
    This implements the collaborative filtering logic from the notebook
    """
    if not load_all_data():
        return []

    try:
        # Create user-item matrix
        user_item_matrix = rating.pivot_table(
            index='userID',
            columns='placeID',
            values='rating',
            fill_value=0
        )

        # Check if user exists
        if user_id not in user_item_matrix.index:
            return []

        # Calculate user similarity using cosine similarity
        user_similarity = cosine_similarity(user_item_matrix)
        user_similarity_df = pd.DataFrame(
            user_similarity,
            index=user_item_matrix.index,
            columns=user_item_matrix.index
        )

        # Get similar users
        similar_users = user_similarity_df[user_id].sort_values(ascending=False)[1:11]  # Top 10 similar users

        # Get restaurants rated by similar users but not by target user
        user_ratings = user_item_matrix.loc[user_id]
        unrated_restaurants = user_ratings[user_ratings == 0].index

        # Calculate weighted ratings for unrated restaurants
        recommendations = {}

        for restaurant in unrated_restaurants:
            weighted_sum = 0
            similarity_sum = 0

            for similar_user, similarity_score in similar_users.items():
                if user_item_matrix.loc[similar_user, restaurant] > 0:
                    weighted_sum += similarity_score * user_item_matrix.loc[similar_user, restaurant]
                    similarity_sum += similarity_score

            if similarity_sum > 0:
                predicted_rating = weighted_sum / similarity_sum
                recommendations[restaurant] = predicted_rating

        # Sort recommendations by predicted rating
        sorted_recommendations = sorted(recommendations.items(), key=lambda x: x[1], reverse=True)

        # Get top N recommendations with restaurant details
        top_recommendations = []
        for place_id, predicted_rating in sorted_recommendations[:top_n]:
            restaurant_info = rest_geo[rest_geo['placeID'] == place_id]
            if not restaurant_info.empty:
                restaurant = restaurant_info.iloc[0]

                # Get cuisine information
                cuisine_info = rest_cuisine[rest_cuisine['placeID'] == place_id]
                cuisines = cuisine_info['Rcuisine'].tolist() if not cuisine_info.empty else []

                top_recommendations.append({
                    'placeID': int(place_id),
                    'name': str(restaurant['name']) if pd.notna(restaurant['name']) else 'N/A',
                    'address': str(restaurant['address']) if pd.notna(restaurant['address']) else 'N/A',
                    'city': str(restaurant['city']) if pd.notna(restaurant['city']) else 'N/A',
                    'price': str(restaurant['price']) if pd.notna(restaurant['price']) else 'N/A',
                    'alcohol': str(restaurant['alcohol']) if pd.notna(restaurant['alcohol']) else 'N/A',
                    'smoking_area': str(restaurant['smoking_area']) if pd.notna(restaurant['smoking_area']) else 'N/A',
                    'predicted_rating': round(float(predicted_rating), 2),
                    'cuisines': cuisines
                })

        return top_recommendations

    except Exception as e:
        print(f"Error generating recommendations: {e}")
        return []

@app.route('/')
def index():
    """Serve the main page"""
    return render_template('index.html')

@app.after_request
def after_request(response):
    """Add CORS headers to all responses"""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route('/api/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    """Handle preflight OPTIONS requests"""
    response = jsonify({'status': 'ok'})
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

@app.route('/api/users')
def get_users():
    """Get list of all users"""
    if not load_all_data():
        return jsonify({'error': 'Failed to load data'}), 500

    users = cons_profile['userID'].tolist()
    return jsonify({'users': users})

@app.route('/api/recommendations/<user_id>')
def get_recommendations(user_id):
    """Get recommendations for a specific user"""
    try:
        top_n = request.args.get('top_n', 10, type=int)
        recommendations = get_user_recommendations(user_id, top_n)

        return jsonify({
            'user_id': user_id,
            'recommendations': recommendations,
            'count': len(recommendations)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/<user_id>')
def get_user_profile(user_id):
    """Get user profile information"""
    if not load_all_data():
        return jsonify({'error': 'Failed to load data'}), 500

    user_info = cons_profile[cons_profile['userID'] == user_id]
    if user_info.empty:
        return jsonify({'error': 'User not found'}), 404

    user = user_info.iloc[0]

    # Get user's cuisine preferences
    user_cuisines = cons_cuisine[cons_cuisine['userID'] == user_id]['Rcuisine'].tolist()

    # Get user's payment preferences
    user_payments = cons_pay[cons_pay['userID'] == user_id]['Upayment'].tolist()

    # Get user's ratings
    user_ratings = rating[rating['userID'] == user_id]

    return jsonify({
        'userID': user_id,
        'profile': {
            'latitude': float(user['latitude']) if pd.notna(user['latitude']) else None,
            'longitude': float(user['longitude']) if pd.notna(user['longitude']) else None,
            'smoker': str(user['smoker']) if pd.notna(user['smoker']) else None,
            'drink_level': str(user['drink_level']) if pd.notna(user['drink_level']) else None,
            'dress_preference': str(user['dress_preference']) if pd.notna(user['dress_preference']) else None,
            'ambience': str(user['ambience']) if pd.notna(user['ambience']) else None,
            'transport': str(user['transport']) if pd.notna(user['transport']) else None,
            'marital_status': str(user['marital_status']) if pd.notna(user['marital_status']) else None,
            'hijos': str(user['hijos']) if pd.notna(user['hijos']) else None,
            'birth_year': int(user['birth_year']) if pd.notna(user['birth_year']) else None,
            'interest': str(user['interest']) if pd.notna(user['interest']) else None,
            'personality': str(user['personality']) if pd.notna(user['personality']) else None,
            'religion': str(user['religion']) if pd.notna(user['religion']) else None,
            'activity': str(user['activity']) if pd.notna(user['activity']) else None,
            'color': str(user['color']) if pd.notna(user['color']) else None,
            'weight': float(user['weight']) if pd.notna(user['weight']) else None,
            'budget': str(user['budget']) if pd.notna(user['budget']) else None,
            'height': float(user['height']) if pd.notna(user['height']) else None
        },
        'cuisine_preferences': user_cuisines,
        'payment_preferences': user_payments,
        'total_ratings': int(len(user_ratings)),
        'average_rating': round(float(user_ratings['rating'].mean()), 2) if len(user_ratings) > 0 else 0
    })

@app.route('/api/restaurants')
def get_restaurants():
    """Get all restaurants with details"""
    if not load_all_data():
        return jsonify({'error': 'Failed to load data'}), 500

    restaurants = []
    for _, restaurant in rest_geo.iterrows():
        place_id = restaurant['placeID']

        # Get cuisine information
        cuisine_info = rest_cuisine[rest_cuisine['placeID'] == place_id]
        cuisines = cuisine_info['Rcuisine'].tolist() if not cuisine_info.empty else []

        # Get payment methods
        payment_info = rest_pay[rest_pay['placeID'] == place_id]
        payments = payment_info['Rpayment'].tolist() if not payment_info.empty else []

        # Get parking info
        parking_info = rest_parking[rest_parking['placeID'] == place_id]
        parking = parking_info['parking_lot'].tolist() if not parking_info.empty else []

        # Get ratings
        restaurant_ratings = rating[rating['placeID'] == place_id]
        avg_rating = round(float(restaurant_ratings['rating'].mean()), 2) if len(restaurant_ratings) > 0 else 0
        rating_count = len(restaurant_ratings)

        restaurants.append({
            'placeID': int(place_id),
            'name': str(restaurant['name']) if pd.notna(restaurant['name']) else 'N/A',
            'address': str(restaurant['address']) if pd.notna(restaurant['address']) else 'N/A',
            'city': str(restaurant['city']) if pd.notna(restaurant['city']) else 'N/A',
            'state': str(restaurant['state']) if pd.notna(restaurant['state']) else 'N/A',
            'country': str(restaurant['country']) if pd.notna(restaurant['country']) else 'N/A',
            'latitude': float(restaurant['latitude']) if pd.notna(restaurant['latitude']) else None,
            'longitude': float(restaurant['longitude']) if pd.notna(restaurant['longitude']) else None,
            'price': str(restaurant['price']) if pd.notna(restaurant['price']) else 'N/A',
            'alcohol': str(restaurant['alcohol']) if pd.notna(restaurant['alcohol']) else 'N/A',
            'smoking_area': str(restaurant['smoking_area']) if pd.notna(restaurant['smoking_area']) else 'N/A',
            'dress_code': str(restaurant['dress_code']) if pd.notna(restaurant['dress_code']) else 'N/A',
            'accessibility': str(restaurant['accessibility']) if pd.notna(restaurant['accessibility']) else 'N/A',
            'other_services': str(restaurant['other_services']) if pd.notna(restaurant['other_services']) else 'N/A',
            'cuisines': cuisines,
            'payments': payments,
            'parking': parking,
            'average_rating': avg_rating,
            'rating_count': rating_count
        })

    return jsonify({'restaurants': restaurants})

@app.route('/api/restaurant/<int:place_id>')
def get_restaurant_detail(place_id):
    """Get detailed information for a specific restaurant"""
    if not load_all_data():
        return jsonify({'error': 'Failed to load data'}), 500

    restaurant_info = rest_geo[rest_geo['placeID'] == place_id]
    if restaurant_info.empty:
        return jsonify({'error': 'Restaurant not found'}), 404

    restaurant = restaurant_info.iloc[0]

    # Get cuisine information
    cuisine_info = rest_cuisine[rest_cuisine['placeID'] == place_id]
    cuisines = cuisine_info['Rcuisine'].tolist() if not cuisine_info.empty else []

    # Get payment methods
    payment_info = rest_pay[rest_pay['placeID'] == place_id]
    payments = payment_info['Rpayment'].tolist() if not payment_info.empty else []

    # Get parking info
    parking_info = rest_parking[rest_parking['placeID'] == place_id]
    parking = parking_info['parking_lot'].tolist() if not parking_info.empty else []

    # Get hours
    hours_info = rest_hours[rest_hours['placeID'] == place_id]
    hours = []
    for _, hour in hours_info.iterrows():
        hours.append({
            'days': str(hour['days']) if pd.notna(hour['days']) else 'N/A',
            'hours': str(hour['hours']) if pd.notna(hour['hours']) else 'N/A'
        })

    # Get ratings and reviews
    restaurant_ratings = rating[rating['placeID'] == place_id]
    reviews = []
    for _, review in restaurant_ratings.iterrows():
        reviews.append({
            'userID': str(review['userID']),
            'rating': int(review['rating']),
            'food_rating': int(review['food_rating']) if pd.notna(review['food_rating']) else None,
            'service_rating': int(review['service_rating']) if pd.notna(review['service_rating']) else None
        })

    avg_rating = round(float(restaurant_ratings['rating'].mean()), 2) if len(restaurant_ratings) > 0 else 0

    return jsonify({
        'placeID': int(place_id),
        'name': str(restaurant['name']) if pd.notna(restaurant['name']) else 'N/A',
        'address': str(restaurant['address']) if pd.notna(restaurant['address']) else 'N/A',
        'city': str(restaurant['city']) if pd.notna(restaurant['city']) else 'N/A',
        'state': str(restaurant['state']) if pd.notna(restaurant['state']) else 'N/A',
        'country': str(restaurant['country']) if pd.notna(restaurant['country']) else 'N/A',
        'latitude': float(restaurant['latitude']) if pd.notna(restaurant['latitude']) else None,
        'longitude': float(restaurant['longitude']) if pd.notna(restaurant['longitude']) else None,
        'price': str(restaurant['price']) if pd.notna(restaurant['price']) else 'N/A',
        'alcohol': str(restaurant['alcohol']) if pd.notna(restaurant['alcohol']) else 'N/A',
        'smoking_area': str(restaurant['smoking_area']) if pd.notna(restaurant['smoking_area']) else 'N/A',
        'dress_code': str(restaurant['dress_code']) if pd.notna(restaurant['dress_code']) else 'N/A',
        'accessibility': str(restaurant['accessibility']) if pd.notna(restaurant['accessibility']) else 'N/A',
        'other_services': str(restaurant['other_services']) if pd.notna(restaurant['other_services']) else 'N/A',
        'cuisines': cuisines,
        'payments': payments,
        'parking': parking,
        'hours': hours,
        'average_rating': avg_rating,
        'rating_count': len(restaurant_ratings),
        'reviews': reviews
    })

@app.route('/api/stats')
def get_stats():
    """Get overall statistics"""
    if not load_all_data():
        return jsonify({'error': 'Failed to load data'}), 500

    total_users = len(cons_profile)
    total_restaurants = len(rest_geo)
    total_reviews = len(rating)

    # Get cuisine distribution
    cuisine_counts = cons_cuisine['Rcuisine'].value_counts().to_dict()

    # Get payment method distribution
    payment_counts = cons_pay['Upayment'].value_counts().to_dict()

    # Get restaurant cuisine distribution
    restaurant_cuisine_counts = rest_cuisine['Rcuisine'].value_counts().to_dict()

    return jsonify({
        'total_users': total_users,
        'total_restaurants': total_restaurants,
        'total_reviews': total_reviews,
        'user_cuisine_preferences': cuisine_counts,
        'user_payment_preferences': payment_counts,
        'restaurant_cuisines': restaurant_cuisine_counts
    })

@app.route('/api/users/all')
def get_all_users():
    """Get all users with basic information"""
    if not load_all_data():
        return jsonify({'error': 'Failed to load data'}), 500

    users = []
    for _, user in cons_profile.iterrows():
        user_id = user['userID']

        # Get user's ratings count
        user_ratings = rating[rating['userID'] == user_id]

        # Get user's cuisine preferences
        user_cuisines = cons_cuisine[cons_cuisine['userID'] == user_id]['Rcuisine'].tolist()

        users.append({
            'userID': str(user_id),
            'latitude': float(user['latitude']) if pd.notna(user['latitude']) else None,
            'longitude': float(user['longitude']) if pd.notna(user['longitude']) else None,
            'smoker': str(user['smoker']) if pd.notna(user['smoker']) else None,
            'drink_level': str(user['drink_level']) if pd.notna(user['drink_level']) else None,
            'dress_preference': str(user['dress_preference']) if pd.notna(user['dress_preference']) else None,
            'ambience': str(user['ambience']) if pd.notna(user['ambience']) else None,
            'transport': str(user['transport']) if pd.notna(user['transport']) else None,
            'marital_status': str(user['marital_status']) if pd.notna(user['marital_status']) else None,
            'birth_year': int(user['birth_year']) if pd.notna(user['birth_year']) else None,
            'budget': str(user['budget']) if pd.notna(user['budget']) else None,
            'total_ratings': len(user_ratings),
            'average_rating': round(float(user_ratings['rating'].mean()), 2) if len(user_ratings) > 0 else 0,
            'cuisine_preferences': user_cuisines[:3]  # Show top 3 preferences
        })

    return jsonify({'users': users})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
