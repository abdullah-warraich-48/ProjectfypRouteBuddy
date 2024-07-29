import { useRoute } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const Booking = () => {
  const route = useRoute();
  const { driverData } = route.params || {};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Booking Details</Text>
      {driverData ? (
        <View style={styles.details}>
          <Text style={styles.label}>Arrival Time:</Text>
          <Text>{driverData.arrivalTime}</Text>
          <Text style={styles.label}>Departure Time:</Text>
          <Text>{driverData.departureTime}</Text>
          <Text style={styles.label}>Destination:</Text>
          <Text>{driverData.destination}</Text>
          <Text style={styles.label}>Price:</Text>
          <Text>{driverData.price}</Text>
        </View>
      ) : (
        <Text>No driver data available.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  details: {
    marginTop: 20,
  },
  label: {
    fontWeight: 'bold',
  },
});

export default Booking;
