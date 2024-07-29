import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const History = ({ route }) => {
  // Retrieve driver data from route parameters
  const { driverData } = route.params || {};

  if (!driverData) {
    return (
      <View style={styles.container}>
        <Text>No data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Information</Text>
      <Text>Arrival Time: {driverData.arrivalTime}</Text>
      <Text>Departure Time: {driverData.departureTime}</Text>
      <Text>Destination: {driverData.destination}</Text>
      <Text>Price: {driverData.price}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});

export default History;
