import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { firebase } from '../firebase/firebaseConfig'; // Ensure this path is correct

const UserRatingScreen = () => {
  const [userRatings, setUserRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const snapshot = await firebase.database().ref('ratings').once('value');
        const ratingsData = snapshot.val();
        const ratingsArray = Object.values(ratingsData || {});

        setUserRatings(ratingsArray);

        if (ratingsArray.length > 0) {
          const totalRating = ratingsArray.reduce((acc, item) => acc + item.rating, 0);
          setAverageRating(totalRating / ratingsArray.length);
        } else {
          setAverageRating(0);
        }
      } catch (error) {
        console.error("Error fetching ratings data: ", error);
      }
    };

    fetchRatings();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Rating</Text>
      <Text style={styles.averageRating}>Average Rating: {averageRating.toFixed(1)}</Text>
      <FlatList
        data={userRatings}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.ratingItem}>
            <Text style={styles.ratingText}>Rating: {item.rating}</Text>
            <Text style={styles.commentText}>Comment: {item.comment}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  averageRating: {
    fontSize: 20,
    marginVertical: 10,
  },
  ratingItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  ratingText: {
    fontSize: 16,
  },
  commentText: {
    fontSize: 14,
    color: '#555',
  },
});

export default UserRatingScreen;
