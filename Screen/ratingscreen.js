import React, { useEffect, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { firebase } from '../firebase/firebaseConfig'; // Adjust path if necessary

const UserRatingScreen = ({ route }) => {
  // Destructure userId from route.params with a default fallback
  const { userId } = route.params || {};

  const [userData, setUserData] = useState({});
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    if (userId) {
      fetchUserData();
      fetchRatings();
    } else {
      console.error('User ID is missing');
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const userRef = firebase.database().ref(`users/${userId}`);
      const snapshot = await userRef.once('value');
      if (snapshot.exists()) {
        setUserData(snapshot.val());
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchRatings = async () => {
    try {
      const ratingsRef = firebase.database().ref('ratings');
      const snapshot = await ratingsRef.once('value');
      const ratingsData = snapshot.val() || {};
      const userRatings = Object.values(ratingsData).filter(rating => rating.users[1] === userId);
      
      if (userRatings.length > 0) {
        const totalRating = userRatings.reduce((acc, item) => acc + item.rating, 0);
        setAverageRating(totalRating / userRatings.length);
        setRatings(userRatings);
      } else {
        setAverageRating(0);
        setRatings([]);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const renderRatingItem = ({ item }) => (
    <View style={styles.feedbackItem}>
      <Text style={styles.feedbackText}>{item.comment || 'No comment'}</Text>
      <Text style={styles.feedbackRating}>Rating: {item.rating}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        <Image
          source={{ uri: userData.profilePicture || 'https://via.placeholder.com/150' }}
          style={styles.profileImage}
        />
        <Text style={styles.userName}>{userData.name || 'User Name'}</Text>
        <Text style={styles.userEmail}>{userData.email || 'user@example.com'}</Text>
      </View>

      <View style={styles.ratingSection}>
        <Text style={styles.ratingTitle}>Average Rating</Text>
        <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
      </View>

      <View style={styles.feedbackSection}>
        <Text style={styles.feedbackTitle}>Feedback Received</Text>
        <FlatList
          data={ratings}
          renderItem={renderRatingItem}
          keyExtractor={(item, index) => index.toString()}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  ratingSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  averageRating: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#32a4a8',
  },
  feedbackSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  feedbackItem: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  feedbackText: {
    fontSize: 16,
    color: '#333',
  },
  feedbackRating: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
});

export default UserRatingScreen;
