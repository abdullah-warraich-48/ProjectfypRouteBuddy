import { DateTimePicker } from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const NOMINATIM_API_URL = 'https://nominatim.openstreetmap.org/search';

const RouteInfo = () => {
  const [startPoint, setStartPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [substops, setSubstops] = useState('');
  const [startPointCoords, setStartPointCoords] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [showDeparturePicker, setShowDeparturePicker] = useState(false);
  const [showArrivalPicker, setShowArrivalPicker] = useState(false);
  const [departureTime, setDepartureTime] = useState(new Date());
  const [arrivalTime, setArrivalTime] = useState(new Date());

  // Function to fetch coordinates from an address
  const getCoordinatesFromAddress = async (address) => {
    try {
      const response = await fetch(`${NOMINATIM_API_URL}?q=${encodeURIComponent(address)}&format=json`);
      const data = await response.json();
      if (data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };
      }
      throw new Error('No coordinates found');
    } catch (error) {
      console.error('Error fetching coordinates:', error);
      return null;
    }
  };

  // Fetch coordinates for start and destination points
  const fetchCoordinates = async () => {
    if (startPoint) {
      try {
        const coords = await getCoordinatesFromAddress(startPoint);
        setStartPointCoords(coords);
      } catch (error) {
        console.error('Error fetching start point coordinates:', error);
      }
    }
    if (destination) {
      try {
        const coords = await getCoordinatesFromAddress(destination);
        setDestinationCoords(coords);
      } catch (error) {
        console.error('Error fetching destination coordinates:', error);
      }
    }
  };

  useEffect(() => {
    fetchCoordinates();
  }, [startPoint, destination]);

  // Handle Substops
  const handleSubStopsPress = () => {
    // This function should handle the logic of adding substops
    // For simplicity, let's assume we have a hardcoded array of substops
    const newMarkers = [
      { latitude: 32.1, longitude: 74.1 }, // Example coordinates
      { latitude: 32.2, longitude: 74.2 },
    ];
    setMapMarkers(newMarkers);
  };

  const handleConfirmLocation = () => {
    // Handle confirmation logic here
  };

  const handleDepartureTimeChange = (event, selectedDate) => {
    const currentDate = selectedDate || departureTime;
    setShowDeparturePicker(Platform.OS === 'ios');
    setDepartureTime(currentDate);
  };

  const handleArrivalTimeChange = (event, selectedDate) => {
    const currentDate = selectedDate || arrivalTime;
    setShowArrivalPicker(Platform.OS === 'ios');
    setArrivalTime(currentDate);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 32.1614, // Default to Gujranwala, Pakistan
          longitude: 74.1883,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {startPointCoords && (
          <Marker coordinate={startPointCoords} title="Start Point" />
        )}
        {destinationCoords && (
          <Marker coordinate={destinationCoords} title="Destination" />
        )}
        {mapMarkers.map((coord, index) => (
          <Marker
            key={index}
            coordinate={coord}
            title={`Substop ${index + 1}`}
          />
        ))}
      </MapView>
      <TouchableOpacity style={styles.button} onPress={() => handleSubStopsPress()}>
        <Text style={styles.buttonText}>Add Substops</Text>
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        placeholder="Start Point"
        value={startPoint}
        onChangeText={setStartPoint}
      />
      <TextInput
        style={styles.input}
        placeholder="Destination"
        value={destination}
        onChangeText={setDestination}
      />
      <TextInput
        style={styles.input}
        placeholder="Substops"
        value={substops}
        onChangeText={setSubstops}
      />
      <TouchableOpacity style={styles.button} onPress={() => setShowDeparturePicker(true)}>
        <Text style={styles.buttonText}>Select Departure Time</Text>
      </TouchableOpacity>
      {showDeparturePicker && (
        <DateTimePicker
          value={departureTime}
          mode="datetime"
          display="default"
          onChange={handleDepartureTimeChange}
        />
      )}
      <TouchableOpacity style={styles.button} onPress={() => setShowArrivalPicker(true)}>
        <Text style={styles.buttonText}>Select Arrival Time</Text>
      </TouchableOpacity>
      {showArrivalPicker && (
        <DateTimePicker
          value={arrivalTime}
          mode="datetime"
          display="default"
          onChange={handleArrivalTimeChange}
        />
      )}
      <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmLocation}>
        <Text style={styles.confirmButtonText}>Confirm</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  map: {
    width: '100%',
    height: 300,
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderBottomWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default RouteInfo;
