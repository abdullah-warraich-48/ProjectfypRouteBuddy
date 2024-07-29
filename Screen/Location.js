import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';

const Location = () => {
  const navigation = useNavigation();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [coordinates, setCoordinates] = useState([]);

  const handleSubmit = () => {
    console.log('Origin:', origin);
    console.log('Destination:', destination);
    setCoordinates([
      { latitude: 32.166351, longitude: 74.195900 },
      { latitude: 32.166351, longitude: 74.195900 },
    ]);
    navigation.navigate('Map');
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <Ionicons name="location-sharp" size={24} color="#32a4a8" />
        <TextInput
          style={styles.input}
          placeholder="Enter pick-up location"
          value={origin}
          onChangeText={setOrigin}
        />
      </View>
      <View style={styles.inputWrapper}>
        <Ionicons name="navigate" size={24} color="#32a4a8" />
        <TextInput
          style={styles.input}
          placeholder="Enter destination"
          value={destination}
          onChangeText={setDestination}
        />
      </View>
      <TouchableOpacity style={styles.locationButton} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Set Location</Text>
      </TouchableOpacity>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 32.166351,
          longitude: 74.195900,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {coordinates.length > 0 && <Polyline coordinates={coordinates} strokeWidth={4} strokeColor="#32a4a8" />}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    paddingBottom: 10,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  locationButton: {
    backgroundColor: '#32a4a8',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'center',
    marginVertical: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  map: {
    flex: 1,
    width: '100%',
    marginTop: 10,
  },
});

export default Location;
