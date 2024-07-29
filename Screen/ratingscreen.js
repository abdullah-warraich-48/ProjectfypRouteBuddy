import React, { useContext, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { AirbnbRating } from 'react-native-ratings'; // Import AirbnbRating component
import { UserContext } from '../context/UserContext';
import { firebase } from '../firebase/firebaseConfig'; // Ensure this path is correct

const UserRatingScreen = () => {
  const { currentUser } = useContext(UserContext);
  const [userRatings, setUserRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    const fetchRatings = async () => {
      if (!currentUser || !currentUser.email) {
        console.error("Current user or email is not defined");
        return;
      }

      console.log("Fetching ratings for:", currentUser.email); // Debugging line

      try {
        const snapshot = await firebase.database().ref('ratings').once('value');
        
        console.log("Snapshot:", snapshot.val());
        const ratingsData = snapshot.val() || {};
        const ratingsArray = Object.values(ratingsData);

        // Check if each rating object contains receiverEmail
        console.log("Ratings Array:", ratingsArray);

        // Filter ratings to include only those where receiverEmail matches the current user's email
        const filteredRatings = ratingsArray.filter(rating => {
          console.log("Rating:", rating);
          return rating.users && rating.users[1] === currentUser.email;
        });

        console.log("Filtered Ratings:", filteredRatings);
        setUserRatings(filteredRatings);

        if (filteredRatings.length > 0) {
          const totalRating = filteredRatings.reduce((acc, item) => acc + item.rating, 0);
          setAverageRating(totalRating / filteredRatings.length);
        } else {
          setAverageRating(0);
        }
      } catch (error) {
        console.error("Error fetching ratings data: ", error);
      }
    };

    fetchRatings();
  }, [currentUser.email]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Rating</Text>
      
      {/* Display average rating as stars */}
      <View style={styles.averageRatingContainer}>
        <Text style={styles.averageRatingLabel}>Average Rating:</Text>
        <AirbnbRating
          count={5}
          size={30}
          isDisabled
          defaultRating={averageRating}
          showRating={false}
        />
        <Text style={styles.averageRatingValue}>{averageRating.toFixed(1)}</Text>
      </View>

      <FlatList
        data={userRatings}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.ratingItem}>
            {/* Display rating as stars */}
            {/* <AirbnbRating
              count={5}
              size={20}
              isDisabled
              defaultRating={item.rating}
              showRating={false}
            /> */}
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
  averageRatingContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  averageRatingLabel: {
    fontSize: 20,
    marginBottom: 10,
  },
  averageRatingValue: {
    fontSize: 20,
    marginTop: 5,
  },
  ratingItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  commentText: {
    fontSize: 14,
    color: '#555',
  },
});

export default UserRatingScreen;
