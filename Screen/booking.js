import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const Booking = ({ route }) => {
  // Extract booking details from route params
  const {filterDriverData} = route.params || {};
  console.log(filterDriverData);

  console.log

  // Default values in case params are undefined
  // const defaultArrivalTime = arrivalTime || 'N/A';
  // const defaultDepartureTime = departureTime || 'N/A';
  // const defaultPrice = price || 'N/A'; 

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Arrival Time:</Text>
        <Text style={styles.value}>{filterDriverData.arrivalTimen}</Text>

        <Text style={styles.label}>Departure Time:</Text>
        <Text style={styles.value}>{filterDriverData.departureTime}</Text>

        <Text style={styles.label}>Price:</Text>
        <Text style={styles.value}>{filterDriverData.price}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9', // Light gray background for the whole screen
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    marginBottom: 15,
  },
});

export default Booking;
